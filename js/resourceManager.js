// resourceManager.js - Version améliorée pour GitHub Pages
// Cette version utilise une variable globale ResourceManager au lieu d'export/import
// et est plus souple pour trouver les fichiers dans différentes structures de dossiers
// Créer un objet global ResourceManager
window.ResourceManager = (function() {
  
  // Constructeur
  function ResourceManagerClass() {
    this.cache = {
      metadata: null,
      quizzes: {}
    };
    
    // Détecter si nous sommes sur GitHub Pages
    this.isGitHubPages = window.location.hostname.includes('github.io');
    
    // Base path prioritaire pour GitHub Pages
    if (this.isGitHubPages) {
      this.baseDataPath = '/TYF_Bundle/';
      console.log("GitHub Pages détecté - Utilisation du chemin GitHub Pages:", this.baseDataPath);
    } else {
      // Utiliser la configuration si disponible, sinon utiliser un chemin par défaut
      this.baseDataPath = window.resourceManagerConfig?.baseDataPath || './';
      console.log("Mode local détecté - Utilisation du chemin local:", this.baseDataPath);
    }
  }
  
  // Méthodes
  ResourceManagerClass.prototype.loadMetadata = async function() {
    // Vérifier le cache d'abord
    if (this.cache.metadata) {
      console.log("Using cached metadata");
      return this.cache.metadata;
    }

    console.log("Attempting to load metadata from multiple possible locations...");

    // Liste des chemins possibles à essayer
    const pathsToTry = [];
    
    // Si nous sommes sur GitHub Pages, priorité aux chemins avec le nom du dépôt
    if (this.isGitHubPages) {
      pathsToTry.push(
        '/TYF_Bundle/metadata.json',
        '/TYF_Bundle/js/data/metadata.json',
        '/TYF_Bundle/js/metadata.json'
      );
    }
    
    // Ajouter les chemins standards (toujours essayer, même sur GitHub Pages)
    pathsToTry.push(
      './metadata.json',
      './js/data/metadata.json',
      './js/metadata.json',
      `${this.baseDataPath}metadata.json`,
      `${this.baseDataPath}js/data/metadata.json`
    );

    let metadata = null;
    let successPath = null;

    // Essayer chaque chemin jusqu'à trouver un qui fonctionne
    for (const path of pathsToTry) {
      try {
        console.log(`Attempting to load metadata from: ${path}`);
        const response = await fetch(path);
        
        if (response.ok) {
          metadata = await response.json();
          successPath = path;
          console.log(`✅ SUCCESS! Metadata loaded from: ${path}`);
          break;
        } else {
          console.log(`❌ Failed to load from ${path}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Error loading from ${path}: ${error.message}`);
      }
    }

    // SOLUTION D'URGENCE : Utiliser des données intégrées si aucun chargement n'a réussi
    if (!metadata) {
      console.error("❗ CRITICAL ERROR: Could not load metadata from any location");
      console.log("⚠️ Using embedded metadata as fallback");
      
      // Données intégrées directement dans le code
      metadata = {
        "version": "2.2.0",
        "releaseDate": "2024-04-12",
        "themes": [
          {
            "id": 1,
            "name": "I Speak Café French tests",
            "description": "Writing, Reading and Listening skills for the Café environment.",
            "icon": "fas fa-coffee",
            "quizzes": [
              { "id": 101, "name": "Writing and Reading Café", "description": "Test your writing and reading skills." },
              { "id": 102, "name": "Writing and Reading Conversation Café", "description": "Practice reading conversations." },
              { "id": 103, "name": "Listening Café", "description": "Improve your listening comprehension." },
              { "id": 104, "name": "Listening Conversation Café", "description": "Understand real conversations." },
              { "id": 105, "name": "Writing, Reading & Listening Café", "description": "Combined skills practice." }
            ]
          },
          {
            "id": 2,
            "name": "I Speak Colors French tests",
            "description": "Mastering colors in various contexts: writing, reading, listening.",
            "icon": "fas fa-palette",
            "quizzes": [
              { "id": 201, "name": "Writing and Reading Colors", "description": "Learn color vocabulary and agreement." },
              { "id": 202, "name": "Writing and Reading Conversation Colors", "description": "Using colors in dialogue." },
              { "id": 203, "name": "Listening Colors", "description": "Recognize colors by ear." },
              { "id": 204, "name": "Listening Conversation Colors", "description": "Understand colors in spoken context." },
              { "id": 205, "name": "Writing, Reading & Listening Colors", "description": "Comprehensive color practice." }
            ]
          },
          {
            "id": 3,
            "name": "I Speak Gender French tests",
            "description": "Understanding and using grammatical gender in French.",
            "icon": "fas fa-venus-mars",
             "quizzes": [
              { "id": 301, "name": "Writing and Reading Gender", "description": "Identify noun genders." },
              { "id": 302, "name": "Writing and Reading Conversation Gender", "description": "Apply gender in sentences." },
              { "id": 303, "name": "Listening Gender", "description": "Recognize gender in spoken words." },
              { "id": 304, "name": "Listening Conversation Gender", "description": "Hear gender agreement in dialogues." },
              { "id": 305, "name": "Writing, Reading & Listening Gender", "description": "Full practice on gender." }
            ]
          },
          {
            "id": 4,
            "name": "I Speak Numbers French tests",
            "description": "Practice numbers through writing, reading, and listening.",
            "icon": "fas fa-sort-numeric-down",
             "quizzes": [
              { "id": 401, "name": "Writing and Reading Numbers", "description": "Learn to write and read numbers." },
              { "id": 402, "name": "Writing and Reading Conversation Numbers", "description": "Use numbers in context." },
              { "id": 403, "name": "Listening Numbers", "description": "Understand spoken numbers." },
              { "id": 404, "name": "Listening Conversation Numbers", "description": "Follow numbers in dialogues." },
              { "id": 405, "name": "Writing, Reading & Listening Numbers", "description": "All-around number practice." }
            ]
          },
           {
            "id": 5,
            "name": "I Speak Singular and Plural French tests",
            "description": "Mastering singular and plural forms in different skills.",
            "icon": "fas fa-copy",
             "quizzes": [
              { "id": 501, "name": "Writing and Reading Singular/Plural", "description": "Identify and form plurals." },
              { "id": 502, "name": "Writing and Reading Conversation S/P", "description": "Use plurals in sentences." },
              { "id": 503, "name": "Listening Singular/Plural", "description": "Distinguish singular/plural by ear." },
              { "id": 504, "name": "Listening Conversation S/P", "description": "Hear plurals in context." },
              { "id": 505, "name": "Writing, Reading & Listening S/P", "description": "Comprehensive plural practice." }
            ]
          },
           {
            "id": 6,
            "name": "I Speak Accents French tests",
            "description": "Understanding and using French accents correctly.",
            "icon": "fas fa-italic",
             "quizzes": [
              { "id": 601, "name": "Writing and Reading Accents", "description": "Recognize and write accents." },
              { "id": 602, "name": "Writing and Reading Conversation Accents", "description": "See accents used in text." },
              { "id": 603, "name": "Listening Accents", "description": "Hear the effect of accents." },
              { "id": 604, "name": "Listening Conversation Accents", "description": "Understand accented words in speech." },
              { "id": 605, "name": "Writing, Reading & Listening Accents", "description": "Full accent practice." }
            ]
          },
           {
            "id": 7,
            "name": "I Speak ça va (breaking the ice) French tests",
            "description": "Everyday greetings and small talk to break the ice.",
            "icon": "fas fa-handshake",
             "quizzes": [
              { "id": 701, "name": "Writing and Reading Ça va", "description": "Basic greetings and responses." },
              { "id": 702, "name": "Writing and Reading Conversation Ça va", "description": "Read simple dialogues." },
              { "id": 703, "name": "Listening Ça va", "description": "Understand spoken greetings." },
              { "id": 704, "name": "Listening Conversation Ça va", "description": "Follow basic conversations." },
              { "id": 705, "name": "Writing, Reading & Listening Ça va", "description": "Practice common interactions." }
            ]
          },
           {
            "id": 8,
            "name": "I Speak Métro French tests",
            "description": "Navigating the Paris Métro: vocabulary and situations.",
            "icon": "fas fa-subway",
             "quizzes": [
              { "id": 801, "name": "Writing and Reading Métro", "description": "Understand signs and vocabulary." },
              { "id": 802, "name": "Writing and Reading Conversation Métro", "description": "Read dialogues about the metro." },
              { "id": 803, "name": "Listening Métro", "description": "Understand announcements." },
              { "id": 804, "name": "Listening Conversation Métro", "description": "Follow conversations about metro travel." },
              { "id": 805, "name": "Writing, Reading & Listening Métro", "description": "Comprehensive metro practice." }
            ]
          },
          {
            "id": 9,
            "name": "I Speak Boulangerie French tests",
            "description": "Ordering bread and pastries like a local.",
            "icon": "fas fa-bread-slice",
             "quizzes": [
              { "id": 901, "name": "Writing and Reading Boulangerie", "description": "Vocabulary for items and ordering." },
              { "id": 902, "name": "Writing and Reading Conversation Boulangerie", "description": "Read typical bakery interactions." },
              { "id": 903, "name": "Listening Boulangerie", "description": "Understand orders and requests." },
              { "id": 904, "name": "Listening Conversation Boulangerie", "description": "Follow dialogues at the bakery." },
              { "id": 905, "name": "Writing, Reading & Listening Boulangerie", "description": "Full bakery scenario practice." }
            ]
          },
          {
            "id": 10,
            "name": "General Revision",
            "description": "Mixed quizzes covering various basic topics.",
            "icon": "fas fa-random",
             "quizzes": [
              { "id": 1001, "name": "General Mix 1", "description": "Reviewing basics." },
              { "id": 1002, "name": "General Mix 2", "description": "Consolidating knowledge." },
              { "id": 1003, "name": "General Mix 3", "description": "Intermediate review." },
              { "id": 1004, "name": "General Mix 4", "description": "Further consolidation." },
              { "id": 1005, "name": "General Mix 5", "description": "Final basic review." }
            ]
          }
        ]
      };
      
      console.log("✅ Using embedded metadata fallback");
    } else {
      // Validation simple seulement si les données ont été chargées depuis un fichier
      if (!metadata || !Array.isArray(metadata.themes)) {
        console.error("❗ CRITICAL ERROR: Invalid metadata structure");
        throw new Error("Invalid metadata structure. Check metadata.json format.");
      }
    }

    this.cache.metadata = metadata;
    if (successPath) {
      console.log(`✅ Metadata successfully cached from ${successPath}`);
    } else {
      console.log("✅ Metadata successfully cached from embedded data");
    }
    return metadata;
  };

  ResourceManagerClass.prototype.getThemeQuizzes = async function(themeId) {
    try {
      const metadata = await this.loadMetadata();
      const theme = metadata.themes.find(t => t.id === Number(themeId));

      if (!theme) {
        console.error(`Theme with ID ${themeId} not found in metadata`);
        throw new Error(`Theme with ID ${themeId} not found`);
      }
      
      console.log(`Found ${theme.quizzes?.length || 0} quizzes for theme ${themeId} (${theme.name})`);
      return theme.quizzes || [];
    } catch(error) {
      console.error(`Error retrieving quizzes for theme ${themeId}:`, error);
      throw error;
    }
  };

  ResourceManagerClass.prototype.getQuiz = async function(themeId, quizId) {
    const cacheKey = `quiz_${quizId}`;

    // Vérifier le cache
    if (this.cache.quizzes[cacheKey]) {
      console.log(`Using cached quiz data for quiz ${quizId}`);
      return this.cache.quizzes[cacheKey];
    }

    console.log(`Attempting to load quiz ${quizId} for theme ${themeId}...`);

    // Liste des chemins possibles à essayer
    const pathsToTry = [];
    
    // Si nous sommes sur GitHub Pages, priorité aux chemins avec le nom du dépôt
    if (this.isGitHubPages) {
      pathsToTry.push(
        `/TYF_Bundle/js/data/themes/theme-${themeId}/quiz_${quizId}.json`,
        `/TYF_Bundle/themes/theme-${themeId}/quiz_${quizId}.json`
      );
    }
    
    // Ajouter les chemins standards (toujours essayer)
    pathsToTry.push(
      `./js/data/themes/theme-${themeId}/quiz_${quizId}.json`,
      `./themes/theme-${themeId}/quiz_${quizId}.json`,
      `${this.baseDataPath}js/data/themes/theme-${themeId}/quiz_${quizId}.json`
    );

    let quizData = null;
    let successPath = null;

    // Essayer chaque chemin
    for (const path of pathsToTry) {
      try {
        console.log(`Attempting to load quiz from: ${path}`);
        const response = await fetch(path);
        
        if (response.ok) {
          quizData = await response.json();
          successPath = path;
          console.log(`✅ SUCCESS! Quiz loaded from: ${path}`);
          break;
        } else {
          console.log(`❌ Failed to load from ${path}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Error loading from ${path}: ${error.message}`);
      }
    }

    if (!quizData) {
      console.error(`❗ CRITICAL ERROR: Could not load quiz ${quizId} from any location`);
      throw new Error(`Could not load quiz ${quizId} from any location. Check network tab for details.`);
    }

    // Validation de base
    if (!quizData || !Array.isArray(quizData.questions)) {
      console.error(`❗ Quiz ${quizId} has invalid structure: missing questions array`);
      throw new Error(`Quiz ${quizId} has invalid structure: missing questions array`);
    }
    
    // Compatibilité: les numéros d'ID peuvent ne pas correspondre exactement
    // Nous pouvons forcer la cohérence ici
    quizData.id = Number(quizId);
    
    // Ajouter themeId si absent
    if (!quizData.themeId) {
      console.log(`Adding missing themeId ${themeId} to quiz data`);
      quizData.themeId = Number(themeId);
    }

    // Mettre en cache et retourner
    this.cache.quizzes[cacheKey] = quizData;
    console.log(`✅ Quiz ${quizId} (Theme ${themeId}) successfully cached from ${successPath}`);
    return quizData;
  };

  ResourceManagerClass.prototype.preloadThemeQuizzes = async function(themeId) {
    console.log(`Preloading quizzes for theme ${themeId}...`);
    try {
      const quizzesMeta = await this.getThemeQuizzes(themeId);
      if (!quizzesMeta || quizzesMeta.length === 0) {
        console.log(`No quizzes to preload for theme ${themeId}`);
        return;
      }

      console.log(`Found ${quizzesMeta.length} quizzes to preload for theme ${themeId}`);

      // Précharger en arrière-plan
      for (const quizMeta of quizzesMeta) {
        this.getQuiz(themeId, quizMeta.id).catch(error => {
          console.warn(`[Preload] Failed to preload quiz ${quizMeta.id}: ${error.message}`);
        });
        
        // Petite pause entre les préchargements pour réduire la charge
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Preloading complete for theme ${themeId}`);
    } catch (error) {
      console.error(`Error during preloading for theme ${themeId}:`, error);
    }
  };

  ResourceManagerClass.prototype.clearCache = function(type = 'all') {
    if (type === 'all' || type === 'metadata') {
      this.cache.metadata = null;
      console.log("Metadata cache cleared");
    }
    if (type === 'all' || type === 'quizzes') {
      this.cache.quizzes = {};
      console.log("Quizzes cache cleared");
    }
  };

  // Retourner une instance unique (singleton)
  return new ResourceManagerClass();
})();

// Pour compatibilité avec la version module
var resourceManager = window.ResourceManager;