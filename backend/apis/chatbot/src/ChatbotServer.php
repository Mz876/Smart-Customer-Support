<?php

require __DIR__ . '/../vendor/autoload.php';

use React\EventLoop\Factory;
use React\Http\HttpServer;
use React\Socket\SocketServer;
use React\Http\Message\Response;
use Psr\Http\Message\ServerRequestInterface;
use React\MySQL\Factory as MySQLFactory;
use Clue\React\Buzz\Browser;

$host = '127.0.0.1';
$db   = 'smartcustsupport';
$user = 'root';
$pass = '';
$port = 3307;

$loop = Factory::create();

// MySQL async connection
$mysqlFactory = new MySQLFactory($loop);
$mysql = $mysqlFactory->createLazyConnection("$user:$pass@$host:$port/$db");

// Load env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();
$apiKey = $_ENV['GEMINI_API_KEY'];

// Async HTTP client
$browser = new Browser($loop);

/**
 * Step 1: Analyze user question and determine what data to fetch
 */
function analyzeQuestion($browser, $apiKey, $userMessage) {
    $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
    
    $analysisPrompt = "You are a database query analyzer. Analyze this customer question and determine what data needs to be fetched from the database.

Question: \"$userMessage\"

Available tables:
1. products (Product_Name, Product_Id, Product_Price, Brand, Description, Quantity)
2. questions (id, user_id, message, created_at) - Previous customer questions
3. answers (id, question_id, message, created_at) - Previous AI responses

Respond in JSON format ONLY:
{
    \"needs_products\": true/false,
    \"product_filters\": {
        \"search_term\": \"keywords to search in product name/description/brand\",
        \"price_range\": {\"min\": 0, \"max\": 1000000},
        \"brand\": \"specific brand if mentioned\"
    },
    \"needs_history\": true/false,
    \"history_search\": \"keywords to search in previous Q&A\",
    \"query_intent\": \"brief description of what user wants\"
}

Examples:
- \"What laptops do you have?\" → needs_products: true, search_term: \"laptop\"
- \"Show me products under $500\" → needs_products: true, price_range: {max: 500}
- \"What did I ask before about phones?\" → needs_history: true, history_search: \"phone\"";

    return $browser->post(
        $apiUrl,
        [
            'Content-Type' => 'application/json',
            'x-goog-api-key' => $apiKey
        ],
        json_encode([
            'contents' => [
                [
                    'parts' => [
                        ['text' => $analysisPrompt]
                    ]
                ]
            ]
        ])
    );
}

/**
 * Step 2: Fetch relevant data from database based on analysis
 */
