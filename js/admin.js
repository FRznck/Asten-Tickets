import { chargerTickets, renderTicketsTable, viewTicket, changeTicketStatus, compterTicketsResolu, compterTicketsParCategorie, compterTicketsParNiveauDeConfiance, assignerTicketModal, confirmerAssignation, updateMembresOptions, getConfidenceDistribution, getTeamAssignmentEvolution, getPredictionFeedbackEvolution, getCategoryCorrectionsData, resetCurrentPage } from './tickets-manager.js';
import { exportTicketsToCSV, exportChartDataToCSV, exportToPDF } from './export-manager.js';
import 'https://cdn.jsdelivr.net/npm/chart.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

// ===================================================================================
// GESTION DE L'ÉTAT GLOBAL ET DES ÉLÉMENTS DU DOM
// On garde ici une référence à toutes nos instances de graphiques et aux données.
// ===================================================================================

let allCharts = {}; // Un objet pour centraliser toutes nos instances de graphiques.
let allTicketsData = []; // On stocke les tickets ici pour ne pas les recharger inutilement.

// On met en cache les éléments du DOM qu'on utilise souvent pour de meilleures perfs.
const elements = {
    ticketSearch: document.getElementById('ticket-search'),
    tabs: document.querySelectorAll('.tab'),
    ticketModal: document.getElementById('ticketModal'),
    closeModal: document.getElementById('closeModal'),
    cancelTicket: document.getElementById('cancelTicket'),
    ticketForm: document.getElementById('ticketForm'),
    toast: document.getElementById('toast'),
    confidenceThreshold: document.getElementById('confidenceThreshold'),
    confidenceValue: document.getElementById('confidenceValue'),
    exportPdfButton: document.getElementById('exportPdfButton'),
    exportTicketsCsvButton: document.getElementById('exportTicketsCsvButton')
};

// ===================================================================================
// INITIALISATION DE LA PAGE
// C'est le point d'entrée principal quand la page est chargée.
// ===================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // On affiche un loader pendant que les données chargent pour ne pas avoir une page blanche.
        showLoader();
        
        // On charge les tickets une seule fois au démarrage.
        allTicketsData = await chargerTickets();
        
        // On initialise tous les graphiques et le tableau de tickets.
        await initializeDashboard();
        
        // On attache tous les écouteurs d'événements.
        setupEventListeners();
        
        // On active le premier onglet par défaut.
        elements.tabs[0]?.click();
        
    } catch (error) {
        console.error("Erreur critique lors de l'initialisation du tableau de bord:", error);
        alert("Une erreur est survenue lors du chargement des données. Veuillez rafraîchir la page.");
    } finally {
        // Quoi qu'il arrive, on cache le loader.
        hideLoader();
    }
});

// ===================================================================================
// FONCTIONS PRINCIPALES DU TABLEAU DE BORD
// ===================================================================================

/**
 * Orchestre l'initialisation ou la mise à jour de tous les composants du tableau de bord.
 */
async function initializeDashboard() {
    renderTicketsTable();
    updateKeyMetrics();
    await setupAllCharts();
}

/**
 * Met à jour les KPIs principaux (les gros chiffres en haut).
 */
function updateKeyMetrics() {
    const totalTickets = allTicketsData.length;
    const openTickets = allTicketsData.filter(t => t.status === 'en-cours' || t.status === 'nouveau').length;
    const resolvedTickets = allTicketsData.filter(t => t.status === 'resolu').length;
    
    document.getElementById('total-tickets').textContent = totalTickets;
    document.getElementById('open-tickets').textContent = openTickets;
    document.getElementById('resolved-tickets').textContent = resolvedTickets;
}

/**
 * Initialise tous les graphiques de la page.
 */
async function setupAllCharts() {
    // Chaque fonction s'occupe de créer un graphique spécifique.
    await setupConfidenceDistributionChart('7d');
    await setupTeamAssignmentEvolutionChart(30);
    await setupPredictionFeedbackChart(7);
    await setupCategoryCorrectionsChart();
}


