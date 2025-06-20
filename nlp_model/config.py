import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Configuration Firebase
    FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-credentials.json')
    FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', 'asten-tickets')
    
    # Configuration du modèle NLP
    MODEL_PATH = os.getenv('MODEL_PATH', 'models/ticket_classifier.joblib')
    VECTORIZER_PATH = os.getenv('VECTORIZER_PATH', 'models/tfidf_vectorizer.joblib')
    ENCODER_PATH = os.getenv('ENCODER_PATH', 'models/label_encoder.joblib')
    
    # Catégories de tickets
    TICKET_CATEGORIES = [
        "Support Technique",
        "Assistance Générale",
        "Demande de Fonctionnalité",
        "Signalement de Bug",
        "Question sur l'Utilisation",
        "Problème d'Accès / Connexion",
        "Demande de Remboursement",
        "Autre"
    ]
    
    # Configuration de l'API
    API_HOST = os.getenv('API_HOST', '0.0.0.0')
    API_PORT = int(os.getenv('API_PORT', 8000))
    
    # Configuration du modèle
    MIN_CONFIDENCE_THRESHOLD = 0.6
    RETRAIN_THRESHOLD = 10  # Nombre de nouveaux tickets avant réentraînement
    MAX_FEATURES = 5000
    N_GRAM_RANGE = (1, 2)
    
    # Configuration des données d'entraînement
    TRAINING_DATA_PATH = 'data/training_data.csv'
    VALIDATION_DATA_PATH = 'data/validation_data.csv' 