<?php
require '../db.php';
header('Content-Type: application/json');

// Tickets aujourd'hui
$t1 = $pdo->query("SELECT COUNT(*) FROM tickets WHERE DATE(date_creation) = CURDATE()")->fetchColumn();

// Précision modèle
$t2 = $pdo->query("SELECT precision FROM modeles ORDER BY date_entrainement DESC LIMIT 1")->fetchColumn();

// Temps moyen (tickets fermés)
$t3 = $pdo->query("SELECT AVG(TIMESTAMPDIFF(SECOND, date_creation, NOW()))/60 AS minutes FROM tickets WHERE statut = 'ferme'")
         ->fetch(PDO::FETCH_ASSOC);

// En attente
$t4 = $pdo->query("SELECT COUNT(*) FROM tickets WHERE statut != 'ferme'")->fetchColumn();

echo json_encode([
    'tickets_aujourdhui' => (int)$t1,
    'precision_modele' => round((float)$t2, 2),
    'temps_moyen_traitement' => round((float)$t3['minutes'], 1) . "min",
    'tickets_en_attente' => (int)$t4
]);
?>
