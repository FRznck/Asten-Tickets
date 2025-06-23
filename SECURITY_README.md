# 🔒 Guide de Sécurité - Asten Tickets

## ⚠️ IMPORTANT : Configuration Sécurisée

Ce guide vous explique comment configurer votre projet de manière sécurisée avant de le pousser sur GitHub.

## 📋 Checklist de Sécurité

### ✅ Fichiers déjà sécurisés :
- [x] `.gitignore` créé avec les bonnes exclusions
- [x] `js/firebase-config.js` - Clés remplacées par des variables d'environnement
- [x] `js/auth.js` - Mots de passe en dur supprimés
- [x] `nlp_model/firebase-credentials.json` - Credentials remplacés par un template
- [x] `env.example` - Fichier d'exemple pour les variables d'environnement

### 🔧 Configuration requise :

#### 1. Variables d'environnement
Créez un fichier `.env` à la racine du projet :

```bash
# Copiez le fichier d'exemple
cp env.example .env
```

Puis éditez `.env` avec vos vraies valeurs :
```env
FIREBASE_API_KEY=AIzaSyAjZuld7cIh6uXyuiH83Xj6p3EeIVhilHE
ADMIN_PASSWORD=VotreMotDePasseSecurise123!
DEMO_PASSWORD=VotreMotDePasseDemo456!
```

#### 2. Configuration Firebase
Créez votre vrai fichier `js/firebase-config.js` :
```javascript
export const firebaseConfig = {
    apiKey: "AIzaSyAjZuld7cIh6uXyuiH83Xj6p3EeIVhilHE",
    authDomain: "asten-tickets.firebaseapp.com",
    projectId: "asten-tickets",
    storageBucket: "asten-tickets.firebasestorage.app",
    messagingSenderId: "474907811866",
    appId: "1:474907811866:web:fd80fa99140ea320a1b1a3"
};
```

#### 3. Credentials Firebase NLP
Créez votre vrai fichier `nlp_model/firebase-credentials.json` avec vos credentials Firebase Admin SDK.

## 🚨 Actions CRITIQUES avant push

### 1. Supprimer les fichiers du tracking Git
```bash
git rm --cached js/firebase-config.js
git rm --cached nlp_model/firebase-credentials.json
git rm --cached .env
```

### 2. Vérifier que les fichiers sensibles ne sont pas trackés
```bash
git status
```

### 3. Commit des changements de sécurité
```bash
git add .gitignore
git add js/firebase-config.js
git add js/auth.js
git add nlp_model/firebase-credentials.json
git add env.example
git add SECURITY_README.md
git commit -m "🔒 Sécurisation du projet - Protection des clés sensibles"
```

## 🔐 Bonnes pratiques

1. **Ne jamais commiter** de vraies clés API
2. **Utiliser des variables d'environnement** pour les secrets
3. **Changer les mots de passe par défaut**
4. **Vérifier régulièrement** les permissions GitHub
5. **Utiliser des secrets GitHub** pour les déploiements

## 📞 Support

Si vous avez des questions sur la sécurité, consultez :
- [Documentation Firebase Security](https://firebase.google.com/docs/projects/api-keys)
- [GitHub Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

**⚠️ RAPPEL :** Ce fichier contient des informations sensibles. Ne le partagez jamais publiquement ! 