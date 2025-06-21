# 🎫 Asten-Tickets - Système de Gestion de Tickets avec IA

## 📋 Description du Projet

**Asten-Tickets** est une application web complète de gestion de tickets de support avec intégration d'intelligence artificielle pour la classification automatique des demandes. Le système combine une interface utilisateur moderne avec un moteur NLP (Natural Language Processing) pour optimiser le traitement des tickets.

## 🚀 Fonctionnalités Principales

### 👥 Gestion des Utilisateurs
- **Authentification multiple** : Email/mot de passe, Google OAuth, liens magiques
- **Gestion des rôles** : Utilisateurs, Administrateurs
- **Sessions sécurisées** avec Firebase Authentication

### 🎫 Gestion des Tickets
- **Création de tickets** avec titre et description
- **Classification automatique** par IA (8 catégories prédéfinies)
- **Suivi des statuts** : Nouveau, En cours, Résolu
- **Interface intuitive** pour utilisateurs et administrateurs

### 🤖 Intelligence Artificielle
- **Classification automatique** des tickets en temps réel
- **Apprentissage continu** avec feedback utilisateur
- **API REST** pour l'intégration
- **Planification automatique** des réentraînements

### 📊 Tableau de Bord Administrateur
- **Statistiques en temps réel** des tickets
- **Export des données** en CSV/Excel
- **Gestion des catégories** et assignations
- **Monitoring** des performances du modèle IA

## 🏗️ Architecture du Projet

```
Asten-Tickets/
├── 📁 Frontend (HTML/CSS/JS)
│   ├── auth.html              # Page d'authentification
│   ├── user-dashboard.html    # Dashboard utilisateur
│   ├── admin-dashboard.html   # Dashboard administrateur
│   └── js/                    # Scripts JavaScript
├── 📁 Backend (PHP)
│   ├── api/                   # API REST PHP
│   └── db.php                 # Configuration base de données
└── 📁 nlp_model/              # Système IA Python
    ├── api_server.py          # Serveur API FastAPI
    ├── ticket_classifier.py   # Modèle de classification
    └── ...                    # Autres composants IA
```

## 🤖 Système NLP - Rôles des Fichiers Python

### 🎯 **Fichiers Principaux**

#### `run.py` - Point d'entrée principal
- **Rôle** : Script principal pour lancer le système NLP
- **Fonctionnalités** :
  - Initialisation du modèle et des composants
  - Gestion des modes de fonctionnement (API, planificateur, test, initialisation)
  - Vérification des dépendances et création des dossiers
  - Lancement du serveur API et du planificateur d'entraînement

#### `api_server.py` - Serveur API REST
- **Rôle** : Interface HTTP pour le système de classification
- **Endpoints** :
  - `POST /predict` : Classification d'un nouveau ticket
  - `POST /feedback` : Sauvegarde du feedback utilisateur
  - `POST /retrain` : Réentraînement manuel du modèle
  - `GET /model-info` : Informations sur le modèle
  - `GET /health` : Vérification de l'état du système
  - `GET /categories` : Liste des catégories disponibles

#### `ticket_classifier.py` - Moteur de Classification
- **Rôle** : Cœur du système de classification IA
- **Fonctionnalités** :
  - Chargement/création du modèle Random Forest
  - Prédiction de catégories avec scores de confiance
  - Entraînement et réentraînement du modèle
  - Évaluation des performances
  - Sauvegarde/chargement des modèles

### 🔧 **Fichiers de Configuration et Utilitaires**

#### `config.py` - Configuration Centralisée
- **Rôle** : Gestion centralisée de toute la configuration
- **Paramètres** :
  - Configuration Firebase (credentials, project ID)
  - Chemins des modèles et données
  - Catégories de tickets (8 catégories prédéfinies)
  - Paramètres du modèle (seuil de confiance, nombre de features)
  - Configuration API (host, port)

#### `text_preprocessor.py` - Prétraitement de Texte
- **Rôle** : Préparation des textes pour l'analyse IA
- **Fonctionnalités** :
  - Nettoyage des textes (ponctuation, chiffres, caractères spéciaux)
  - Suppression des mots vides (français et anglais)
  - Tokenisation et normalisation
  - Extraction de mots-clés

#### `firebase_connector.py` - Connexion Base de Données
- **Rôle** : Interface avec Firebase Firestore
- **Fonctionnalités** :
  - Récupération des tickets pour l'entraînement
  - Sauvegarde des feedbacks de prédiction
  - Mise à jour des catégories de tickets
  - Sauvegarde des métadonnées du modèle
  - Mode dégradé avec données d'exemple si Firebase indisponible

### ⚙️ **Fichiers d'Automatisation**

