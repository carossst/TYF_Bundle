# Test Your French – Contenu et Structure

## 🎯 Objectif
Application web pour s’entraîner au français à travers des quiz interactifs (lecture, écoute, grammaire…).

## 🗂️ Structure actuelle des thèmes

| Thème affiché              | Quiz réellement utilisés     | Origine du contenu |
|----------------------------|-------------------------------|--------------------|
| I Speak Colors             | quiz_201–205                 | inchangé           |
| I Speak Numbers            | quiz_301–305                 | ancien "Gender"   |
| I Speak Gender             | quiz_401–405                 | ancien "Numbers"  |
| I Speak Singular & Plural | quiz_501–505                 | inchangé           |
| I Speak Present Tense     | quiz_601–605                 | ancien "Accents"  |
| I Speak Accents            | quiz_701–705                 | ancien "Ça va"     |
| I Speak Ça Va              | quiz_801–805                 | ancien "Métro"     |
| I Speak Métro              | quiz_1001–1005               | ancien "Révision" |
| ❌ I Speak Café            | quiz_101–105                 | **exclu**          |

## 🧼 Logique appliquée

- Les noms de thèmes ont été réalignés avec leur contenu réel (voir tableau ci-dessus).
- Le thème 1 (Café) est masqué car ses quiz sont incomplets.
- Chaque quiz contient maintenant un `name` et une `description`, extraits directement des fichiers `quiz_XXX.json`.

## 📁 Fichier metadata.json

Le fichier `js/data/metadata.json` contient :

- La liste des 9 thèmes valides
- Pour chaque thème :
  - `id`
  - `name`
  - `description`
  - `icon` (font-awesome)
  - Liste des `quizzes` avec :
    - `id`
    - `name`
    - `description`

## 🧪 Audit et maintenance

Un script Python (`audit_quiz_json.py`) est disponible pour :

- Vérifier que tous les quiz contiennent :
  - une question valide
  - au moins 2 options
  - une bonne réponse
- Identifier les quiz incomplets à exclure du `metadata.json`

## 📌 À venir

- Refonte visuelle (`style.css`, `index.html`) pour correspondre à la maquette
- Ajout de quiz plus riches avec sons + multi-niveaux
- Mode “Parcours” ou “Compétences”
