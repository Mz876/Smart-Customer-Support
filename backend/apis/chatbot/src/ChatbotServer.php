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
$apiKey = $_ENV['GEMINI_API_KEY']; // Add GEMINI_API_KEY to your .env file

// Async HTTP client
$browser = new Browser($loop);

$server = new HttpServer(function (ServerRequestInterface $request) use ($mysql, $browser, $apiKey) {
    
    // ✅ CORS Headers - Handle preflight OPTIONS request
    $corsHeaders = [
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
        'Content-Type' => 'application/json'
    ];

    // Handle OPTIONS preflight request
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

    // 1️⃣ Insert question
    $insertQuestion = $mysql->query(
        "INSERT INTO questions (user_id, message, created_at) VALUES (?, ?, NOW())",
        [$userId, $userMessage]
    )->then(function ($result) use ($mysql, $browser, $userMessage, $apiKey, $corsHeaders) {

        $questionId = $result->insertId;
        
        error_log("🔍 Processing question ID: $questionId");

        // 2️⃣ Call Google Gemini API (FREE!) - Using the exact format from curl
        $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
        
        $apiCall = $browser->post(
            $apiUrl,
            [
                'Content-Type' => 'application/json',
                'x-goog-api-key' => $apiKey  // ⚠️ Note: Using x-goog-api-key header instead of query param
            ],
            json_encode([
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $userMessage]
                        ]
                    ]
                ]
            ])
        );

        return $apiCall->then(function ($response) use ($mysql, $questionId, $corsHeaders, $userMessage) {

            $status = $response->getStatusCode();
            $body = (string)$response->getBody();

            error_log("📨 Gemini Response Status: $status");

            if ($status !== 200) {
                error_log("❌ Gemini API Error: Status $status, Response: $body");
                
                $errorData = json_decode($body, true);
                $errorMessage = $errorData['error']['message'] ?? 'Unknown error';
                
                return new Response(
                    500,
                    $corsHeaders,
                    json_encode([
                        'error' => "AI API Error (HTTP $status)",
                        'message' => $errorMessage,
                        'details' => $body
                    ])
                );
            }

            $apiData = json_decode($body, true);

            // Extract AI message from Gemini response (exact structure from curl)
            $aiMessage = $apiData['candidates'][0]['content']['parts'][0]['text'] ?? 'No response';
            
            error_log("✅ AI Response received: " . substr($aiMessage, 0, 50) . "...");

            // 3️⃣ Insert AI response into answers table
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
    })->otherwise(function ($error) use ($corsHeaders) {
        // Handle errors
        error_log("❌ Server Error: " . $error->getMessage());
        return new Response(
            500,
            $corsHeaders,
            json_encode(['error' => 'Server error: ' . $error->getMessage()])
        );
    });

    return $insertQuestion;
});

$socket = new SocketServer('127.0.0.1:8080', [], $loop);
$server->listen($socket);

 
$loop->run();