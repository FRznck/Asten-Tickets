
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

export async function redirectBasedOnRole(user) {
    const userRef = doc(db, "utilisateur", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const role = userSnap.data().role || "user";
        if (role === "admin") {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "user-dashboard.html";
        }
    } else {
        alert("Utilisateur introuvable. Veuillez vous connecter à nouveau.");
        window.location.href = "loading.html";
    }
}
