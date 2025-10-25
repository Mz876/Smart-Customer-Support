<?php
// Allow React (frontend) on a different port to access
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");

// Include DB connection
require_once '../../config/db.php';

// Get JSON POST body
$data = json_decode(file_get_contents("php://input"), true);

// Extract email and password
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// Validate input
if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Email and password required']);
    exit;
}

// Prepare SQL query to fetch user by email
$sql = "SELECT * FROM users WHERE email = ?";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

// Check if user exists
if ($user = mysqli_fetch_assoc($result)) {
    // Verify hashed password
    if (password_verify($password, $user['password'])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
} else {
    // User not found
    echo json_encode(['success' => false]);
}

// Close DB resources
mysqli_stmt_close($stmt);
mysqli_close($conn);
?>
