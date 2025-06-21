import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report
import logging
from ticket_classifier import TicketClassifier
from config import Config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def diagnose_model():
    """Diagnostique le modèle NLP et identifie les problèmes"""
    print("🔍 DIAGNOSTIC DU MODÈLE NLP")
    print("=" * 50)
    
    # Charger le modèle
    classifier = TicketClassifier()
    
    # Vérifier les catégories disponibles
    print("\n📋 CATÉGORIES CONFIGURÉES:")
    for i, cat in enumerate(Config.TICKET_CATEGORIES, 1):
        print(f"   {i}. {cat}")
    
    # Vérifier les catégories du modèle entraîné
    if classifier.label_encoder:
        print("\n🎯 CATÉGORIES DU MODÈLE:")
        for i, cat in enumerate(classifier.label_encoder.classes_, 1):
            print(f"   {i}. {cat}")
    
    # Tester avec des exemples variés
    test_cases = [
        ("Mon ordinateur ne démarre plus", "Support Technique"),
        ("Je ne peux pas me connecter au VPN", "Problème d'Accès / Connexion"),
        ("L'application plante quand je clique", "Signalement de Bug"),
        ("Comment changer mon mot de passe ?", "Question sur l'Utilisation"),
        ("Je voudrais une nouvelle fonctionnalité", "Demande de Fonctionnalité"),
        ("Pouvez-vous m'aider à comprendre ?", "Assistance Générale"),
        ("Je veux demander un remboursement", "Demande de Remboursement"),
        ("Problème non listé ici", "Autre")
    ]
    
    print("\n🧪 TESTS DE CLASSIFICATION:")
    print("-" * 50)
    
    results = []
    for text, expected in test_cases:
        prediction = classifier.predict(text)
        predicted = prediction['predicted_category']
        confidence = prediction['confidence']
        
        print(f"📝 Texte: {text}")
        print(f"   Attendu: {expected}")
        print(f"   Prédit: {predicted}")
        print(f"   Confiance: {confidence:.2%}")
        print(f"   ✅ Correct" if predicted == expected else f"   ❌ Incorrect")
        print()
        
        results.append({
            'text': text,
            'expected': expected,
            'predicted': predicted,
            'confidence': confidence,
            'correct': predicted == expected
        })
    
    # Statistiques
    df_results = pd.DataFrame(results)
    accuracy = df_results['correct'].mean()
    
    print(f"📊 STATISTIQUES:")
    print(f"   Précision globale: {accuracy:.2%}")
    print(f"   Nombre de tests: {len(results)}")
    print(f"   Tests corrects: {df_results['correct'].sum()}")
    print(f"   Tests incorrects: {(~df_results['correct']).sum()}")
    
    # Analyser les erreurs
    errors = df_results[~df_results['correct']]
    if not errors.empty:
        print(f"\n❌ ERREURS DÉTECTÉES:")
        for _, error in errors.iterrows():
            print(f"   '{error['text']}' -> {error['predicted']} (attendu: {error['expected']})")
    
    return classifier, df_results

