let currentTab = 'dashboard';
let tickets = [];

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

// Charger les tickets depuis l'API
async function fetchTickets() {
    try {
        const res = await fetch('http://localhost:3001/api/tickets');
        tickets = await res.json();
        renderTicketsTable();
    } catch (err) {
        showToast('Erreur lors du chargement des tickets', 'error');
    }
}

// Tab Navigation
navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        switchTab(tabId);
    });
});

function switchTab(tabId) {
    navTabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    currentTab = tabId;
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

// Ticket Form Submission
ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const submitText = document.getElementById('submitText');
    const submitLoading = document.getElementById('submitLoading');
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline-block';
    submitBtn.disabled = true;

    // Récupérer la valeur de confiance depuis le champ du formulaire
    const confidence = parseInt(document.getElementById('ticketConfidence').value, 10);

    // Récupérer l'utilisateur (à adapter selon ton formulaire)
    const utilisateur_id = document.getElementById('ticketUserId').value;

    // Récupérer la catégorie prédite (à adapter selon ton formulaire)
    const categorie_predite_id = parseInt(document.getElementById('ticketCategoryId').value, 10);

    const newTicket = {
        utilisateur_id: utilisateur_id,
        titre: document.getElementById('ticketTitle').value,
        description: document.getElementById('ticketDescription').value,
        statut: 'ouvert',
        categorie_predite_id: categorie_predite_id,
        confidence: confidence
    };

    try {
        await fetch('http://localhost:3001/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTicket)
        });
        closeTicketModal();
        showToast('Ticket créé avec succès!', 'success');
        await fetchTickets();
    } catch (err) {
        showToast('Erreur lors de la création du ticket', 'error');
    }
    submitText.style.display = 'inline';
    submitLoading.style.display = 'none';
    submitBtn.disabled = false;
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    renderTicketsTable(searchTerm);
});

// Render tickets table
function renderTicketsTable(searchTerm = '') {
    const tbody = document.getElementById('ticketsTableBody');
    const filteredTickets = searchTerm
        ? tickets.filter(ticket =>
            (ticket.titre || '').toLowerCase().includes(searchTerm) ||
            (ticket.ticket_id || '').toString().toLowerCase().includes(searchTerm) ||
            (ticket.categorie_predite_id || '').toString().toLowerCase().includes(searchTerm)
        )
        : tickets;

    tbody.innerHTML = filteredTickets.map(ticket => `
        <tr>
            <td class="ticket-id">${ticket.ticket_id}</td>
            <td>${ticket.titre}</td>
            <td><span class="ticket-status status-${ticket.statut}">${getStatusLabel(ticket.statut)}</span></td>
            <td><span class="category-tag cat-${ticket.categorie_predite_id}">${ticket.categorie_predite_id}</span></td>
            <td>
                <div class="confidence-score">
                    <span>${ticket.confidence || 0}%</span>
                    <div class="confidence-bar">
                        <div class="confidence-fill confidence-${getConfidenceLevel(ticket.confidence || 0)}"
                             style="width: ${(ticket.confidence || 0)}%"></div>
                    </div>
                </div>
            </td>
            <td>${formatDate(ticket.date_creation)}</td>
            <td>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;"
                        onclick="viewTicket('${ticket.ticket_id}')">
                    👁️ Voir
                </button>
            </td>
        </tr>
    `).join('');
}

// Helper functions
function getStatusLabel(status) {
    const labels = {
        'nouveau': 'Nouveau',
        'ouvert': 'Ouvert',
        'en-cours': 'En Cours',
        'en_cours': 'En Cours',
        'resolu': 'Résolu',
        'ferme': 'Fermé'
    };
    return labels[status] || status;
}

function getConfidenceLevel(confidence) {
    if (confidence >= 90) return 'high';
    if (confidence >= 70) return 'medium';
    return 'low';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

window.viewTicket = function(ticketId) {
    const ticket = tickets.find(t => t.ticket_id == ticketId);
    if (ticket) {
        alert(`Détails du ticket ${ticket.ticket_id}:\n\nTitre: ${ticket.titre}\nDescription: ${ticket.description}\nStatut: ${getStatusLabel(ticket.statut)}\nCatégorie: ${ticket.categorie_predite_id} (${ticket.confidence || 0}% confiance)`);
    }
}

// Toast notifications
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Settings - Confidence threshold slider
confidenceThreshold.addEventListener('input', (e) => {
    confidenceValue.textContent = e.target.value + '%';
});

// Bulk classify functionality (à adapter selon ton backend)
document.getElementById('bulkClassifyBtn').addEventListener('click', async () => {
    const btn = document.getElementById('bulkClassifyBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '🤖 Classification en cours... <span class="loading"></span>';
    btn.disabled = true;
    await new Promise(resolve => setTimeout(resolve, 3000));
    btn.innerHTML = originalText;
    btn.disabled = false;
    showToast(`Reclassification terminée !`, 'success');
    await fetchTickets();
});

// Chart initialization
function initializeCharts() {
    // ... (inchangé)
}

function initializeAnalyticsCharts() {
    // ... (inchangé)
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    fetchTickets();
    initializeCharts();
});

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