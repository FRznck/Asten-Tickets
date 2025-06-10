<?php
require '../db.php'; // assure-toi que ce fichier établit correctement la connexion

header('Content-Type: application/json');

// Vérification de la connexion PDO
if (!$pdo) {
    echo json_encode(['error' => 'Échec de la connexion à la base de données.']);
    exit;
}

try {
    // Requête SQL pour récupérer les tickets avec la catégorie associée
    $sql = "SELECT 
                t.ticket_id, 
                t.titre, 
                t.description, 
                t.statut, 
                c.nom AS categorie, 
                t.date_creation
            FROM tickets t
            LEFT JOIN categories c ON t.categorie_predite_id = c.categorie_id
            ORDER BY t.date_creation DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($tickets)) {
        echo json_encode(['message' => 'Aucun ticket trouvé dans la base de données.']);
    } else {
        echo json_encode($tickets);
    }
} catch (PDOException $e) {
    // En cas d’erreur SQL ou autre
    echo json_encode(['error' => 'Erreur SQL : ' . $e->getMessage()]);
}
?>
