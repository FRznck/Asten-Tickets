# 🔔 Système de Notifications - Asten Tickets

## 📋 Vue d'ensemble

Le système de notifications d'Asten Tickets permet d'informer les utilisateurs en temps réel des événements importants liés à leurs tickets et au système. Il est entièrement intégré avec Firestore et fonctionne de manière asynchrone.

## 🏗️ Architecture

### Collections Firestore

#### Collection `notifications`
```javascript
{
  // Identifiants
  id: "auto-généré", // ID du document Firestore
  notification_id: "NOTIF-2024-001", // ID unique de la notification
  
  // Informations de base
  titre: "Nouveau ticket assigné",
  message: "Le ticket TK-2024-001 vous a été assigné",
  type: "ticket_assigne", // Type de notification
  priorite: "normale", // haute, normale, basse
  
  // Destinataires
  destinataire_id: "user_uid", // UID de l'utilisateur destinataire
  destinataire_email: "user@example.com",
  destinataire_nom: "Nom de l'utilisateur",
  
  // Contexte et liens
  entite_type: "ticket", // ticket, utilisateur, systeme, etc.
  entite_id: "ticket_id", // ID de l'entité concernée
  lien_action: "/admin-dashboard.html?ticket=TK-2024-001", // Lien pour agir
  
  // Métadonnées
  date_creation: Timestamp.now(),
  date_lecture: null, // Timestamp quand lue
  date_expiration: Timestamp, // Optionnel, pour les notifications temporaires
  
  // Statut
  statut: "non_lue", // non_lue, lue, archivee
  lu_par: null, // UID de qui l'a lue
  
  // Données supplémentaires (optionnel)
  donnees_extra: {
    ticket_titre: "Problème de connexion",
    ticket_categorie: "Support Technique",
    equipe: "support_technique",
    assigne_par: "admin_uid"
  },
  
  // Configuration
  envoyer_email: true, // Si la notification doit aussi être envoyée par email
  envoyer_push: false, // Pour les notifications push futures
  
  // Audit
  cree_par: "system_uid", // UID de qui a créé la notification
  cree_par_type: "system", // system, utilisateur, bot
  version: "1.0" // Version du format de notification
}
```

## 📁 Structure des fichiers

```
js/
├── notifications-manager.js    # Gestionnaire principal des notifications
├── notifications-ui.js         # Interface utilisateur des notifications
└── ...

Pages HTML
├── user-dashboard.html         # Dashboard utilisateur avec notifications
├── admin-dashboard.html        # Dashboard admin avec notifications
└── test-notifications.html     # Page de test des notifications
```

## 🚀 Utilisation

### 1. Import des modules

```javascript
import { 
    creerNotification, 
    marquerCommeLue, 
    compterNotificationsNonLues,
    notifierCreationTicket,
    notifierAssignationTicket,
    TYPES_NOTIFICATIONS,
    PRIORITES,
    STATUTS
} from './js/notifications-manager.js';
```

### 2. Création d'une notification simple

```javascript
const notification = {
    titre: "Nouveau ticket créé",
    message: "Votre ticket a été créé avec succès",
    type: TYPES_NOTIFICATIONS.TICKET_CREE,
    priorite: PRIORITES.NORMALE,
    destinataire_id: user.uid,
    entite_type: "ticket",
    entite_id: ticketId,
    lien_action: `/user-dashboard.html?ticket=${ticketId}`
};

await creerNotification(notification);
```

### 3. Utilisation des fonctions spécialisées

```javascript
// Notification de création de ticket
await notifierCreationTicket(ticketData, utilisateurId);

// Notification d'assignation
await notifierAssignationTicket(ticketData, assigneA, assignePar);

// Notification de changement de statut
await notifierModificationStatut(ticketData, ancienStatut, nouveauStatut, utilisateurId);

// Notification de résolution
await notifierResolutionTicket(ticketData, resoluPar, utilisateurId);
```

### 4. Gestion des notifications

