import { auth } from "./firebase-init.js";
import { 
    marquerCommeLue, 
    marquerToutesCommeLues,
    getNotificationsNonLues,
    getToutesNotifications,
    compterNotificationsNonLues,
    ecouterNotifications,
    formaterDateNotification,
    getIconeNotification,
    STATUTS
} from "./notifications-manager.js";

class NotificationsUI {
    constructor(user) {
        this.notifications = [];
        this.unsubscribe = null;
        this.currentUser = user;
        this.isDropdownOpen = false;
        
        // Initialiser immédiatement
        this.initializeNotifications();
    }

    async initializeNotifications() {
        try {
            // Créer l'élément de notification dans le header
            this.createNotificationElement();
            
            // Charger les notifications initiales
            await this.loadNotifications();
            
            // Écouter les nouvelles notifications en temps réel
            this.startRealtimeListener();
            
            // Mettre à jour le compteur
            await this.updateNotificationCount();
            
        } catch (error) {
            console.error("Erreur lors de l'initialisation des notifications:", error);
        }
    }

    createNotificationElement() {
        // Chercher le conteneur de l'en-tête, qui est plus spécifique
        const headerContent = document.querySelector('.header-content');
        if (!headerContent) {
            console.warn("L'élément .header-content est introuvable. La cloche de notification ne peut pas être ajoutée.");
            return;
        }

        // Éviter de créer des doublons si la fonction est appelée plusieurs fois
        if (headerContent.querySelector('.notifications-container')) {
            return;
        }

        // Créer le conteneur de notifications
        const notificationContainer = document.createElement('div');
        notificationContainer.className = 'notifications-container';
        notificationContainer.innerHTML = `
            <div class="notification-bell" id="notificationBell">
                <div class="bell-icon">🔔</div>
                <div class="notification-badge" id="notificationBadge">0</div>
            </div>
            <div class="notifications-dropdown" id="notificationsDropdown">
                <div class="notifications-header">
                    <h3>Notifications</h3>
                    <button class="mark-all-read" id="markAllRead">Tout marquer comme lu</button>
                </div>
                <div class="notifications-list" id="notificationsList">
                    <div class="loading-notifications">Chargement...</div>
                </div>
                <div class="notifications-footer">
                    <a href="#" class="view-all-notifications">Voir toutes les notifications</a>
                </div>
            </div>
        `;

        // Insérer avant le bouton de déconnexion, qui est un enfant direct de headerContent
        const logoutBtn = headerContent.querySelector('#logout-btn, .btn-logout, .logout-btn');
        if (logoutBtn) {
            headerContent.insertBefore(notificationContainer, logoutBtn);
        } else {
            // S'il n'y a pas de bouton de déconnexion, on l'ajoute à la fin du conteneur
            headerContent.appendChild(notificationContainer);
        }

        // Ajouter les styles CSS
        this.addNotificationStyles();

        // Ajouter les événements
        this.addEventListeners();
    }

    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notifications-container {
                position: relative;
                margin-right: 15px;
            }

            .notification-bell {
                position: relative;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: background-color 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
            }

            .notification-bell:hover {
                background-color: rgba(0, 0, 0, 0.1);
            }

            .bell-icon {
                font-size: 18px;
                color: #666;
            }

            .notification-badge {
                position: absolute;
                top: 0;
                right: 0;
                background-color: #dc3545;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                font-size: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                min-width: 18px;
            }

            .notification-badge.hidden {
                display: none;
            }

