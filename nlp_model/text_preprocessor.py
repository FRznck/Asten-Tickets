import re
import string
from typing import List
import logging

logger = logging.getLogger(__name__)

class TextPreprocessor:
    def __init__(self):
        """Initialise le préprocesseur de texte"""
        # Mots vides en français et anglais
        self.stop_words = {
            'le', 'la', 'les', 'un', 'une', 'des', 'ce', 'ces', 'cette', 'mon', 'ma', 'mes',
            'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'leur', 'leurs',
            'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se',
            'lui', 'leur', 'moi', 'toi', 'soi', 'eux', 'elles', 'ceci', 'cela', 'ça',
            'qui', 'que', 'quoi', 'dont', 'où', 'quand', 'comment', 'pourquoi',
            'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or', 'puis', 'ensuite',
            'de', 'du', 'des', 'à', 'au', 'aux', 'en', 'dans', 'sur', 'sous', 'avec',
            'sans', 'par', 'pour', 'vers', 'depuis', 'jusqu', 'pendant', 'avant', 'après',
            'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir', 'pouvoir',
            'vouloir', 'devoir', 'falloir', 'valoir', 'paraître', 'sembler', 'rester',
            'devenir', 'rendre', 'tenir', 'venir', 'sortir', 'partir', 'arriver',
            'entrer', 'monter', 'descendre', 'passer', 'tourner', 'retourner',
            'comme', 'ainsi', 'alors', 'donc', 'puis', 'ensuite', 'alors', 'donc',
            'bien', 'mal', 'mieux', 'pire', 'plus', 'moins', 'très', 'trop', 'assez',
            'peu', 'beaucoup', 'trop', 'trop', 'trop', 'trop', 'trop', 'trop',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
            'before', 'after', 'above', 'below', 'between', 'among', 'within',
            'without', 'against', 'toward', 'towards', 'upon', 'across', 'behind',
            'beneath', 'beside', 'beyond', 'inside', 'outside', 'under', 'over',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
            'can', 'must', 'shall', 'this', 'that', 'these', 'those', 'i', 'you',
            'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours',
            'his', 'hers', 'ours', 'theirs', 'myself', 'yourself', 'himself',
            'herself', 'itself', 'ourselves', 'yourselves', 'themselves'
        }
        
        # Mots spécifiques au domaine des tickets
        self.domain_stop_words = {
            'ticket', 'problème', 'aide', 'support', 'demande', 'question',
            'erreur', 'bug', 'fonctionnalité', 'système', 'application'
        }
        self.stop_words.update(self.domain_stop_words)
    
    def clean_text(self, text: str) -> str:
        """Nettoie le texte en supprimant les caractères spéciaux et normalisant"""
        if not text or not isinstance(text, str):
            return ""
        
        # Convertir en minuscules
        text = text.lower()
        
        # Supprimer les caractères spéciaux et chiffres
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\d+', ' ', text)
        
        # Supprimer les espaces multiples
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        """Supprime les mots vides"""
        return [token for token in tokens if token not in self.stop_words]
    
    def preprocess(self, text: str) -> str:
        """Prétraite complètement un texte"""
        try:
            # Nettoyer le texte
            cleaned_text = self.clean_text(text)
            
            # Tokeniser (séparer par espaces)
            tokens = cleaned_text.split()
            
            # Supprimer les mots vides
            tokens = self.remove_stopwords(tokens)
            
            # Filtrer les tokens trop courts
            tokens = [token for token in tokens if len(token) > 2]
            
            # Rejoindre en texte
            processed_text = ' '.join(tokens)
            
            return processed_text
        except Exception as e:
            logger.error(f"Erreur lors du prétraitement: {e}")
            return text
    
    def extract_keywords(self, text: str, top_k: int = 10) -> List[str]:
        """Extrait les mots-clés les plus importants d'un texte"""
        try:
            processed_text = self.preprocess(text)
            tokens = processed_text.split()
            
            # Compter les fréquences
            from collections import Counter
            word_freq = Counter(tokens)
            
            # Retourner les top_k mots les plus fréquents
            return [word for word, freq in word_freq.most_common(top_k)]
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des mots-clés: {e}")
            return [] 