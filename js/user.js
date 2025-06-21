import { db, auth } from './firebase-init.js';
import {
    collection, addDoc, getDocs, query, where, Timestamp,
    updateDoc, doc
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Import des notifications
import { notifierCreationTicket } from './notifications-manager.js';

let currentTicket = null;
let tickets = [];

// Configuration de l'API NLP
const NLP_API_BASE_URL = 'http://localhost:8000';

// Fonction pour prédire la catégorie via l'API NLP
async function predictCategory(title, description) {
    try {
        const response = await fetch(`${NLP_API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                titre: title,
                description: description
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const prediction = await response.json();
        return prediction;
    } catch (error) {
        console.error('Erreur lors de la prédiction NLP:', error);
        // Fallback en cas d'erreur
        return {
            predicted_category: 'Autre',
            confidence: 0.0,
            top_categories: [],
            needs_human_review: true,
            keywords: []
        };
    }
}

// Fonction pour sauvegarder le feedback
async function saveFeedback(ticketId, predictedCategory, actualCategory, confidence) {
    try {
        await fetch(`${NLP_API_BASE_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticket_id: ticketId,
                predicted_category: predictedCategory,
                actual_category: actualCategory,
                confidence: confidence
            })
        });
        console.log('Feedback sauvegardé avec succès');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du feedback:', error);
    }
}

document.getElementById('ticketForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const title = this.querySelector('input[type="text"]').value;
    const description = this.querySelector('textarea').value;
    const submitBtn = this.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const loading = submitBtn.querySelector('#submitLoading');

    btnText.textContent = 'Traitement...';
    loading.style.display = 'inline-block';
    submitBtn.disabled = true;

    try {
        // Prédiction via l'API NLP
        const prediction = await predictCategory(title, description);
        
        showPredictedCategory(prediction);
        showModificationSection(prediction);

        const user = auth.currentUser;
        if (!user) {
            alert("Utilisateur non connecté");
            return;
        }

        // Créer le ticket dans Firebase
        const docRef = await addDoc(collection(db, "tickets"), {
            titre: title,
            description: description,
            statut: "Nouveau",
            dateSoumission: Timestamp.now(),
            categorie: prediction.predicted_category,
            utilisateur: user.uid,
            confidence: prediction.confidence,
            needs_human_review: prediction.needs_human_review,
            keywords: prediction.keywords || []
        });

        // Notifier la création du ticket
        const ticketData = {
            id: docRef.id,
            titre: title,
            categorie: prediction.predicted_category,
            statut: "Nouveau"
        };
        await notifierCreationTicket(ticketData, user.uid);

        showToast('Ticket soumis avec succès !');
        this.reset();
        btnText.textContent = 'Soumettre';
        loading.style.display = 'none';
        submitBtn.disabled = false;

        await chargerTickets();
    } catch (err) {
        console.error("Erreur lors de la soumission:", err);
        alert("Échec de l'enregistrement du ticket.");
        btnText.textContent = 'Soumettre';
        loading.style.display = 'none';
        submitBtn.disabled = false;
    }
});

