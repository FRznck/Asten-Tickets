import { db } from "./firebase-init.js";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

let tickets = [];

// Fonction pour charger les tickets depuis Firestore
export async function chargerTickets() {
    try {
        const ticketsRef = collection(db, "tickets");
        const q = query(ticketsRef, orderBy("dateSoumission", "desc"));
        const querySnapshot = await getDocs(q);
        
        tickets = [];
        querySnapshot.forEach((doc) => {
            const ticket = doc.data();
            tickets.push({
                id: doc.id,
                title: ticket.titre,
                status: ticket.statut,
                category: ticket.categorie,
                date: ticket.dateSoumission.toDate().toISOString().split('T')[0],
                description: ticket.description,
                email: ticket.utilisateur
            });
        });
        
        return tickets;
    } catch (error) {
        console.error("Erreur lors du chargement des tickets:", error);
        throw error;
    }
}

// Fonction pour mettre à jour le statut d'un ticket
export async function updateTicketStatus(ticketId, newStatus) {
    try {
        const ticketRef = doc(db, "tickets", ticketId);
        await updateDoc(ticketRef, {
            statut: newStatus
        });
        
        // Mettre à jour le ticket dans le tableau local
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
            tickets[ticketIndex].status = newStatus;
        }
        
        return true;
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        throw error;
    }
}

// Fonction pour obtenir le prochain statut possible
function getNextStatus(currentStatus) {
    const statusFlow = {
        'nouveau': 'en-cours',
        'en-cours': 'resolu',
        'resolu': 'ferme',
        'ferme': 'nouveau'
    };
    return statusFlow[currentStatus] || 'nouveau';
}

// Fonction pour afficher les tickets dans le tableau
export function renderTicketsTable(searchTerm = '') {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) {
        console.error("Élément ticketsTableBody non trouvé");
        return;
    }

    const filteredTickets = searchTerm 
        ? tickets.filter(ticket => 
            ticket.title.toLowerCase().includes(searchTerm) ||
            ticket.id.toLowerCase().includes(searchTerm) ||
            ticket.category.toLowerCase().includes(searchTerm)
          )
        : tickets;

    if (filteredTickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-tickets">
                    Aucun ticket trouvé
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredTickets.map(ticket => `
        <tr>
            <td class="ticket-id">${ticket.id}</td>
            <td>${ticket.title}</td>
            <td><span class="ticket-status status-${ticket.status}">${getStatusLabel(ticket.status)}</span></td>
            <td><span class="category-tag cat-${ticket.category}">${getCategoryLabel(ticket.category)}</span></td>
            <td>${formatDate(ticket.date)}</td>
            <td>
                <div class="ticket-actions">
                    <button class="btn btn-secondary" onclick="viewTicket('${ticket.id}')">
                        👁️ Voir
                    </button>
                    <button class="btn btn-primary" onclick="changeTicketStatus('${ticket.id}')">
                        🔄 Changer Statut
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Fonctions utilitaires
function getStatusLabel(status) {
    const labels = {
        'nouveau': 'Nouveau',
        'en-cours': 'En Cours',
        'resolu': 'Résolu',
        'ferme': 'Fermé'
    };
    return labels[status] || status;
}

function getCategoryLabel(category) {
    const labels = {
        'technique': 'Technique',
        'facturation': 'Facturation',
        'support': 'Support',
        'autre': 'Autre'
    };
    return labels[category] || category;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

// Fonction pour afficher les détails d'un ticket
export function viewTicket(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const modal = document.getElementById('ticketDetailsModal');
    if (!modal) {
        console.error("Modal element not found");
        return;
    }

    // Mettre à jour le contenu du modal
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${ticket.title}</h2>
                <button class="close-btn" onclick="this.closest('.modal').classList.remove('active')">×</button>
            </div>
            <div class="modal-body">
                <div class="ticket-details">
                    <p><strong>ID Ticket :</strong> ${ticket.id}</p>
                    <p><strong>Statut :</strong> <span class="ticket-status status-${ticket.status}">${getStatusLabel(ticket.status)}</span></p>
                    <p><strong>Catégorie :</strong> <span class="category-tag cat-${ticket.category}">${getCategoryLabel(ticket.category)}</span></p>
                    <p><strong>Date de création :</strong> ${formatDate(ticket.date)}</p>
                    <p><strong>ID Utilisateur :</strong> ${ticket.email}</p>
                    <p><strong>Description :</strong></p>
                    <div class="ticket-description">${ticket.description}</div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal').classList.remove('active')">Fermer</button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Fonction pour changer le statut d'un ticket
export async function changeTicketStatus(ticketId) {
    try {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const newStatus = getNextStatus(ticket.status);
        await updateTicketStatus(ticketId, newStatus);
        renderTicketsTable();
        
        // Afficher une notification de succès
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = `Statut du ticket mis à jour vers ${getStatusLabel(newStatus)}`;
            toast.className = 'toast success show';
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    } catch (error) {
        console.error("Erreur lors du changement de statut:", error);
        // Afficher une notification d'erreur
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = "Erreur lors du changement de statut";
            toast.className = 'toast error show';
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }
} 