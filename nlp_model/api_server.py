from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import uvicorn
from datetime import datetime

from config import Config
from ticket_classifier import TicketClassifier
from firebase_connector import FirebaseConnector

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialisation de l'application FastAPI
app = FastAPI(
    title="API de Classification de Tickets",
    description="API pour classifier automatiquement les tickets utilisateur avec apprentissage continu",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifiez les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation des composants
classifier = TicketClassifier()
firebase_connector = FirebaseConnector()

# Modèles Pydantic pour les requêtes/réponses
class TicketRequest(BaseModel):
    titre: str
    description: str
    utilisateur_id: Optional[str] = None

class PredictionResponse(BaseModel):
    predicted_category: str
    confidence: float
    top_categories: List[Dict[str, Any]]
    needs_human_review: bool
    keywords: List[str]

class FeedbackRequest(BaseModel):
    ticket_id: str
    predicted_category: str
    actual_category: str
    confidence: float

class ModelInfoResponse(BaseModel):
    training_count: int
    last_training: str
    categories: List[str]
    total_tickets: int
    model_path: str

@app.get("/")
async def root():
    """Endpoint racine"""
    return {
        "message": "API de Classification de Tickets - Asten Tickets",
        "version": "1.0.0",
        "status": "actif"
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_ticket_category(request: TicketRequest):
    """Prédit la catégorie d'un ticket"""
    try:
        # Combiner titre et description
        text = f"{request.titre} {request.description}"
        
        # Faire la prédiction
        prediction = classifier.predict(text)
        
        # Extraire les mots-clés
        from text_preprocessor import TextPreprocessor
        preprocessor = TextPreprocessor()
        keywords = preprocessor.extract_keywords(text, top_k=5)
        
        # Ajouter les mots-clés à la réponse
        prediction['keywords'] = keywords
        
        logger.info(f"Prédiction effectuée: {prediction['predicted_category']} (confiance: {prediction['confidence']:.2f})")
        
        return PredictionResponse(**prediction)
        
    except Exception as e:
        logger.error(f"Erreur lors de la prédiction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def save_prediction_feedback(request: FeedbackRequest):
    """Sauvegarde le feedback sur une prédiction"""
    try:
        firebase_connector.save_prediction_feedback(
            ticket_id=request.ticket_id,
            predicted_category=request.predicted_category,
            actual_category=request.actual_category,
            confidence=request.confidence
        )
        
        logger.info(f"Feedback sauvegardé pour le ticket {request.ticket_id}")
        
        return {"message": "Feedback sauvegardé avec succès"}
        
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
async def retrain_model():
    """Réentraîne le modèle avec les nouvelles données"""
    try:
        classifier.retrain_with_new_data()
        
        return {
            "message": "Modèle réentraîné avec succès",
            "training_count": classifier.training_count
        }
        
    except Exception as e:
        logger.error(f"Erreur lors du réentraînement: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """Retourne les informations sur le modèle"""
    try:
        info = classifier.get_model_info()
        return ModelInfoResponse(**info)
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des infos du modèle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tickets")
async def get_tickets():
    """Récupère tous les tickets depuis Firebase"""
    try:
        tickets = firebase_connector.get_all_tickets()
        return {
            "tickets": tickets,
            "count": len(tickets)
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des tickets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/categories")
async def get_categories():
    """Retourne la liste des catégories disponibles"""
    return {
        "categories": Config.TICKET_CATEGORIES
    }

@app.get("/health")
async def health_check():
    """Vérification de l'état de santé de l'API"""
    try:
        # Vérifier que le modèle est chargé
        model_loaded = (classifier.classifier is not None and 
                       classifier.vectorizer is not None and 
                       classifier.label_encoder is not None)
        
        # Vérifier la connexion Firebase
        tickets_count = firebase_connector.get_tickets_count()
        
        return {
            "status": "healthy" if model_loaded else "unhealthy",
            "model_loaded": model_loaded,
            "firebase_connected": tickets_count >= 0,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Erreur lors du health check: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host=Config.API_HOST,
        port=Config.API_PORT,
        reload=True
    ) 