// ===================================================================================
// CONFIGURATION DES ÉCOUTEURS D'ÉVÉNEMENTS
// On centralise ici toute la gestion des actions de l'utilisateur.
// ===================================================================================

function setupEventListeners() {
    // Navigation par onglets
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Recherche de tickets
    elements.ticketSearch.addEventListener('input', (e) => {
        resetCurrentPage(); // On revient à la page 1 à chaque nouvelle recherche
        renderTicketsTable(e.target.value.toLowerCase());
    });

    // Filtres de période pour le graphique de confiance
    const confidenceFilters = document.querySelectorAll('input[name="confidence-period"]');
    confidenceFilters.forEach(radio => {
        radio.addEventListener('change', (e) => {
            setupConfidenceDistributionChart(e.target.value);
        });
    });

    // Boutons d'export
    elements.exportPdfButton?.addEventListener('click', () => exportToPDF(allCharts, allTicketsData));
    elements.exportTicketsCsvButton?.addEventListener('click', () => exportTicketsToCSV(allTicketsData));
    
    // On attache un écouteur générique au conteneur des graphiques pour les exports CSV.
    document.getElementById('dashboard-graphs')?.addEventListener('click', handleChartExport);
}

// ===================================================================================
// LOGIQUE DE NAVIGATION ET D'INTERACTION UI
// ===================================================================================

/**
 * Affiche l'onglet sélectionné et cache les autres.
 * @param {string} tabId - L'ID de l'onglet à afficher ('overview', 'tickets', etc.).
 */
function switchTab(tabId) {
    // On met à jour l'état "actif" sur les boutons d'onglets.
    elements.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    
    // On affiche le contenu correspondant à l'onglet.
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });

    // C'est une petite optimisation : on s'assure que les graphiques se redimensionnent
    // correctement s'ils étaient cachés.
    if (tabId === 'dashboard-graphs') {
        Object.values(allCharts).forEach(chart => chart?.resize());
    }
}

/**
 * Gère l'export CSV pour n'importe quel graphique qui a un bouton d'export.
 * On utilise la délégation d'événements pour ne pas avoir à mettre un listener par bouton.
 */
function handleChartExport(event) {
    if (event.target.classList.contains('export-chart-csv')) {
        const chartId = event.target.dataset.chartId;
        const chart = allCharts[chartId];
        const filename = chartId.replace(/Chart$/, ''); // ex: confidenceDistributionChart -> confidenceDistribution
        if (chart) {
            exportChartDataToCSV(chart, filename);
        } else {
            console.error(`Graphique non trouvé pour l'export : ${chartId}`);
        }
    }
}

/**
 * Affiche le spinner de chargement.
 */
function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

/**
 * Cache le spinner de chargement.
 */
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}


// ===================================================================================
// FONCTIONS DE CRÉATION DES GRAPHIQUES (CHART.JS)
// Chaque fonction est responsable de la création d'une seule visualisation.
// ===================================================================================

/**
 * Crée ou met à jour le graphique de distribution des scores de confiance.
 * @param {string} period - La période à afficher ('7d', '30d', 'all').
 */
async function setupConfidenceDistributionChart(period) {
    const { labels, data } = getConfidenceDistribution(period);
    const ctx = document.getElementById('confidenceDistributionChart')?.getContext('2d');
    if (!ctx) return;
    
    if (allCharts.confidenceDistributionChart) {
        // Si le graphique existe déjà, on met juste les données à jour. C'est plus rapide.
        allCharts.confidenceDistributionChart.data.labels = labels;
        allCharts.confidenceDistributionChart.data.datasets[0].data = data;
        allCharts.confidenceDistributionChart.update();
    } else {
        // Sinon, on le crée de zéro.
        allCharts.confidenceDistributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nombre de tickets',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Nombre de Tickets' }
                    },
                    x: {
                        title: { display: true, text: 'Plage de Confiance de la Prédiction' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Distribution des Scores de Confiance',
                        font: { size: 16 }
                    }
                }
            }
        });
    }
}

