# 🚀 Installation Rapide - Système NLP Asten Tickets

## ⚡ Démarrage en 5 minutes



### 3. Installation automatique (Windows)
```bash
# Double-cliquez sur le fichier
start_nlp.bat
```

### 4. Installation manuelle
```bash
# Installer les dépendances
pip install -r requirements.txt

# Initialiser le modèle
python run.py --mode init

# Démarrer le système complet
python run.py --mode full
```

### 5. Test du système
```bash
# Dans un nouveau terminal
python test_system.py
```

## 🔧 Configuration

### Variables d'environnement
Créez un fichier `.env` basé sur `env_example.txt` :

```env
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
FIREBASE_PROJECT_ID=votre-projet-id
API_HOST=0.0.0.0
API_PORT=8000
```

### Intégration Frontend
Le fichier `js/user.js` a été modifié pour utiliser l'API NLP. Assurez-vous que :
- L'API est accessible sur `http://localhost:8000`
- Les CORS sont configurés correctement

## 📊 Vérification

### Endpoints de test
- **Santé** : `http://localhost:8000/health`
- **Prédiction** : `POST http://localhost:8000/predict`
- **Catégories** : `GET http://localhost:8000/categories`

### Interface Swagger
- **Documentation API** : `http://localhost:8000/docs`

## 🚨 Dépannage rapide

### Erreur "Module not found"
```bash
pip install -r requirements.txt
```

### Erreur Firebase
- Vérifiez que `firebase-credentials.json` est présent
- Vérifiez que Firestore est activé

### API inaccessible
- Vérifiez que le port 8000 est libre
- Changez le port dans `.env` si nécessaire

### Modèle non initialisé
```bash
python run.py --mode init
```

## 📈 Prochaines étapes

1. **Ajouter des données d'entraînement** : Créez des tickets dans Firebase
2. **Ajuster les catégories** : Modifiez `config.py`
3. **Optimiser le modèle** : Ajustez les paramètres selon vos besoins
4. **Monitoring** : Surveillez les logs dans `nlp_system.log`

## 🆘 Support

- **Logs** : `nlp_system.log`
- **Documentation complète** : `README.md`
- **Tests** : `test_system.py`

---

**🎉 Votre système NLP est prêt !** 