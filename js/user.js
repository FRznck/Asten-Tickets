
        // Variables globales
        let currentTicket = null;
        let tickets = [
            {
                id: 1,
                title: "Titre du Ticket 1", 
                description: "Problème avec l'authentification utilisateur",
                status: "Nouveau",
                date: "12/12/2023",
                category: "Support Technique"
            },
            {
                id: 2,
                title: "Titre du Ticket 2", 
                description: "Demande d'amélioration de l'interface",
                status: "En cours",
                date: "10/12/2023",
                category: "Demande de Fonctionnalité"
            },
            {
                id: 3,
                title: "Titre du Ticket 3", 
                description: "Correction de bug dans le formulaire de contact",
                status: "Résolu",
                date: "08/12/2023",
                category: "Bug Report"
            }
        ];

        // Fonction pour afficher les toasts
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

        // Soumission de ticket
        document.getElementById('ticketForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = this.querySelector('input[type="text"]').value;
            const description = this.querySelector('textarea').value;
            const submitBtn = this.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const loading = submitBtn.querySelector('#submitLoading');
            
            // Afficher le loading
            btnText.textContent = 'Traitement...';
            loading.style.display = 'inline-block';
            submitBtn.disabled = true;
            
            // Simulation de l'analyse NLP et prédiction de catégorie
            setTimeout(() => {
                const categories = [
                    { name: "Support Technique", confidence: 85 },
                    { name: "Assistance Générale", confidence: 72 },
                    { name: "Bug Report", confidence: 68 }
                ];
                
                // Sélection aléatoire d'une catégorie avec le plus haut score
                const predictedCategory = categories[Math.floor(Math.random() * categories.length)];
                
                showPredictedCategory(predictedCategory);
                showModificationSection(predictedCategory);
                
                // Ajouter le ticket à l'historique
                const newTicket = {
                    id: tickets.length + 1,
                    title: title,
                    description: description,
                    status: "Nouveau",
                    date: new Date().toLocaleDateString('fr-FR'),
                    category: predictedCategory.name
                };
                
                tickets.unshift(newTicket);
                updateTicketsDisplay();
                
                // Afficher le toast de succès
                showToast('Ticket soumis avec succès !');
                
                // Réinitialiser le formulaire
                this.reset();
                
                // Réinitialiser le bouton
                btnText.textContent = 'Soumettre';
                loading.style.display = 'none';
                submitBtn.disabled = false;
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
            
            // Pré-sélectionner la catégorie prédite
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
            if (newCategory) {
                // Mettre à jour la catégorie du ticket le plus récent
                if (tickets.length > 0) {
                    tickets[0].category = newCategory;
                    updateTicketsDisplay();
                }
                
                // Masquer la section de modification
                cancelModification();
                
                // Afficher un toast de confirmation
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
                    <div class="ticket-category">
                        Catégorie: ${ticket.category}
                    </div>
                `;
                container.appendChild(ticketElement);
            });
        }

        // Fonctions de filtrage
        function filterByDate() {
            const sortedTickets = [...tickets].sort((a, b) => new Date(b.date) - new Date(a.date));
            displayFilteredTickets(sortedTickets, 'Date (plus récent)');
        }

        function filterByStatus() {
            const statusOrder = { 'Nouveau': 0, 'En cours': 1, 'Résolu': 2 };
            const sortedTickets = [...tickets].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
            displayFilteredTickets(sortedTickets, 'Statut');
        }

        function filterByCategory() {
            const sortedTickets = [...tickets].sort((a, b) => a.category.localeCompare(b.category));
            displayFilteredTickets(sortedTickets, 'Catégorie');
        }

        function displayFilteredTickets(filteredTickets, filterType) {
            tickets = filteredTickets;
            updateTicketsDisplay();
            
            // Afficher un toast du filtre appliqué
            showToast(`Filtré par: ${filterType}`);
        }

        // Initialisation de l'affichage des tickets
        updateTicketsDisplay();

        // Animation d'entrée pour les cartes
        window.addEventListener('load', function() {
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
    