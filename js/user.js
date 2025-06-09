import { db, auth } from './firebase-init.js';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';


let currentTicket = null;
let tickets = [];

// Soumission de ticket
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

    // Simulation NLP
    setTimeout(async () => {
        const categories = [
            { name: "Support Technique", confidence: 85 },
            { name: "Assistance Générale", confidence: 72 },
            { name: "Bug Report", confidence: 68 }
        ];

        const predictedCategory = categories[Math.floor(Math.random() * categories.length)];

        showPredictedCategory(predictedCategory);
        showModificationSection(predictedCategory);

        const user = auth.currentUser;
        if (!user) {
            alert("Utilisateur non connecté");
            return;
        }

        try {
            const docRef = await addDoc(collection(db, "tickets"), {
                titre: title,
                description: description,
                statut: "Nouveau",
                dateSoumission: Timestamp.now(),
                categorie: predictedCategory.name,
                utilisateur: user.email
            });

            showToast('Ticket soumis avec succès !');
            this.reset();
            btnText.textContent = 'Soumettre';
            loading.style.display = 'none';
            submitBtn.disabled = false;

            await chargerTickets(); // Rafraîchir l'affichage
        } catch (err) {
            console.error("Erreur Firestore :", err);
            alert("Échec de l'enregistrement du ticket.");
        }
    }, 1500);
});

function showPredictedCategory(category) {
    const container = document.getElementById('predictedCategory');
    container.innerHTML = `
        <div class="category-predite">
            <div class="category-header">
                <span class="category-name">${category.name}</span>
                <span class="confidence-score">${category.confidence}%</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Catégorie suggérée par l'IA</p>
        </div>
    `;
    currentTicket = category;
}

function showModificationSection(category) {
    document.getElementById('modifySection').style.display = 'block';
    document.getElementById('noModifyMessage').style.display = 'none';
    document.getElementById('newCategory').value = category.name;
}

function cancelTicket() {
    document.getElementById('ticketForm').reset();
}

function cancelModification() {
    document.getElementById('modifySection').style.display = 'none';
    document.getElementById('noModifyMessage').style.display = 'block';
}

function validateModification() {
    const newCategory = document.getElementById('newCategory').value;
    if (newCategory && tickets.length > 0) {
        tickets[0].category = newCategory;
        updateTicketsDisplay();
        cancelModification();
        showToast('Catégorie modifiée avec succès !');
    }
}

function updateTicketsDisplay() {
    const container = document.getElementById('ticketsContainer');
    container.innerHTML = '';

    tickets.forEach(ticket => {
        const statusClass = ticket.status.toLowerCase().replace(' ', '-');
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-item';
        ticketElement.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">${ticket.title}</div>
                <div class="ticket-status status-${statusClass}">${ticket.status}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-secondary);">${ticket.description}</span>
                <span class="ticket-date">${ticket.date}</span>
            </div>
            <div class="ticket-category">Catégorie: ${ticket.category}</div>
        `;
        container.appendChild(ticketElement);
    });
}

async function chargerTickets() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "tickets"), where("utilisateur", "==", user.email));
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
            category: data.categorie
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

window.addEventListener("load", async () => {
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
});
