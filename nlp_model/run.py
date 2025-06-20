#!/usr/bin/env python3
"""
Script principal pour lancer le système NLP de classification de tickets
"""

import os
import sys
import logging
import argparse
import subprocess
import time
from pathlib import Path

# Ajouter le répertoire courant au path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config
from ticket_classifier import TicketClassifier
from training_scheduler import TrainingScheduler

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('nlp_system.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def create_directories():
    """Crée les dossiers nécessaires"""
    directories = ['models', 'data', 'logs']
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        logger.info(f"Dossier créé/vérifié: {directory}")

def check_dependencies():
    """Vérifie que toutes les dépendances sont installées"""
    try:
        import sklearn
        import pandas
        import numpy
        import firebase_admin
        import fastapi
        import uvicorn
        logger.info("Toutes les dépendances sont installées")
        return True
    except ImportError as e:
        logger.error(f"Dépendance manquante: {e}")
        logger.info("Installez les dépendances avec: pip install -r requirements.txt")
        return False

def start_api_server():
    """Lance le serveur API"""
    logger.info("Démarrage du serveur API...")
    try:
        import uvicorn
        uvicorn.run(
            "api_server:app",
            host=Config.API_HOST,
            port=Config.API_PORT,
            reload=False,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Erreur lors du démarrage de l'API: {e}")

def start_training_scheduler():
    """Lance le planificateur d'entraînement"""
    logger.info("Démarrage du planificateur d'entraînement...")
    try:
        scheduler = TrainingScheduler()
        scheduler.run_scheduler()
    except Exception as e:
        logger.error(f"Erreur lors du démarrage du planificateur: {e}")

def test_model():
    """Teste le modèle avec des exemples"""
    logger.info("Test du modèle...")
    try:
        classifier = TicketClassifier()
        
        test_cases = [
            "Mon ordinateur ne démarre plus",
            "Je ne peux pas me connecter à l'application",
            "L'application plante quand je clique sur ce bouton",
            "Comment puis-je changer mon mot de passe?",
            "Je voudrais une nouvelle fonctionnalité pour exporter les données"
        ]
        
        for text in test_cases:
            prediction = classifier.predict(text)
            logger.info(f"Texte: '{text}'")
            logger.info(f"Prédiction: {prediction['predicted_category']} (confiance: {prediction['confidence']:.2f})")
            logger.info("---")
        
        logger.info("Test du modèle terminé")
        
    except Exception as e:
        logger.error(f"Erreur lors du test: {e}")

def initialize_model():
    """Initialise le modèle avec des données d'exemple"""
    logger.info("Initialisation du modèle...")
    try:
        classifier = TicketClassifier()
        logger.info("Modèle initialisé avec succès")
        
        # Afficher les informations du modèle
        info = classifier.get_model_info()
        logger.info(f"Informations du modèle: {info}")
        
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation: {e}")

def main():
    """Fonction principale"""
    parser = argparse.ArgumentParser(description="Système NLP de classification de tickets")
    parser.add_argument('--mode', choices=['api', 'scheduler', 'test', 'init', 'full'], 
                       default='full', help='Mode de fonctionnement')
    parser.add_argument('--port', type=int, default=Config.API_PORT, 
                       help='Port pour l\'API')
    parser.add_argument('--host', default=Config.API_HOST, 
                       help='Host pour l\'API')
    
    args = parser.parse_args()
    
    # Créer les dossiers
    create_directories()
    
    # Vérifier les dépendances
    if not check_dependencies():
        sys.exit(1)
    
    logger.info("=== Système NLP de Classification de Tickets ===")
    logger.info(f"Mode: {args.mode}")
    logger.info(f"API Host: {args.host}")
    logger.info(f"API Port: {args.port}")
    
    try:
        if args.mode == 'api':
            # Mode API uniquement
            start_api_server()
            
        elif args.mode == 'scheduler':
            # Mode planificateur uniquement
            start_training_scheduler()
            
        elif args.mode == 'test':
            # Mode test
            test_model()
            
        elif args.mode == 'init':
            # Mode initialisation
            initialize_model()
            
        elif args.mode == 'full':
            # Mode complet (API + planificateur)
            import threading
            
            # Lancer le planificateur dans un thread séparé
            scheduler_thread = threading.Thread(target=start_training_scheduler, daemon=True)
            scheduler_thread.start()
            
            # Lancer l'API dans le thread principal
            start_api_server()
            
    except KeyboardInterrupt:
        logger.info("Arrêt du système...")
    except Exception as e:
        logger.error(f"Erreur fatale: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 