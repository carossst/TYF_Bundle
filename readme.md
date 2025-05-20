# Test Your French

Application web progressive (PWA) pour apprendre le français à travers des quiz interactifs. Cette application fonctionne également hors ligne et est compatible avec les appareils mobiles.

## Structure du projet

```
TYF_Bundle/
├── js/
│   ├── main.js
│   ├── ui.js
│   ├── storage.js
│   ├── resourceManager.js
│   ├── quizManager.js
│   └── data/
│       ├── metadata.json
│       └── themes/
│           ├── theme-1/ # Thème "Café" et ses quiz
│           │   ├── quiz_101.json
│           │   ├── quiz_102.json
│           │   ├── quiz_103.json
│           │   ├── quiz_104.json
│           │   └── quiz_105.json
│           ├── theme-2/ # Thème "Couleurs"
│           └── ...theme-10/ # Autres thèmes
├── icons/ # Icônes de l'application
├── audio/ # Fichiers audio pour les quiz d'écoute
├── style.css # Styles CSS
├── sw.js # Service Worker pour mode hors ligne
├── manifest.json # Manifeste pour fonctionnalités PWA
└── index.html # Page principale de l'application
```

## Vérification des chemins dans index.html

Assurez-vous que les scripts sont chargés dans cet ordre et avec les bons chemins :

```html
<!-- Configuration pour resourceManager -->
<script>
  window.resourceManagerConfig = {
    baseDataPath: './'
  };
</script>

<!-- Chemins corrects -->
<script src="./js/storage.js"></script>
<script src="./js/resourceManager.js"></script>
<script src="./js/quizManager.js"></script>
<script src="./js/ui.js"></script>
<script src="./js/main.js"></script>
```

## Dépannage pour GitHub Pages

Si vous déployez sur GitHub Pages et rencontrez des erreurs de chargement des fichiers JSON, essayez ces solutions :

1. **Vérifiez que le fichier metadata.json existe** à l'emplacement exact `js/data/metadata.json`

2. **Vérifiez les chemins dans sw.js** pour s'assurer qu'ils correspondent à la structure réelle

3. **Effacez le cache du navigateur** avec Ctrl+F5 ou Cmd+Shift+R

4. **Créez une copie de metadata.json à la racine** du projet (même niveau que index.html)

5. **Examinez la console du navigateur** pour voir les chemins tentés lors du chargement

6. **Créez un nouveau commit** pour déclencher une reconstruction sur GitHub Pages :
   ```bash
   git commit --allow-empty -m "Trigger rebuild for GitHub Pages"
   git push
   ```

7. **Assurez-vous que votre CSP (Content Security Policy)** autorise l'exécution de scripts depuis les sources attendues

8. **Pour débogage avancé**, modifiez resourceManager.js pour qu'il imprime tous les chemins tentés dans la console

## Fonctionnalités

- 10 thèmes français : Café, Couleurs, Genre grammatical, Nombres, Singulier/Pluriel, Accents, Ça va, Métro, Boulangerie, et révision générale
- 5 types de quiz par thème : Écriture, Lecture, Conversation, Écoute, et Mixte
- Progression enregistrée : Suivi de vos résultats et statistiques
- Badges et récompenses : Système de gamification pour motiver l'apprentissage
- Design responsive : Compatible avec mobile, tablette et ordinateur
- Mode hors ligne : Utilisation possible sans connexion internet
- Installation possible : Peut être installée comme une application sur appareils mobiles

## Niveaux

L'application évalue votre niveau de français selon l'échelle suivante :
- A2 : 80-100% de réponses correctes
- A1+ : 60-79% de réponses correctes
- A1 : 40-59% de réponses correctes
- Pré-A1 : 20-39% de réponses correctes
- Débutant : 0-19% de réponses correctes

## Solution temporaire pour les problèmes de chargement

Si l'application ne parvient pas à charger le fichier metadata.json, vous pouvez intégrer temporairement les données directement dans le code. Modifiez resourceManager.js ainsi :

```javascript
// Dans loadMetadata(), ajoutez ce code à la fin
if (!metadata) {
  console.log("Utilisation des données intégrées en dernier recours");
  // Intégrer le contenu de metadata.json directement
  metadata = {
    "version": "2.2.0",
    "releaseDate": "2024-04-12",
    "themes": [
      // Copiez ici tout le contenu de votre fichier metadata.json
    ]
  };
  this.cache.metadata = metadata;
}
return this.cache.metadata;
```

## Fichiers audio

Les fichiers audio suivent cette convention :
```
TYF_[ThemeName]_[QuizNumber]_[QuestionNumber].mp3
```

Exemple :
```
TYF_Cafe_3_2.mp3 → Theme: Cafe, Quiz 3 (Listening), Question 2
```

Note : Pour le thème "Numbers", le préfixe est `TYI_` au lieu de `TYF_`

## Personnalisation

- **Ajout de nouveaux quiz** : Créez des fichiers quiz_XXX.json dans le d