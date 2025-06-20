# Système NLP de Classification de Tickets - Asten Tickets

Ce système utilise l'intelligence artificielle et le traitement du langage naturel (NLP) pour classifier automatiquement les tickets soumis par les utilisateurs, avec un apprentissage continu basé sur les données de Firebase.

## 🚀 Fonctionnalités

- **Classification automatique** des tickets en 8 catégories
- **Apprentissage continu** avec les nouvelles données
- **API REST** pour l'intégration avec le frontend
- **Planification automatique** de l'entraînement
- **Extraction de mots-clés** pour améliorer la compréhension
- **Feedback utilisateur** pour améliorer les prédictions
- **Intégration Firebase** pour la récupération et sauvegarde des données

## 📋 Catégories de Tickets

1. **Support Technique** - Problèmes techniques généraux
2. **Assistance Générale** - Questions et demandes d'aide
3. **Demande de Fonctionnalité** - Nouvelles fonctionnalités souhaitées
4. **Bug Report** - Signaler des erreurs ou bugs
5. **Question sur l'Utilisation** - Comment utiliser le système
6. **Problème de Connexion** - Difficultés de connexion
7. **Demande de Remboursement** - Demandes de remboursement
8. **Autre** - Catégories non spécifiées

## 🏗️ Architecture

```
nlp_model/
├── config.py              # Configuration du système
├── firebase_connector.py  # Connexion et gestion Firebase
├── text_preprocessor.py   # Prétraitement des textes
├── ticket_classifier.py   # Modèle de classification principal
├── api_server.py         # API FastAPI
├── training_scheduler.py # Planificateur d'entraînement
├── run.py               # Script principal
├── requirements.txt     # Dépendances Python
└── README.md           # Documentation
```

## 🛠️ Installation

### Prérequis

- Python 3.8+
- Compte Firebase avec Firestore activé
- Fichier de credentials Firebase

### Installation des dépendances

```bash
cd nlp_model
pip install -r requirements.txt
```

### Configuration Firebase

1. Créez un projet Firebase
2. Activez Firestore Database
3. Générez une clé de service (Service Account Key)
4. Placez le fichier JSON dans le dossier `nlp_model/` sous le nom `firebase-credentials.json`

### Variables d'environnement

Créez un fichier `.env` dans le dossier `nlp_model/` :

```env
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
FIREBASE_PROJECT_ID=votre-projet-id
API_HOST=0.0.0.0
API_PORT=8000
```

## 🚀 Utilisation

### Démarrage rapide

```bash
# Mode complet (API + planificateur)
python run.py --mode full

# Mode API uniquement
python run.py --mode api

# Mode planificateur uniquement
python run.py --mode scheduler

# Test du modèle
python run.py --mode test

# Initialisation du modèle
python run.py --mode init
```

### API Endpoints

#### Prédiction de catégorie
```http
POST /predict
Content-Type: application/json

{
    "titre": "Mon ordinateur ne démarre plus",
    "description": "L'ordinateur affiche un écran bleu au démarrage",
    "utilisateur_id": "user123"
}
```

#### Sauvegarde de feedback
```http
POST /feedback
Content-Type: application/json

{
    "ticket_id": "ticket123",
    "predicted_category": "Support Technique",
    "actual_category": "Bug Report",
    "confidence": 0.85
}
```

#### Informations du modèle
```http
GET /model-info
```

#### Réentraînement manuel
```http
POST /retrain
```

#### Vérification de santé
```http
GET /health
```

## 🔧 Configuration avancée

### Paramètres du modèle

Modifiez `config.py` pour ajuster :

- **MIN_CONFIDENCE_THRESHOLD** : Seuil de confiance minimum (0.6)
- **RETRAIN_THRESHOLD** : Nombre de nouveaux tickets avant réentraînement (100)
- **MAX_FEATURES** : Nombre maximum de features TF-IDF (5000)
- **N_GRAM_RANGE** : Plage de n-grams pour l'extraction de features (1, 2)

### Planification d'entraînement

Le système planifie automatiquement :

- **Vérification horaire** : Contrôle si un réentraînement est nécessaire
- **Réentraînement quotidien** : À 2h du matin
- **Réentraînement hebdomadaire** : Le dimanche à 3h du matin

## 📊 Intégration avec le Frontend

### Modification du fichier user.js

Remplacez la logique de prédiction dans `js/user.js` :

```javascript
// Remplacer la prédiction aléatoire par un appel à l'API NLP
async function predictCategory(title, description) {
    try {
        const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                titre: title,
                description: description
            })
        });
        
        const prediction = await response.json();
        return prediction;
    } catch (error) {
        console.error('Erreur lors de la prédiction:', error);
        return {
            predicted_category: 'Autre',
            confidence: 0.0,
            needs_human_review: true
        };
    }
}

// Sauvegarder le feedback quand l'utilisateur modifie la catégorie
async function saveFeedback(ticketId, predictedCategory, actualCategory, confidence) {
    try {
        await fetch('http://localhost:8000/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticket_id: ticketId,
                predicted_category: predictedCategory,
                actual_category: actualCategory,
                confidence: confidence
            })
        });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du feedback:', error);
    }
}
```

## 📈 Monitoring et Logs

### Logs

Les logs sont sauvegardés dans :
- `nlp_system.log` : Logs généraux du système
- Console : Logs en temps réel

### Métriques importantes

- **Précision du modèle** : Affichée lors de l'entraînement
- **Nombre de tickets** : Total dans Firebase
- **Confiance moyenne** : Qualité des prédictions
- **Taux de feedback** : Corrections utilisateur

## 🔍 Dépannage

### Problèmes courants

1. **Erreur Firebase** : Vérifiez les credentials et la configuration
2. **Modèle non chargé** : Lancez `python run.py --mode init`
3. **API inaccessible** : Vérifiez le port et les CORS
4. **Entraînement échoué** : Vérifiez les données dans Firebase

### Commandes utiles

```bash
# Vérifier l'état du système
curl http://localhost:8000/health

# Tester une prédiction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"titre":"Test","description":"Test description"}'

# Forcer un réentraînement
curl -X POST http://localhost:8000/retrain
```

## 🤝 Contribution

Pour améliorer le système :

1. Ajoutez de nouvelles catégories dans `config.py`
2. Améliorez le prétraitement dans `text_preprocessor.py`
3. Testez avec de nouvelles données
4. Ajustez les paramètres selon les résultats

## 📄 Licence

Ce projet fait partie du système Asten Tickets. 