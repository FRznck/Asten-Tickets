import { db } from "./firebase-init.js";
import { 
    collection, addDoc, getDocs, query, where, orderBy, 
    updateDoc, doc, Timestamp, onSnapshot, limit, getCountFromServer, startAfter
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Types de notifications
export const TYPES_NOTIFICATIONS = {
    // Tickets
    TICKET_CREE: "ticket_cree",
    TICKET_ASSIGNE: "ticket_assigne", 
    TICKET_MODIFIE: "ticket_modifie",
    TICKET_RESOLU: "ticket_resolu",
    TICKET_FERME: "ticket_ferme",
    
    // Assignations
    ASSIGNATION_CREEE: "assignation_creee",
    ASSIGNATION_MODIFIEE: "assignation_modifiee",
    ASSIGNATION_SUPPRIMEE: "assignation_supprimee",
    
    // Système
    SYSTEME_MAINTENANCE: "systeme_maintenance",
    SYSTEME_MAJ: "systeme_maj",
    
    // Utilisateurs
    UTILISATEUR_INSCRIT: "utilisateur_inscrit",
    UTILISATEUR_MODIFIE: "utilisateur_modifie",
    
    // Général
    MESSAGE_GENERAL: "message_general",
    RAPPEL: "rappel"
};

// Statuts
export const STATUTS = {
    NON_LUE: "non_lue",
    LUE: "lue",
    ARCHIVEE: "archivee"
};

/**
 * Crée une nouvelle notification
 */
export async function creerNotification(notificationData) {
    try {
        const notificationComplete = {
            ...notificationData,
            date_creation: Timestamp.now(),
            statut: STATUTS.NON_LUE,
            version: "1.0",
            envoyer_email: notificationData.envoyer_email !== false, // Par défaut true
            envoyer_push: notificationData.envoyer_push || false
        };

        const docRef = await addDoc(collection(db, "notifications"), notificationComplete);
        console.log("Notification créée avec succès:", docRef.id);
        return docRef;
    } catch (error) {
        console.error("Erreur lors de la création de la notification:", error);
        throw error;
    }
}

/**
 * Marque une notification comme lue
 */
export async function marquerCommeLue(notificationId, userId) {
    try {
        const notifRef = doc(db, "notifications", notificationId);
        await updateDoc(notifRef, {
            statut: STATUTS.LUE,
            date_lecture: Timestamp.now(),
            lu_par: userId
        });
        console.log("Notification marquée comme lue:", notificationId);
    } catch (error) {
        console.error("Erreur lors du marquage comme lue:", error);
        throw error;
    }
}

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
export async function marquerToutesCommeLues(userId) {
    try {
        const q = query(
            collection(db, "notifications"),
            where("destinataire_id", "==", userId),
            where("statut", "==", STATUTS.NON_LUE)
        );
        
        const querySnapshot = await getDocs(q);
        const updatePromises = querySnapshot.docs.map(doc => {
            return updateDoc(doc.ref, {
                statut: STATUTS.LUE,
                date_lecture: Timestamp.now(),
                lu_par: userId
            });
        });
        
        await Promise.all(updatePromises);
        console.log(`${updatePromises.length} notifications marquées comme lues`);
    } catch (error) {
        console.error("Erreur lors du marquage en masse:", error);
        throw error;
    }
}

/**
 * Récupère les notifications non lues d'un utilisateur
 */
export async function getNotificationsNonLues(userId, limite = 50) {
    try {
        const q = query(
            collection(db, "notifications"),
            where("destinataire_id", "==", userId),
            where("statut", "==", STATUTS.NON_LUE),
            orderBy("date_creation", "desc"),
            limit(limite)
        );
        
        const querySnapshot = await getDocs(q);
        const notifications = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                ...data,
                date_creation: data.date_creation?.toDate(),
                date_lecture: data.date_lecture?.toDate(),
                date_expiration: data.date_expiration?.toDate()
            });
        });
        
        return notifications;
    } catch (error) {
        console.error("Erreur lors de la récupération des notifications:", error);
        return [];
    }
}

/**
 * Récupère toutes les notifications d'un utilisateur (avec pagination)
 */
export async function getToutesNotifications(userId, limite = 20, derniereNotification = null) {
    try {
        let q = query(
            collection(db, "notifications"),
            where("destinataire_id", "==", userId),
            orderBy("date_creation", "desc"),
            limit(limite)
        );
        
        if (derniereNotification) {
            q = query(q, startAfter(derniereNotification));
        }
        
        const querySnapshot = await getDocs(q);
        const notifications = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                ...data,
                date_creation: data.date_creation?.toDate(),
                date_lecture: data.date_lecture?.toDate(),
                date_expiration: data.date_expiration?.toDate()
            });
        });
        
        return notifications;
    } catch (error) {
        console.error("Erreur lors de la récupération des notifications:", error);
        return [];
    }
}

/**
 * Compte le nombre de notifications non lues
 */
export async function compterNotificationsNonLues(userId) {
    try {
        const q = query(
            collection(db, "notifications"),
            where("destinataire_id", "==", userId),
            where("statut", "==", STATUTS.NON_LUE)
        );
        
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    } catch (error) {
        console.error("Erreur lors du comptage des notifications:", error);
        return 0;
    }
}

/**
 * Écoute les notifications en temps réel
 */
