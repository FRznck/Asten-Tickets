import { chargerTickets, renderTicketsTable, viewTicket, changeTicketStatus } from './tickets-manager.js';

// Application State
let currentTab = 'dashboard';

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
    
    initializeCharts();
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

// Chart initialization
function initializeCharts() {
    // Classifications evolution chart
    const ctx1 = document.getElementById('classificationsChart');
    if (ctx1) {
        new Chart(ctx1, {
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

    // Categories distribution
    const ctx2 = document.getElementById('categoriesChart');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Technique', 'Facturation', 'Support', 'Autre'],
                datasets: [{
                    data: [45, 25, 20, 10],
                    backgroundColor: [
                        '#0277bd',
                        '#7b1fa2',
                        '#2e7d32',
                        '#f57c00'
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
        new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: ['Haute (90%+)', 'Moyenne (70-89%)', 'Faible (<70%)'],
                datasets: [{
                    data: [60, 30, 10],
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
    