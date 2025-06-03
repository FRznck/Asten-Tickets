document.addEventListener('DOMContentLoaded', function() {
    // Données simulées pour les graphiques
    const performanceData = {
        totalTickets: [1050, 1120, 1200, 1234],
        correctionRate: [65, 68, 69, 70],
        accuracy: [80, 82, 83, 85],
        categories: ['Support Technique', 'Support Messagerie', 'Assistance Générale', 'Demande de Fonctionnalité'],
        categoryDistribution: [320, 450, 280, 184],
        categoryAccuracy: [82, 88, 79, 85],
        accuracyTrend: [80, 81, 82, 83, 84, 85, 84, 85, 86, 85],
        trendLabels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct']
    };
    
    // Graphique 1: Nombre total de tickets
    const totalTicketsCtx = document.getElementById('totalTicketsChart').getContext('2d');
    new Chart(totalTicketsCtx, {
        type: 'line',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                data: performanceData.totalTickets,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { display: false },
                x: { display: false }
            }
        }
    });
    
    // Graphique 2: Répartition par catégorie
    const categoryDistributionCtx = document.getElementById('categoryDistributionChart').getContext('2d');
    new Chart(categoryDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: performanceData.categories,
            datasets: [{
                data: performanceData.categoryDistribution,
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#9b59b6',
                    '#f1c40f'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
    
    // Graphique 3: Précision par catégorie
    const categoryAccuracyCtx = document.getElementById('categoryAccuracyChart').getContext('2d');
    new Chart(categoryAccuracyCtx, {
        type: 'bar',
        data: {
            labels: performanceData.categories,
            datasets: [{
                label: 'Précision (%)',
                data: performanceData.categoryAccuracy,
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(155, 89, 182, 0.7)',
                    'rgba(241, 196, 15, 0.7)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(155, 89, 182, 1)',
                    'rgba(241, 196, 15, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
    
    // Graphique 4: Évolution de la précision
    const accuracyTrendCtx = document.getElementById('accuracyTrendChart').getContext('2d');
    new Chart(accuracyTrendCtx, {
        type: 'line',
        data: {
            labels: performanceData.trendLabels,
            datasets: [{
                label: 'Précision (%)',
                data: performanceData.accuracyTrend,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 75,
                    max: 100
                }
            }
        }
    });
});