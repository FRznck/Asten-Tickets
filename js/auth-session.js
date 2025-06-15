import { auth } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const userProfileSpan = document.querySelector(".user-profile span");
const userAvatar = document.querySelector(".user-avatar");
const logoutBtn = document.getElementById("logout-btn");

onAuthStateChanged(auth, (user) => {
    if (user) {
        const displayName = user.displayName || user.email || "Utilisateur";
        if (userProfileSpan) {
            userProfileSpan.textContent = `Bienvenue, ${displayName}`;
        }

        if (user.photoURL && userAvatar) {
           
            userAvatar.innerHTML = `<img src="${user.photoURL}" alt="avatar" class="avatar-img">`;

        } else if (userAvatar) {
            
            userAvatar.textContent = displayName.charAt(0).toUpperCase();
        }
    } else {
        
        window.location.href = "loading.html";
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth)
            .then(() => {
                console.log("Déconnecté");
                window.location.href = "loading.html";
            })
            .catch((error) => {
                console.error("Erreur déconnexion :", error);
                alert("Erreur de déconnexion");
            });
    });
}
