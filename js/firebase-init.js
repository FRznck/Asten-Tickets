
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyAjZuld7cIh6uXyuiH83Xj6p3EeIVhilHE", 
    authDomain: "asten-tickets.firebaseapp.com",
    projectId: "asten-tickets",
    storageBucket: "asten-tickets.firebasestorage.app",
    messagingSenderId: "474907811866",
    appId: "1:474907811866:web:fd80fa99140ea320a1b1a3"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'fr';

export { app, auth };