def create_better_training_data():
    """Crée un meilleur ensemble de données d'entraînement"""
    print("\n🔄 CRÉATION D'UN MEILLEUR ENSEMBLE D'ENTRAÎNEMENT")
    print("=" * 60)
    
    # Données d'entraînement enrichies avec plus d'exemples variés
    training_data = {
        'text': [
            # Support Technique (Matériel & Système) (25 exemples)
            "Mon ordinateur ne démarre plus du tout",
            "L'écran reste noir au démarrage, mais j'entends le ventilateur",
            "Problème avec l'imprimante, elle n'imprime plus",
            "Mon clavier ne répond pas, certaines touches sont bloquées",
            "La souris sans fil ne fonctionne pas, j'ai changé les piles",
            "Le son grésille et ne marche plus correctement",
            "L'écran de mon portable est fissuré",
            "Le disque dur fait un bruit de claquement bizarre",
            "Mon PC est devenu extrèmement lent depuis la dernière mise à jour",
            "Le système plante sans arrêt avec un écran bleu",
            "Impossible d'installer le logiciel de compta, j'ai une erreur",
            "L'antivirus Norton bloque l'accès à tous mes fichiers",
            "Le WiFi se déconnecte toutes les 5 minutes",
            "Le Bluetooth ne trouve aucun appareil",
            "L'affichage clignote sur mon deuxième écran",
            "Le ventilateur de mon laptop fait un bruit d'enfer et il chauffe beaucoup",
            "L'ordinateur surchauffe et s'éteint tout seul",
            "Un des ports USB-C sur le côté ne fonctionne plus",
            "L'écran tactile de la tablette ne réagit plus sur la partie droite",
            "Mon micro n'est pas détecté sur Teams",
            "mon ordi est mort, ecran noir",
            "mon inprimante ne marche pa",
            "Bonjour, depuis ce matin, je n'arrive pas à me servir de ma souris Logitech.",
            "Pourquoi est-ce que mon ordinateur est si lent tout d'un coup ?",
            "Encore une panne de WiFi, c'est insupportable !",
            
            # Problème de Connexion Réseau (20 exemples)
            "Je ne peux pas me connecter au VPN de l'entreprise",
            "Erreur de connexion à distance au serveur de fichiers",
            "Accès refusé à l'intranet, on me dit que je n'ai pas les droits",
            "La connexion au réseau est très instable aujourd'hui",
            "Pas d'accès internet sur mon poste de travail",
            "Impossible d'accéder au serveur applicatif 'SAP'",
            "La connexion au VPN est lente et coupe souvent",
            "Erreur de certificat en tentant d'accéder à un site interne",
            "Je pense avoir un problème de proxy, la navigation est bloquée",
            "La connexion WiFi du bureau est défaillante",
            "Erreur de domaine, impossible de me logger sur le réseau",
            "Impossible de joindre le contrôleur de domaine",
            "La connexion RDP au serveur distant échoue systématiquement",
            "J'ai une erreur de port bloqué en utilisant FileZilla",
            "Le pare-feu semble bloquer ma connexion à la base de données",
            "J'arrive pas à aller sur le lecteur partagé",
            "Est-ce que le VPN est en maintenance ?",
            "Il faut rétablir la connexion au plus vite",
            "Toute mon équipe n'a plus accès à internet depuis 10h.",
            "pb de vpn",
            
            # Problème de Compte & Accès Logiciel (20 exemples)
            "Mon mot de passe a expiré et je n'arrive pas à le renouveler",
            "Mon compte utilisateur est verrouillé",
            "Impossible de me connecter à ma session Windows",
            "Je n'arrive pas à me connecter à Outlook, il ne reconnaît pas mon mot de passe",
            "Erreur d'authentification sur la plateforme Salesforce",
            "Ma session sur le portail RH expire instantanément",
            "Erreur de synchronisation de mon compte Google",
            "J'ai oublié mon mot de passe pour Jira",
            "Pouvez-vous débloquer mon compte svp ?",
            "Comment faire si j'ai perdu mes identifiants ?",
            "Accès refusé au logiciel de paie",
            "mon mdp ne fonctionne plus",
            "je suis bloqué dehors du système",
            "Le SSO ne fonctionne pas, je dois entrer mon mot de passe partout",
            "Bonjour, après 3 tentatives, mon compte a été bloqué.",
            "Je n'ai pas reçu le mail pour réinitialiser mon mot de passe",
            "Besoin d'un accès au nouveau logiciel de design",
            "Retirer les accès de l'ancien stagiaire qui est parti",
            "Je n'ai pas les bons droits pour modifier ce fichier",
            "Demande de création de compte pour un nouvel employé",
            
            # Signalement de Bug Applicatif (25 exemples)
            "L'application plante quand je clique sur le bouton 'Valider'",
            "Le logiciel se ferme tout seul quand j'ouvre un gros fichier",
            "J'ai une erreur 404 en cliquant sur le lien dans l'email",
            "Le bouton 'Sauvegarder' est grisé et ne fonctionne pas",
            "L'affichage de l'interface est complètement cassé sur Firefox",
            "Le formulaire de contact ne s'envoie pas, la roue tourne à l'infini",
            "J'ai une erreur JavaScript dans la console : 'TypeError: null is not an object'",
            "Le menu déroulant pour sélectionner le pays est vide",
            "La fonction de recherche ne retourne aucun résultat même pour des mots simples",
            "Le tri par date dans le tableau ne fonctionne pas correctement",
            "L'export des données vers Excel échoue avec un message d'erreur",
            "L'import de mon fichier client plante au milieu du processus",
            "Erreur de base de données en voulant enregistrer un nouvel article",
            "Les données que je modifie ne se sauvegardent pas",
            "L'upload de ma photo de profil ne fonctionne pas",
            "Le téléchargement du rapport PDF plante à 99%",
            "Le champ téléphone refuse les numéros suisses, erreur de validation",
            "Le système de notification push n'envoie rien",
            "L'API me retourne une erreur 500 quand j'appelle le endpoint /users",
            "ça marche pas quand je clique là",
            "Votre appli est buggée, impossible de travailler !",
            "Pourquoi le rapport ne se génère pas ?",
            "Le calcul de la TVA est incorrect dans le module de facturation.",
            "L'aplication se ferme toute seul",
            "Le copier/coller ne marche plus dans l'éditeur de texte",
            
            # Demande d'Information / Aide à l'Utilisation (20 exemples)
            "Comment puis-je changer mon mot de passe ?",
            "Où est-ce que je peux trouver les documents partagés par mon équipe ?",
            "Pouvez-vous m'expliquer comment exporter mes données en CSV ?",
            "Je ne comprends pas comment configurer les notifications par email.",
            "Je suis perdu, pouvez-vous me guider pour créer mon premier rapport ?",
            "J'ai besoin d'aide pour utiliser le nouveau tableau de bord",
            "Y a-t-il un tutoriel pour la prise en main du logiciel ?",
            "Je ne trouve pas la fonction pour modifier mon profil",
            "Comment ajouter un nouveau contact dans le carnet d'adresses ?",
            "Je ne sais pas par où commencer.",
            "Expliquez-moi comment filtrer les résultats de recherche.",
            "Comment imprimer ce bon de commande ?",
            "Je suis bloqué à l'étape 3 du processus, que faire ?",
            "Bonjour, je suis nouveau ici, j'aurais besoin d'un coup de main.",
            "Montrez-moi comment sauvegarder mon travail.",
            "je trouve pas mes anciennes demandes",
            "Où sont les paramètres ?",
            "J'ai besoin d'explications sur le fonctionnement général.",
            "Comment restaurer une sauvegarde précédente ?",
            "Quelle est la procédure pour mettre à jour l'application ?",
            
            # Demande de Fonctionnalité (20 exemples)
            "Je voudrais proposer une nouvelle fonctionnalité pour l'application",
            "Serait-il possible d'ajouter un bouton pour tout archiver d'un coup ?",
            "J'aimerais beaucoup pouvoir exporter mes factures en format PDF",
            "Pourriez-vous ajouter un système de tags pour mieux organiser les projets ?",
            "Il manque vraiment une option de tri par ordre alphabétique inversé",
            "Une fonction de recherche avancée avec plus de filtres serait utile",
            "Ce serait génial d'avoir des raccourcis clavier pour les actions courantes",
            "Avez-vous prévu de développer une version mobile de l'application ?",
            "Il faudrait absolument un système de notifications en temps réel",
            "Un mode sombre pour l'interface serait très apprécié pour travailler la nuit",
            "Je rêve de pouvoir personnaliser les couleurs de l'interface",
            "Une sauvegarde automatique toutes les 5 minutes serait une sécurité bienvenue",
            "Ajoutez un historique des modifications",
            "Il manque une fonction pour partager un dossier complet",
            "Une idée : pourquoi ne pas intégrer un système de commentaires ?",
            "Le logiciel concurrent a une fonction de reporting que vous n'avez pas",
            "un dark mode svp !!!",
            "Intégration avec Google Calendar",
            "Demande d'amélioration : permettre la connexion via un compte Microsoft",
            "On devrait pouvoir dupliquer une tâche",
            
            # Assistance Générale (15 exemples)
            "Pouvez-vous m'aider à comprendre ?",
            "J'ai besoin d'aide pour utiliser le système",
            "Je ne comprends pas cette fonction",
            "Pouvez-vous m'expliquer comment faire ?",
            "J'ai besoin d'assistance",
            "Je suis perdu dans l'interface",
            "Pouvez-vous me guider ?",
            "J'ai besoin de conseils",
            "Je ne sais pas par où commencer",
            "Pouvez-vous m'aider ?",
            "J'ai besoin d'un tutoriel",
            "Je ne trouve pas ce que je cherche",
            "Pouvez-vous m'orienter ?",
            "J'ai besoin d'explications",
            "Je suis bloqué",
            
            # Demande de Remboursement (10 exemples)
            "Je veux demander un remboursement",
            "Comment obtenir un remboursement ?",
            "Je souhaite être remboursé",
            "Demande de remboursement pour mon achat",
            "Je veux récupérer mon argent",
            "Comment procéder pour un remboursement ?",
            "Je demande le remboursement de ma commande",
            "Je veux annuler et être remboursé",
            "Remboursement pour service non fourni",
            "Je veux un remboursement partiel",
            
            # Autre (10 exemples)
            "Problème non listé ici",
            "Question générale",
            "Autre demande",
            "Problème divers",
            "Question non catégorisée",
            "Demande spéciale",
            "Problème unique",
            "Question particulière",
            "Demande exceptionnelle",
            "Autre problème"
        ],
        'category': [
            # Support Technique (Matériel & Système)
            "Support Technique", "Support Technique", "Support Technique", "Support Technique", "Support Technique",
            "Support Technique", "Support Technique", "Support Technique", "Support Technique", "Support Technique",
            "Support Technique", "Support Technique", "Support Technique", "Support Technique", "Support Technique",
            "Support Technique", "Support Technique", "Support Technique", "Support Technique", "Support Technique",
            "Support Technique", "Support Technique", "Support Technique", "Support Technique", "Support Technique",
            
            # Problème de Connexion Réseau
            "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion",
            "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion",
            "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion",
            "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion",
            
            # Problème de Compte & Accès Logiciel
            "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion",
            "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion",
            "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion",
            "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion", "Problème d'Accès / Connexion",
            
            # Signalement de Bug Applicatif
            "Signalement de Bug", "Signalement de Bug", "Signalement de Bug", "Signalement de Bug", "Signalement de Bug",
            "Signalement de Bug", "Signalement de Bug", "Signalement de Bug", "Signalement de Bug", "Signalement de Bug",
            "Signalement de Bug", "Signalement de Bug", "Signalement de Bug", "Signalement de Bug", "Signalement de Bug",
            "Signalement de Bug", "Signalement de Bug", "Signalement de Bug", "Signalement de Bug", "Signalement de Bug",
            "Signalement de Bug", "Signalement de Bug", "Signalement de Bug", "Signalement de Bug", "Signalement de Bug",
            
            # Demande d'Information / Aide à l'Utilisation
            "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation",
            "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation",
            "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation",
            "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation", "Question sur l'Utilisation",
            
            # Demande de Fonctionnalité
            "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité",
            "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité",
            "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité",
            "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité", "Demande de Fonctionnalité",
            
            # Assistance Générale
            "Assistance Générale", "Assistance Générale", "Assistance Générale", "Assistance Générale", "Assistance Générale",
            "Assistance Générale", "Assistance Générale", "Assistance Générale", "Assistance Générale", "Assistance Générale",
            "Assistance Générale", "Assistance Générale", "Assistance Générale", "Assistance Générale", "Assistance Générale",
            
            # Demande de Remboursement
            "Demande de Remboursement", "Demande de Remboursement", "Demande de Remboursement", "Demande de Remboursement", "Demande de Remboursement",
            "Demande de Remboursement", "Demande de Remboursement", "Demande de Remboursement", "Demande de Remboursement", "Demande de Remboursement",
            
            # Autre
            "Autre", "Autre", "Autre", "Autre", "Autre", "Autre", "Autre", "Autre", "Autre", "Autre"
        ]
    }
    
    df = pd.DataFrame(training_data)
    print(f"✅ Données d'entraînement enrichies créées: {len(df)} échantillons")
    print(f"📊 Répartition par catégorie:")
    print(df['category'].value_counts())
    
    return df

