# Test Your French

Application web progressive (PWA) pour apprendre le français à travers des quiz interactifs. Cette application fonctionne également hors ligne et est compatible avec les appareils mobiles.

## 📁 Structure du projet

```
TYF_Bundle/
├── js/
│   └── data/
│       └── themes/
│           ├── theme-1/           # Thème "Café" et ses quiz
│           │   ├── quiz_101.json
│           │   ├── quiz_102.json
│           │   ├── quiz_103.json
│           │   ├── quiz_104.json
│           │   └── quiz_105.json
│           ├── theme-2/           # Thème "Couleurs"
│           ├── theme-3/           # Thème "Genre grammatical"
│           └── ...theme-10/       # Autres thèmes
│       ├── metadata.json          # Index des thèmes et quiz
│       ├── ui.js                  # Interface utilisateur
│       ├── storage.js             # Gestion du stockage local
│       ├── resourceManager.js     # Chargement des ressources
│       ├── quizManager.js         # Gestion des quiz et questions
│       └── main.js                # Point d'entrée principal
├── icons/                         # Icônes de l'application
├── audio/                         # Fichiers audio pour les quiz d'écoute
├── style.css                      # Styles CSS
├── sw.js                          # Service Worker pour mode hors ligne
├── manifest.json                  # Manifeste pour fonctionnalités PWA
└── index.html                     # Page principale de l'application
```

## 🚀 Installation et lancement

1. **Vérification des chemins dans index.html**
   Assurez-vous que les scripts sont chargés dans cet ordre et avec les bons chemins :
   ```html
   <!-- Exemple avec les bons chemins -->
   <script src="./js/data/resourceManager.js"></script>
   <script src="./js/data/storage.js"></script>
   <script src="./js/data/quizManager.js"></script>
   <script src="./js/data/ui.js"></script>
   <script src="./js/data/main.js"></script>
   ```

2. **Mode non-module**
   - Vérifiez que les balises script n'ont PAS l'attribut `type="module"`
   - Les scripts utilisent désormais une approche non-module avec variables globales

3. **Lancement**
   - Ouvrez simplement `index.html` dans votre navigateur 
   - Ou utilisez un serveur local comme Live Server de VS Code

## 📱 Caractéristiques

- **10 thèmes français** : Café, Couleurs, Genre grammatical, Nombres, Singulier/Pluriel, Accents, Ça va, Métro, Boulangerie, et révision générale
- **5 types de quiz par thème** : Écriture, Lecture, Conversation, Écoute, et Mixte
- **Progression enregistrée** : Suivi de vos résultats et statistiques
- **Badges et récompenses** : Système de gamification pour motiver l'apprentissage
- **Design responsive** : Compatible avec mobile, tablette et ordinateur
- **Mode hors ligne** : Utilisation possible sans connexion internet
- **Installation possible** : Peut être installée comme une application sur appareils mobiles

## 🧠 Évaluation du niveau

L'application évalue votre niveau de français selon l'échelle suivante :
- **A2** : 80-100% de réponses correctes
- **A1+** : 60-79% de réponses correctes
- **A1** : 40-59% de réponses correctes
- **Pré-A1** : 20-39% de réponses correctes
- **Débutant** : 0-19% de réponses correctes

## 🔊 Convention de nommage des fichiers audio

Les fichiers audio suivent cette convention :
```
TYF_[ThemeName]_[QuizNumber]_[QuestionNumber].mp3
```

Exemple :
```
TYF_Cafe_3_2.mp3  → Theme: Cafe, Quiz 3 (Listening), Question 2
```

> Note : Pour le thème "Numbers", le préfixe est `TYI_` au lieu de `TYF_`

## 🔧 Développement

- **Ajout de nouveaux quiz** : Créez des fichiers quiz_XXX.json dans le dossier du thème approprié et référencez-les dans metadata.json
- **Modification du comportement** : Modifiez les fichiers JavaScript dans le dossier `js/data/`
- **Reset des données** : Effacez le localStorage du navigateur pour réinitialiser la progression
- **Tests** : Utilisez quiz-test.js pour tester les fonctionnalités critiques

## 🌐 Déploiement sur GitHub Pages

Pour déployer correctement l'application sur GitHub Pages, assurez-vous que :

1. Tous les chemins relatifs dans le code commencent par `./` (et non par `/`)
2. Les fichiers JSON de quiz sont recherchés dans plusieurs emplacements possibles, notamment `./js/data/themes/theme-X/quiz_Y.json`
3. Le fichier metadata.json est accessible à la fois dans `./js/data/themes/metadata.json` et via d'autres chemins alternatifs
4. Le service worker (sw.js) a été mis à jour pour refléter la structure de dossiers correcte
5. Que l'application utilise l'approche non-module pour éviter les problèmes d'importation sur GitHub Pages

---

© 2025 Test Your French