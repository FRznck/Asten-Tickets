import schedule
import time
import logging
from datetime import datetime, timedelta
from typing import Optional
import threading

from ticket_classifier import TicketClassifier
from firebase_connector import FirebaseConnector
from config import Config

logger = logging.getLogger(__name__)

class TrainingScheduler:
    def __init__(self):
        """Initialise le planificateur d'entraînement"""
        self.classifier = TicketClassifier()
        self.firebase_connector = FirebaseConnector()
        self.last_training_date = None
        self.new_tickets_count = 0
        self.is_training = False
        
        # Charger la date du dernier entraînement
        self.load_last_training_date()
    
    def load_last_training_date(self):
        """Charge la date du dernier entraînement depuis un fichier"""
        try:
            with open('data/last_training.txt', 'r') as f:
                self.last_training_date = datetime.fromisoformat(f.read().strip())
                logger.info(f"Dernier entraînement: {self.last_training_date}")
        except FileNotFoundError:
            self.last_training_date = datetime.now() - timedelta(days=1)
            logger.info("Aucun entraînement précédent trouvé")
    
    def save_last_training_date(self):
        """Sauvegarde la date du dernier entraînement"""
        try:
            os.makedirs('data', exist_ok=True)
            with open('data/last_training.txt', 'w') as f:
                f.write(datetime.now().isoformat())
            self.last_training_date = datetime.now()
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde de la date: {e}")
    
    def check_new_tickets(self) -> int:
        """Vérifie le nombre de nouveaux tickets depuis le dernier entraînement"""
        try:
            # Récupérer tous les tickets
            tickets = self.firebase_connector.get_all_tickets()
            
            # Compter les nouveaux tickets
            new_tickets = 0
            for ticket in tickets:
                if 'dateSoumission' in ticket:
                    ticket_date = ticket['dateSoumission']
                    if isinstance(ticket_date, str):
                        ticket_date = datetime.fromisoformat(ticket_date.replace('Z', '+00:00'))
                    elif hasattr(ticket_date, 'to_pydatetime'):
                        ticket_date = ticket_date.to_pydatetime()
                    
                    if ticket_date > self.last_training_date:
                        new_tickets += 1
            
            self.new_tickets_count = new_tickets
            logger.info(f"Nouveaux tickets détectés: {new_tickets}")
            return new_tickets
            
        except Exception as e:
            logger.error(f"Erreur lors de la vérification des nouveaux tickets: {e}")
            return 0
    
    def should_retrain(self) -> bool:
        """Détermine si le modèle doit être réentraîné"""
        new_tickets = self.check_new_tickets()
        
        # Conditions pour le réentraînement
        conditions = [
            new_tickets >= Config.RETRAIN_THRESHOLD,  # Assez de nouveaux tickets
            datetime.now() - self.last_training_date > timedelta(days=7),  # Au moins une semaine
        ]
        
        should_retrain = any(conditions)
        
        if should_retrain:
            logger.info(f"Réentraînement recommandé: {new_tickets} nouveaux tickets, "
                       f"{datetime.now() - self.last_training_date} depuis le dernier entraînement")
        
        return should_retrain
    
    def retrain_model(self):
        """Réentraîne le modèle de manière asynchrone"""
        if self.is_training:
            logger.info("Entraînement déjà en cours, ignoré")
            return
        
        self.is_training = True
        logger.info("Début du réentraînement automatique")
        
        try:
            # Réentraîner le modèle
            self.classifier.retrain_with_new_data()
            
            # Sauvegarder la date
            self.save_last_training_date()
            
            logger.info("Réentraînement automatique terminé avec succès")
            
        except Exception as e:
            logger.error(f"Erreur lors du réentraînement automatique: {e}")
        
        finally:
            self.is_training = False
    
    def retrain_model_async(self):
        """Lance le réentraînement dans un thread séparé"""
        thread = threading.Thread(target=self.retrain_model)
        thread.daemon = True
        thread.start()
    
    def schedule_training(self):
        """Planifie les tâches d'entraînement"""
        # Vérifier toutes les heures
        schedule.every().hour.do(self.check_and_retrain)
        
        # Réentraînement quotidien à 2h du matin
        schedule.every().day.at("02:00").do(self.force_retrain)
        
        # Réentraînement hebdomadaire le dimanche à 3h du matin
        schedule.every().sunday.at("03:00").do(self.force_retrain)
        
        logger.info("Planification d'entraînement configurée")
    
    def check_and_retrain(self):
        """Vérifie et lance le réentraînement si nécessaire"""
        if self.should_retrain():
            self.retrain_model_async()
    
    def force_retrain(self):
        """Force le réentraînement"""
        logger.info("Réentraînement forcé planifié")
        self.retrain_model_async()
    
    def run_scheduler(self):
        """Lance le planificateur en boucle"""
        logger.info("Démarrage du planificateur d'entraînement")
        self.schedule_training()
        
        while True:
            try:
                schedule.run_pending()
                time.sleep(60)  # Vérifier toutes les minutes
            except KeyboardInterrupt:
                logger.info("Arrêt du planificateur d'entraînement")
                break
            except Exception as e:
                logger.error(f"Erreur dans le planificateur: {e}")
                time.sleep(60)
    
    def get_scheduler_status(self) -> dict:
        """Retourne le statut du planificateur"""
        return {
            'is_training': self.is_training,
            'last_training_date': self.last_training_date.isoformat() if self.last_training_date else None,
            'new_tickets_count': self.new_tickets_count,
            'next_scheduled_jobs': [str(job) for job in schedule.get_jobs()],
            'should_retrain': self.should_retrain()
        }

if __name__ == "__main__":
    import os
    
    # Configuration du logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Créer le dossier data s'il n'existe pas
    os.makedirs('data', exist_ok=True)
    
    # Lancer le planificateur
    scheduler = TrainingScheduler()
    scheduler.run_scheduler() 