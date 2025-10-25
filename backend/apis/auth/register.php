<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type"); // ← ADD THIS LINE


// Include DB connection
require_once "../../config/db.php";

// Get JSON data from frontend
$data = json_decode(file_get_contents("php://input"), true);

$first_name = trim($data['first_name'] ?? '');
$last_name  = trim($data['last_name'] ?? '');
$email      = trim($data['email'] ?? '');
$password   = $data['password'] ?? '';

// Simple validation
if (!$first_name || !$last_name || !$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email']);
    exit;
}

// Check if email already exists
$sql = "SELECT id FROM users WHERE email = ?";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_fetch_assoc($result)) {
    echo json_encode(['success' => false, 'message' => 'Email already registered']);
    exit;
}
mysqli_stmt_close($stmt);

// Hash the password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Prepare INSERT query
$sql = "INSERT INTO users (first_name, last_name, email, password, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())";

$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "ssss", $first_name, $last_name, $email, $hashed_password);

// Execute and check
if (mysqli_stmt_execute($stmt)) {
    echo json_encode(['success' => true, 'message' => 'User registered successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Registration failed']);
}

// Close resources
mysqli_stmt_close($stmt);
mysqli_close($conn);
?>
