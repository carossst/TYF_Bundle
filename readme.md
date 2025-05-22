# Test Your French – Contenu et Structure

## 🎯 Objectif
Application web pour s'entraîner au français à travers des quiz interactifs (lecture, écoute, grammaire…).

## 🗂️ Structure actuelle des thèmes

L'application utilise 10 thèmes, chacun contenant 5 quiz de 10 questions. Les thèmes sont structurés comme suit :

| Thème affiché              | ID du Thème | IDs des Quiz | Clé de Thème (`<ThemeKey>`) |
|----------------------------|-------------|--------------|-----------------------------|
| I Speak Colors             | 1           | 101–105      | `Colors`                    |
| I Speak Numbers            | 2           | 201–205      | `Numbers`                   |
| I Speak Gender             | 3           | 301–305      | `Gender`                    |
| I Speak Singular & Plural | 4           | 401–405      | `Singular_Plural`           |
| I Speak Present Tense     | 5           | 501–505      | `Present_tense`             |
| I Speak Accents            | 6           | 601–605      | `Accents`                   |
| I Speak Ça Va              | 7           | 701–705      | `Ca_va`                     |
| I Speak Métro              | 8           | 801–805      | `Metro`                     |
| I Speak Boulangerie        | 9           | 901–905      | `Boulangerie`               |
| I Speak Café               | 10          | 1001–1005    | `Cafe`                      |

Les fichiers de quiz JSON suivent le format de nommage : `<ThemeKey>_quiz_<quizId>.json`. Par exemple, pour le Quiz 1 du thème "I Speak Colors" (ID 101), le nom du fichier est `Colors_quiz_101.json`.

Les fichiers sont censés être stockés dans une structure de dossier comme `js/data/themes/theme-<themeId>/`, ce qui semble être une incohérence avec le nom de fichier généré. Il est possible que le `resourceManager.js` doive être ajusté pour chercher les fichiers en utilisant le `<ThemeKey>` dans le chemin, ou que le chemin dans `resourceManager.js` doive simplement pointer vers l'emplacement réel des fichiers générés tels quels.

## 📁 Fichier metadata.json

Le fichier `js/data/metadata.json` contient la structure des thèmes et des quiz. Il liste les 10 thèmes valides avec leurs IDs (1-10), noms, descriptions et les IDs des quiz associés (XXX-YYY).

## 🧪 Audit et maintenance

Un script Python (`audit_quiz_json.py`) est disponible pour vérifier l'intégrité des fichiers JSON générés.

## 📌 À venir

- Refonte visuelle (`style.css`, `index.html`) pour correspondre à la maquette
- Ajout de quiz plus riches avec sons + multi-niveaux
- Mode "Parcours" ou "Compétences"