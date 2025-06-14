import { auth } from "./firebase-init.js";
import {
    GoogleAuthProvider,
    signInWithPopup
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

const provider = new GoogleAuthProvider();
const googleLoginBtn = document.getElementById("google-login-btn");

if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => {
        signInWithPopup(auth, provider)
            .then(async (result) => {
                await saveUserToFirestore(result.user);
                await redirectBasedOnRole(result.user);
            })
            .catch((error) => {
                console.error('Erreur Google:', error);
                alert("Erreur lors de la connexion Google.");
            });
    });
}