```javascript
// Marquer une notification comme lue
await marquerCommeLue(notificationId, userId);

// Marquer toutes les notifications comme lues
await marquerToutesCommeLues(userId);

// Compter les notifications non lues
const count = await compterNotificationsNonLues(userId);

// Récupérer les notifications non lues
const notifications = await getNotificationsNonLues(userId, 10);
```

## 🎨 Interface Utilisateur

### Intégration automatique

Le système s'intègre automatiquement dans les pages qui importent `notifications-ui.js` :

- Ajoute une icône de cloche dans le header
- Affiche un badge avec le nombre de notifications non lues
- Dropdown avec la liste des notifications
- Mise à jour en temps réel

### Styles CSS

Les styles sont injectés automatiquement et incluent :
- Animation de pulsation pour les nouvelles notifications
- Design responsive
- Thèmes de couleurs selon la priorité
- Transitions fluides

## 📊 Types de notifications

### Tickets
- `TICKET_CREE` : Nouveau ticket créé
- `TICKET_ASSIGNE` : Ticket assigné à un utilisateur
- `TICKET_MODIFIE` : Statut ou informations modifiées
- `TICKET_RESOLU` : Ticket résolu
- `TICKET_FERME` : Ticket fermé

### Assignations
- `ASSIGNATION_CREEE` : Nouvelle assignation
- `ASSIGNATION_MODIFIEE` : Assignation modifiée
- `ASSIGNATION_SUPPRIMEE` : Assignation supprimée

### Système
- `SYSTEME_MAINTENANCE` : Maintenance prévue
- `SYSTEME_MAJ` : Mise à jour système

### Général
- `MESSAGE_GENERAL` : Message général
- `RAPPEL` : Rappel/notification

## 🔧 Configuration

### Priorités
- `HAUTE` : Rouge (#dc3545)
- `NORMALE` : Bleu (#007bff)
- `BASSE` : Gris (#6c757d)

### Statuts
- `NON_LUE` : Notification non lue
- `LUE` : Notification lue
- `ARCHIVEE` : Notification archivée

## 🧪 Tests

### Page de test
Accédez à `test-notifications.html` pour tester toutes les fonctionnalités :

1. **Création de notifications** : Testez différents types
2. **Gestion** : Marquer comme lue, compter, etc.
3. **Interface** : Test de l'interface utilisateur
4. **Temps réel** : Test des mises à jour en temps réel

### Tests automatisés
```javascript
// Test de création
await testNotificationTicket();

// Test de comptage
await testCompterNotifications();

// Test de marquage
await testMarquerCommeLue();
```

## 🔒 Sécurité

- Les notifications sont liées à un utilisateur spécifique
- Vérification des permissions avant création
- Validation des données avant sauvegarde
- Protection contre les injections

## 📈 Performance

- Requêtes optimisées avec Firestore
- Pagination automatique
- Mise en cache des données
- Écoute en temps réel efficace

## 🚨 Dépannage

### Problèmes courants

1. **Notifications non affichées**
   - Vérifiez que l'utilisateur est connecté
   - Vérifiez les permissions Firestore
   - Consultez la console pour les erreurs

2. **Interface non chargée**
   - Vérifiez l'import de `notifications-ui.js`
   - Vérifiez que le header existe dans le DOM

3. **Erreurs de création**
   - Vérifiez la structure des données
   - Vérifiez la connexion Firestore
   - Vérifiez les règles de sécurité

### Logs de débogage

```javascript
// Activer les logs détaillés
console.log('Notifications:', notifications);
console.log('Compteur:', count);
console.log('Erreur:', error);
```

## 🔮 Évolutions futures

- [ ] Notifications par email
- [ ] Notifications push (Push API)
- [ ] Notifications groupées
- [ ] Templates personnalisables
- [ ] Notifications programmées
- [ ] Intégration Slack/Discord
- [ ] Analytics des notifications

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs de la console
2. Testez avec `test-notifications.html`
3. Vérifiez la documentation Firestore
4. Contactez l'équipe de développement

---

**Version :** 1.0  
**Dernière mise à jour :** Janvier 2024  
**Auteur :** Équipe Asten Tickets 