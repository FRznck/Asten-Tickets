from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, f1_score
import matplotlib.pyplot as plt
import seaborn as sns # type: ignore
import numpy as np
import joblib
import nltk
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('stopwords')
nltk.download('wordnet')
from datetime import datetime

class ModelTrainer:
    def __init__(self):
        self.models = {
            'svm': SVC(kernel='linear', probability=True),
            'naive_bayes': MultinomialNB(),
            'random_forest': RandomForestClassifier(n_estimators=100)
        }
        self.best_model = None
        self.best_score = 0

    def train_models(self, X_train, y_train):
        """Entraîne tous les modèles et garde le meilleur."""
        results = {}
        for name, model in self.models.items():
            print(f"Entraînement du modèle {name}...")
            model.fit(X_train, y_train)
            score = model.score(X_train, y_train)
            results[name] = score
            
            if score > self.best_score:
                self.best_score = score
                self.best_model = model

        return results

    def evaluate_model(self, model, X_test, y_test):
        """Évalue les performances du modèle."""
        y_pred = model.predict(X_test)
        
        # Calcul des métriques
        report = classification_report(y_test, y_pred, output_dict=True)
        conf_matrix = confusion_matrix(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        return {
            'classification_report': report,
            'confusion_matrix': conf_matrix,
            'f1_score': f1
        }

    def plot_confusion_matrix(self, conf_matrix, labels):
        """Génère et sauvegarde la matrice de confusion."""
        plt.figure(figsize=(10, 8))
        sns.heatmap(conf_matrix, annot=True, fmt='d', cmap='Blues',
                   xticklabels=labels, yticklabels=labels)
        plt.title('Matrice de Confusion')
        plt.ylabel('Vraies étiquettes')
        plt.xlabel('Prédictions')
        
        # Sauvegarde du graphique
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        plt.savefig(f'confusion_matrix_{timestamp}.png')
        plt.close()

    def save_model(self, model, filename):
        """Sauvegarde le modèle entraîné."""
        joblib.dump(model, filename)

    def load_model(self, filename):
        """Charge un modèle sauvegardé."""
        return joblib.load(filename)

    def retrain_model(self, model, X_new, y_new):
        """Réentraîne le modèle avec de nouvelles données."""
        return model.fit(X_new, y_new) 