function fetchRelevantData($mysql, $analysis, $userId) {
    $promises = [];
    
    // Fetch products if needed
    if ($analysis['needs_products']) {
        $filters = $analysis['product_filters'] ?? [];
        $conditions = [];
        $params = [];
        
        if (!empty($filters['search_term'])) {
            $searchTerm = '%' . $filters['search_term'] . '%';
            $conditions[] = "(Product_Name LIKE ? OR Description LIKE ? OR Brand LIKE ?)";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        if (!empty($filters['brand'])) {
            $conditions[] = "Brand LIKE ?";
            $params[] = '%' . $filters['brand'] . '%';
        }
        
        if (isset($filters['price_range']['min'])) {
            $conditions[] = "Product_Price >= ?";
            $params[] = $filters['price_range']['min'];
        }
        
        if (isset($filters['price_range']['max'])) {
            $conditions[] = "Product_Price <= ?";
            $params[] = $filters['price_range']['max'];
        }
        
        $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
        $query = "SELECT * FROM products $whereClause LIMIT 20";
        
        $promises['products'] = $mysql->query($query, $params);
    }
    
    // Fetch conversation history if needed
    if ($analysis['needs_history'] && $userId) {
        $historySearch = $analysis['history_search'] ?? '';
        $searchCondition = '';
        $params = [$userId];
        
        if ($historySearch) {
            $searchCondition = "AND q.message LIKE ?";
            $params[] = '%' . $historySearch . '%';
        }
        
        $historyQuery = "SELECT q.message as question, a.message as answer, q.created_at 
                        FROM questions q 
                        LEFT JOIN answers a ON q.id = a.question_id 
                        WHERE q.user_id = ? $searchCondition 
                        ORDER BY q.created_at DESC 
                        LIMIT 10";
        
        $promises['history'] = $mysql->query($historyQuery, $params);
    }
    
    // Return all promises
    return \React\Promise\all($promises);
}

/**
 * Step 3: Generate final response with context
 */
function generateContextualResponse($browser, $apiKey, $userMessage, $fetchedData, $queryIntent) {
    $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
    
    // Build context from fetched data
    $context = "User Question: $userMessage\n\n";
    $context .= "Query Intent: $queryIntent\n\n";
    
    if (isset($fetchedData['products'])) {
        $products = $fetchedData['products'];
        $context .= "=== AVAILABLE PRODUCTS ===\n";
        if (count($products->resultRows) > 0) {
            foreach ($products->resultRows as $product) {
                $context .= "- {$product['Product_Name']} (ID: {$product['Product_Id']})\n";
                $context .= "  Brand: {$product['Brand']}\n";
                $context .= "  Price: \${$product['Product_Price']}\n";
                $context .= "  Quantity: {$product['Quantity']}\n";
                $context .= "  Description: {$product['Description']}\n\n";
            }
        } else {
            $context .= "No products found matching the criteria.\n\n";
        }
    }
    
    if (isset($fetchedData['history'])) {
        $history = $fetchedData['history'];
        $context .= "=== CONVERSATION HISTORY ===\n";
        if (count($history->resultRows) > 0) {
            foreach ($history->resultRows as $entry) {
                $context .= "Q: {$entry['question']}\n";
                $context .= "A: {$entry['answer']}\n";
                $context .= "Date: {$entry['created_at']}\n\n";
            }
        } else {
            $context .= "No previous conversation history found.\n\n";
        }
    }
    
    $finalPrompt = $context . "\nBased on the above data, provide a helpful, natural response to the user's question. Be specific and reference actual products/data when available. If no relevant data was found, politely inform the user and suggest alternatives.";
    
    return $browser->post(
        $apiUrl,
        [
            'Content-Type' => 'application/json',
            'x-goog-api-key' => $apiKey
        ],
        json_encode([
            'contents' => [
                [
                    'parts' => [
                        ['text' => $finalPrompt]
                    ]
                ]
            ]
        ])
    );
}

$server = new HttpServer(function (ServerRequestInterface $request) use ($mysql, $browser, $apiKey) {
    
    $corsHeaders = [
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
        'Content-Type' => 'application/json'
    ];

    if ($request->getMethod() === 'OPTIONS') {
        return new Response(200, $corsHeaders, '');
    }

    $data = json_decode((string)$request->getBody(), true);
    $userMessage = $data['message'] ?? '';
    $userId = $data['user_id'] ?? null;

    if (!$userMessage) {
        return new Response(
            400, 
            $corsHeaders, 
            json_encode(['error' => 'Message is required'])
        );
    }

    // Insert user question
    $pipeline = $mysql->query(
        "INSERT INTO questions (user_id, message, created_at) VALUES (?, ?, NOW())",
        [$userId, $userMessage]
    )->then(function ($result) use ($mysql, $browser, $userMessage, $apiKey, $corsHeaders, $userId) {

        $questionId = $result->insertId;
        
        // STEP 1: Analyze the question
        return analyzeQuestion($browser, $apiKey, $userMessage)
            ->then(function ($response) use ($mysql, $browser, $apiKey, $userMessage, $questionId, $corsHeaders, $userId) {
                
                $body = (string)$response->getBody();
                $apiData = json_decode($body, true);
                $analysisText = $apiData['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
                
                // Extract JSON from response (remove markdown if present)
                $analysisText = preg_replace('/```json\s*|\s*```/', '', $analysisText);
                $analysis = json_decode($analysisText, true);
                
                if (!$analysis) {
                    $analysis = ['needs_products' => false, 'needs_history' => false];
                }
                
                $queryIntent = $analysis['query_intent'] ?? 'General inquiry';
                
                // STEP 2: Fetch relevant data
                return fetchRelevantData($mysql, $analysis, $userId)
                    ->then(function ($fetchedData) use ($browser, $apiKey, $userMessage, $queryIntent, $mysql, $questionId, $corsHeaders) {
                        
                        // STEP 3: Generate contextual response
                        return generateContextualResponse($browser, $apiKey, $userMessage, $fetchedData, $queryIntent)
                            ->then(function ($response) use ($mysql, $questionId, $corsHeaders) {
                                
                                $body = (string)$response->getBody();
                                $apiData = json_decode($body, true);
                                $aiMessage = $apiData['candidates'][0]['content']['parts'][0]['text'] ?? 'No response';
                                
                                // Insert AI response
                                return $mysql->query(
                                    "INSERT INTO answers (question_id, message, created_at) VALUES (?, ?, NOW())",
                                    [$questionId, $aiMessage]
                                )->then(function () use ($aiMessage, $corsHeaders) {
                                    return new Response(
                                        200,
                                        $corsHeaders,
                                        json_encode(['reply' => $aiMessage])
                                    );
                                });
                            });
                    });
            });
    })->otherwise(function ($error) use ($corsHeaders) {
        return new Response(
            500,
            $corsHeaders,
            json_encode(['error' => 'Server error: ' . $error->getMessage()])
        );
    });

    return $pipeline;
});

$socket = new SocketServer('127.0.0.1:8080', [], $loop);
$server->listen($socket);


$loop->run();