export function ecouterNotifications(userId, callback) {
    const q = query(
        collection(db, "notifications"),
        where("destinataire_id", "==", userId),
        where("statut", "==", STATUTS.NON_LUE),
        orderBy("date_creation", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
        const notifications = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                ...data,
                date_creation: data.date_creation?.toDate(),
                date_lecture: data.date_lecture?.toDate(),
                date_expiration: data.date_expiration?.toDate()
            });
        });
        callback(notifications);
    });
}

/**
 * Supprime une notification (archivage)
 */
export async function supprimerNotification(notificationId) {
    try {
        const notifRef = doc(db, "notifications", notificationId);
        await updateDoc(notifRef, {
            statut: STATUTS.ARCHIVEE,
            date_archivage: Timestamp.now()
        });
        console.log("Notification archivée:", notificationId);
    } catch (error) {
        console.error("Erreur lors de l'archivage:", error);
        throw error;
    }
}

/**
 * Notifications spécifiques au système de tickets
 */

// Notification de création de ticket
export async function notifierCreationTicket(ticketData, utilisateurId) {
    const notification = {
        titre: "Nouveau ticket créé",
        message: `Votre ticket "${ticketData.titre}" a été créé avec succès`,
        type: TYPES_NOTIFICATIONS.TICKET_CREE,
        destinataire_id: utilisateurId,
        entite_type: "ticket",
        entite_id: ticketData.id,
        lien_action: `/user-dashboard.html?ticket=${ticketData.id}`,
        donnees_extra: {
            ticket_titre: ticketData.titre,
            ticket_categorie: ticketData.categorie,
            ticket_statut: ticketData.statut
        },
        cree_par: "system",
        cree_par_type: "system"
    };
    
    return await creerNotification(notification);
}

// Notification d'assignation de ticket
export async function notifierAssignationTicket(ticketData, assigneA, assignePar) {
    const notification = {
        titre: "Ticket assigné",
        message: `Le ticket "${ticketData.titre}" vous a été assigné`,
        type: TYPES_NOTIFICATIONS.TICKET_ASSIGNE,
        destinataire_id: assigneA,
        entite_type: "ticket",
        entite_id: ticketData.id,
        lien_action: `/admin-dashboard.html?ticket=${ticketData.id}`,
        donnees_extra: {
            ticket_titre: ticketData.titre,
            ticket_categorie: ticketData.categorie,
            assigne_par: assignePar,
            equipe: ticketData.equipe
        },
        cree_par: assignePar,
        cree_par_type: "utilisateur"
    };
    
    return await creerNotification(notification);
}

// Notification de modification de statut
export async function notifierModificationStatut(ticketData, ancienStatut, nouveauStatut, utilisateurId) {
    const statuts = {
        'nouveau': 'Nouveau',
        'en-cours': 'En Cours',
        'resolu': 'Résolu',
        'ferme': 'Fermé'
    };
    
    const notification = {
        titre: "Statut du ticket modifié",
        message: `Le statut de votre ticket "${ticketData.titre}" est passé de <strong>${statuts[ancienStatut]}</strong> à <strong class="new-status">${statuts[nouveauStatut]}</strong>`,
        type: TYPES_NOTIFICATIONS.TICKET_MODIFIE,
        destinataire_id: utilisateurId,
        entite_type: "ticket",
        entite_id: ticketData.id,
        lien_action: `/user-dashboard.html?ticket=${ticketData.id}`,
        donnees_extra: {
            ticket_titre: ticketData.titre,
            ancien_statut: ancienStatut,
            nouveau_statut: nouveauStatut
        },
        cree_par: "system",
        cree_par_type: "system"
    };
    
    return await creerNotification(notification);
}

/**
 * Utilitaires pour l'affichage
 */
export function formaterDateNotification(date) {
    if (!date) return '';
    
    const maintenant = new Date();
    const diffEnMinutes = Math.floor((maintenant - date) / (1000 * 60));
    
    if (diffEnMinutes < 1) return 'À l\'instant';
    if (diffEnMinutes < 60) return `Il y a ${diffEnMinutes} min`;
    
    const diffEnHeures = Math.floor(diffEnMinutes / 60);
    if (diffEnHeures < 24) return `Il y a ${diffEnHeures}h`;
    
    const diffEnJours = Math.floor(diffEnHeures / 24);
    if (diffEnJours < 7) return `Il y a ${diffEnJours}j`;
    
    return date.toLocaleDateString('fr-FR');
}

export function getIconeNotification(type) {
    const icones = {
        [TYPES_NOTIFICATIONS.TICKET_CREE]: '📝',
        [TYPES_NOTIFICATIONS.TICKET_ASSIGNE]: '👤',
        [TYPES_NOTIFICATIONS.TICKET_MODIFIE]: '✏️',
        [TYPES_NOTIFICATIONS.TICKET_RESOLU]: '✅',
        [TYPES_NOTIFICATIONS.TICKET_FERME]: '🔒',
        [TYPES_NOTIFICATIONS.ASSIGNATION_CREEE]: '🎯',
        [TYPES_NOTIFICATIONS.SYSTEME_MAINTENANCE]: '🔧',
        [TYPES_NOTIFICATIONS.SYSTEME_MAJ]: '🔄',
        [TYPES_NOTIFICATIONS.MESSAGE_GENERAL]: '💬',
        [TYPES_NOTIFICATIONS.RAPPEL]: '⏰'
    };
    
    return icones[type] || '🔔';
} 