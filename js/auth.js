        // Gestion de l'affichage/masquage du mot de passe
        document.getElementById('passwordToggle').addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });

        // Fonction pour afficher les erreurs
        function showError(message) {
            const errorMessage = document.getElementById('errorMessage');
            const errorText = document.getElementById('errorText');
            errorText.textContent = message;
            errorMessage.style.display = 'flex';
            
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }

        // Fonction pour afficher le loading
        function showLoading(show) {
            const button = document.getElementById('loginButton');
            const buttonText = button.querySelector('.button-text');
            const loading = document.getElementById('loading');
            
            if (show) {
                buttonText.style.display = 'none';
                loading.style.display = 'flex';
                button.disabled = true;
            } else {
                buttonText.style.display = 'block';
                loading.style.display = 'none';
                button.disabled = false;
            }
        }

        // Configuration d'authentification sécurisée
        const AUTH_CONFIG = {
            adminEmail: process.env.ADMIN_EMAIL || 'admin@asten.com',
            adminPassword: process.env.ADMIN_PASSWORD || 'CHANGEZ_CE_MOT_DE_PASSE',
            demoEmail: 'demo@asten.com',
            demoPassword: 'CHANGEZ_CE_MOT_DE_PASSE_DEMO'
        };

        // Gestion de la connexion
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Validation basique
            if (!email || !password) {
                showError('Veuillez remplir tous les champs');
                return;
            }
            
            if (!email.includes('@')) {
                showError('Veuillez entrer une adresse email valide');
                return;
            }
            
            // Simulation de connexion
            showLoading(true);
            
            setTimeout(() => {
                // Simulation d'authentification sécurisée
                if (email === AUTH_CONFIG.adminEmail && password === AUTH_CONFIG.adminPassword) {
                    // Stockage des données utilisateur
                    const userData = {
                        email: email,
                        name: 'Administrateur',
                        role: 'admin',
                        loginTime: new Date().toISOString()
                    };
                    
                    // Stockage en mémoire (simulation)
                    window.currentUser = userData;
                    
                    // Redirection vers le dashboard
                    window.location.href = 'admin-dashboard.html';
                } else {
                    showLoading(false);
                    showError('Email ou mot de passe incorrect');
                }
            }, 2000);
        });

        // Accès démonstration
        document.getElementById('demoButton').addEventListener('click', function() {
            // Données utilisateur démo
            const demoUser = {
                email: AUTH_CONFIG.demoEmail,
                name: 'Utilisateur Démo',
                role: 'user',
                loginTime: new Date().toISOString()
            };
            
            window.currentUser = demoUser;
            window.location.href = 'dashboard.html';
        });

        // Animation d'entrée pour les éléments
        window.addEventListener('load', function() {
            const elements = document.querySelectorAll('.form-group, .login-button, .demo-access');
            elements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    el.style.transition = 'all 0.6s ease';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, index * 100);
            });
        });

        // Préremplir les champs pour la démo (sécurisé)
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('demo') === 'true') {
                document.getElementById('email').value = AUTH_CONFIG.adminEmail;
                document.getElementById('password').value = ''; // Ne pas préremplir le mot de passe
            }
        });
    