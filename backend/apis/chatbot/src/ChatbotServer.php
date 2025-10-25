<?php
require __DIR__ . '/../vendor/autoload.php';

use React\EventLoop\Factory;
use React\Http\HttpServer;
use React\Socket\SocketServer;
use React\Http\Message\Response;
use Psr\Http\Message\ServerRequestInterface;
use React\MySQL\Factory as MySQLFactory;
use Clue\React\Buzz\Browser;

$loop = Factory::create();

// Async MySQL connection
$mysqlFactory = new MySQLFactory($loop);
$mysql = $mysqlFactory->createLazyConnection('root:@127.0.0.1/chatbot');

// Async HTTP client (for Gemini API)
$browser = new Browser($loop);

$server = new HttpServer(function (ServerRequestInterface $request) use ($mysql, $browser) {
    $data = json_decode((string)$request->getBody(), true);
    $userMessage = $data['message'] ?? '';

    // Save message async
    $mysqlQuery = $mysql->query("INSERT INTO messages (content) VALUES ('$userMessage')");

    // Call Gemini API async
    $apiCall = $browser->post('https://api.gemini.com/v1/your-endpoint', [
        'Content-Type' => 'application/json',
        'Authorization' => 'Bearer YOUR_KEY'
    ], json_encode(['message' => $userMessage]));

    // Combine both async tasks
    return \React\Promise\all([$mysqlQuery, $apiCall])->then(function ($results) use ($apiCall) {
        return $apiCall->then(function ($response) {
            $apiResponse = (string)$response->getBody();
            return new Response(
                200,
                ['Content-Type' => 'application/json'],
                json_encode(['reply' => $apiResponse])
            );
        });
    });
});

$socket = new SocketServer('127.0.0.1:8080', [], $loop);
$server->listen($socket);

echo "ReactPHP Chatbot API running at http://127.0.0.1:8080\n";

$loop->run();