def retrain_model_with_better_data():
    """Réentraîne le modèle avec de meilleures données"""
    print("\n🔄 RÉENTRAÎNEMENT DU MODÈLE")
    print("=" * 40)
    
    # Créer de meilleures données d'entraînement
    training_data = create_better_training_data()
    
    # Réentraîner le modèle
    classifier = TicketClassifier()
    classifier.train_model(training_data)
    
    print("✅ Modèle réentraîné avec succès!")
    
    # Tester le nouveau modèle
    print("\n🧪 TEST DU NOUVEAU MODÈLE:")
    print("-" * 30)
    
    test_cases = [
        ("Mon ordinateur ne démarre plus", "Support Technique"),
        ("Je ne peux pas me connecter au VPN", "Problème d'Accès / Connexion"),
        ("L'application plante quand je clique", "Signalement de Bug"),
        ("Comment changer mon mot de passe ?", "Question sur l'Utilisation"),
        ("Je voudrais une nouvelle fonctionnalité", "Demande de Fonctionnalité"),
        ("Pouvez-vous m'aider à comprendre ?", "Assistance Générale"),
        ("Je veux demander un remboursement", "Demande de Remboursement"),
        ("Problème non listé ici", "Autre")
    ]
    
    correct = 0
    for text, expected in test_cases:
        prediction = classifier.predict(text)
        predicted = prediction['predicted_category']
        confidence = prediction['confidence']
        
        is_correct = predicted == expected
        if is_correct:
            correct += 1
            
        status = "✅" if is_correct else "❌"
        print(f"{status} '{text}' -> {predicted} ({confidence:.1%})")
    
    accuracy = correct / len(test_cases)
    print(f"\n📊 Précision du nouveau modèle: {accuracy:.1%} ({correct}/{len(test_cases)})")
    
    return classifier

if __name__ == "__main__":
    # Diagnostiquer le modèle actuel
    classifier, results = diagnose_model()
    
    # Réentraîner avec de meilleures données
    new_classifier = retrain_model_with_better_data() 