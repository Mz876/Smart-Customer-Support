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
$apiKey = $_ENV['OPENAI_API_KEY'];

// Async HTTP client
$browser = new Browser($loop);

$server = new HttpServer(function (ServerRequestInterface $request) use ($mysql, $browser, $apiKey) {
    $data = json_decode((string)$request->getBody(), true);
    $userMessage = $data['message'] ?? '';
    $userId = $data['user_id'] ?? null; // assuming frontend sends user_id

    if (!$userMessage) {
        return new Response(400, ['Content-Type' => 'application/json'], json_encode(['error' => 'Message is required']));
    }

    // 1️⃣ Insert question
    $insertQuestion = $mysql->query(
        "INSERT INTO questions (user_id, content, created_at) VALUES (?, ?, NOW())",
        [$userId, $userMessage]
    )->then(function ($result) use ($mysql, $browser, $userMessage, $apiKey) {

        $questionId = $result->insertId; // get the auto-generated question ID

        // 2️⃣ Call OpenAI API
        $apiCall = $browser->post(
            'https://api.openai.com/v1/chat/completions',
            [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $apiKey
            ],
            json_encode([
                'model' => 'gpt-3.5-turbo',
                'messages' => [['role' => 'user', 'content' => $userMessage]]
            ])
        );

        return $apiCall->then(function ($response) use ($mysql, $questionId) {
            $apiData = json_decode((string)$response->getBody(), true);

            // Extract AI message
            $aiMessage = $apiData['choices'][0]['message']['content'] ?? 'No response';

            // 3️⃣ Insert AI response into answers table
            return $mysql->query(
                "INSERT INTO answers (question_id, message, created_at) VALUES (?, ?, NOW())",
                [$questionId, $aiMessage]
            )->then(function () use ($aiMessage) {
                return new Response(
                    200,
                    ['Content-Type' => 'application/json'],
                    json_encode(['reply' => $aiMessage])
                );
            });
        });
    });

    return $insertQuestion;
});

$socket = new SocketServer('127.0.0.1:8080', [], $loop);
$server->listen($socket);

echo "ReactPHP Chatbot API running at http://127.0.0.1:8080\n";

$loop->run();
