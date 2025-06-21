import { db } from "./firebase-init.js";
import { collection, getDocs, query, orderBy, doc, updateDoc, where, getCountFromServer, addDoc, Timestamp, limit } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Import des notifications
import { notifierAssignationTicket, notifierModificationStatut } from './notifications-manager.js';

let tickets = [];
let assignations = [];
let currentPage = 1;
const TICKETS_PER_PAGE = 10; // On peut ajuster ce nombre pour afficher plus ou moins de tickets par page.

// On récupère ici toutes les assignations "actives" depuis Firestore.
// C'est utile pour savoir rapidement qui est sur quel ticket.
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

// C'est une des fonctions les plus importantes.
// Elle charge tous les tickets et, pour chacun, elle va chercher les infos de l'utilisateur
// qui l'a créé et l'assignation actuelle. Ça évite de faire plein de requêtes séparées plus tard.
export async function chargerTickets() {
    try {
        // On s'assure d'avoir les assignations à jour avant de traiter les tickets.
        await chargerAssignations();
        
        const ticketsRef = collection(db, "tickets");
        const q = query(ticketsRef, orderBy("dateSoumission", "desc"));
        const querySnapshot = await getDocs(q);
        
        tickets = [];
        
        // Récupérer tous les utilisateurs pour éviter les requêtes multiples
        const usersRef = collection(db, "utilisateur");
        const usersSnapshot = await getDocs(usersRef);
        const users = {};
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            users[doc.id] = userData;
        });
        
        querySnapshot.forEach((doc) => {
            const ticket = doc.data();
            
            // On cherche si une assignation active existe pour ce ticket.
            const assignation = assignations.find(a => a.ticket_id === doc.id);
            
            // On récupère les infos de l'utilisateur qui a soumis le ticket.
            const userInfo = users[ticket.utilisateur] || {};
            
            tickets.push({
                id: doc.id,
                title: ticket.titre,
                status: ticket.statut,
                category: ticket.categorie,
                date: ticket.dateSoumission.toDate(),
                description: ticket.description,
                email: ticket.utilisateur,
                userEmail: userInfo.email || 'Email non disponible',
                userName: userInfo.nom || 'Nom non disponible',
                confidence: ticket.confidence || 0,
                categorie_modifiee: ticket.categorie_modifiee || false,
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

// Petite fonction pour basculer le statut d'un ticket (ex: de 'nouveau' à 'en-cours').
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

// Gère toute la logique pour assigner un ticket.
// Si une ancienne assignation existait, on la termine avant de créer la nouvelle.
export async function assignerTicket(ticketId, assigneA, equipe = null, commentaire = "") {
    try {
        // D'abord, on désactive l'assignation précédente si elle existe.
        const assignationExistante = assignations.find(a => a.ticket_id === ticketId && a.statut_assignation === "active");
        if (assignationExistante) {
            const assignationRef = doc(db, "assignations", assignationExistante.id);
            await updateDoc(assignationRef, {
                statut_assignation: "termine",
                date_fin: Timestamp.now()
            });
        }

        // Ensuite, on crée la nouvelle assignation.
        const nouvelleAssignation = {
            ticket_id: ticketId,
            assigne_a: assigneA,
            assigne_par: "admin", // TODO: Remplacer par l'ID de l'admin actuellement connecté.
            date_assignation: Timestamp.now(),
            equipe: equipe,
            statut_assignation: "active",
            commentaire: commentaire
        };

        const assignationRef = await addDoc(collection(db, "assignations"), nouvelleAssignation);

        // Notifier l'assignation du ticket
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
            const ticketData = {
                id: ticketId,
                titre: ticket.title,
                categorie: ticket.category,
                equipe: equipe
            };
            await notifierAssignationTicket(ticketData, assigneA, "admin");
        }

        // On recharge les données pour que l'interface soit à jour.
        await chargerAssignations();
        await chargerTickets();

        return assignationRef.id;
    } catch (error) {
        console.error("Erreur lors de l'assignation du ticket:", error);
        throw error;
    }
}

// Le transfert, c'est simplement terminer l'assignation actuelle
// avec un statut "transfere" et en créer une nouvelle. On réutilise assignerTicket().
export async function transfererAssignation(ticketId, nouveauAssigneA, nouvelleEquipe = null, commentaire = "") {
    try {
        // On termine l'assignation actuelle.
        const assignationActuelle = assignations.find(a => a.ticket_id === ticketId && a.statut_assignation === "active");
        if (assignationActuelle) {
            const assignationRef = doc(db, "assignations", assignationActuelle.id);
            await updateDoc(assignationRef, {
                statut_assignation: "transfere",
                date_fin: Timestamp.now(),
                commentaire_fin: commentaire
            });
        }

        // Et on en crée une nouvelle.
        return await assignerTicket(ticketId, nouveauAssigneA, nouvelleEquipe, commentaire);
    } catch (error) {
        console.error("Erreur lors du transfert de l'assignation:", error);
        throw error;
    }
}

// Retourne la liste statique des équipes. Si un jour ça doit venir de la base,
// il faudra rendre cette fonction asynchrone.
export function getEquipesDisponibles() {
    return [
        { id: "support_technique", nom: "Support Technique", description: "Problèmes techniques et bugs" },
        { id: "support_general", nom: "Support Général", description: "Assistance générale et questions" },
        { id: "facturation", nom: "Facturation", description: "Problèmes de facturation et remboursements" },
        { id: "developpement", nom: "Développement", description: "Demandes de fonctionnalités" },
        { id: "administration", nom: "Administration", description: "Gestion des comptes et accès" }
    ];
}

// Pour un ID d'équipe donné, on retourne les membres associés.
// C'est statique pour l'instant, mais ça pourrait aussi venir de Firestore.
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

// Le cycle de vie d'un ticket. On définit ici quel statut suit quel autre.
// Ça permet de changer le statut d'un simple clic sur un bouton.
function getNextStatus(currentStatus) {
    const statusFlow = {
        'nouveau': 'en-cours',
        'en-cours': 'resolu',
        'resolu': 'ferme',
        'ferme': 'nouveau'
    };
    return statusFlow[currentStatus] || 'nouveau';
}

// C'est la fonction qui "dessine" le tableau des tickets dans le HTML.
// Elle prend en compte le terme de recherche et la pagination.
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
            ticket.userName.toLowerCase().includes(searchTerm) ||
            ticket.userEmail.toLowerCase().includes(searchTerm) ||
            (ticket.equipe && ticket.equipe.toLowerCase().includes(searchTerm))
          )
        : tickets;

    // On applique la pagination sur les tickets filtrés.
    const totalPages = Math.ceil(filteredTickets.length / TICKETS_PER_PAGE);
    if (currentPage > totalPages) {
        currentPage = totalPages > 0 ? totalPages : 1;
    }
    const startIndex = (currentPage - 1) * TICKETS_PER_PAGE;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + TICKETS_PER_PAGE);

    if (paginatedTickets.length === 0 && searchTerm) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="no-tickets">
                    Aucun ticket ne correspond à votre recherche.
                </td>
            </tr>
        `;
    } else if (paginatedTickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="no-tickets">
                    Aucun ticket à afficher.
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = paginatedTickets.map(ticket => `
            <tr>
                <td class="ticket-id">${ticket.id}</td>
                <td>${ticket.title}</td>
                <td><span class="ticket-status status-${ticket.status}">${getStatusLabel(ticket.status)}</span></td>
                <td><span class="category-tag cat-${ticket.category}">${getCategoryLabel(ticket.category)}</span></td>
                <td>${formatDate(ticket.date)}</td>
                <td>
                    <div class="user-info">
                        <div class="user-name">${ticket.userName}</div>
                        <div class="user-email">${ticket.userEmail}</div>
                    </div>
                </td>
                <td>
                    ${ticket.equipe ? 
                        `<span class="equipe-tag">${getEquipeLabel(ticket.equipe)}</span>` : 
                        '<span class="non-assigne">Non assigné</span>'
                    }
                </td>
                <td>
                    <div class="ticket-actions-dropdown">
                        <button class="actions-btn" onclick="toggleActions(event)">•••</button>
                        <div class="actions-menu">
                            <a href="#" onclick="viewTicket('${ticket.id}'); event.target.closest('.actions-menu').classList.remove('active'); return false;">👁️ Voir</a>
                            <a href="#" onclick="changeTicketStatus('${ticket.id}'); event.target.closest('.actions-menu').classList.remove('active'); return false;">🔄 Changer Statut</a>
                            <a href="#" onclick="assignerTicketModal('${ticket.id}'); event.target.closest('.actions-menu').classList.remove('active'); return false;">👥 Assigner</a>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPaginationControls(filteredTickets.length);
}

