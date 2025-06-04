<?php
require '../db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

$titre = $data['titre'];
$description = $data['description'];
$email = $data['email'];
$utilisateur_id = $data['utilisateur_id']; // Doit être un UID Firebase si tu veux suivre la logique du SQL
$priorite = $data['priorite'] ?? 'moyenne';

// Ajouter l'utilisateur s'il n'existe pas
$check = $pdo->prepare("SELECT * FROM utilisateurs WHERE utilisateur_id = ?");
$check->execute([$utilisateur_id]);

if ($check->rowCount() === 0) {
    $insertUser = $pdo->prepare("INSERT INTO utilisateurs (utilisateur_id, email) VALUES (?, ?)");
    $insertUser->execute([$utilisateur_id, $email]);
}

// Créer le ticket
$insert = $pdo->prepare("INSERT INTO tickets (titre, description, utilisateur_id) VALUES (?, ?, ?)");
$insert->execute([$titre, $description, $utilisateur_id]);

echo json_encode(['message' => 'Ticket créé avec succès', 'ticket_id' => $pdo->lastInsertId()]);
?>
