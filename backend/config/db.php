<?php

$host = 'localhost';
$db   = 'smartcustsupport';
$user = 'root';
$password = '';
$port = 3307;

$conn = mysqli_connect($host, $user, $password, $db,$port);

 

if(!$conn){
 
    die("Connection failed: " . mysqli_connect_error());
}




?>