// Quand l'utilisateur tape une recherche, on doit revenir à la première page.
export function resetCurrentPage() {
    currentPage = 1;
}

// Ici, on génère les boutons "Précédent" / "Suivant" et l'indicateur de page.
function renderPaginationControls(totalTickets) {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(totalTickets / TICKETS_PER_PAGE);
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Bouton Précédent
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo; Précédent';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTicketsTable(document.getElementById('searchInput').value);
        }
    });
    paginationContainer.appendChild(prevButton);

    // Pour l'instant, un simple texte "Page X sur Y" suffit entre les boutons
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${currentPage} sur ${totalPages}`;
    pageInfo.style.margin = '0 1rem';
    paginationContainer.appendChild(pageInfo);

    // Bouton Suivant
    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'Suivant &raquo;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTicketsTable(document.getElementById('searchInput').value);
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Fonctions utilitaires pour obtenir des libellés propres à partir des ID.
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

function formatDate(date) {
    if (!date) return 'Non spécifié';
    
    // On s'assure de travailler avec un objet Date, peu importe ce que Firestore nous envoie (Timestamp, string...).
    if (date && typeof date.toDate === 'function') {
        date = date.toDate();
    }
    
    // Si c'est une chaîne de caractères, on essaie de la convertir.
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    // Ultime vérification pour éviter les erreurs "Invalid Date".
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'Date invalide';
    }
    
    return date.toLocaleString('fr-FR');
}

// Gère l'affichage de la modale qui montre tous les détails d'un ticket.
export function viewTicket(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const modal = document.getElementById('ticketDetailsModal');
    if (!modal) {
        console.error("Modal element not found");
        return;
    }

    // On prépare le bloc d'infos sur l'assignation.
    const assignationInfo = ticket.equipe ? `
        <p><strong>Équipe assignée :</strong> <span class="equipe-tag">${getEquipeLabel(ticket.equipe)}</span></p>
        <p><strong>Assigné à :</strong> ${ticket.assigne_a || 'Non spécifié'}</p>
        <p><strong>Assigné par :</strong> ${ticket.assigne_par || 'Non spécifié'}</p>
        ${ticket.date_assignation ? `<p><strong>Date d'assignation :</strong> ${formatDate(ticket.date_assignation)}</p>` : ''}
        ${ticket.commentaire_assignation ? `<p><strong>Commentaire pour l'équipe :</strong> ${ticket.commentaire_assignation}</p>` : ''}
    ` : '<p><strong>Assignation :</strong> <span class="non-assigne">Non assigné</span></p>';

    // On injecte tout le HTML dans la modale.
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
                    <p><strong>Utilisateur :</strong> ${ticket.userName} (${ticket.userEmail})</p>
                    ${assignationInfo}
                    <p><strong>Description du ticket :</strong></p>
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

// La fonction appelée par le bouton "Changer Statut".
// Elle utilise le cycle de vie défini dans getNextStatus.
export async function changeTicketStatus(ticketId) {
    try {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const ancienStatut = ticket.status;
        const newStatus = getNextStatus(ticket.status);
        
        await updateTicketStatus(ticketId, newStatus);
        
        // Notifier le changement de statut
        const ticketData = {
            id: ticketId,
            titre: ticket.title,
            categorie: ticket.category
        };
        await notifierModificationStatut(ticketData, ancienStatut, newStatus, ticket.email);
        
        renderTicketsTable();
        
        // C'est toujours bien de donner un retour visuel à l'utilisateur.
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
        // Et on lui montre aussi quand ça ne marche pas.
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

// Fonctions de comptage pour les stats du tableau de bord.
// Utilise getCountFromServer qui est optimisé pour ne pas télécharger tous les documents.
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

// Calcule la répartition des tickets en fonction du score de confiance de la prédiction.
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

// Calcule le nombre de tickets pour chaque catégorie.
// C'est utilisé pour le graphique "donut" des catégories.
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
        
        // On parcourt tous les tickets pour faire le compte.
        querySnapshot.forEach((doc) => {
            const ticket = doc.data();
            const categorie = ticket.categorie;
            
            // Ce mapping nous assure que même si les ID de catégories changent un peu,
            // on les regroupe correctement pour l'affichage.
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

// Affiche la modale pour assigner ou transférer un ticket.
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

// Appelé par le bouton "Confirmer" de la modale d'assignation.
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
        
        // On lance l'assignation...
        await assignerTicket(ticketId, membre || equipe, equipe, commentaire);
        
        // ...on ferme la modale...
        const modal = document.getElementById('ticketDetailsModal');
        modal.classList.remove('active');
        
        // ...on rafraîchit le tableau...
        renderTicketsTable();
        
        // ...et on confirme à l'utilisateur que tout s'est bien passé.
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

// Petite fonction dynamique qui met à jour la liste des membres
// en fonction de l'équipe sélectionnée dans le formulaire d'assignation.
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

// On expose certaines fonctions à l'objet global `window` pour qu'elles puissent
// être appelées par les attributs `onclick` dans le HTML.
window.viewTicket = viewTicket;
window.changeTicketStatus = changeTicketStatus;
window.assignerTicketModal = assignerTicketModal;
window.confirmerAssignation = confirmerAssignation;
window.updateMembresOptions = updateMembresOptions;

// --- Fonctions pour les nouveaux graphiques ---

// 1. Distribution des Scores de Confiance
export function getConfidenceDistribution(period = '7d') {
    let ticketsToProcess = tickets;

    if (period !== 'all') {
        const days = parseInt(period.replace('d', ''));
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        ticketsToProcess = tickets.filter(t => t.date >= startDate && t.date <= endDate);
    }

    const bins = Array(10).fill(0);
    const labels = Array.from({ length: 10 }, (_, i) => `${i * 10}-${(i + 1) * 10}%`);

    ticketsToProcess.forEach(ticket => {
        if (typeof ticket.confidence === 'number') {
            const binIndex = Math.floor(ticket.confidence * 10);
            if (binIndex >= 0 && binIndex < 10) {
                bins[binIndex]++;
            } else if (ticket.confidence === 1) { // il faut penser au cas où la confiance est exactement 1
                bins[9]++;
            }
        }
    });

    return { labels, data: bins };
}


// 2. Évolution des Assignations par Équipe
export async function getTeamAssignmentEvolution(days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    const startTimestamp = Timestamp.fromDate(startDate);

    const assignationsRef = collection(db, "assignations");
    const q = query(assignationsRef, where("date_assignation", ">=", startTimestamp));
    const snapshot = await getDocs(q);

    const teamData = {}; // On va stocker les données comme ça : { equipe: { date: count } }
    const allEquipes = new Set();
    const allDates = new Set();

    snapshot.forEach(doc => {
        const assignation = doc.data();
        if (assignation.equipe && assignation.date_assignation) {
            const equipe = getEquipeLabel(assignation.equipe); // On utilise le nom de l'équipe pour que ce soit plus lisible.
            const date = assignation.date_assignation.toDate().toISOString().split('T')[0];
            
            allEquipes.add(equipe);
            allDates.add(date);

            if (!teamData[equipe]) teamData[equipe] = {};
            teamData[equipe][date] = (teamData[equipe][date] || 0) + 1;
        }
    });

    const sortedDates = Array.from(allDates).sort();
    const labels = sortedDates.map(d => new Date(d).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }));
    
    const datasets = Array.from(allEquipes).map(equipe => {
        return {
            label: equipe,
            data: sortedDates.map(date => teamData[equipe][date] || 0),
        };
    });

    return { labels, datasets };
}


// 3. Évolution du Feedback sur les Prédictions
export async function getPredictionFeedbackEvolution(days = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    const startTimestamp = Timestamp.fromDate(startDate);

    const feedbackRef = collection(db, "prediction_feedback");
    const q = query(feedbackRef, where("feedback_date", ">=", startTimestamp));
    const snapshot = await getDocs(q);

    const dailyData = {};
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        dailyData[key] = { correct: 0, incorrect: 0 };
    }

    snapshot.forEach(doc => {
        const feedback = doc.data();
        if (feedback.feedback_date) {
            const key = feedback.feedback_date.toDate().toISOString().split('T')[0];
            if (dailyData[key]) {
                if (feedback.needs_retraining === false) {
                    dailyData[key].correct++;
                } else {
                    dailyData[key].incorrect++;
                }
            }
        }
    });
    
    const labels = Object.keys(dailyData).map(d => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short' }));
    const correctData = Object.values(dailyData).map(d => d.correct);
    const incorrectData = Object.values(dailyData).map(d => d.incorrect);

    return { labels, correctData, incorrectData };
}


// 4. Répartition des Corrections par Catégorie
export async function getCategoryCorrectionsData() {
    const correctionsRef = collection(db, "corrections");
    const snapshot = await getDocs(correctionsRef);

    const correctionsCount = {}; // On stocke les comptes comme ça : { categorie: count }

    snapshot.forEach(doc => {
        const correction = doc.data();
        // Ce qui nous intéresse, c'est la catégorie que le modèle avait prédite à tort.
        const oldCategory = getCategoryLabel(correction.ancienne_categorie_id || 'Autre');

        correctionsCount[oldCategory] = (correctionsCount[oldCategory] || 0) + 1;
    });

    const labels = Object.keys(correctionsCount);
    const data = Object.values(correctionsCount);

    // C'est plus parlant de trier pour voir tout de suite les catégories les plus problématiques.
    const sortedData = labels.map((label, index) => ({ label, count: data[index] }))
        .sort((a, b) => b.count - a.count);

    return {
        labels: sortedData.map(item => item.label),
        data: sortedData.map(item => item.count)
    };
} 