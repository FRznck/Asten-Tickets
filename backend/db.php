<?php
$host = 'localhost';
$dbname = 'syteme_ticket';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO('mysql:host=localhost;dbname=systeme_ticket;charset=utf8', 'utilisateur', 'motdepasse');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'Connexion échouée : ' . $e->getMessage()]));
}
?>

