import spacy # type: ignore
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

class TextPreprocessor:
    def __init__(self):
        # Téléchargement des ressources NLTK nécessaires
        nltk.download('punkt')
        nltk.download('stopwords')
        nltk.download('wordnet')
        
        # Initialisation de spaCy
        self.nlp = spacy.load('fr_core_news_md')
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('french'))
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            stop_words=list(self.stop_words)
        )

    def clean_text(self, text):
        """Nettoie le texte en retirant les caractères spéciaux et en le mettant en minuscules."""
        if not isinstance(text, str):
            return ""
        # Conversion en minuscules
        text = text.lower()
        # Suppression des caractères spéciaux
        text = ''.join(c for c in text if c.isalnum() or c.isspace())
        return text

    def tokenize(self, text):
        """Tokenise le texte en mots."""
        return word_tokenize(text)

    def remove_stopwords(self, tokens):
        """Supprime les mots vides."""
        return [token for token in tokens if token not in self.stop_words]

    def lemmatize(self, tokens):
        """Lemmatise les tokens."""
        return [self.lemmatizer.lemmatize(token) for token in tokens]

    def process_text(self, text):
        """Applique l'ensemble du pipeline de prétraitement."""
        # Nettoyage
        cleaned_text = self.clean_text(text)
        # Tokenisation
        tokens = self.tokenize(cleaned_text)
        # Suppression des mots vides
        tokens = self.remove_stopwords(tokens)
        # Lemmatisation
        tokens = self.lemmatize(tokens)
        return ' '.join(tokens)

    def vectorize(self, texts):
        """Vectorise les textes en utilisant TF-IDF."""
        processed_texts = [self.process_text(text) for text in texts]
        return self.vectorizer.fit_transform(processed_texts)

    def get_feature_names(self):
        """Retourne les noms des features (mots) utilisés dans la vectorisation."""
        return self.vectorizer.get_feature_names_out() 