/**
 * Crée le graphique de l'évolution des assignations par équipe.
 */
async function setupTeamAssignmentEvolutionChart() {
    const { labels, datasets } = await getTeamAssignmentEvolution(30);
    const ctx = document.getElementById('teamAssignmentEvolutionChart')?.getContext('2d');
    if (!ctx) return;
    
    // On définit un jeu de couleurs pour différencier les équipes.
    const colors = [
        'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 
        'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)'
    ];

    datasets.forEach((dataset, index) => {
        dataset.backgroundColor = colors[index % colors.length];
        dataset.borderColor = colors[index % colors.length].replace('0.7', '1');
        dataset.borderWidth = 1;
        dataset.fill = true;
    });

    allCharts.teamAssignmentEvolutionChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: true, // On empile les aires pour voir le volume total.
                    title: { display: true, text: 'Nombre d\'assignations' }
                }
            },
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: 'Évolution des Assignations par Équipe (30 derniers jours)',
                    font: { size: 16 }
                }
            }
        }
    });
}

/**
 * Crée le graphique de feedback sur les prédictions (correct vs incorrect).
 */
async function setupPredictionFeedbackChart() {
    const { labels, correctData, incorrectData } = await getPredictionFeedbackEvolution(7);
    const ctx = document.getElementById('predictionFeedbackChart')?.getContext('2d');
    if (!ctx) return;

    allCharts.predictionFeedbackChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Prédictions Correctes',
                    data: correctData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
                {
                    label: 'Prédictions Corrigées',
                    data: incorrectData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { 
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: 'Nombre de Prédictions' }
                }
            },
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: 'Feedback sur les Prédictions (7 derniers jours)',
                    font: { size: 16 }
                }
            }
        }
    });
}

/**
 * Crée le graphique en "donut" des catégories les plus corrigées.
 */
async function setupCategoryCorrectionsChart() {
    const { labels, data } = await getCategoryCorrectionsData();
    const ctx = document.getElementById('categoryCorrectionsChart')?.getContext('2d');
    if (!ctx) return;

    allCharts.categoryCorrectionsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)', 'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                title: {
                    display: true,
                    text: 'Catégories les plus souvent corrigées',
                    font: { size: 16 }
                }
            }
        }
    });
}

// Application State
let currentTab = 'dashboard';
let categoriesChart, confidenceChart, confidenceDistributionChart, teamEvolutionChart, predictionFeedbackChart, categoryCorrectionsChart;

// DOM Elements
const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');
const ticketModal = document.getElementById('ticketModal');
const closeModal = document.getElementById('closeModal');
const cancelTicket = document.getElementById('cancelTicket');
const ticketForm = document.getElementById('ticketForm');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');
const confidenceThreshold = document.getElementById('confidenceThreshold');
const confidenceValue = document.getElementById('confidenceValue');

// Vérification des éléments DOM critiques
if (!ticketForm || !searchInput) {
    console.error("Éléments DOM critiques manquants");
}

// Tab Navigation
function initializeTabs() {
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        });
    });

    // Activer l'onglet par défaut
    const defaultTab = document.querySelector('.nav-tab.active');
    if (defaultTab) {
        switchTab(defaultTab.dataset.tab);
    }
}

function switchTab(tabId) {
    currentTab = tabId;

    // Mettre à jour les onglets de navigation
    navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Afficher le contenu de l'onglet correspondant
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });

    // Initialiser les graphiques si l'onglet Analytiques est activé
    if (tabId === 'analytics') {
        initializeAnalyticsCharts();
    }
    
    // Rafraîchir le tableau des tickets si l'onglet tickets est activé
    if (tabId === 'tickets') {
        renderTicketsTable();
    }
}

