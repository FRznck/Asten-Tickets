import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import pandas as pd
from typing import List, Dict, Any
import logging
from config import Config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FirebaseConnector:
    def __init__(self):
        """Initialise la connexion Firebase"""
        self.db = None
        self.connected = False
        try:
            # Vérifie si l'application n'a pas déjà été initialisée
            if not firebase_admin._apps:
                # Initialiser Firebase Admin SDK
                cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred, {
                    'projectId': Config.FIREBASE_PROJECT_ID
                })
                logger.info("Application Firebase initialisée avec succès.")
            
            self.db = firestore.client()
            self.connected = True
            logger.info("Connexion Firebase établie avec succès")
        except Exception as e:
            logger.warning(f"Erreur lors de l'initialisation Firebase: {e}")
            logger.info("Le système fonctionnera en mode local sans Firebase")
            self.connected = False
    
    def get_all_tickets(self) -> List[Dict[str, Any]]:
        """Récupère tous les tickets depuis Firestore"""
        if not self.connected:
            logger.warning("Firebase non connecté - retour de données d'exemple")
            return self._get_sample_tickets()
        
        try:
            tickets_ref = self.db.collection('tickets')
            tickets = []
            
            for doc in tickets_ref.stream():
                ticket_data = doc.to_dict()
                ticket_data['id'] = doc.id
                tickets.append(ticket_data)
            
            logger.info(f"Récupération de {len(tickets)} tickets depuis Firebase")
            return tickets
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des tickets: {e}")
            return self._get_sample_tickets()
    
    def _get_sample_tickets(self) -> List[Dict[str, Any]]:
        """Retourne des tickets d'exemple pour les tests"""
        return [
            {
                'id': 'sample_1',
                'titre': 'Mon ordinateur ne démarre plus',
                'description': 'L\'ordinateur affiche un écran bleu au démarrage',
                'categorie': 'Support Technique',
                'dateSoumission': datetime.now(),
                'statut': 'Nouveau'
            },
            {
                'id': 'sample_2',
                'titre': 'Je ne peux pas me connecter',
                'description': 'L\'application me demande constamment de me reconnecter',
                'categorie': 'Problème de Connexion',
                'dateSoumission': datetime.now(),
                'statut': 'En cours'
            },
            {
                'id': 'sample_3',
                'titre': 'L\'application plante',
                'description': 'Quand je clique sur le bouton sauvegarder, l\'application se ferme',
                'categorie': 'Signalement de Bug',
                'dateSoumission': datetime.now(),
                'statut': 'Résolu'
            }
        ]
    
    def get_tickets_for_training(self) -> pd.DataFrame:
        """Récupère les tickets avec leurs catégories pour l'entraînement"""
        tickets = self.get_all_tickets()
        
        training_data = []
        for ticket in tickets:
            if 'titre' in ticket and 'description' in ticket and 'categorie' in ticket:
                # Combiner titre et description
                text = f"{ticket['titre']} {ticket['description']}"
                
                training_data.append({
                    'text': text,
                    'category': ticket['categorie'],
                    'ticket_id': ticket['id'],
                    'date_created': ticket.get('dateSoumission', datetime.now())
                })
        
        df = pd.DataFrame(training_data)
        logger.info(f"Données d'entraînement préparées: {len(df)} échantillons")
        return df
    
    def save_prediction_feedback(self, ticket_id: str, predicted_category: str, 
                                actual_category: str, confidence: float):
        """Sauvegarde le feedback sur une prédiction pour l'amélioration du modèle"""
        if not self.connected:
            logger.info(f"Feedback simulé pour le ticket {ticket_id}: {predicted_category} -> {actual_category}")
            return
        
        try:
            feedback_data = {
                'ticket_id': ticket_id,
                'predicted_category': predicted_category,
                'actual_category': actual_category,
                'confidence': confidence,
                'feedback_date': datetime.now(),
                'needs_retraining': predicted_category != actual_category
            }
            
            self.db.collection('prediction_feedback').add(feedback_data)
            logger.info(f"Feedback sauvegardé pour le ticket {ticket_id}")
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde du feedback: {e}")
    
    def update_ticket_category(self, ticket_id: str, new_category: str):
        """Met à jour la catégorie d'un ticket"""
        if not self.connected:
            logger.info(f"Catégorie simulée mise à jour pour le ticket {ticket_id}: {new_category}")
            return
        
        try:
            ticket_ref = self.db.collection('tickets').document(ticket_id)
            ticket_ref.update({
                'categorie': new_category,
                'categorie_modifiee': True,
                'date_modification': datetime.now()
            })
            logger.info(f"Catégorie mise à jour pour le ticket {ticket_id}")
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour de la catégorie: {e}")
    
    def save_model_metadata(self, metadata: Dict[str, Any]):
        """Sauvegarde les métadonnées d'un modèle entraîné dans Firestore."""
        if not self.connected:
            logger.info(f"Sauvegarde simulée des métadonnées du modèle: {metadata}")
            return
        
        try:
            # Utilise la collection `modeles` comme demandé
            self.db.collection('modeles').add(metadata)
            logger.info("Métadonnées du modèle sauvegardées avec succès dans Firestore.")
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde des métadonnées du modèle: {e}")

    def get_prediction_feedback(self) -> pd.DataFrame:
        """Récupère les feedbacks de prédiction pour l'analyse"""
        if not self.connected:
            logger.info("Retour de feedbacks d'exemple")
            return pd.DataFrame([
                {
                    'id': 'feedback_1',
                    'ticket_id': 'sample_1',
                    'predicted_category': 'Support Technique',
                    'actual_category': 'Support Technique',
                    'confidence': 0.85,
                    'feedback_date': datetime.now(),
                    'needs_retraining': False
                }
            ])
        
        try:
            feedback_ref = self.db.collection('prediction_feedback')
            feedback_data = []
            
            for doc in feedback_ref.stream():
                feedback = doc.to_dict()
                feedback['id'] = doc.id
                feedback_data.append(feedback)
            
            df = pd.DataFrame(feedback_data)
            logger.info(f"Récupération de {len(df)} feedbacks de prédiction")
            return df
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des feedbacks: {e}")
            return pd.DataFrame()
    
    def get_tickets_count(self) -> int:
        """Retourne le nombre total de tickets"""
        if not self.connected:
            return len(self._get_sample_tickets())
        
        try:
            tickets_ref = self.db.collection('tickets')
            return len(list(tickets_ref.stream()))
        except Exception as e:
            logger.error(f"Erreur lors du comptage des tickets: {e}")
            return len(self._get_sample_tickets()) 