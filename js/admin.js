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

// ===================================================================================
// INITIALISATION DE LA PAGE
// C'est le point d'entrée principal quand la page est chargée.
// ===================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM loaded');
        
        // On affiche un loader pendant que les données chargent pour ne pas avoir une page blanche.
        showLoader();
        
        // On charge les tickets une seule fois au démarrage.
        allTicketsData = await chargerTickets();
        
        // On initialise tous les graphiques et le tableau de tickets.
        await initializeDashboard();
        
        // On attache tous les écouteurs d'événements.
        setupEventListeners();
        
        // On initialise la navigation par onglets
        initializeTabs();
        
        // On active le premier onglet par défaut.
        const defaultTab = document.querySelector('.nav-tab.active');
        if (defaultTab) {
            switchTab(defaultTab.dataset.tab);
        }
        
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
    console.log('Initialisation du dashboard...');
    renderTicketsTable();
    await updateDashboardStats();
    await initializeCharts();
    initializeExportButtons();
    console.log('Dashboard initialisé');
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
    // Recherche de tickets
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            resetCurrentPage(); // On revient à la page 1 à chaque nouvelle recherche
            renderTicketsTable(e.target.value.toLowerCase());
        });
    }

    // Filtres de période pour le graphique de confiance
    const confidenceFilters = document.querySelectorAll('input[name="confidence-period"]');
    confidenceFilters.forEach(radio => {
        radio.addEventListener('change', (e) => {
            setupConfidenceDistributionChart(e.target.value);
        });
    });

    // Boutons d'export
    const exportPdfButton = document.getElementById('exportPdfButton');
    const exportTicketsCsvButton = document.getElementById('exportTicketsCsvButton');
    
    if (exportPdfButton) {
        exportPdfButton.addEventListener('click', () => exportToPDF(allCharts, allTicketsData));
    }
    if (exportTicketsCsvButton) {
        exportTicketsCsvButton.addEventListener('click', () => exportTicketsToCSV(allTicketsData));
    }
    
    // On attache un écouteur générique au conteneur des graphiques pour les exports CSV.
    const dashboardGraphs = document.getElementById('dashboard-graphs');
    if (dashboardGraphs) {
        dashboardGraphs.addEventListener('click', handleChartExport);
    }
}

// ===================================================================================
// LOGIQUE DE NAVIGATION ET D'INTERACTION UI
// ===================================================================================

/**
 * Initialise la navigation par onglets
 */
function initializeTabs() {
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        });
    });
}

/**
 * Affiche l'onglet sélectionné et cache les autres.
 * @param {string} tabId - L'ID de l'onglet à afficher ('dashboard', 'tickets', etc.).
 */
function switchTab(tabId) {
    currentTab = tabId;

    // On met à jour l'état "actif" sur les boutons d'onglets.
    navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // On affiche le contenu correspondant à l'onglet.
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

    // C'est une petite optimisation : on s'assure que les graphiques se redimensionnent
    // correctement s'ils étaient cachés.
    if (tabId === 'dashboard') {
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
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'block';
    }
}

/**
 * Cache le spinner de chargement.
 */
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
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
    
    // Détruire le graphique existant s'il existe
    if (confidenceDistributionChart) {
        confidenceDistributionChart.destroy();
    }
    
    confidenceDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nombre de tickets',
                data: data,
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 1
            }]
        },
        options: { 
            responsive: true, 
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Nombre de tickets' } } }
        }
    });
    
    // Stocker la référence
    allCharts.confidenceDistributionChart = confidenceDistributionChart;
}

/**
 * Crée ou met à jour le graphique d'évolution des assignations par équipe.
 */
async function setupTeamAssignmentEvolutionChart(days = 30) {
    const ctx = document.getElementById('teamEvolutionChart')?.getContext('2d');
    if (!ctx) return;
    
    // Détruire le graphique existant s'il existe
    if (teamEvolutionChart) {
        teamEvolutionChart.destroy();
    }
    
    const { labels, datasets } = await getTeamAssignmentEvolution(days);
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    datasets.forEach((ds, index) => {
        ds.backgroundColor = colors[index % colors.length];
    });

    teamEvolutionChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }
    });
    
    // Stocker la référence
    allCharts.teamEvolutionChart = teamEvolutionChart;
}

/**
 * Crée ou met à jour le graphique d'évolution du feedback sur les prédictions.
 */
