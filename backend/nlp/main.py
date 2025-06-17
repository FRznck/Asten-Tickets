from preprocessing import TextPreprocessor
from models import ModelTrainer
import pandas as pd
from sklearn.model_selection import train_test_split
import json
from datetime import datetime

class NLPProcessor:
    def __init__(self):
        self.preprocessor = TextPreprocessor()
        self.model_trainer = ModelTrainer()
        self.model = None

    def prepare_data(self, data):
        """Prépare les données pour l'entraînement."""
        # Supposons que data est une liste de dictionnaires avec 'text' et 'label'
        texts = [item['text'] for item in data]
        labels = [item['label'] for item in data]
        
        # Vectorisation des textes
        X = self.preprocessor.vectorize(texts)
        return X, labels

    def train(self, data):
        """Entraîne le modèle sur les données fournies."""
        X, y = self.prepare_data(data)
        
        # Division en ensembles d'entraînement et de test
        X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
        
        # Entraînement des modèles
        results = self.model_trainer.train_models(X_train, y_train)
        
        # Évaluation du meilleur modèle
        evaluation = self.model_trainer.evaluate_model(
            self.model_trainer.best_model, X_test, y_test
        )
        
        # Sauvegarde des résultats
        self.save_results(results, evaluation)
        
        return evaluation

    def predict(self, text):
        """Fait une prédiction sur un nouveau texte."""
        if not self.model:
            raise Exception("Le modèle n'a pas été entraîné")
        
        # Prétraitement du texte
        processed_text = self.preprocessor.process_text(text)
        # Vectorisation
        X = self.preprocessor.vectorizer.transform([processed_text])
        # Prédiction
        prediction = self.model_trainer.best_model.predict(X)
        probabilities = self.model_trainer.best_model.predict_proba(X)
        
        return {
            'prediction': prediction[0],
            'probabilities': probabilities[0].tolist()
        }

    def save_results(self, training_results, evaluation_results):
        """Sauvegarde les résultats de l'entraînement et de l'évaluation."""
    from numpy import ndarray

    def convert_ndarray(obj):
        if isinstance(obj, ndarray): # type: ignore
            return obj.tolist()
        if isinstance(obj, dict):
            return {k: convert_ndarray(v) for k, v in obj.items()} # type: ignore
        if isinstance(obj, list):
            return [convert_ndarray(v) for v in obj] # type: ignore
        return obj

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    results = {
        'timestamp': timestamp,
        'training_results': convert_ndarray(training_results), # type: ignore
        'evaluation_results': convert_ndarray(evaluation_results) # type: ignore
    }

    with open(f'results_{timestamp}.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=4)

    def retrain(self, new_data):
        """Réentraîne le modèle avec de nouvelles données."""
        X_new, y_new = self.prepare_data(new_data)
        self.model_trainer.retrain_model(self.model_trainer.best_model, X_new, y_new)

if __name__ == "__main__":
    # Exemple d'utilisation
    processor = NLPProcessor()
    
    # Exemple de données
    sample_data = [
    {'text': 'Je ne peux pas accéder à mon compte', 'label': 'connexion'},
    {'text': 'Mon écran est noir', 'label': 'hardware'},
    {'text': 'Mot de passe oublié', 'label': 'connexion'},
    {'text': 'Le clavier ne fonctionne plus', 'label': 'hardware'},
    {'text': 'Impossible de se connecter', 'label': 'connexion'},
    {'text': 'L’ordinateur ne démarre pas', 'label': 'hardware'},
]
    
    # Entraînement
    results = processor.train(sample_data)
    print("Résultats de l'entraînement:", results)