// Modal management for new tickets
if (ticketModal) {
    closeModal.addEventListener('click', closeTicketModal);
    cancelTicket.addEventListener('click', closeTicketModal);

    ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('ticketTitle').value;
        const description = document.getElementById('ticketDescription').value;
        const email = document.getElementById('ticketEmail').value;
        
        if (!title || !description || !email) {
            showToast("Veuillez remplir tous les champs obligatoires", "error");
            return;
        }

        // Simuler la création et la classification (à remplacer par une vraie logique)
        showToast("Ticket créé et classifié avec succès !", "success");
        closeTicketModal();
        
        // Rafraîchir la liste
        await chargerTickets();
        renderTicketsTable();
    });
}

function closeTicketModal() {
    ticketModal.classList.remove('active');
    ticketForm.reset();
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    resetCurrentPage();
    renderTicketsTable(searchTerm);
});

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded');
    initializeTabs();
    
    try {
        await chargerTickets();
        if (currentTab === 'tickets') {
            renderTicketsTable();
        }
    } catch (error) {
        console.error("Erreur lors du chargement initial des tickets:", error);
        showToast("Erreur lors du chargement des tickets", "error");
    }
    
    await updateDashboardStats();
    initializeCharts();
    initializeExportButtons();

    const nbTicketsResolu = await compterTicketsResolu();
    document.getElementById('nbTicketsResolu').textContent = nbTicketsResolu;
});

// Toast notifications
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Rendre viewTicket et changeTicketStatus accessibles globalement
window.viewTicket = viewTicket;
window.changeTicketStatus = changeTicketStatus;
window.assignerTicketModal = assignerTicketModal;
window.confirmerAssignation = confirmerAssignation;
window.updateMembresOptions = updateMembresOptions;

// Dropdown pour les actions du tableau
window.toggleActions = function(event) {
    event.stopPropagation();
    const menu = event.target.closest('.ticket-actions-dropdown').querySelector('.actions-menu');
    
    // Fermer les autres menus ouverts
    document.querySelectorAll('.actions-menu.active').forEach(openMenu => {
        if (openMenu !== menu) {
            openMenu.classList.remove('active');
        }
    });

    menu.classList.toggle('active');
}

// Fermer les menus si on clique ailleurs
window.addEventListener('click', function(e) {
    const dropdowns = document.querySelectorAll('.ticket-actions-dropdown');
    dropdowns.forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
            dropdown.querySelector('.actions-menu').classList.remove('active');
        }
    });
});

