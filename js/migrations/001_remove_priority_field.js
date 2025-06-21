import { db } from "../firebase-init.js";
import { collection, getDocs, updateDoc, doc, deleteField } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

/**
 * Script de migration pour supprimer le champ 'priorite' de tous les documents
 * de la collection 'notifications'.
 */
async function removePriorityFieldFromNotifications() {
    console.log("🚀 Démarrage de la migration : suppression du champ 'priorite'...");
    const logsContainer = document.getElementById('migration-logs');
    
    const log = (message) => {
        console.log(message);
        if (logsContainer) {
            logsContainer.innerHTML += `<div>${message}</div>`;
        }
    };

    const notificationsRef = collection(db, "notifications");
    let documentsUpdated = 0;
    
    try {
        log("🔍 Lecture de tous les documents de la collection 'notifications'...");
        const snapshot = await getDocs(notificationsRef);
        
        if (snapshot.empty) {
            log("✅ La collection 'notifications' est vide. Aucune action n'est requise.");
            return;
        }

        log(`Found ${snapshot.size} documents. Searching for documents with 'priorite' field...`);

        const updatePromises = [];

        snapshot.forEach(document => {
            const data = document.data();
            if (Object.prototype.hasOwnProperty.call(data, 'priorite')) {
                log(`- Champ 'priorite' trouvé dans le document ${document.id}. Ajout à la file de suppression...`);
                const docRef = doc(db, "notifications", document.id);
                updatePromises.push(
                    updateDoc(docRef, {
                        priorite: deleteField()
                    })
                );
                documentsUpdated++;
            }
        });

        if (updatePromises.length > 0) {
            log(`🔄 ${documentsUpdated} documents à mettre à jour. Lancement des opérations...`);
            await Promise.all(updatePromises);
            log(`✅ Migration terminée avec succès. ${documentsUpdated} documents ont été mis à jour.`);
        } else {
            log("✅ Aucun document ne contenait le champ 'priorite'. Aucune mise à jour nécessaire.");
        }

    } catch (error) {
        log(`❌ Erreur durant la migration : ${error.message}`);
        console.error(error);
    }
}

// Pour rendre la fonction accessible depuis le bouton dans le HTML
window.runMigrationRemovePriority = removePriorityFieldFromNotifications;

// Indiquer que le script est prêt
const readyMessage = "📋 Script de migration chargé. Cliquez sur le bouton pour démarrer.";
console.log(readyMessage);
const logsContainer = document.getElementById('migration-logs');
if (logsContainer) {
    logsContainer.innerHTML = `<div>${readyMessage}</div>`;
} 