            .notifications-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                width: 350px;
                max-height: 500px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                display: none;
                overflow: hidden;
            }

            .notifications-dropdown.open {
                display: block;
            }

            .notifications-header {
                padding: 15px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .notifications-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }

            .mark-all-read {
                background: none;
                border: none;
                color: #007bff;
                font-size: 12px;
                cursor: pointer;
                text-decoration: underline;
            }

            .mark-all-read:hover {
                color: #0056b3;
            }

            .notifications-list {
                max-height: 350px;
                overflow-y: auto;
            }

            .notification-item {
                padding: 12px 15px;
                border-bottom: 1px solid #f5f5f5;
                cursor: pointer;
                transition: background-color 0.2s ease;
                display: flex;
                align-items: flex-start;
                gap: 10px;
            }

            .notification-item:hover {
                background-color: #f8f9fa;
            }

            .notification-item.unread {
                background-color: #f0f7ff;
            }

            .notification-item.unread:hover {
                background-color: #e6f3ff;
            }

            .notification-icon {
                font-size: 16px;
                margin-top: 2px;
                flex-shrink: 0;
            }

            .notification-content {
                flex: 1;
                min-width: 0;
            }

            .notification-title {
                font-weight: 600;
                font-size: 14px;
                color: #333;
                margin-bottom: 4px;
                line-height: 1.3;
            }

            .notification-message {
                font-size: 13px;
                color: #666;
                line-height: 1.4;
                margin-bottom: 6px;
            }

            .notification-message strong {
                font-weight: 600;
                color: #333;
            }

            .notification-message .new-status {
                color: #007bff;
                font-weight: 700;
            }

            .notification-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
                color: #999;
            }

            .notification-time {
                font-size: 11px;
                color: #999;
            }

            .loading-notifications {
                padding: 20px;
                text-align: center;
                color: #666;
                font-style: italic;
            }

            .no-notifications {
                padding: 20px;
                text-align: center;
                color: #666;
            }

            .notifications-footer {
                padding: 12px 15px;
                border-top: 1px solid #eee;
                text-align: center;
            }

            .view-all-notifications {
                color: #007bff;
                text-decoration: none;
                font-size: 13px;
            }

            .view-all-notifications:hover {
                text-decoration: underline;
            }

            /* Animation pour les nouvelles notifications */
            @keyframes notificationPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            .notification-badge.pulse {
                animation: notificationPulse 0.6s ease-in-out;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .notifications-dropdown {
                    width: 300px;
                    right: -50px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    addEventListeners() {
        const bell = document.getElementById('notificationBell');
        const dropdown = document.getElementById('notificationsDropdown');
        const markAllRead = document.getElementById('markAllRead');
        const viewAll = document.querySelector('.view-all-notifications');

        if (bell) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        if (markAllRead) {
            markAllRead.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.markAllAsRead();
            });
        }

        if (viewAll) {
            viewAll.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAllNotifications();
            });
        }

        // Fermer le dropdown en cliquant ailleurs
        document.addEventListener('click', (e) => {
            if (!dropdown?.contains(e.target) && !bell?.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    async loadNotifications() {
        try {
            const notifications = await getNotificationsNonLues(this.currentUser.uid, 10);
            this.notifications = notifications;
            this.renderNotifications();
        } catch (error) {
            console.error("Erreur lors du chargement des notifications:", error);
            this.showError("Erreur lors du chargement des notifications");
        }
    }

    startRealtimeListener() {
        this.unsubscribe = ecouterNotifications(this.currentUser.uid, (notifications) => {
            this.notifications = notifications;
            this.renderNotifications();
            this.updateNotificationCount();
            
            // Animation pour les nouvelles notifications
            if (notifications.length > 0) {
                this.pulseNotificationBadge();
            }
        });
    }

    renderNotifications() {
        const list = document.getElementById('notificationsList');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="no-notifications">Aucune notification</div>';
            return;
        }

        list.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.statut === STATUTS.NON_LUE ? 'unread' : ''}" 
                 data-notification-id="${notification.id}">
                <div class="notification-icon">${getIconeNotification(notification.type)}</div>
                <div class="notification-content">
                    <div class="notification-title">${notification.titre}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-meta">
                        <span class="notification-time">${formaterDateNotification(notification.date_creation)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Ajouter les événements de clic sur les notifications
        list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const notificationId = item.dataset.notificationId;
                this.handleNotificationClick(notificationId, item);
            });
        });
    }

    async handleNotificationClick(notificationId, element) {
        try {
            // Marquer comme lue
            await marquerCommeLue(notificationId, this.currentUser.uid);
            
            // Mettre à jour l'affichage
            element.classList.remove('unread');
            
            // Trouver la notification et naviguer si nécessaire
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && notification.lien_action) {
                // Fermer le dropdown
                this.closeDropdown();
                
                // Naviguer vers le lien
                setTimeout(() => {
                    window.location.href = notification.lien_action;
                }, 100);
            }
            
            // Mettre à jour le compteur
            await this.updateNotificationCount();
            
        } catch (error) {
            console.error("Erreur lors du traitement de la notification:", error);
        }
    }

    async markAllAsRead() {
        try {
            await marquerToutesCommeLues(this.currentUser.uid);
            
            // Mettre à jour l'affichage
            this.notifications.forEach(notification => {
                notification.statut = STATUTS.LUE;
            });
            this.renderNotifications();
            
            // Mettre à jour le compteur
            await this.updateNotificationCount();
            
        } catch (error) {
            console.error("Erreur lors du marquage en masse:", error);
            this.showError("Erreur lors du marquage des notifications");
        }
    }

    async updateNotificationCount() {
        try {
            const count = await compterNotificationsNonLues(this.currentUser.uid);
            const badge = document.getElementById('notificationBadge');
            
            if (badge) {
                badge.textContent = count;
                badge.classList.toggle('hidden', count === 0);
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour du compteur:", error);
        }
    }

    toggleDropdown() {
        const dropdown = document.getElementById('notificationsDropdown');
        if (dropdown) {
            this.isDropdownOpen = !this.isDropdownOpen;
            dropdown.classList.toggle('open', this.isDropdownOpen);
            
            if (this.isDropdownOpen) {
                // Recharger les notifications quand on ouvre
                this.loadNotifications();
            }
        }
    }

    closeDropdown() {
        const dropdown = document.getElementById('notificationsDropdown');
        if (dropdown) {
            this.isDropdownOpen = false;
            dropdown.classList.remove('open');
        }
    }

    pulseNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.classList.add('pulse');
            setTimeout(() => {
                badge.classList.remove('pulse');
            }, 600);
        }
    }

    async showAllNotifications() {
        try {
            console.log("🔍 Début de showAllNotifications");
            console.log("👤 User ID:", this.currentUser.uid);
            
            if (this.showingAllNotifications) {
                // Revenir aux notifications non lues seulement
                console.log("🔄 Retour aux notifications non lues");
                await this.loadNotifications();
                this.showingAllNotifications = false;
                
                // Mettre à jour le titre
                const header = document.querySelector('.notifications-header h3');
                if (header) {
                    header.textContent = 'Notifications';
                }
                
                // Mettre à jour le lien
                const link = document.querySelector('.view-all-notifications');
                if (link) {
                    link.textContent = 'Voir toutes les notifications';
                }
            } else {
                // Afficher toutes les notifications
                console.log("📋 Chargement de toutes les notifications...");
                const toutesNotifications = await getToutesNotifications(this.currentUser.uid, 20);
                console.log("📊 Notifications récupérées:", toutesNotifications);
                console.log("📊 Nombre de notifications:", toutesNotifications.length);
                
                this.notifications = toutesNotifications;
                this.renderNotifications();
                this.showingAllNotifications = true;
                
                // Mettre à jour le titre
                const header = document.querySelector('.notifications-header h3');
                if (header) {
                    header.textContent = 'Toutes les notifications';
                }
                
                // Mettre à jour le lien
                const link = document.querySelector('.view-all-notifications');
                if (link) {
                    link.textContent = 'Voir notifications non lues';
                }
                
                console.log(`✅ Affichage de ${toutesNotifications.length} notifications`);
            }
        } catch (error) {
            console.error("❌ Erreur lors du chargement des notifications:", error);
            this.showError("Erreur lors du chargement des notifications");
        }
    }

    showError(message) {
        // Afficher une erreur à l'utilisateur
        console.error(message);
        // TODO: Implémenter un système de toast/alert
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        
        // Supprimer les éléments de notification
        const container = document.querySelector('.notifications-container');
        if (container) {
            container.remove();
        }
        
        // Supprimer les styles
        const styles = document.getElementById('notification-styles');
        if (styles) {
            styles.remove();
        }
    }
}

// Initialiser les notifications quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Créer une seule instance pour éviter les doublons
            if (!window.notificationsUI) {
                window.notificationsUI = new NotificationsUI(user);
            }
        } else {
            // Nettoyer si l'utilisateur se déconnecte
            if (window.notificationsUI) {
                window.notificationsUI.cleanup();
                window.notificationsUI = null;
            }
        }
    });
});

export default NotificationsUI; 