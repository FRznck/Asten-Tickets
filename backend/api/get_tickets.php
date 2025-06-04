<?php
require '../db.php';

header('Content-Type: application/json');

$sql = "SELECT t.ticket_id, t.titre, t.description, t.statut, c.nom AS categorie, t.date_creation
        FROM tickets t
        LEFT JOIN categories c ON t.categorie_predite_id = c.categorie_id
        ORDER BY t.date_creation DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute();

$tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($tickets);
?>