// Chart initialization
async function initializeCharts() {
    // Destroy existing charts if they exist
    if (confidenceDistributionChart) confidenceDistributionChart.destroy();
    if (categoriesChart) categoriesChart.destroy();
    if (confidenceChart) confidenceChart.destroy();

    // Confidence Distribution Chart
    const ctxConfidenceDist = document.getElementById('confidenceDistributionChart');
    if (ctxConfidenceDist) {
        const { labels, data } = getConfidenceDistribution('7d'); // Période par défaut
        const confidenceDistData = {
            labels,
            datasets: [{
                label: 'Nombre de tickets',
                data,
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 1
            }]
        };
        confidenceDistributionChart = new Chart(ctxConfidenceDist, {
            type: 'bar',
            data: confidenceDistData,
            options: { 
                responsive: true, 
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Nombre de tickets' } } }
            }
        });

        // Ajouter des écouteurs d'événements pour les filtres
        document.querySelectorAll('#dashboard .chart-filter .filter-btn').forEach(btn => {
            if(btn.closest('.chart-container').querySelector('#confidenceDistributionChart')){
                btn.addEventListener('click', (e) => {
                    // Mettre à jour l'état actif du bouton
                    document.querySelectorAll('#dashboard .chart-filter .filter-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    const period = e.target.dataset.period;
                    const { labels, data } = getConfidenceDistribution(period);
                    confidenceDistributionChart.data.labels = labels;
                    confidenceDistributionChart.data.datasets[0].data = data;
                    confidenceDistributionChart.update();
                });
            }
        });
    }

    // Categories distribution - Utiliser les vraies données
    const ctx2 = document.getElementById('categoriesChart');
    if (ctx2) {
        // Récupérer les vraies données de catégories
        const categoriesData = await compterTicketsParCategorie();
        
        const labels = Object.keys(categoriesData);
        const data = Object.values(categoriesData);
        
        categoriesChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#0277bd',
                        '#7b1fa2',
                        '#2e7d32',
                        '#f57c00',
                        '#c2185b',
                        '#0288d1',
                        '#8e24aa',
                        '#fbc02d'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Confidence levels
    const ctx3 = document.getElementById('confidenceChart');
    if (ctx3) {
        const confidenceData = compterTicketsParNiveauDeConfiance();
        const labels = Object.keys(confidenceData);
        const data = Object.values(confidenceData);

        confidenceChart = new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#22c55e',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

async function initializeAnalyticsCharts() {
    if (teamEvolutionChart) teamEvolutionChart.destroy();
    if (predictionFeedbackChart) predictionFeedbackChart.destroy();
    if (categoryCorrectionsChart) categoryCorrectionsChart.destroy();

    // Team Evolution Chart
    const ctxTeam = document.getElementById('teamEvolutionChart');
    if (ctxTeam) {
        const { labels, datasets } = await getTeamAssignmentEvolution(30);
        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
        datasets.forEach((ds, index) => {
            ds.backgroundColor = colors[index % colors.length];
        });

        teamEvolutionChart = new Chart(ctxTeam, {
            type: 'bar',
            data: { labels, datasets },
            options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }
        });
    }

    // Prediction Feedback Evolution Chart
    const ctxFeedback = document.getElementById('predictionFeedbackChart');
    if (ctxFeedback) {
        const { labels, correctData, incorrectData } = await getPredictionFeedbackEvolution(7);
        const feedbackData = {
            labels,
            datasets: [{
                label: 'Prédictions correctes',
                data: correctData,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4,
            }, {
                label: 'Prédictions incorrectes',
                data: incorrectData,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
            }]
        };
        predictionFeedbackChart = new Chart(ctxFeedback, {
            type: 'line',
            data: feedbackData,
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    // Category Corrections Chart
    const ctxCorrections = document.getElementById('categoryCorrectionsChart');
    if (ctxCorrections) {
        const { labels, data } = await getCategoryCorrectionsData();
        const correctionsData = {
            labels,
            datasets: [{
                label: 'Nombre de corrections',
                data,
                backgroundColor: '#8b5cf6'
            }]
        };
        categoryCorrectionsChart = new Chart(ctxCorrections, {
            type: 'bar',
            data: correctionsData,
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

// Category management
document.getElementById('manageCategoriesBtn').addEventListener('click', () => {
    alert('Fonctionnalité de gestion des catégories à implémenter avec votre backend.');
});

// Export functionality
document.querySelectorAll('.settings-card button').forEach(btn => {
    const buttonText = btn.textContent.trim();
    if (buttonText.includes('CSV') || buttonText.includes('Excel') || buttonText.includes('PDF')) {
        btn.addEventListener('click', (e) => {
            const format = buttonText.includes('CSV') ? 'CSV' : 
                          (buttonText.includes('Excel') ? 'Excel' : 'PDF');
            showToast(`Export ${format} en cours...`, 'success');
        });
    }
});

// Ajout : fonction pour mettre à jour les stats du dashboard avec les vraies données Firestore
async function updateDashboardStats() {
    // Charger tous les tickets
    let tickets = [];
    try {
        tickets = await chargerTickets();
    } catch (e) {
        console.error('Erreur chargement tickets pour stats:', e);
        return;
    }
    
    // Statistiques à calculer
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // format YYYY-MM-DD
    let traitesAuj = 0;
    let enAttente = 0;
    let totalConfidence = 0;
    let nbConfidence = 0;
    let totalDuree = 0;
    let nbDuree = 0;
    let precisionModele = 94.2; // Valeur statique par défaut
    
    tickets.forEach(ticket => {
        // Tickets traités aujourd'hui (statut résolu ou fermé, date aujourd'hui)
        if ((ticket.status === 'resolu' || ticket.status === 'ferme') && ticket.date === todayStr) {
            traitesAuj++;
        }
        // Tickets en attente
        if (ticket.status === 'nouveau' || ticket.status === 'en-cours') {
            enAttente++;
        }
        // Moyenne de confiance
        if (typeof ticket.confidence === 'number') {
            totalConfidence += ticket.confidence;
            nbConfidence++;
        }
        // Temps moyen de traitement (si tu as un champ date de résolution)
        // Ici, on suppose qu'il y a ticket.dateResolution et ticket.dateSoumission
        if (ticket.status === 'resolu' && ticket.dateResolution && ticket.dateSoumission) {
            const d1 = new Date(ticket.dateSoumission);
            const d2 = new Date(ticket.dateResolution);
            const diffMin = (d2 - d1) / 60000;
            if (!isNaN(diffMin)) {
                totalDuree += diffMin;
                nbDuree++;
            }
        }
    });

    // Mise à jour du DOM avec les nouveaux IDs
    const elEnAttente = document.getElementById('stat-attente');
    if (elEnAttente) elEnAttente.textContent = enAttente;

    const elPrecision = document.getElementById('stat-precision');
    if (elPrecision) elPrecision.textContent = (precisionModele).toFixed(1) + '%';

    const elTempsMoyen = document.getElementById('stat-temps');
    if (elTempsMoyen) {
        if (nbDuree > 0) {
            elTempsMoyen.textContent = (totalDuree / nbDuree).toFixed(1) + 'min';
        } else {
            elTempsMoyen.textContent = '--';
        }
    }
    
    // Mettre à jour le graphique des catégories avec les vraies données
    await updateCategoriesChart();
}

// Nouvelle fonction pour mettre à jour le graphique des catégories
async function updateCategoriesChart() {
    const ctx2 = document.getElementById('categoriesChart');
    if (!ctx2) return;
    
    try {
        // Récupérer les vraies données de catégories
        const categoriesData = await compterTicketsParCategorie();
        
        const labels = Object.keys(categoriesData);
        const data = Object.values(categoriesData);
        
        // Détruire le graphique existant s'il existe
        if (categoriesChart) {
            categoriesChart.destroy();
        }
        
        // Créer le nouveau graphique
        categoriesChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#0277bd',
                        '#7b1fa2',
                        '#2e7d32',
                        '#f57c00',
                        '#c2185b',
                        '#0288d1',
                        '#8e24aa',
                        '#fbc02d'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du graphique des catégories:', error);
    }
}

function initializeExportButtons() {
    const exportTicketsBtn = document.getElementById('exportTicketsCSV');
    if (exportTicketsBtn) {
        exportTicketsBtn.addEventListener('click', async () => {
            showToast('Exportation des tickets en cours...', 'info');
            const ticketsToExport = await chargerTickets();
            exportTicketsToCSV(ticketsToExport);
        });
    }

    const exportChartsBtn = document.getElementById('exportChartsCSV');
    if (exportChartsBtn) {
        exportChartsBtn.addEventListener('click', () => {
             showToast('Exportation des données des graphiques en cours...', 'info');
             if (confidenceDistributionChart) {
                 exportChartDataToCSV(confidenceDistributionChart, 'distribution_confiance');
             }
             if (categoriesChart) {
                 exportChartDataToCSV(categoriesChart, 'repartition_categories');
             }
        });
    }

    const exportPdfBtn = document.getElementById('exportReportPDF');
    if(exportPdfBtn) {
        exportPdfBtn.addEventListener('click', async () => {
            showToast('Génération du rapport PDF en cours...', 'info');
            const ticketsForReport = await chargerTickets();
            const chartsToExport = {
                'Distribution de la Confiance': confidenceDistributionChart,
                'Répartition par Catégorie': categoriesChart,
                'Niveau de Confiance': confidenceChart,
                'Évolution des Assignations': teamEvolutionChart,
                'Feedback sur Prédictions': predictionFeedbackChart,
                'Corrections par Catégorie': categoryCorrectionsChart
            };
            await exportToPDF(chartsToExport, ticketsForReport);
        });
    }
}
    