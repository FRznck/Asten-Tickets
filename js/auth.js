// auth.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerBtn = document.getElementById('registerBtn');
    const forgotPassword = document.getElementById('forgotPassword');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Validation simple
        if (!email || !password) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        if (password.length < 8) {
            alert('Le mot de passe doit comporter au moins 8 caractères');
            return;
        }
        
        // Simuler une connexion réussie
        localStorage.setItem('isAuthenticated', 'true');
        window.location.href = 'dashboard.html';
    });
    
    registerBtn.addEventListener('click', function() {
        alert('Fonctionnalité d\'inscription à implémenter');
    });
    
    forgotPassword.addEventListener('click', function() {
        alert('Fonctionnalité de réinitialisation de mot de passe à implémenter');
    });
});

// ticket.js
document.addEventListener('DOMContentLoaded', function() {
    // Gestion de la catégorie prédite
    const modifyCategoryCheck = document.getElementById('modifyCategoryCheck');
    const modifiedCategoryContainer = document.getElementById('modifiedCategoryContainer');
    
    modifyCategoryCheck.addEventListener('change', function() {
        if (this.checked) {
            modifiedCategoryContainer.style.display = 'block';
        } else {
            modifiedCategoryContainer.style.display = 'none';
        }
    });
    
    // Simulation de catégorisation automatique
    const ticketDescription = document.getElementById('ticketDescription');
    const predictedCategory = document.getElementById('predictedCategory');
    
    ticketDescription.addEventListener('input', function() {
        // Simuler une analyse NLP après un délai
        clearTimeout(window.nlpTimeout);
        window.nlpTimeout = setTimeout(function() {
            const text = ticketDescription.value.toLowerCase();
            let category = 'Support Général';
            let confidence = 'Moyenne';
            
            if (text.includes('email') || text.includes('messagerie')) {
                category = 'Support Messagerie';
                confidence = 'Haute';
            } else if (text.includes('fonction') || text.includes('feature')) {
                category = 'Demande de Fonctionnalité';
                confidence = 'Haute';
            } else if (text.includes('technique') || text.includes('bug')) {
                category = 'Support Technique';
                confidence = 'Moyenne';
            }
            
            predictedCategory.textContent = category;
            // Mettre à jour le badge de confiance
            const confidenceBadge = document.querySelector('.predicted-category .badge');
            confidenceBadge.textContent = `Score de Confiance : ${confidence}`;
            confidenceBadge.className = 'badge ' + (
                confidence === 'Haute' ? 'bg-success' : 
                confidence === 'Moyenne' ? 'bg-warning' : 'bg-danger'
            );
        }, 1000);
    });
    
    // Gestion de la soumission du ticket
    const ticketForm = document.getElementById('ticketForm');
    ticketForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('ticketTitle').value;
        const description = document.getElementById('ticketDescription').value;
        
        if (!description) {
            window.location.href = 'ticket-error.html';
            return;
        }
        
        // Enregistrer le ticket (simulation)
        const tickets = JSON.parse(localStorage.getItem('tickets') || []);
        const category = modifyCategoryCheck.checked ? 
            document.getElementById('categorySelect').value : 
            predictedCategory.textContent;
        
        tickets.push({
            id: Date.now(),
            title: title,
            description: description,
            category: category,
            status: 'pending',
            date: new Date().toISOString()
        });
        
        localStorage.setItem('tickets', JSON.stringify(tickets));
        window.location.href = 'ticket-success.html';
    });
    
    // Gestion des filtres
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filtersContainer = document.getElementById('filtersContainer');
    
    filterToggleBtn.addEventListener('click', function() {
        if (filtersContainer.style.display === 'none') {
            filtersContainer.style.display = 'block';
        } else {
            filtersContainer.style.display = 'none';
        }
    });
});

// main.js - Fonctions utilitaires
function loadTickets() {
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const ticketList = document.querySelector('.ticket-list');
    
    if (ticketList) {
        ticketList.innerHTML = '';
        
        tickets.forEach(ticket => {
            const ticketItem = document.createElement('div');
            ticketItem.className = 'ticket-item';
            
            // Convertir la date en format lisible
            const date = new Date(ticket.date);
            const formattedDate = date.toLocaleDateString('fr-FR');
            
            // Déterminer la classe du badge de statut
            let statusClass = 'bg-secondary';
            let statusText = 'Inconnu';
            
            switch(ticket.status) {
                case 'pending':
                    statusClass = 'bg-warning';
                    statusText = 'En Attente';
                    break;
                case 'validated':
                    statusClass = 'bg-success';
                    statusText = 'Validé';
                    break;
                case 'corrected':
                    statusClass = 'bg-info';
                    statusText = 'Corrigé';
                    break;
            }
            
            // Déterminer la classe du badge de catégorie
            let categoryClass = 'bg-primary';
            let categoryText = ticket.category;
            
            if (ticket.category.includes('Messagerie')) {
                categoryClass = 'bg-primary';
            } else if (ticket.category.includes('Fonctionnalité')) {
                categoryClass = 'bg-purple';
            } else if (ticket.category.includes('Technique')) {
                categoryClass = 'bg-info';
            } else {
                categoryClass = 'bg-secondary';
            }
            
            ticketItem.innerHTML = `
                <div class="ticket-checkbox">
                    <input type="checkbox" id="ticket-${ticket.id}">
                </div>
                <div class="ticket-content">
                    <label for="ticket-${ticket.id}" class="ticket-title">${ticket.title}</label>
                    <div class="ticket-meta">
                        <span class="badge ${categoryClass}">${categoryText}</span>
                        <span class="badge ${statusClass}">${statusText}</span>
                        <span class="ticket-date">${formattedDate}</span>
                    </div>
                </div>
                <div class="ticket-actions">
                    <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline-secondary"><i class="fas fa-edit"></i></button>
                </div>
            `;
            
            ticketList.appendChild(ticketItem);
        });
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    if (window.location.pathname !== '/index.html' && !localStorage.getItem('isAuthenticated')) {
        window.location.href = 'index.html';
    }
    
    // Charger les tickets
    loadTickets();
    
    // Gestion de la déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('isAuthenticated');
            window.location.href = 'index.html';
        });
    }
    
    // Initialiser le date picker
    if (typeof $ !== 'undefined' && $.fn.daterangepicker) {
        $('.date-range-picker').daterangepicker({
            locale: {
                format: 'DD/MM/YYYY',
                applyLabel: 'Appliquer',
                cancelLabel: 'Annuler',
                fromLabel: 'De',
                toLabel: 'À',
                customRangeLabel: 'Personnalisé',
                daysOfWeek: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
                monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
                firstDay: 1
            },
            opens: 'right',
            autoUpdateInput: false
        });
        
        $('.date-range-picker').on('apply.daterangepicker', function(ev, picker) {
            $(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
        });
    }
}); 
