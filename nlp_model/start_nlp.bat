@echo off
echo ========================================
echo   Systeme NLP - Asten Tickets
echo ========================================
echo.

echo Installation des dependances...
pip install -r requirements.txt

echo.
echo Demarrage du systeme NLP...
echo Mode: Complet (API + Planificateur)
echo Port: 8000
echo.

python run.py --mode full

pause