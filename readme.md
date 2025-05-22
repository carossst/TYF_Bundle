# Test Your French – Architecture et Structure

## 🎯 Objectif
Application web progressive (PWA) pour apprendre le français à travers des quiz interactifs (lecture, écoute, grammaire…).

## 🗂️ Structure actuelle des thèmes

L'application utilise 10 thèmes, chacun contenant 5 quiz de 10 questions. Les thèmes sont structurés comme suit :

| Thème affiché              | ID du Thème | IDs des Quiz | Clé de Thème (`<themeKey>`) |
|----------------------------|-------------|--------------|-----------------------------|
| I Speak Colors             | 1           | 101–105      | `colors`                    |
| I Speak Numbers            | 2           | 201–205      | `numbers`                   |
| I Speak Gender             | 3           | 301–305      | `gender`                    |
| I Speak Singular & Plural | 4           | 401–405      | `singular_plural`           |
| I Speak Present Tense     | 5           | 501–505      | `present_tense`             |
| I Speak Accents            | 6           | 601–605      | `accents`                   |
| I Speak Ça Va              | 7           | 701–705      | `ca_va`                     |
| I Speak Métro              | 8           | 801–805      | `metro`                     |
| I Speak Boulangerie        | 9           | 901–905      | `boulangerie`               |
| I Speak Café               | 10          | 1001–1005    | `cafe`                      |

## 📁 Structure des fichiers

### **Nommage des fichiers quiz**
Les fichiers de quiz JSON suivent le format : `<themeKey>_quiz_<quizId>.json`

**Exemples :**
- Quiz 1 du thème Colors (ID 101) : `colors_quiz_101.json`
- Quiz 3 du thème Numbers (ID 203) : `numbers_quiz_203.json`
- Quiz 5 du thème Gender (ID 305) : `gender_quiz_305.json`

### **Arborescence des fichiers**

```
TYF_Bundle/ (racine GitHub Pages)
├── js/
│   ├── main.js                    # Point d'entrée principal
│   ├── ui.js                      # Interface utilisateur
│   ├── quizManager.js             # Gestion des quiz et questions
│   ├── resourceManager.js         # Chargement des ressources
│   ├── storage.js                 # Gestion du stockage local
│   └── data/
│       ├── metadata.json          # Index des thèmes et quiz
│       └── themes/
│           ├── theme-1/           # Thème "I Speak Colors"
│           │   ├── colors_quiz_101.json
│           │   ├── colors_quiz_102.json
│           │   ├── colors_quiz_103.json
│           │   ├── colors_quiz_104.json
│           │   ├── colors_quiz_105.json
│           │   └── audio/         # Fichiers audio (optionnel)
│           ├── theme-2/           # Thème "I Speak Numbers"
│           │   ├── numbers_quiz_201.json
│           │   ├── numbers_quiz_202.json
│           │   └── ...
│           ├── theme-3/           # Thème "I Speak Gender"
│           └── ...                # themes-4 à theme-10
├── icons/                         # Icônes de l'application PWA
├── audio/                         # Fichiers audio globaux
├── style.css                      # Styles CSS
├── sw.js                          # Service Worker pour mode hors ligne
├── manifest.json                  # Manifeste PWA
└── index.html                     # Page principale

```

## 📄 Structure d'un fichier quiz

Chaque fichier quiz contient :

```json
{
  "id": 101,
  "themeId": 1,
  "name": "Writing and Reading Colors – Quiz 1",
  "description": "Practice Colors vocabulary and grammar...",
  "version": "2.2.5",
  "questions": [
    {
      "question": "How do you say \"Red\"?",
      "options": ["A. Rose", "B. Rouge", "C. Led", "D. Bordeaux"],
      "correctAnswer": "B. Rouge",
      "explanation": "Red is one of the three colors on the French flag..."
    }
    // ... 9 autres questions
  ]
}
```

## 🔧 Configuration technique

### **Environnements supportés**
- **GitHub Pages** : `https://carossst.github.io/TYF_Bundle/`
- **Développement local** : `localhost` ou `127.0.0.1`

### **Chemins de ressources**
- **GitHub Pages** : `/TYF_Bundle/js/data/`
- **Local** : `./js/data/`

### **Service Worker**
- Cache les assets statiques (HTML, CSS, JS)
- Mode Network-First pour les fichiers JSON
- Mise à jour automatique avec notification utilisateur

### **Progressive Web App (PWA)**
- Installation possible sur mobile/desktop
- Mode hors ligne partiel
- Icônes et raccourcis configurés

## 🎵 Fichiers audio

Les fichiers audio suivent cette convention de nommage :
```
TYF_[ThemeName]_[QuizNumber]_[QuestionNumber].mp3
```

**Exemples :**
- `TYF_colors_3_2.mp3` → Thème Colors, Quiz 3, Question 2
- `TYF_cafe_1_5.mp3` → Thème Café, Quiz 1, Question 5

**Note spéciale :** Pour le thème Numbers, le préfixe est `TYI_` au lieu de `TYF_`.

## 📊 Fichier metadata.json

Le fichier `js/data/metadata.json` contient la structure complète des thèmes et quiz :

```json
{
  "version": "2.2.5",
  "releaseDate": "2025-05-22",
  "themes": [
    {
      "id": 1,
      "name": "I Speak Colors",
      "description": "Practice French color vocabulary...",
      "icon": "fas fa-palette",
      "quizzes": [
        { "id": 101, "name": "Writing and Reading Color Test 1" },
        { "id": 102, "name": "Listening Color Test 2" }
        // ... autres quiz
      ]
    }
    // ... autres thèmes
  ]
}
```

## 🚀 Déploiement GitHub Pages

### **Configuration actuelle**
- **Repository** : `carossst/TYF_Bundle`
- **URL** : `https://carossst.github.io/TYF_Bundle/`
- **Branche** : `main`
- **Dossier source** : `/` (root)

### **Points critiques pour GitHub Pages**
- ✅ Tous les chemins relatifs commencent par `./`
- ✅ Service Worker configuré pour `/TYF_Bundle/`
- ✅ ResourceManager détecte automatiquement l'environnement
- ✅ Manifest.json configuré pour PWA

## 🧪 Tests et maintenance

### **Script de validation**
Un script Python (`audit_quiz_json.py`) est disponible pour vérifier l'intégrité des fichiers JSON.

### **Diagnostic intégré**
Le ResourceManager inclut une fonction de diagnostic accessible en mode développement :
```javascript
ResourceManager.diagnose(); // Console du navigateur
```

### **Vérifications recommandées**
- [ ] Tous les fichiers quiz sont accessibles
- [ ] Metadata.json est cohérent avec les fichiers existants
- [ ] Service Worker fonctionne correctement
- [ ] PWA installable sur mobile

## 🔄 Gestion des versions

- **Version actuelle** : 2.2.5
- **Service Worker** : Mise à jour automatique avec notification
- **Cache** : Invalidation automatique lors des nouvelles versions

## 📈 Fonctionnalités

### **Quiz interactifs**
- 10 questions par quiz
- Feedback immédiat avec explications
- Chronométrage optionnel
- Navigation libre entre questions

### **Progression et statistiques**
- Sauvegarde automatique en localStorage
- Statistiques globales par thème
- Historique des scores
- Système de badges

### **Interface adaptive**
- Responsive design (mobile/desktop)
- Support tactile et clavier
- Mode sombre automatique selon préférences système

---

© 2025 Test Your French - Application développée pour l'apprentissage du français