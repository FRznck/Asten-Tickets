import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyAjZuld7cIh6uXyuiH83Xj6p3EeIVhilHE",
    authDomain: "asten-tickets.firebaseapp.com",
    projectId: "asten-tickets",
    storageBucket: "asten-tickets.firebasestorage.app",
    messagingSenderId: "474907811866",
    appId: "1:474907811866:web:fd80fa99140ea320a1b1a3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'fr';
const provider = new GoogleAuthProvider();


const googlelogin = document.getElementById("google-login-btn");
googlelogin.addEventListener("click", function() {

   signInWithPopup(auth, provider)
    .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        console.log('Connexion réussie:', { user, token, credential });
        window.location.href = "dashboard.html";
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData ? error.customData.email : null;
        const credential = GoogleAuthProvider.credentialFromError(error);
        console.error('Erreur de connexion:', { errorCode, errorMessage, email, credential });
    });

});