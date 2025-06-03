document.addEventListener('DOMContentLoaded', function() {
    // Charger les tickets depuis le localStorage
    const loadTickets = function() {
        const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
        const tableBody = document.getElementById('ticketTableBody');
        
        tableBody.innerHTML = '';
        
        tickets.forEach(ticket => {
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
                case 'rejected':
                    statusClass = 'bg-danger';
                    statusText = 'Rejeté';
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
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="form-check-input"></td>
                <td>${ticket.title}</td>
                <td><span class="badge ${categoryClass}">${categoryText}</span></td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${formattedDate}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" title="Voir"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-outline-secondary" title="Modifier"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-outline-danger" title="Supprimer"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    };
    
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
    
    // Gestion des filtres
    document.getElementById('applyFiltersBtn').addEventListener('click', function() {
        // Implémenter la logique de filtrage ici
        alert('Filtres appliqués (simulation)');
    });
    
    document.getElementById('resetFiltersBtn').addEventListener('click', function() {
        document.getElementById('statusFilter').value = '';
        document.getElementById('categoryFilter').value = '';
        $('.date-range-picker').val('');
        alert('Filtres réinitialisés (simulation)');
    });
    
    // Charger les tickets au démarrage
    loadTickets();
    
    // Gestion du bouton nouveau ticket
    document.getElementById('newTicketBtn').addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });
});