#### `training_scheduler.py` - Planificateur d'Entraînement
- **Rôle** : Automatisation des réentraînements du modèle
- **Fonctionnalités** :
  - Surveillance des nouveaux tickets
  - Planification d'entraînements automatiques (quotidien, hebdomadaire)
  - Déclenchement basé sur le nombre de nouveaux tickets
  - Gestion asynchrone des entraînements

#### `diagnose_model.py` - Diagnostic et Tests
- **Rôle** : Outils de diagnostic et d'amélioration du modèle
- **Fonctionnalités** :
  - Tests de classification avec exemples variés
  - Analyse des performances et erreurs
  - Création d'ensembles de données d'entraînement améliorés
  - Diagnostic des problèmes du modèle

### 📦 **Fichiers de Support**

#### `requirements.txt` - Dépendances Python
- **Rôle** : Liste des packages Python nécessaires
- **Packages principaux** :
  - `fastapi` : Serveur API
  - `scikit-learn` : Machine Learning
  - `firebase-admin` : Connexion Firebase
  - `pandas`, `numpy` : Manipulation de données
  - `uvicorn` : Serveur ASGI

#### `start_nlp.bat` - Script de Démarrage Windows
- **Rôle** : Démarrage automatique du système NLP
- **Fonctionnalités** :
  - Installation des dépendances
  - Initialisation du modèle
  - Lancement du serveur API

## 🎯 Catégories de Tickets Supportées

Le système classifie automatiquement les tickets dans 8 catégories :

1. **Support Technique** - Problèmes matériels et système
2. **Assistance Générale** - Aide et accompagnement
3. **Demande de Fonctionnalité** - Nouvelles fonctionnalités
4. **Signalement de Bug** - Erreurs et dysfonctionnements
5. **Question sur l'Utilisation** - Aide à l'utilisation
6. **Problème d'Accès / Connexion** - Problèmes d'authentification
7. **Demande de Remboursement** - Remboursements
8. **Autre** - Demandes non classées

## 🚀 Installation et Démarrage

### Prérequis
- Python 3.8+


### Installation Rapide ou consulter le fichier `INSTALLATION_RAPIDE.md`
```bash
# 1. Cloner le projet
git clone [à-venir]

# 2. Installer les dépendances Python
cd nlp_model
pip install -r requirements.txt

# 3. Configurer Firebase
cp firebase-credentials.example.json firebase-credentials.json
# Éditer le fichier avec vos credentials

# 4. Démarrer le système NLP
python run.py --mode full

# 5. Ouvrir l'application web
# Accéder à http://localhost:5002 // http://127.0.0.1:5502
```

### Configuration
1. **Firebase** : Configurer les credentials dans `firebase-credentials.json`
2. **Variables d'environnement** : Créer un fichier `.env` basé sur `env_example.txt` dans le dossier `txt_and_rd`
3. **Frontend** : Configurer l'URL de l'API dans `js/user.js`

## 📊 Utilisation

### Pour les Utilisateurs
1. Se connecter via `auth.html`
2. Créer un nouveau ticket dans le dashboard utilisateur
3. Le système classe automatiquement le ticket
4. Suivre l'évolution du ticket

### Pour les Administrateurs
1. Accéder au dashboard administrateur avec le compte `#`
2. Consulter les statistiques et tickets
3. Gérer les assignations et statuts
4. Exporter les données

### API REST
```bash
# Classification d'un ticket
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"titre": "Mon ordinateur ne démarre plus", "description": "Écran noir au démarrage"}'

# Informations sur le modèle
curl "http://localhost:8000/model-info"
```

## 🔧 Maintenance et Monitoring

### Logs
- **Logs système** : `nlp_system.log`
- **Logs API** : Console du serveur FastAPI
- **Logs planificateur** : Intégrés aux logs système

### Monitoring
- **Health Check** : `GET /health`
- **Statistiques modèle** : `GET /model-info`
- **Performance** : Métriques dans les logs

### Réentraînement
- **Automatique** : Tous les jours à 2h et toutes les semaines
- **Manuel** : `POST /retrain`
- **Basé sur les données** : Quand 10+ nouveaux tickets

## 🆘 Support et Dépannage

### Problèmes Courants 
1. **Module not found** : `pip install -r requirements.txt`
2. **Erreur Firebase** : Vérifier les credentials
3. **API inaccessible** : Vérifier le port 8000
4. **Modèle non initialisé** : `python run.py --mode init`

### Tests
```bash
# Test du système complet
python test_system.py

# Diagnostic du modèle
python diagnose_model.py
```

## 📈 Évolutions Futures

- [ ] Interface d'administration du modèle IA
- [ ] Intégration de modèles plus avancés (BERT, GPT)
- [ ] Suggestions automatiques de solutions
- [ ] Intégration avec des outils de ticketing externes

## 👥 Équipe

**Asten-Tickets** - Système de gestion de tickets intelligent avec IA

---

**🎉 Votre système de tickets intelligent est prêt !** 