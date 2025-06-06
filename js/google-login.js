import { auth } from "./firebase-init.js";
import {
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const provider = new GoogleAuthProvider();
const googleLoginBtn = document.getElementById("google-login-btn");

if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log('Connexion réussie:', result.user);
                window.location.href = "user-dashboard.html";
            })
            .catch((error) => {
                console.error('Erreur Google:', error);
                alert("Erreur lors de la connexion Google.");
            });
    });
}
