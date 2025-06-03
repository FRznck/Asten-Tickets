// Données simulées
        const mockTickets = [
            {
                id: 'TK-2024-001',
                subject: 'Problème de connexion à l\'application',
                description: 'Impossible de se connecter depuis ce matin',
                category: 'technique',
                priority: 'high',
                status: 'open',
                created: new Date(2024, 5, 3, 9, 30),
                author: 'Jean Dupont'
            },
            {
                id: 'TK-2024-002',
                subject: 'Demande de formation sur le nouveau module',
                description: 'Besoin d\'une formation pour l\'équipe commerciale',
                category: 'support',
                priority: 'medium',
                status: 'pending',
                created: new Date(2024, 5, 3, 8, 15),
                author: 'Marie Martin'
            },
            {
                id: 'TK-2024-003',
                subject: 'Erreur lors de la génération des rapports',
                description: 'Les rapports mensuels ne se génèrent plus correctement',
                category: 'technique',
                priority: 'high',
                status: 'resolved',
                created: new Date(2024, 5, 2, 16, 45),
                author: 'Pierre Bernard'
            },
            {
                id: 'TK-2024-004',
                subject: 'Demande de congés exceptionnels',
                description: 'Demande de congés pour événement familial',
                category: 'rh',
                priority: 'low',
                status: 'open',
                created: new Date(2024, 5, 2, 14, 20),
                author: 'Sophie Laurent'
            },
            {
                id: 'TK-2024-005',
                subject: 'Négociation contrat client important',
                description: 'Besoin d\'assistance pour finaliser le contrat avec ACME Corp',
                category: 'commercial',
                priority: 'medium',
                status: 'pending',
                created: new Date(2024, 5, 1, 11, 30),
                author: 'Thomas Dubois'
            }
        ];

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            initializeUserInfo();
            updateDateTime();
            loadRecentTickets();
            initializeCharts();
            animateCards();
        });

        function initializeUserInfo() {
            const user = window.currentUser || {
                name: 'Administrateur',
                email: 'admin@asten.com',
                role: 'admin'
            };
            
            document.getElementById('userName').textContent = user.name;
            document.getElementById('userRole').textContent = user.role === 'admin' ? 'Administrateur' : 'Utilisateur';
            document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
        }

        function updateDateTime() {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            document.getElementById('currentDate').textContent = now.toLocaleDateString('fr-FR', options);
        }

        function loadRecentTickets() {
            const container = document.getElementById('recentTicketsList');
            const recentTickets = mockTickets.slice(0, 5);
            
            container.innerHTML = recentTickets.map(ticket => `
                <div class="ticket-item" onclick="viewTicket('${ticket.id}')">
                    <div class="ticket-header">
                        <span class="ticket-id">${ticket.id}</span>
                        <span class="ticket-time">${formatTime(ticket.created)}</span>
                    </div>
                    <div class="ticket-subject">${ticket.subject}</div>
                    <div class="ticket-meta">
                        <div class="ticket-category category-${ticket.category}">
                            ${getCategoryLabel(ticket.category)}
                        </div>
                        <div class="ticket-priority">
                            <div class="priority-dot priority-${ticket.priority}"></div>
                            <span>${getPriorityLabel(ticket.priority)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function formatTime(date) {
            const now = new Date();
            const diff = now - date;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            
            if (hours < 1) return 'À l\'instant';
            if (hours < 24) return `Il y a ${hours}h`;
            
            const days = Math.floor(hours / 24);
            return `Il y a ${days}j`;
        }

        function getCategoryLabel(category) {
            const labels = {
                'technique': 'Technique',
                'commercial': 'Commercial',
                'support': 'Support',
                'rh': 'RH'
            };
            return labels[category] || category;
        }

        function getPriorityLabel(priority) {
            const labels = {
                'low': 'Faible',
                'medium': 'Moyenne',
                'high': 'Élevée'
            };
            return labels[priority] || priority;
        }

        function initializeCharts() {
            // Graphique d'évolution des tickets
            const ctx1 = document.getElementById('ticketsChart').getContext('2d');
            new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                    datasets: [{
                        label: 'Nouveaux tickets',
                        data: [12, 19, 8, 15, 10, 7, 14],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Tickets résolus',
                        data: [8, 15, 12, 18, 13, 9, 11],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Graphique de répartition par catégorie
            const ctx2 = document.getElementById('categoriesChart').getContext('2d');
            new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Technique', 'Support', 'Commercial', 'RH'],
                    datasets: [{
                        data: [45, 25, 20, 10],
                        backgroundColor: [
                            '#2563eb',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        function updateChart(period) {
            // Mettre à jour les boutons de filtre
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Ici, vous pourriez mettre à jour les données du graphique
            // selon la période sélectionnée
        }

        function animateCards() {
            const cards = document.querySelectorAll('.stat-card, .chart-card, .action-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }

        function showNewTicketModal() {
            document.getElementById('newTicketModal').style.display = 'flex';
        }

        function closeNewTicketModal() {
            document.getElementById('newTicketModal').style.display = 'none';
            document.getElementById('newTicketForm').reset();
        }

        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
        }

        function viewTicket(ticketId) {
            // Rediriger vers la page de détail du ticket
            console.log('Voir ticket:', ticketId);
        }

        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // Gestion du formulaire de nouveau ticket
        document.getElementById('newTicketForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const subject = document.getElementById('ticketSubject').value;
            const description = document.getElementById('ticketDescription').value;
            const priority = document.getElementById('ticketPriority').value;
            
            // Simulation de catégorisation automatique
            const categories = ['technique', 'support', 'commercial', 'rh'];
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            
            const newTicket = {
                id: `TK-2024-${String(mockTickets.length + 1).padStart(3, '0')}`,
                subject: subject,
                description: description,
                category: randomCategory,
                priority: priority,
                status: 'open',
                created: new Date(),
                author: document.getElementById('userName').textContent
            };
            
            // Ajouter le ticket à la liste
            mockTickets.unshift(newTicket);
            
            // Mettre à jour l'affichage
            loadRecentTickets();
            
            // Fermer le modal
            closeNewTicketModal();
            
            // Afficher une notification de succès
            showNotification('Ticket créé avec succès! Catégorie détectée: ' + getCategoryLabel(randomCategory));
            
            // Rediriger vers la page de succès
            setTimeout(() => {
                window.location.href = `ticket-success.html?id=${newTicket.id}`;
            }, 2000);
        });

        // Vérification de l'authentification
        if (!window.currentUser) {
            window.location.href = 'index.html';
        }
    
