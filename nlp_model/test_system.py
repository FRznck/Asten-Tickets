#!/usr/bin/env python3
"""
Script de test pour le système NLP de classification de tickets
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"

def test_api_health():
    """Test de l'état de santé de l'API"""
    print("🔍 Test de l'état de santé de l'API...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            health = response.json()
            print(f"✅ API en ligne - Statut: {health['status']}")
            print(f"   Modèle chargé: {health['model_loaded']}")
            print(f"   Firebase connecté: {health['firebase_connected']}")
            return True
        else:
            print(f"❌ Erreur API: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter à l'API")
        return False

def test_prediction():
    """Test de prédiction de catégorie"""
    print("\n🎯 Test de prédiction de catégorie...")
    
    test_cases = [
        {
            "titre": "Mon ordinateur ne démarre plus",
            "description": "L'ordinateur affiche un écran bleu au démarrage et ne répond plus"
        },
        {
            "titre": "Je ne peux pas me connecter",
            "description": "L'application me demande constamment de me reconnecter"
        },
        {
            "titre": "L'application plante",
            "description": "Quand je clique sur le bouton sauvegarder, l'application se ferme"
        },
        {
            "titre": "Comment changer mon mot de passe?",
            "description": "Je ne trouve pas l'option pour modifier mon mot de passe"
        },
        {
            "titre": "Nouvelle fonctionnalité souhaitée",
            "description": "J'aimerais pouvoir exporter mes données en format Excel"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📝 Test {i}: {test_case['titre']}")
        try:
            response = requests.post(
                f"{API_BASE_URL}/predict",
                json=test_case,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                prediction = response.json()
                print(f"   Catégorie prédite: {prediction['predicted_category']}")
                print(f"   Confiance: {prediction['confidence']:.2%}")
                print(f"   Mots-clés: {', '.join(prediction['keywords'])}")
                print(f"   Nécessite vérification: {prediction['needs_human_review']}")
            else:
                print(f"   ❌ Erreur: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Erreur de connexion: {e}")

def test_model_info():
    """Test des informations du modèle"""
    print("\n📊 Test des informations du modèle...")
    try:
        response = requests.get(f"{API_BASE_URL}/model-info")
        if response.status_code == 200:
            info = response.json()
            print(f"✅ Nombre d'entraînements: {info['training_count']}")
            print(f"   Dernier entraînement: {info['last_training']}")
            print(f"   Catégories disponibles: {', '.join(info['categories'])}")
            print(f"   Total tickets: {info['total_tickets']}")
        else:
            print(f"❌ Erreur: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur de connexion: {e}")

def test_categories():
    """Test de récupération des catégories"""
    print("\n📋 Test de récupération des catégories...")
    try:
        response = requests.get(f"{API_BASE_URL}/categories")
        if response.status_code == 200:
            categories = response.json()
            print(f"✅ Catégories disponibles ({len(categories['categories'])}):")
            for i, category in enumerate(categories['categories'], 1):
                print(f"   {i}. {category}")
        else:
            print(f"❌ Erreur: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur de connexion: {e}")

def test_feedback():
    """Test de sauvegarde de feedback"""
    print("\n💬 Test de sauvegarde de feedback...")
    feedback_data = {
        "ticket_id": "test_ticket_123",
        "predicted_category": "Support Technique",
        "actual_category": "Bug Report",
        "confidence": 0.85
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/feedback",
            json=feedback_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Feedback sauvegardé: {result['message']}")
        else:
            print(f"❌ Erreur: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur de connexion: {e}")

def test_retrain():
    """Test de réentraînement"""
    print("\n🔄 Test de réentraînement...")
    try:
        response = requests.post(f"{API_BASE_URL}/retrain")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Réentraînement: {result['message']}")
            print(f"   Nombre d'entraînements: {result['training_count']}")
        else:
            print(f"❌ Erreur: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur de connexion: {e}")

def main():
    """Fonction principale de test"""
    print("=" * 60)
    print("🧪 TEST DU SYSTÈME NLP - ASTEN TICKETS")
    print("=" * 60)
    print(f"⏰ Début des tests: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Attendre que l'API soit prête
    print("\n⏳ Attente du démarrage de l'API...")
    time.sleep(3)
    
    # Tests
    if test_api_health():
        test_prediction()
        test_model_info()
        test_categories()
        test_feedback()
        test_retrain()
    else:
        print("\n❌ L'API n'est pas accessible. Vérifiez que le serveur est démarré.")
        print("   Commande: python run.py --mode api")
    
    print("\n" + "=" * 60)
    print("🏁 Tests terminés")
    print("=" * 60)

if __name__ == "__main__":
    main() 