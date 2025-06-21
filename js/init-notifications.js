/**
 * Script d'initialisation du système de notifications
 * Ce script doit être exécuté une seule fois pour initialiser la collection notifications
 */

import { db } from "./firebase-init.js";
import { collection, addDoc, Timestamp, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

/**
 * Initialise la collection notifications avec des données d'exemple
 */
export async function initialiserCollectionNotifications() {
    try {
        console.log("🚀 Initialisation de la collection notifications...");
        
        // Données d'exemple pour tester le système
        const notificationsExemple = [
            {
                titre: "Bienvenue sur Asten Tickets",
                message: "Votre compte a été configuré avec succès. Vous pouvez maintenant créer des tickets.",
                type: "message_general",
                destinataire_id: "admin_user_1", // Remplacer par un vrai UID
                entite_type: "systeme",
                entite_id: "welcome",
                lien_action: "/user-dashboard.html",
                donnees_extra: {
                    type_message: "bienvenue"
                },
                cree_par: "system",
                cree_par_type: "system",
                date_creation: Timestamp.now(),
                statut: "non_lue",
                version: "1.0",
                envoyer_email: false,
                envoyer_push: false
            },
            {
                titre: "Maintenance prévue",
                message: "Une maintenance est prévue ce soir de 22h à 00h. Le système sera temporairement indisponible.",
                type: "systeme_maintenance",
                destinataire_id: "admin_user_1", // Remplacer par un vrai UID
                entite_type: "systeme",
                entite_id: "maintenance_001",
                lien_action: "/admin-dashboard.html?tab=settings",
                donnees_extra: {
                    date_maintenance: "2024-01-15",
                    heure_debut: "22:00",
                    heure_fin: "00:00",
                    impact: "Système temporairement indisponible"
                },
                cree_par: "system",
                cree_par_type: "system",
                date_creation: Timestamp.now(),
                statut: "non_lue",
                version: "1.0",
                envoyer_email: true,
                envoyer_push: false
            },
            {
                titre: "Ticket de test créé",
                message: "Votre ticket \"Test du système de notifications\" a été créé avec succès",
                type: "ticket_cree",
                destinataire_id: "admin_user_1", // Remplacer par un vrai UID
                entite_type: "ticket",
                entite_id: "TEST-001",
                lien_action: "/user-dashboard.html?ticket=TEST-001",
                donnees_extra: {
                    ticket_titre: "Test du système de notifications",
                    ticket_categorie: "Support Technique",
                    ticket_statut: "Nouveau"
                },
                cree_par: "system",
                cree_par_type: "system",
                date_creation: Timestamp.now(),
                statut: "non_lue",
                version: "1.0",
                envoyer_email: false,
                envoyer_push: false
            }
        ];

        // les notifications d'exemple
        const promises = notificationsExemple.map(async (notification) => {
            try {
                const docRef = await addDoc(collection(db, "notifications"), notification);
                console.log(`✅ Notification créée: ${docRef.id}`);
                return docRef.id;
            } catch (error) {
                console.error(`❌ Erreur création notification: ${error.message}`);
                return null;
            }
        });

        const results = await Promise.all(promises);
        const successCount = results.filter(id => id !== null).length;
        
        console.log(`🎉 Initialisation terminée: ${successCount}/${notificationsExemple.length} notifications créées`);
        
        return {
            success: true,
            created: successCount,
            total: notificationsExemple.length,
            ids: results.filter(id => id !== null)
        };
        
    } catch (error) {
        console.error("❌ Erreur lors de l'initialisation:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Vérifie si la collection notifications existe et contient des données
 */
export async function verifierCollectionNotifications() {
    try {
        console.log("🔍 Vérification de la collection notifications...");
        
        const notificationsRef = collection(db, "notifications");
        const snapshot = await getDocs(notificationsRef);
        
        const count = snapshot.size;
        console.log(`📊 Collection notifications: ${count} documents trouvés`);
        
        return {
            exists: true,
            count: count,
            needsInit: count === 0
        };
        
    } catch (error) {
        console.error("❌ Erreur lors de la vérification:", error);
        return {
            exists: false,
            error: error.message
        };
    }
}

/**
 * Nettoie la collection notifications (pour les tests)
 */
export async function nettoyerCollectionNotifications() {
    try {
        console.log("🧹 Nettoyage de la collection notifications...");
        
        const notificationsRef = collection(db, "notifications");
        const snapshot = await getDocs(notificationsRef);
        
        const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        
        console.log(`🗑️ ${snapshot.size} notifications supprimées`);
        
        return {
            success: true,
            deleted: snapshot.size
        };
        
    } catch (error) {
        console.error("❌ Erreur lors du nettoyage:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Fonction principale d'initialisation
 */
export async function initialiserSystemeNotifications() {
    console.log("🚀 Initialisation du système de notifications...");
    
    // Vérifier l'état actuel
    const verification = await verifierCollectionNotifications();
    
    if (!verification.exists) {
        console.log("❌ Collection notifications non accessible");
        return verification;
    }
    
    if (verification.needsInit) {
        console.log("📝 Initialisation nécessaire, création des données d'exemple...");
        return await initialiserCollectionNotifications();
    } else {
        console.log("✅ Collection notifications déjà initialisée");
        return {
            success: true,
            message: "Collection déjà initialisée",
            count: verification.count
        };
    }
}

// Fonction pour être appelée depuis la console
window.initialiserNotifications = initialiserSystemeNotifications;
window.verifierNotifications = verifierCollectionNotifications;
window.nettoyerNotifications = nettoyerCollectionNotifications;

console.log("📋 Script d'initialisation des notifications chargé");
console.log("💡 Utilisez initialiserNotifications() pour initialiser le système");
console.log("💡 Utilisez verifierNotifications() pour vérifier l'état");
console.log("💡 Utilisez nettoyerNotifications() pour nettoyer (tests uniquement)"); 