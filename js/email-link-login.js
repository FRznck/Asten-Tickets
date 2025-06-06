import { auth } from "./firebase-init.js";
import {
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";


const actionCodeSettings = {
    url: 'http://127.0.0.1:5501/user-dashboard.html',
    handleCodeInApp: true
};


const emailLinkBtn = document.getElementById("email-link-btn");

if (emailLinkBtn) {
    emailLinkBtn.addEventListener("click", async () => {
        const email = document.getElementById("email").value;

        if (!email) {
            alert("Veuillez entrer votre adresse e-mail.");
            return;
        }

        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem("emailForSignIn", email);
            alert("Lien envoyé. Vérifiez votre boîte mail !");
        } catch (error) {
            console.error("Erreur envoi lien :", error);
            alert("Erreur lors de l'envoi du lien.");
        }
    });
}

// Vérifie si retour via le lien
if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem("emailForSignIn");
    if (!email) {
        email = window.prompt("Entrez votre adresse e-mail pour continuer");
    }

    signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
            window.localStorage.removeItem("emailForSignIn");
            console.log("Connexion réussie avec le lien :", result.user);
            window.location.href = "user-dashboard.html";
        })
        .catch((error) => {
            console.error("Erreur connexion avec lien :", error);
        });
}
    