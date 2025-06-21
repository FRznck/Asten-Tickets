import { chargerTickets, renderTicketsTable, viewTicket, changeTicketStatus, compterTicketsResolu, compterTicketsParCategorie, compterTicketsParNiveauDeConfiance, assignerTicketModal, confirmerAssignation, updateMembresOptions } from './tickets-manager.js';

// Application State
let currentTab = 'dashboard';
let classificationsChart, categoriesChart, confidenceChart;

// DOM Elements
const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');
const ticketModal = document.getElementById('ticketModal');
const newTicketBtn = document.getElementById('newTicketBtn');
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
    console.log('Switching to tab:', tabId);

    // Update active tab
    navTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
        }
    });


    // Update active content
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
            content.classList.add('active');
        }
    });

    currentTab = tabId;

    // Initialize tab-specific content
    if (tabId === 'dashboard') {
        initializeCharts();
    } else if (tabId === 'tickets') {
        renderTicketsTable();
    } else if (tabId === 'analytics') {
        initializeAnalyticsCharts();
    }
}

// Modal Management
newTicketBtn.addEventListener('click', () => {
    ticketModal.classList.add('active');
});

closeModal.addEventListener('click', closeTicketModal);
cancelTicket.addEventListener('click', closeTicketModal);

ticketModal.addEventListener('click', (e) => {
    if (e.target === ticketModal) {
        closeTicketModal();
    }
});

function closeTicketModal() {
    ticketModal.classList.remove('active');
    ticketForm.reset();
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
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

// Chart initialization
async function initializeCharts() {
    // Destroy existing charts if they exist
    if (classificationsChart) {
        classificationsChart.destroy();
    }
    if (categoriesChart) {
        categoriesChart.destroy();
    }
    if (confidenceChart) {
        confidenceChart.destroy();
    }

    // Classifications evolution chart
    const ctx1 = document.getElementById('classificationsChart');
    if (ctx1) {
        classificationsChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                datasets: [{
                    label: 'Tickets Classifiés',
                    data: [45, 52, 38, 67, 73, 42, 35],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
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

function initializeAnalyticsCharts() {
    // Performance chart
    const ctx4 = document.getElementById('performanceChart');
    if (ctx4) {
        new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Précision (%)',
                    data: [88, 91, 93, 92, 94, 95],
                    backgroundColor: 'rgba(37, 99, 235, 0.8)'
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
    }

    // Errors analysis
    const ctx5 = document.getElementById('errorsChart');
    if (ctx5) {
        new Chart(ctx5, {
            type: 'line',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                datasets: [{
                    label: 'Erreurs de Classification',
                    data: [12, 8, 6, 4],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
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
    if (btn.textContent.includes('CSV') || btn.textContent.includes('Excel') || btn.textContent.includes('PDF')) {
        btn.addEventListener('click', (e) => {
            const format = e.target.textContent.includes('CSV') ? 'CSV' : 
                          e.target.textContent.includes('Excel') ? 'Excel' : 'PDF';
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

// Patch pour :contains (non supporté nativement)
(function() {
    if (!Element.prototype.matches) return;
    if (document.querySelector(':contains')) return;
    document.querySelectorAll = (function(qsa) {
        return function(selectors) {
            if (selectors.includes(':contains')) {
                const match = /(.+):contains\(["'](.+)["']\)/.exec(selectors);
                if (match) {
                    const els = qsa.call(document, match[1]);
                    return Array.from(els).filter(el => el.textContent.includes(match[2]));
                }
            }
            return qsa.call(document, selectors);
        };
    })(document.querySelectorAll);
})();
    