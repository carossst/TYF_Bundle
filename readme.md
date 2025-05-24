# 🎯 Test Your French - Évaluation des Compétences Françaises

**Test Your French** est une Progressive Web App (PWA) moderne pour **évaluer et tester vos compétences en français contemporain**. L'application propose 10 thèmes essentiels avec plus de 50 quiz couvrant le **savoir-vivre quotidien**, la **culture contemporaine** et les **situations de la vie de tous les jours**, avec support audio pour tester votre compréhension orale authentique.

## 📋 Table des Matières

- [À Propos du Projet](#-à-propos-du-projet)
- [Technologies Utilisées](#-technologies-utilisées)
- [Configuration Requise](#-configuration-requise)
- [Installation](#installation)
- [Lancement de l'Application](#-lancement-de-lapplication)
- [Structure du Projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Gestion des Fichiers Audio](#-gestion-des-fichiers-audio)
- [Déploiement](#-déploiement)
- [Dépannage](#-dépannage)
- [Responsive Design](#responsive-design)
- [Accessibilité](#accessibilité)
- [Contribution](#contribution)

## 🎓 À Propos du Projet

**Test Your French** est une application web progressive (PWA) dédiée à **l'évaluation des compétences en français contemporain**. Elle s'adresse aux apprenants et francophones souhaitant **tester leur maîtrise du français de tous les jours** avec une approche multimodale combinant :

- **Tests de compétences** avec questions écrites et audio authentiques
- **10 thèmes du quotidien** couvrant les situations réelles (couleurs, nombres, café, boulangerie, métro...)
- **Évaluation du niveau** avec feedback détaillé et progression
- **Audio authentique** pour tester la compréhension orale en situation
- **Interface responsive** optimisée mobile et desktop
- **Mode hors ligne** via Service Worker

### Objectif Principal
**Évaluer vos compétences réelles en français contemporain** à travers des situations authentiques du quotidien, du savoir-vivre et de la culture française actuelle - pas seulement la grammaire théorique !

### Approche Pédagogique
- **Situations authentiques** : conversations réelles en boulangerie, café, métro
- **Culture contemporaine** : expressions actuelles, savoir-vivre moderne
- **Compétences pratiques** : ce dont vous avez vraiment besoin au quotidien
- **Évaluation holistique** : compréhension écrite, orale et culturelle

## 🛠 Technologies Utilisées

### Frontend Core
- **HTML5** - Structure sémantique moderne avec PWA manifest
- **CSS3** - Styles avancés (Grid, Flexbox, animations, mode sombre)
- **JavaScript ES6+ (Vanilla)** - Logique applicative sans framework
- **Font Awesome 6.4.0** - Bibliothèque d'icônes

### APIs Web Modernes
- **Web Audio API** - Gestion des fichiers audio MP3
- **localStorage API** - Persistance des données de progression
- **Fetch API** - Chargement des données JSON
- **Service Worker API** - Cache et fonctionnement hors ligne
- **Web App Manifest** - Installation PWA

### Architecture
- **Modular JavaScript** - Classes séparées (ResourceManager, QuizManager, Storage, UI)
- **Event-driven** - Communication entre modules via événements
- **Progressive Enhancement** - Fonctionnement dégradé gracieux

## ⚙️ Configuration Requise

### Prérequis Système
- **Navigateur web moderne** (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- **Serveur web local** pour le développement (requis pour les fichiers audio)
- **Connexion Internet** pour le chargement initial (optionnelle après cache)

### Prérequis pour le Développement
- **Node.js 14+** ou **Python 3.x** ou **PHP 7+** (pour serveur local)
- **Git** pour le clonage du repository
- **Éditeur de code** (VS Code, Sublime Text, etc.)

### Compatibilité Navigateurs
- ✅ **Chrome/Chromium 80+** (Support complet PWA + audio)
- ✅ **Firefox 75+** (Support complet)
- ✅ **Safari 13+** (Support PWA limité)
- ✅ **Edge 80+** (Support complet)
- ❌ **Internet Explorer** (Non supporté)

### Espace Disque
- **Application** : ~2 MB (code + assets)
- **Fichiers audio** : ~50-100 MB (selon le nombre de thèmes)
- **Cache navigateur** : ~10-20 MB (données utilisateur)

## 🚀 Installation

### Installation Simple (Recommandée)

1. **Cloner le repository**
   ```bash
   git clone https://github.com/carossst/TYF_Bundle.git
   cd TYF_Bundle
   ```

2. **Aucune installation de dépendances requise** 
   *(L'application utilise du JavaScript vanilla et des CDN)*

3. **Vérifier la structure des fichiers**
   ```bash
   ls -la
   # Vous devriez voir : index.html, style.css, js/, audio/, icons/
   ```

### Installation pour GitHub Pages

1. **Fork le repository** sur GitHub
2. **Activer GitHub Pages** dans Settings → Pages
3. **Sélectionner** : Source = "Deploy from branch main"
4. **Attendre** 2-5 minutes pour la propagation
5. **Accéder** à : `https://votre-username.github.io/TYF_Bundle/`

## 🎯 Lancement de l'Application

### Développement Local

**Option 1 : Python (Recommandé)**
```bash
# Python 3
python -m http.server 8000

# Puis ouvrir : http://localhost:8000
```

**Option 2 : Node.js**
```bash
# Installer http-server globalement (une seule fois)
npm install -g http-server

# Lancer le serveur
http-server

# Puis ouvrir : http://localhost:8080
```

**Option 3 : PHP**
```bash
php -S localhost:8000

# Puis ouvrir : http://localhost:8000
```

### Après le Lancement

1. **Le serveur démarre** sur l'URL indiquée (ex: http://localhost:8000)
2. **Ouvrir l'URL** dans votre navigateur
3. **Vous devriez voir** :
   - Page d'accueil avec logo "Test Your French"
   - 10 thèmes de quiz disponibles
   - Stats dashboard avec progression (vide au début)
   - Interface responsive

4. **📱 Installation PWA possible** :
   - Bouton "Installer l'app" dans le navigateur
   - Icône sur l'écran d'accueil comme une vraie app
   - **Toutes vos données restent sauvegardées** même après installation

### Persistance des Données - Information Importante ✨

**🎯 VOS RÉSULTATS SONT CONSERVÉS DÉFINITIVEMENT :**

- ✅ **Première utilisation** : Statistiques à zéro, commencez vos tests
- ✅ **Retours suivants** : Retrouvez TOUTE votre progression
  - Dashboard personnalisé avec vos scores
  - Quiz terminés marqués avec badge ✅
  - Historique complet de vos 10 derniers tests
  - Collection de badges conservée
  - Possibilité de refaire les tests pour améliorer

**💾 Stockage Local Sécurisé :**
- **localStorage du navigateur** (aucun serveur requis)
- **Aucun compte** à créer - tout reste sur votre appareil
- **Données conservées** même hors ligne
- **Installation PWA** possible pour usage comme vraie application

**⚠️ Données perdues UNIQUEMENT si :**
- Vous videz manuellement le cache du navigateur
- Vous désinstallez complètement le navigateur
- Vous effectuez un "Reset" volontaire des données

### Vérification du Fonctionnement

**Test Rapide :**
1. ✅ La page se charge sans erreur
2. ✅ Les 10 thèmes s'affichent
3. ✅ Cliquer sur un thème → Liste des quiz
4. ✅ Lancer un quiz → Questions s'affichent
5. ✅ Audio fonctionne (si fichiers présents)

**Console Navigateur (F12) :**
```javascript
// Vérifier que les modules sont chargés
console.log(window.ResourceManager); // Doit afficher un objet
console.log(window.storage);         // Doit afficher un objet
```

## 📁 Structure du Projet

```
TYF_Bundle/
├── index.html                 # Interface utilisateur principale
├── style.css                  # Styles complets (responsive + mode sombre)
├── manifest.json              # Manifest PWA
├── sw.js                      # Service Worker pour cache et mode hors ligne
├── README.md                  # Documentation du projet
│
├── js/                        # Modules JavaScript
│   ├── main.js               # Point d'entrée et orchestration
│   ├── ui.js                 # Interface utilisateur et interactions
│   ├── quizManager.js        # Logique des quiz et questions
│   ├── resourceManager.js    # Gestion des ressources et API
│   ├── storage.js            # Stockage local et progression
│   └── data/                 # Données des quiz
│       ├── metadata.json     # Index des thèmes et quiz
│       └── themes/           # Données par thème
│           ├── theme-1/      # Thème 1: Colors
│           │   ├── colors_quiz_101.json
│           │   ├── colors_quiz_102.json
│           │   └── ...
│           ├── theme-2/      # Thème 2: Numbers
│           │   ├── numbers_quiz_201.json
│           │   └── ...
│           └── ...           # Thèmes 3-10
│
├── audio/                     # Fichiers audio pour les questions
│   ├── Colors/               # Audio thème 1 (Couleurs)
│   │   ├── TYF_Colors_5_2.mp3
│   │   ├── TYF_Colors_5_4.mp3
│   │   └── ...
│   ├── Ca_va/                # Audio thème 7 (Salutations)
│   │   ├── TYF_Ca va_3_1.mp3
│   │   └── ...
│   ├── Numbers/              # Audio thème 2 (Nombres)
│   ├── Gender/               # Audio thème 3 (Genre)
│   ├── Singular_Plural/      # Audio thème 4 (Singulier/Pluriel)
│   ├── Present_Tense/        # Audio thème 5 (Présent)
│   ├── Accents/              # Audio thème 6 (Accents)
│   ├── Metro/                # Audio thème 8 (Métro)
│   ├── Boulangerie/          # Audio thème 9 (Boulangerie)
│   └── Cafe/                 # Audio thème 10 (Café)
│
├── icons/                     # Icônes PWA et favicon
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── ...                   # Autres tailles d'icônes
│
└── docs/                      # Documentation supplémentaire (optionnel)
    ├── compatibility_check.js # Script de diagnostic
    └── github_deployment_guide.txt
```