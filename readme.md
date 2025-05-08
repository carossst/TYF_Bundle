# Test Your French - Quiz Bundle

This repository contains the full bundle for the **Test Your French** quiz web application, including:
- All 10 themes with structured quizzes (Writing, Conversation, Listening)
- Associated audio files for listening quizzes
- Frontend code and manifest for deployment

## 📁 Directory Structure

```
├── audio/                     # Audio files per theme
│   ├── Accents/
│   ├── Boulangerie/
│   ├── Ca_va/
│   ├── Cafe/
│   ├── Colors/
│   ├── Gender/
│   ├── Metro/
│   ├── Numbers/
│   ├── Present_Tense/
│   └── Singular_Plural/
│
├── js/                        # JavaScript logic
│   ├── data/
│   │   ├── themes/
│   │   │   ├── theme-1/       # Theme 1 = Cafe
│   │   │   ├── theme-2/
│   │   │   └── ... theme-10/
│   │   └── metadata.json      # Main index of all themes and quizzes
│   ├── main.js
│   ├── quizManager.js
│   ├── quiz-test.js
│   ├── resourceManager.js
│   ├── storage.js
│   ├── theme.js
│   └── ui.js
│
├── index.html                 # Main app page
├── manifest.json              # Web app manifest
├── style.css                  # Stylesheet
├── sw.js                      # Service worker
└── readme.md                  # You are here!
```

## 🔊 Audio File Naming Convention

Each audio file follows this pattern:
```
TYF_[ThemeName]_[QuizNumber]_[QuestionNumber].mp3
```

Example:
```
TYF_Cafe_3_2.mp3  → Theme: Cafe, Quiz 3 (Listening), Question 2
```

> 🔁 For Numbers, the prefix is `TYI_` instead of `TYF_` (e.g., `TYI_Numbers_3_2.mp3`)

## ✅ Compatibility Checklist

- `themeId` in each quiz file matches the folder in `js/data/themes/theme-X`
- `audio` fields in questions point to properly named `.mp3` files in `/audio/[Theme]/`
- All JSON files are UTF-8 and match the expected schema
- The app is PWA-ready (manifest and service worker configured)

---

_Last updated: 2025-05-08_
