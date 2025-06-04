
        // Application State
        let currentTab = 'dashboard';
        let tickets = [
            {
                id: 'TK-2024-001',
                title: 'Problème de connexion VPN',
                status: 'nouveau',
                category: 'technique',
                confidence: 92,
                date: '2024-06-03',
                description: 'Impossible de se connecter au VPN entreprise depuis ce matin',
                email: 'user1@company.com',
                priority: 'high'
            },
            {
                id: 'TK-2024-002',
                title: 'Demande de remboursement',
                status: 'en-cours',
                category: 'facturation',
                confidence: 87,
                date: '2024-06-02',
                description: 'Demande de remboursement pour service non utilisé',
                email: 'user2@company.com',
                priority: 'medium'
            },
            {
                id: 'TK-2024-003',
                title: 'Formation sur nouveau logiciel',
                status: 'resolu',
                category: 'support',
                confidence: 95,
                date: '2024-06-01',
                description: 'Besoin de formation sur le nouveau CRM',
                email: 'user3@company.com',
                priority: 'low'
            },
            {
                id: 'TK-2024-004',
                title: 'Erreur application mobile',
                status: 'nouveau',
                category: 'technique',
                confidence: 89,
                date: '2024-06-03',
                description: 'L\'application mobile crash au démarrage',
                email: 'user4@company.com',
                priority: 'high'
            },
            {
                id: 'TK-2024-005',
                title: 'Question sur facturation',
                status: 'ferme',
                category: 'facturation',
                confidence: 94,
                date: '2024-05-30',
                description: 'Clarification nécessaire sur dernière facture',
                email: 'user5@company.com',
                priority: 'medium'
            }
        ];

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

        // Tab Navigation
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                switchTab(tabId);
            });
        });

        function switchTab(tabId) {
            // Update active tab
            navTabs.forEach(tab => tab.classList.remove('active'));
            document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

            // Update active content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');

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

        // Ticket Form Submission
        ticketForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const submitText = document.getElementById('submitText');
            const submitLoading = document.getElementById('submitLoading');
            
            // Show loading state
            submitText.style.display = 'none';
            submitLoading.style.display = 'inline-block';
            submitBtn.disabled = true;

            // Simulate API call for ticket creation and classification
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Create new ticket
            const newTicket = {
                id: `TK-2024-${String(tickets.length + 1).padStart(3, '0')}`,
                title: document.getElementById('ticketTitle').value,
                status: 'nouveau',
                category: classifyTicket(document.getElementById('ticketDescription').value),
                confidence: Math.floor(Math.random() * 20) + 80,
                date: new Date().toISOString().split('T')[0],
                description: document.getElementById('ticketDescription').value,
                email: document.getElementById('ticketEmail').value,
                priority: document.getElementById('ticketPriority').value
            };

            tickets.unshift(newTicket);
            
            // Reset form and close modal
            closeTicketModal();
            
            // Show success toast
            showToast('Ticket créé et classifié avec succès!', 'success');
            
            // Update table if on tickets tab
            if (currentTab === 'tickets') {
                renderTicketsTable();
            }

            // Reset button state
            submitText.style.display = 'inline';
            submitLoading.style.display = 'none';
            submitBtn.disabled = false;
        });

        // Simple ticket classification simulation
        function classifyTicket(description) {
            const keywords = {
                technique: ['vpn', 'connexion', 'application', 'bug', 'erreur', 'crash', 'système'],
                facturation: ['facture', 'remboursement', 'paiement', 'prix', 'coût', 'billing'],
                support: ['formation', 'aide', 'question', 'comment', 'tutorial', 'guide'],
                autre: []
            };

            const descLower = description.toLowerCase();
            
            for (const [category, words] of Object.entries(keywords)) {
                if (words.some(word => descLower.includes(word))) {
                    return category;
                }
            }
            return 'autre';
        }

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
                    ticket.title.toLowerCase().includes(searchTerm) ||
                    ticket.id.toLowerCase().includes(searchTerm) ||
                    ticket.category.toLowerCase().includes(searchTerm)
                  )
                : tickets;

            tbody.innerHTML = filteredTickets.map(ticket => `
                <tr>
                    <td class="ticket-id">${ticket.id}</td>
                    <td>${ticket.title}</td>
                    <td><span class="ticket-status status-${ticket.status}">${getStatusLabel(ticket.status)}</span></td>
                    <td><span class="category-tag cat-${ticket.category}">${getCategoryLabel(ticket.category)}</span></td>
                    <td>
                        <div class="confidence-score">
                            <span>${ticket.confidence}%</span>
                            <div class="confidence-bar">
                                <div class="confidence-fill confidence-${getConfidenceLevel(ticket.confidence)}" 
                                     style="width: ${ticket.confidence}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>${formatDate(ticket.date)}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" 
                                onclick="viewTicket('${ticket.id}')">
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

        function getConfidenceLevel(confidence) {
            if (confidence >= 90) return 'high';
            if (confidence >= 70) return 'medium';
            return 'low';
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        }

        function viewTicket(ticketId) {
            const ticket = tickets.find(t => t.id === ticketId);
            if (ticket) {
                alert(`Détails du ticket ${ticket.id}:\n\nTitre: ${ticket.title}\nDescription: ${ticket.description}\nStatut: ${getStatusLabel(ticket.status)}\nCatégorie: ${getCategoryLabel(ticket.category)} (${ticket.confidence}% confiance)`);
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

        // Bulk classify functionality
        document.getElementById('bulkClassifyBtn').addEventListener('click', async () => {
            const btn = document.getElementById('bulkClassifyBtn');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '🤖 Classification en cours... <span class="loading"></span>';
            btn.disabled = true;

            // Simulate bulk classification
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Update some tickets
            const unclassifiedTickets = tickets.filter(t => t.confidence < 70);
            unclassifiedTickets.forEach(ticket => {
                ticket.confidence = Math.floor(Math.random() * 25) + 75;
            });

            btn.innerHTML = originalText;
            btn.disabled = false;
            
            showToast(`${unclassifiedTickets.length} tickets reclassifiés avec succès!`, 'success');
            
            if (currentTab === 'tickets') {
                renderTicketsTable();
            }
        });

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

        // Initialize application
        document.addEventListener('DOMContentLoaded', () => {
            renderTicketsTable();
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
    