function showPredictedCategory(prediction) {
    const container = document.getElementById('predictedCategory');
    
    // Afficher la catégorie principale
    const mainCategory = `
        <div class="category-predite">
            <div class="category-header">
                <span class="category-name">${prediction.predicted_category}</span>
                <span class="confidence-score">${Math.round(prediction.confidence * 100)}%</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
                Catégorie suggérée par l'IA
                ${prediction.needs_human_review ? ' ⚠️ Nécessite une vérification' : ''}
            </p>
        </div>
    `;
    
    // Afficher les mots-clés si existants
    let keywordsHtml = '';
    if (prediction.keywords && prediction.keywords.length > 0) {
        keywordsHtml = `
            <div class="keywords-section" style="margin-top: 10px;">
                <p style="font-size: 0.8rem; color: var(--text-secondary);">Mots-clés détectés:</p>
                <div class="keywords-list" style="display: flex; flex-wrap: wrap; gap: 5px;">
                    ${prediction.keywords.map(keyword => 
                        `<span style="background: var(--primary-color); color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem;">${keyword}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = mainCategory + keywordsHtml;
    currentTicket = prediction;
}

function showModificationSection(prediction) {
    document.getElementById('modifySection').style.display = 'block';
    document.getElementById('noModifyMessage').style.display = 'none';
    document.getElementById('newCategory').value = prediction.predicted_category;
}

function cancelTicket() {
    document.getElementById('ticketForm').reset();
}

function cancelModification() {
    document.getElementById('modifySection').style.display = 'none';
    document.getElementById('noModifyMessage').style.display = 'block';
}

async function validateModification() {
    const newCategory = document.getElementById('newCategory').value;

    if (!newCategory || tickets.length === 0) return;

    const ticketToUpdate = tickets[0]; // On modifie le plus récent dans ce contexte
    
    try {
        // Mettre à jour dans Firebase
        const ticketRef = doc(db, "tickets", ticketToUpdate.id);
        await updateDoc(ticketRef, {
            categorie: newCategory,
            categorie_modifiee: true,
            date_modification: Timestamp.now()
        });

        // Sauvegarder la correction dans la collection "corrections"
        const user = auth.currentUser;
        await addDoc(collection(db, "corrections"), {
            ticket_id: ticketToUpdate.id,
            utilisateur_id: user ? user.uid : "",
            ancienne_categorie_id: currentTicket ? currentTicket.predicted_category : "",
            nouvelle_categorie_id: newCategory,
            date_correction: Timestamp.now(),
            commentaire: ""
        });

        // Sauvegarder le feedback pour l'amélioration du modèle
        if (currentTicket && currentTicket.predicted_category !== newCategory) {
            await saveFeedback(
                ticketToUpdate.id,
                currentTicket.predicted_category,
                newCategory,
                currentTicket.confidence
            );
        }

        ticketToUpdate.category = newCategory;
        updateTicketsDisplay();
        cancelModification();
        showToast('Catégorie modifiée et enregistrée avec succès !');
    } catch (error) {
        console.error("Erreur de mise à jour :", error);
        alert("Erreur lors de la mise à jour du ticket.");
    }
}

function updateTicketsDisplay() {
    const container = document.getElementById('ticketsContainer');
    container.innerHTML = '';

    tickets.forEach(ticket => {
        const statusClass = ticket.status.toLowerCase().replace(' ', '-');
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-item';
        
        // Afficher les informations du ticket avec plus de détails
        ticketElement.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">${ticket.title}</div>
                <div class="ticket-status status-${statusClass}">${ticket.status}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-secondary);">${ticket.description}</span>
                <span class="ticket-date">${ticket.date}</span>
            </div>
            <div class="ticket-category">
                Catégorie: ${ticket.category}
                ${ticket.confidence ? ` (Confiance: ${Math.round(ticket.confidence * 100)}%)` : ''}
            </div>
            ${ticket.keywords && ticket.keywords.length > 0 ? `
                <div class="ticket-keywords" style="margin-top: 5px;">
                    <small style="color: var(--text-secondary);">Mots-clés: ${ticket.keywords.join(', ')}</small>
                </div>
            ` : ''}
        `;
        container.appendChild(ticketElement);
    });
}

async function chargerTickets() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "tickets"), where("utilisateur", "==", user.uid));
    const snapshot = await getDocs(q);
    tickets = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        tickets.push({
            id: doc.id,
            title: data.titre,
            description: data.description,
            status: data.statut,
            date: data.dateSoumission.toDate().toLocaleDateString('fr-FR'),
            category: data.categorie,
            confidence: data.confidence,
            keywords: data.keywords || []
        });
    });

    updateTicketsDisplay();
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Fonction pour vérifier l'état de l'API NLP
async function checkNLPAPIHealth() {
    try {
        const response = await fetch(`${NLP_API_BASE_URL}/health`);
        const health = await response.json();
        
        if (health.status === 'healthy') {
            console.log('API NLP connectée et opérationnelle');
            return true;
        } else {
            console.warn('API NLP non disponible:', health);
            return false;
        }
    } catch (error) {
        console.warn('Impossible de connecter à l\'API NLP:', error);
        return false;
    }
}

window.addEventListener("load", async () => {
    // Vérifier l'état de l'API NLP au chargement
    await checkNLPAPIHealth();
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await chargerTickets();

            const cards = document.querySelectorAll('.card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'all 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 200);
            });

            //  si aucun ticket trouvé
            if (tickets.length === 0) {
                const container = document.getElementById('ticketsContainer');
                container.innerHTML = `
                    <div class="ticket-empty">
                        🎫 vous avez aucun ticket pour le moment.
                    </div>
                `;
            }
        } else {
            window.location.href = '/auth.html';
        }
    });
});

// Fonctions globales pour les filtres
window.filterByDate = function() {
    // Implémentation du filtre par date
    console.log('Filtrage par date');
};

window.filterByStatus = function() {
    // Implémentation du filtre par statut
    console.log('Filtrage par statut');
};

window.filterByCategory = function() {
    // Implémentation du filtre par catégorie
    console.log('Filtrage par catégorie');
};

// On expose les fonctions globalement pour les boutons HTML
window.cancelTicket = cancelTicket;
window.cancelModification = cancelModification;
window.validateModification = validateModification;
