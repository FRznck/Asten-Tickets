import { auth } from "./firebase-init.js";
import {
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import { redirectBasedOnRole } from './role-redirect.js';

import { db } from "./firebase-init.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

async function saveUserToFirestore(user) {
    const userRef = doc(db, "utilisateur", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            nom: user.displayName || "",
            photo: user.photoURL || ""
        });
        console.log("Utilisateur enregistré dans Firestore");
    }
}

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

if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem("emailForSignIn");
    if (!email) {
        email = window.prompt("Entrez votre adresse e-mail pour continuer");
    }

    signInWithEmailLink(auth, email, window.location.href)
        .then(async (result) => {
            window.localStorage.removeItem("emailForSignIn");
            console.log("Connexion réussie avec le lien :", result.user);
            await saveUserToFirestore(result.user);
            await redirectBasedOnRole(result.user);

        })
        .catch((error) => {
            console.error("Erreur connexion avec lien :", error);
        });
}
