import { db } from "./firebase-init.js";
import { collection, getDocs, query, orderBy, doc, updateDoc, where, getCountFromServer, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

let tickets = [];
let assignations = [];

// Fonction pour charger les assignations depuis Firestore
async function chargerAssignations() {
    try {
        const assignationsRef = collection(db, "assignations");
        const q = query(assignationsRef, where("statut_assignation", "==", "active"));
        const querySnapshot = await getDocs(q);
        
        assignations = [];
        querySnapshot.forEach((doc) => {
            const assignation = doc.data();
            assignations.push({
                id: doc.id,
                ticket_id: assignation.ticket_id,
                assigne_a: assignation.assigne_a,
                assigne_par: assignation.assigne_par,
                date_assignation: assignation.date_assignation,
                equipe: assignation.equipe,
                statut_assignation: assignation.statut_assignation,
                commentaire: assignation.commentaire || ""
            });
        });
        
        return assignations;
    } catch (error) {
        console.error("Erreur lors du chargement des assignations:", error);
        return [];
    }
}

// Fonction pour charger les tickets depuis Firestore avec leurs assignations
export async function chargerTickets() {
    try {
        // Charger les assignations en premier
        await chargerAssignations();
        
        const ticketsRef = collection(db, "tickets");
        const q = query(ticketsRef, orderBy("dateSoumission", "desc"));
        const querySnapshot = await getDocs(q);
        
        tickets = [];
        querySnapshot.forEach((doc) => {
            const ticket = doc.data();
            
            // Trouver l'assignation active pour ce ticket
            const assignation = assignations.find(a => a.ticket_id === doc.id);
            
            tickets.push({
                id: doc.id,
                title: ticket.titre,
                status: ticket.statut,
                category: ticket.categorie,
                date: ticket.dateSoumission.toDate().toISOString().split('T')[0],
                description: ticket.description,
                email: ticket.utilisateur,
                confidence: ticket.confidence || 0,
                // Informations d'assignation
                assigne_a: assignation ? assignation.assigne_a : null,
                assigne_par: assignation ? assignation.assigne_par : null,
                date_assignation: assignation ? assignation.date_assignation : null,
                equipe: assignation ? assignation.equipe : null,
                commentaire_assignation: assignation ? assignation.commentaire : ""
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

// Fonction pour assigner un ticket à une équipe ou personne
export async function assignerTicket(ticketId, assigneA, equipe = null, commentaire = "") {
    try {
        // Désactiver l'assignation précédente si elle existe
        const assignationExistante = assignations.find(a => a.ticket_id === ticketId && a.statut_assignation === "active");
        if (assignationExistante) {
            const assignationRef = doc(db, "assignations", assignationExistante.id);
            await updateDoc(assignationRef, {
                statut_assignation: "termine",
                date_fin: Timestamp.now()
            });
        }

        // Créer une nouvelle assignation
        const nouvelleAssignation = {
            ticket_id: ticketId,
            assigne_a: assigneA,
            assigne_par: "admin", // À remplacer par l'ID de l'admin connecté
            date_assignation: Timestamp.now(),
            equipe: equipe,
            statut_assignation: "active",
            commentaire: commentaire
        };

        const assignationRef = await addDoc(collection(db, "assignations"), nouvelleAssignation);

        // Mettre à jour les données locales
        await chargerAssignations();
        await chargerTickets();

        return assignationRef.id;
    } catch (error) {
        console.error("Erreur lors de l'assignation du ticket:", error);
        throw error;
    }
}

// Fonction pour transférer une assignation
export async function transfererAssignation(ticketId, nouveauAssigneA, nouvelleEquipe = null, commentaire = "") {
    try {
        // Terminer l'assignation actuelle
        const assignationActuelle = assignations.find(a => a.ticket_id === ticketId && a.statut_assignation === "active");
        if (assignationActuelle) {
            const assignationRef = doc(db, "assignations", assignationActuelle.id);
            await updateDoc(assignationRef, {
                statut_assignation: "transfere",
                date_fin: Timestamp.now(),
                commentaire_fin: commentaire
            });
        }

        // Créer une nouvelle assignation
        return await assignerTicket(ticketId, nouveauAssigneA, nouvelleEquipe, commentaire);
    } catch (error) {
        console.error("Erreur lors du transfert de l'assignation:", error);
        throw error;
    }
}

// Fonction pour obtenir les équipes disponibles
export function getEquipesDisponibles() {
    return [
        { id: "support_technique", nom: "Support Technique", description: "Problèmes techniques et bugs" },
        { id: "support_general", nom: "Support Général", description: "Assistance générale et questions" },
        { id: "facturation", nom: "Facturation", description: "Problèmes de facturation et remboursements" },
        { id: "developpement", nom: "Développement", description: "Demandes de fonctionnalités" },
        { id: "administration", nom: "Administration", description: "Gestion des comptes et accès" }
    ];
}

// Fonction pour obtenir les membres d'une équipe 
export function getMembresEquipe(equipeId) {
    const membresParEquipe = {
        "support_technique": [
            { id: "tech_user_1", nom: "Franck KOUASSI", email: "franck.kouassi@asten.com" }
            
        ],
        "support_general": [
            { id: "gen_user_1", nom: "Daniala DATANA", email: "daniala.datana@asten.com" }
        ],
        "facturation": [
            { id: "fact_user_1", nom: "Kanouté COUMBA", email: "kanoute.coumba@asten.com" }
        ],
        "developpement": [
            { id: "dev_user_1", nom: "Damien LARY", email: "damien.lary@asten.com" },
        ],
        "administration": [
            { id: "admin_user_1", nom: "Admin Principal", email: "admin@asten.com" }
        ]
    };
    
    return membresParEquipe[equipeId] || [];
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
            ticket.category.toLowerCase().includes(searchTerm) ||
            (ticket.equipe && ticket.equipe.toLowerCase().includes(searchTerm))
          )
        : tickets;

    if (filteredTickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="no-tickets">
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
                ${ticket.equipe ? 
                    `<span class="equipe-tag">${getEquipeLabel(ticket.equipe)}</span>` : 
                    '<span class="non-assigne">Non assigné</span>'
                }
            </td>
            <td>
                <div class="ticket-actions">
                    <button class="btn btn-secondary" onclick="viewTicket('${ticket.id}')">
                        👁️ Voir
                    </button>
                    <button class="btn btn-primary" onclick="changeTicketStatus('${ticket.id}')">
                        🔄 Changer Statut
                    </button>
                    <button class="btn btn-success" onclick="assignerTicketModal('${ticket.id}')">
                        👥 Assigner
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

function getEquipeLabel(equipeId) {
    const equipes = getEquipesDisponibles();
    const equipe = equipes.find(e => e.id === equipeId);
    return equipe ? equipe.nom : equipeId;
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

    // Informations d'assignation
    const assignationInfo = ticket.equipe ? `
        <p><strong>Équipe assignée :</strong> <span class="equipe-tag">${getEquipeLabel(ticket.equipe)}</span></p>
        <p><strong>Assigné à :</strong> ${ticket.assigne_a || 'Non spécifié'}</p>
        <p><strong>Assigné par :</strong> ${ticket.assigne_par || 'Non spécifié'}</p>
        ${ticket.date_assignation ? `<p><strong>Date d'assignation :</strong> ${formatDate(ticket.date_assignation.toDate())}</p>` : ''}
        ${ticket.commentaire_assignation ? `<p><strong>Commentaire :</strong> ${ticket.commentaire_assignation}</p>` : ''}
    ` : '<p><strong>Assignation :</strong> <span class="non-assigne">Non assigné</span></p>';

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
                    ${assignationInfo}
                    <p><strong>Description :</strong></p>
                    <div class="ticket-description">${ticket.description}</div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-success" onclick="assignerTicketModal('${ticket.id}')">
                    👥 Assigner/Transférer
                </button>
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

// Fonction pour compter les tickets "resolu"
export async function compterTicketsResolu() {
    try {
        const ticketsRef = collection(db, "tickets");
        const q = query(ticketsRef, where("statut", "==", "resolu"));
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    } catch (error) {
        console.error("Erreur lors du comptage des tickets résolus:", error);
        return 0;
    }
}

export async function compterTicketsEnCours() {
    try {
        const ticketsRef = collection(db, "tickets");
        const q = query(ticketsRef, where("statut", "==", "en-cours"));
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    } catch (error) {
        console.error("Erreur lors du comptage des tickets en cours:", error);
        return 0;
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    const nbTicketsEnCours = await compterTicketsResolu();
    document.getElementById('nbTicketsResolu').textContent = nbTicketsEnCours;
}); 

window.addEventListener('DOMContentLoaded', async () => {
    const nbTicketsEnCours = await compterTicketsEnCours();
    document.getElementById('nbTicketsEnCours').textContent = nbTicketsEnCours;
}); 

// Fonction pour compter les tickets par niveau de confiance
export function compterTicketsParNiveauDeConfiance() {
    const confidenceCounts = {
        'Haute (90%+)': 0,
        'Moyenne (70-89%)': 0,
        'Faible (<70%)': 0
    };

    tickets.forEach(ticket => {
        const confidence = ticket.confidence || 0;
        if (confidence >= 0.9) {
            confidenceCounts['Haute (90%+)']++;
        } else if (confidence >= 0.7) {
            confidenceCounts['Moyenne (70-89%)']++;
        } else {
            confidenceCounts['Faible (<70%)']++;
        }
    });

    return confidenceCounts;
}

// Fonction pour compter les tickets par catégorie
export async function compterTicketsParCategorie() {
    try {
        const ticketsRef = collection(db, "tickets");
        const querySnapshot = await getDocs(ticketsRef);
        
        // Initialiser le compteur pour toutes les catégories
        const categories = {
            'Support Technique': 0,
            'Assistance Générale': 0,
            'Demande de Fonctionnalité': 0,
            'Signalement de Bug': 0,
            'Question sur l\'Utilisation': 0,
            'Problème d\'Accès / Connexion': 0,
            'Demande de Remboursement': 0,
            'Autre': 0
        };
        
        // Compter les tickets par catégorie
        querySnapshot.forEach((doc) => {
            const ticket = doc.data();
            const categorie = ticket.categorie;
            
            // Mapper les catégories de la base de données vers les labels du graphique
            const categorieMapping = {
                'Support Technique': 'Support Technique',
                'Assistance Générale': 'Assistance Générale',
                'Demande de Fonctionnalité': 'Demande de Fonctionnalité',
                'Signalement de Bug': 'Signalement de Bug',
                'Question sur l\'Utilisation': 'Question sur l\'Utilisation',
                'Problème d\'Accès / Connexion': 'Problème d\'Accès / Connexion',
                'Demande de Remboursement': 'Demande de Remboursement',
                'autre': 'Autre'
            };
            
            const labelCategorie = categorieMapping[categorie] || 'Autre';
            categories[labelCategorie]++;
        });
        
        return categories;
    } catch (error) {
        console.error("Erreur lors du comptage des tickets par catégorie:", error);
        return {
            'Support Technique': 0,
            'Assistance Générale': 0,
            'Demande de Fonctionnalité': 0,
            'Signalement de Bug': 0,
            'Question sur l\'Utilisation': 0,
            'Problème d\'Accès / Connexion': 0,
            'Demande de Remboursement': 0,
            'Autre': 0
        };
    }
}

// Fonction pour ouvrir le modal d'assignation
export function assignerTicketModal(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const modal = document.getElementById('ticketDetailsModal');
    if (!modal) {
        console.error("Modal element not found");
        return;
    }

    const equipes = getEquipesDisponibles();
    const equipesOptions = equipes.map(equipe => 
        `<option value="${equipe.id}">${equipe.nom}</option>`
    ).join('');

    const membresOptions = equipes.map(equipe => {
        const membres = getMembresEquipe(equipe.id);
        return membres.map(membre => 
            `<option value="${membre.id}" data-equipe="${equipe.id}">${membre.nom} (${equipe.nom})</option>`
        ).join('');
    }).join('');

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Assigner le ticket #${ticket.id}</h2>
                <button class="close-btn" onclick="this.closest('.modal').classList.remove('active')">×</button>
            </div>
            <div class="modal-body">
                <div class="ticket-info">
                    <p><strong>Titre :</strong> ${ticket.title}</p>
                    <p><strong>Statut actuel :</strong> <span class="ticket-status status-${ticket.status}">${getStatusLabel(ticket.status)}</span></p>
                    <p><strong>Catégorie :</strong> <span class="category-tag cat-${ticket.category}">${getCategoryLabel(ticket.category)}</span></p>
                    ${ticket.equipe ? `<p><strong>Équipe actuelle :</strong> <span class="equipe-tag">${getEquipeLabel(ticket.equipe)}</span></p>` : ''}
                </div>
                
                <form id="assignationForm" style="margin-top: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Équipe</label>
                        <select class="form-select" id="equipeSelect" onchange="updateMembresOptions()">
                            <option value="">Sélectionner une équipe</option>
                            ${equipesOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Assigner à (optionnel)</label>
                        <select class="form-select" id="membreSelect">
                            <option value="">Assigner à l'équipe entière</option>
                            ${membresOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Commentaire (optionnel)</label>
                        <textarea class="form-textarea" id="commentaireAssignation" placeholder="Commentaire sur l'assignation..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal').classList.remove('active')">Annuler</button>
                <button class="btn btn-success" onclick="confirmerAssignation('${ticketId}')">
                    ✅ Confirmer l'assignation
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Fonction pour confirmer l'assignation
export async function confirmerAssignation(ticketId) {
    try {
        const equipeSelect = document.getElementById('equipeSelect');
        const membreSelect = document.getElementById('membreSelect');
        const commentaireInput = document.getElementById('commentaireAssignation');
        
        const equipe = equipeSelect.value;
        const membre = membreSelect.value;
        const commentaire = commentaireInput.value;
        
        if (!equipe) {
            alert('Veuillez sélectionner une équipe');
            return;
        }
        
        // Assigner le ticket
        await assignerTicket(ticketId, membre || equipe, equipe, commentaire);
        
        // Fermer le modal
        const modal = document.getElementById('ticketDetailsModal');
        modal.classList.remove('active');
        
        // Rafraîchir le tableau
        renderTicketsTable();
        
        // Afficher une notification de succès
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = `Ticket assigné avec succès à ${equipe}`;
            toast.className = 'toast success show';
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    } catch (error) {
        console.error("Erreur lors de l'assignation:", error);
        alert("Erreur lors de l'assignation du ticket");
    }
}

// Fonction pour mettre à jour les options des membres selon l'équipe sélectionnée
export function updateMembresOptions() {
    const equipeSelect = document.getElementById('equipeSelect');
    const membreSelect = document.getElementById('membreSelect');
    
    if (!equipeSelect || !membreSelect) return;
    
    const equipeId = equipeSelect.value;
    const membres = getMembresEquipe(equipeId);
    
    membreSelect.innerHTML = '<option value="">Assigner à l\'équipe entière</option>';
    
    membres.forEach(membre => {
        const option = document.createElement('option');
        option.value = membre.id;
        option.textContent = membre.nom;
        membreSelect.appendChild(option);
    });
}

// Fonctions globales pour l'interface
window.viewTicket = viewTicket;
window.changeTicketStatus = changeTicketStatus;
window.assignerTicketModal = assignerTicketModal;
window.confirmerAssignation = confirmerAssignation;
window.updateMembresOptions = updateMembresOptions; 