async function setupPredictionFeedbackChart(days = 7) {
    const ctx = document.getElementById('predictionFeedbackChart')?.getContext('2d');
    if (!ctx) return;
    
    // Détruire le graphique existant s'il existe
    if (predictionFeedbackChart) {
        predictionFeedbackChart.destroy();
    }
    
    const { labels, correctData, incorrectData } = await getPredictionFeedbackEvolution(days);
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
    
    predictionFeedbackChart = new Chart(ctx, {
        type: 'line',
        data: feedbackData,
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
    
    // Stocker la référence
    allCharts.predictionFeedbackChart = predictionFeedbackChart;
}

/**
 * Crée ou met à jour le graphique des corrections par catégorie.
 */
async function setupCategoryCorrectionsChart() {
    const ctx = document.getElementById('categoryCorrectionsChart')?.getContext('2d');
    if (!ctx) return;
    
    // Détruire le graphique existant s'il existe
    if (categoryCorrectionsChart) {
        categoryCorrectionsChart.destroy();
    }
    
    const { labels, data } = await getCategoryCorrectionsData();
    const correctionsData = {
        labels,
        datasets: [{
            label: 'Nombre de corrections',
            data,
            backgroundColor: '#8b5cf6'
        }]
    };
    
    categoryCorrectionsChart = new Chart(ctx, {
        type: 'bar',
        data: correctionsData,
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
    
    // Stocker la référence
    allCharts.categoryCorrectionsChart = categoryCorrectionsChart;
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

// Toast notifications
function showToast(message, type = 'success') {
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
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
    console.log('Initialisation des graphiques...');
    
    // Destroy existing charts if they exist
    if (confidenceDistributionChart) {
        confidenceDistributionChart.destroy();
        confidenceDistributionChart = null;
    }
    if (categoriesChart) {
        categoriesChart.destroy();
        categoriesChart = null;
    }
    if (confidenceChart) {
        confidenceChart.destroy();
        confidenceChart = null;
    }

    // Confidence Distribution Chart
    const ctxConfidenceDist = document.getElementById('confidenceDistributionChart');
    if (ctxConfidenceDist) {
        console.log('Création du graphique de distribution de confiance...');
        try {
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
                btn.addEventListener('click', (e) => {
                    // Retirer la classe active de tous les boutons
                    document.querySelectorAll('#dashboard .chart-filter .filter-btn').forEach(b => b.classList.remove('active'));
                    // Ajouter la classe active au bouton cliqué
                    e.target.classList.add('active');
                    // Mettre à jour le graphique
                    const period = e.target.dataset.period;
                    setupConfidenceDistributionChart(period);
                });
            });
        } catch (error) {
            console.error('Erreur lors de la création du graphique de distribution de confiance:', error);
        }
    } else {
        console.warn('Élément confidenceDistributionChart non trouvé');
    }

    // Categories Chart
    const ctx2 = document.getElementById('categoriesChart');
    if (ctx2) {
        console.log('Création du graphique des catégories...');
        try {
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
        } catch (error) {
            console.error('Erreur lors de la création du graphique des catégories:', error);
        }
    } else {
        console.warn('Élément categoriesChart non trouvé');
    }

    // Confidence Level Chart
    const ctx3 = document.getElementById('confidenceChart');
    if (ctx3) {
        console.log('Création du graphique de niveau de confiance...');
        try {
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
                            '#22c55e', // Vert pour haute confiance
                            '#f59e0b', // Orange pour moyenne confiance
                            '#ef4444'  // Rouge pour faible confiance
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
            console.error('Erreur lors de la création du graphique de niveau de confiance:', error);
        }
    } else {
        console.warn('Élément confidenceChart non trouvé');
    }
    
    console.log('Initialisation des graphiques terminée');
}

async function initializeAnalyticsCharts() {
    console.log('Initialisation des graphiques analytiques...');
    
    if (teamEvolutionChart) {
        teamEvolutionChart.destroy();
        teamEvolutionChart = null;
    }
    if (predictionFeedbackChart) {
        predictionFeedbackChart.destroy();
        predictionFeedbackChart = null;
    }
    if (categoryCorrectionsChart) {
        categoryCorrectionsChart.destroy();
        categoryCorrectionsChart = null;
    }

    // Team Evolution Chart
    const ctxTeam = document.getElementById('teamEvolutionChart');
    if (ctxTeam) {
        console.log('Création du graphique d\'évolution des équipes...');
        try {
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
        } catch (error) {
            console.error('Erreur lors de la création du graphique d\'évolution des équipes:', error);
        }
    } else {
        console.warn('Élément teamEvolutionChart non trouvé');
    }

    // Prediction Feedback Evolution Chart
    const ctxFeedback = document.getElementById('predictionFeedbackChart');
    if (ctxFeedback) {
        console.log('Création du graphique de feedback des prédictions...');
        try {
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
        } catch (error) {
            console.error('Erreur lors de la création du graphique de feedback des prédictions:', error);
        }
    } else {
        console.warn('Élément predictionFeedbackChart non trouvé');
    }

    // Category Corrections Chart
    const ctxCorrections = document.getElementById('categoryCorrectionsChart');
    if (ctxCorrections) {
        console.log('Création du graphique des corrections par catégorie...');
        try {
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
        } catch (error) {
            console.error('Erreur lors de la création du graphique des corrections par catégorie:', error);
        }
    } else {
        console.warn('Élément categoryCorrectionsChart non trouvé');
    }
    
    console.log('Initialisation des graphiques analytiques terminée');
}

// Category management
const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
if (manageCategoriesBtn) {
    manageCategoriesBtn.addEventListener('click', () => {
        alert('Fonctionnalité de gestion des catégories à implémenter avec votre backend.');
    });
}

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
    console.log('Mise à jour des statistiques du dashboard...');
    
    // Charger tous les tickets
    let tickets = [];
    try {
        tickets = await chargerTickets();
        console.log(`Nombre de tickets chargés: ${tickets.length}`);
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

    console.log(`Statistiques calculées: traitesAuj=${traitesAuj}, enAttente=${enAttente}, nbConfidence=${nbConfidence}`);

    // Mise à jour du DOM avec les nouveaux IDs
    const elEnAttente = document.getElementById('stat-attente');
    if (elEnAttente) {
        elEnAttente.textContent = enAttente;
        console.log('Stat attente mise à jour');
    } else {
        console.warn('Élément stat-attente non trouvé');
    }

    const elPrecision = document.getElementById('stat-precision');
    if (elPrecision) {
        elPrecision.textContent = (precisionModele).toFixed(1) + '%';
        console.log('Stat précision mise à jour');
    } else {
        console.warn('Élément stat-precision non trouvé');
    }

    const elTempsMoyen = document.getElementById('stat-temps');
    if (elTempsMoyen) {
        if (nbDuree > 0) {
            elTempsMoyen.textContent = (totalDuree / nbDuree).toFixed(1) + 'min';
        } else {
            elTempsMoyen.textContent = '--';
        }
        console.log('Stat temps moyen mise à jour');
    } else {
        console.warn('Élément stat-temps non trouvé');
    }
    
    const elTraitesAuj = document.getElementById('stat-today');
    if (elTraitesAuj) {
        elTraitesAuj.textContent = traitesAuj;
        console.log('Stat traités aujourd\'hui mise à jour');
    } else {
        console.warn('Élément stat-today non trouvé');
    }
    
    // Mettre à jour le graphique des catégories avec les vraies données
    try {
        await updateCategoriesChart();
    } catch (error) {
        console.error('Erreur lors de la mise à jour du graphique des catégories:', error);
    }
    
    console.log('Mise à jour des statistiques terminée');
}

// Nouvelle fonction pour mettre à jour le graphique des catégories
async function updateCategoriesChart() {
    console.log('Mise à jour du graphique des catégories...');
    
    const ctx2 = document.getElementById('categoriesChart');
    if (!ctx2) {
        console.warn('Élément categoriesChart non trouvé');
        return;
    }
    
    try {
        // Récupérer les vraies données de catégories
        const categoriesData = await compterTicketsParCategorie();
        console.log('Données de catégories récupérées:', categoriesData);
        
        const labels = Object.keys(categoriesData);
        const data = Object.values(categoriesData);
        
        // Détruire le graphique existant s'il existe
        if (categoriesChart) {
            categoriesChart.destroy();
            categoriesChart = null;
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
        
        console.log('Graphique des catégories mis à jour avec succès');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du graphique des catégories:', error);
    }
}

function initializeExportButtons() {
    console.log('Initialisation des boutons d\'export...');
    
    const exportTicketsBtn = document.getElementById('exportTicketsCSV');
    if (exportTicketsBtn) {
        exportTicketsBtn.addEventListener('click', async () => {
            showToast('Exportation des tickets en cours...', 'info');
            const ticketsToExport = await chargerTickets();
            exportTicketsToCSV(ticketsToExport);
        });
        console.log('Bouton export tickets initialisé');
    } else {
        console.warn('Bouton exportTicketsCSV non trouvé');
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
        console.log('Bouton export graphiques initialisé');
    } else {
        console.warn('Bouton exportChartsCSV non trouvé');
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
        console.log('Bouton export PDF initialisé');
    } else {
        console.warn('Bouton exportReportPDF non trouvé');
    }
    
    console.log('Initialisation des boutons d\'export terminée');
}
    