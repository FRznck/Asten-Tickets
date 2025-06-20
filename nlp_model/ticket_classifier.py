import joblib
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import logging
from typing import Dict, List, Tuple, Any
import os
from datetime import datetime

from config import Config
from text_preprocessor import TextPreprocessor
from firebase_connector import FirebaseConnector

logger = logging.getLogger(__name__)

class TicketClassifier:
    def __init__(self):
        """Initialise le classifieur de tickets"""
        self.preprocessor = TextPreprocessor()
        self.vectorizer = None
        self.classifier = None
        self.label_encoder = None
        self.firebase_connector = FirebaseConnector()
        self.training_count = 0
        
        # Créer les dossiers nécessaires
        os.makedirs('models', exist_ok=True)
        os.makedirs('data', exist_ok=True)
        
        # Charger ou créer le modèle
        self.load_or_create_model()
    
    def load_or_create_model(self):
        """Charge un modèle existant ou en crée un nouveau"""
        try:
            if (os.path.exists(Config.MODEL_PATH) and 
                os.path.exists(Config.VECTORIZER_PATH) and 
                os.path.exists(Config.ENCODER_PATH)):
                
                self.classifier = joblib.load(Config.MODEL_PATH)
                self.vectorizer = joblib.load(Config.VECTORIZER_PATH)
                self.label_encoder = joblib.load(Config.ENCODER_PATH)
                logger.info("Modèle chargé avec succès")
            else:
                logger.info("Création d'un nouveau modèle")
                self.create_initial_model()
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle: {e}")
            self.create_initial_model()
    
    def create_initial_model(self):
        """Crée un modèle initial avec des données d'exemple"""
        # Données d'exemple pour l'initialisation
        sample_data = {
            'text': [
                # Support Technique
                "Mon ordinateur ne démarre plus",
                "Le système est très lent aujourd'hui",
                "Impossible d'installer une imprimante",
                # Assistance Générale
                "Pouvez-vous m'aider à comprendre cette fonction?",
                "J'ai besoin d'aide pour utiliser le portail RH",
                # Demande de Fonctionnalité
                "Je voudrais une nouvelle fonctionnalité pour exporter les données",
                "Serait-il possible d'ajouter un bouton de tri?",
                # Signalement de Bug
                "L'application plante quand je clique sur ce bouton",
                "Word plante dès que j'ouvre un fichier.",
                # Question sur l'Utilisation
                "Comment puis-je changer mon mot de passe?",
                "Comment accéder à mes anciennes demandes?",
                # Problème d'Accès / Connexion
                "Je ne peux pas me connecter à l'application",
                "Erreur de connexion à distance.",
                # Demande de Remboursement
                "Je veux demander un remboursement",
                "Comment obtenir un remboursement pour mon achat?",
                # Autre
                "Message étrange à l'ouverture du logiciel",
                "Je souhaite signaler un problème non listé"
            ],
            'category': [
                "Support Technique",
                "Support Technique",
                "Support Technique",
                "Assistance Générale",
                "Assistance Générale",
                "Demande de Fonctionnalité",
                "Demande de Fonctionnalité",
                "Signalement de Bug",
                "Signalement de Bug",
                "Question sur l'Utilisation",
                "Question sur l'Utilisation",
                "Problème d'Accès / Connexion",
                "Problème d'Accès / Connexion",
                "Demande de Remboursement",
                "Demande de Remboursement",
                "Autre",
                "Autre"
            ]
        }
        
        df = pd.DataFrame(sample_data)
        self.train_model(df)
    
    def train_model(self, training_data: pd.DataFrame):
        """Entraîne le modèle avec les données fournies"""
        try:
            if training_data.empty:
                logger.warning("Aucune donnée d'entraînement fournie")
                return
            
            # Prétraiter les textes
            training_data['processed_text'] = training_data['text'].apply(
                self.preprocessor.preprocess
            )
            
            # Encoder les catégories
            self.label_encoder = LabelEncoder()
            y = self.label_encoder.fit_transform(training_data['category'])
            
            # Vectoriser les textes
            self.vectorizer = TfidfVectorizer(
                max_features=Config.MAX_FEATURES,
                ngram_range=Config.N_GRAM_RANGE,
                stop_words='english'
            )
            X = self.vectorizer.fit_transform(training_data['processed_text'])
            
            # Entraîner le classifieur
            self.classifier = RandomForestClassifier(
                n_estimators=100,
                random_state=42,
                n_jobs=-1
            )
            self.classifier.fit(X, y)
            
            # Sauvegarder le modèle
            self.save_model()
            
            # Évaluer le modèle
            self.evaluate_model(X, y)
            
            self.training_count += 1
            logger.info(f"Modèle entraîné avec succès (entraînement #{self.training_count})")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'entraînement: {e}")
    
    def predict(self, text: str) -> Dict[str, Any]:
        """Prédit la catégorie d'un ticket"""
        try:
            if not self.classifier or not self.vectorizer or not self.label_encoder:
                raise ValueError("Modèle non initialisé")
            
            # Prétraiter le texte
            processed_text = self.preprocessor.preprocess(text)
            
            # Vectoriser
            X = self.vectorizer.transform([processed_text])
            
            # Prédire
            prediction = self.classifier.predict(X)[0]
            probabilities = self.classifier.predict_proba(X)[0]
            
            # Obtenir la catégorie prédite
            predicted_category = self.label_encoder.inverse_transform([prediction])[0]
            
            # Obtenir la confiance
            confidence = float(np.max(probabilities))
            
            # Obtenir les top 3 catégories
            top_indices = np.argsort(probabilities)[-3:][::-1]
            top_categories = []
            for idx in top_indices:
                category = self.label_encoder.inverse_transform([idx])[0]
                prob = float(probabilities[idx])
                top_categories.append({
                    'category': category,
                    'confidence': prob
                })
            
            return {
                'predicted_category': predicted_category,
                'confidence': confidence,
                'top_categories': top_categories,
                'needs_human_review': confidence < Config.MIN_CONFIDENCE_THRESHOLD
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la prédiction: {e}")
            return {
                'predicted_category': 'Autre',
                'confidence': 0.0,
                'top_categories': [],
                'needs_human_review': True,
                'error': str(e)
            }
    
    def evaluate_model(self, X, y):
        """Évalue les performances du modèle"""
        try:
            # Validation croisée
            cv_scores = cross_val_score(self.classifier, X, y, cv=5)
            logger.info(f"Score de validation croisée: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
            
            # Prédictions sur l'ensemble d'entraînement
            y_pred = self.classifier.predict(X)
            accuracy = accuracy_score(y, y_pred)
            logger.info(f"Précision sur l'ensemble d'entraînement: {accuracy:.3f}")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'évaluation: {e}")
    
    def save_model(self):
        """Sauvegarde le modèle entraîné"""
        try:
            joblib.dump(self.classifier, Config.MODEL_PATH)
            joblib.dump(self.vectorizer, Config.VECTORIZER_PATH)
            joblib.dump(self.label_encoder, Config.ENCODER_PATH)
            logger.info("Modèle sauvegardé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde: {e}")
    
    def retrain_with_new_data(self):
        """Réentraîne le modèle avec les nouvelles données de Firebase"""
        try:
            # Récupérer les données de Firebase
            training_data = self.firebase_connector.get_tickets_for_training()
            
            if len(training_data) > 10:  # Minimum de données pour l'entraînement
                logger.info(f"Réentraînement avec {len(training_data)} tickets")
                self.train_model(training_data)
            else:
                logger.info("Pas assez de données pour le réentraînement")
                
        except Exception as e:
            logger.error(f"Erreur lors du réentraînement: {e}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Retourne les informations sur le modèle"""
        return {
            'training_count': self.training_count,
            'last_training': datetime.now().isoformat(),
            'categories': list(self.label_encoder.classes_) if self.label_encoder else [],
            'total_tickets': self.firebase_connector.get_tickets_count(),
            'model_path': Config.MODEL_PATH
        } 