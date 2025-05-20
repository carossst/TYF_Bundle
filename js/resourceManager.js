// resourceManager.js - Version non-module pour éviter les problèmes d'importation
// Cette version utilise une variable globale ResourceManager au lieu d'export/import

// Créer un objet global ResourceManager
window.ResourceManager = (function() {
  
  // Constructeur
  function ResourceManagerClass() {
    this.cache = {
      metadata: null,
      quizzes: {}
    };
    console.log("ResourceManager initialized (non-module version)");
  }
  
  // Méthodes
  ResourceManagerClass.prototype.loadMetadata = async function() {
    // Vérifier le cache d'abord
    if (this.cache.metadata) {
      return this.cache.metadata;
    }

    console.log("Tentative de chargement des métadonnées...");

    // Liste des chemins possibles à essayer
    const pathsToTry = [
      './js/data/themes/metadata.json',
      './js/data/metadata.json',
      './themes/metadata.json',
      './metadata.json'
    ];

    let metadata = null;
    let successPath = null;

    // Essayer chaque chemin jusqu'à trouver un qui fonctionne
    for (const path of pathsToTry) {
      try {
        console.log(`Tentative de chargement depuis: ${path}`);
        const response = await fetch(path);
        
        if (response.ok) {
          metadata = await response.json();
          successPath = path;
          break;
        }
      } catch (error) {
        console.warn(`Échec du chargement depuis ${path}`);
      }
    }

    if (!metadata) {
      throw new Error("Impossible de charger les métadonnées depuis aucun emplacement");
    }

    // Validation simple
    if (!metadata || !Array.isArray(metadata.themes)) {
      throw new Error("Structure de métadonnées invalide");
    }

    this.cache.metadata = metadata;
    console.log(`Métadonnées chargées avec succès depuis ${successPath}`);
    return metadata;
  };

  ResourceManagerClass.prototype.getThemeQuizzes = async function(themeId) {
    try {
      const metadata = await this.loadMetadata();
      const theme = metadata.themes.find(t => t.id === Number(themeId));

      if (!theme) {
        throw new Error(`Thème avec ID ${themeId} non trouvé`);
      }
      
      return theme.quizzes || [];
    } catch(error) {
      console.error(`Erreur lors de la récupération des quiz pour le thème ${themeId}:`, error);
      throw error;
    }
  };

  ResourceManagerClass.prototype.getQuiz = async function(themeId, quizId) {
    const cacheKey = `quiz_${quizId}`;

    // Vérifier le cache
    if (this.cache.quizzes[cacheKey]) {
      return this.cache.quizzes[cacheKey];
    }

    // Liste des chemins possibles à essayer
    const pathsToTry = [
      `./js/data/themes/theme-${themeId}/quiz_${quizId}.json`,
      `./themes/theme-${themeId}/quiz_${quizId}.json`,
      `./data/themes/theme-${themeId}/quiz_${quizId}.json`,
      `./theme-${themeId}/quiz_${quizId}.json` // Fallback
    ];

    let quizData = null;
    let successPath = null;

    // Essayer chaque chemin
    for (const path of pathsToTry) {
      try {
        console.log(`Tentative de chargement du quiz depuis: ${path}`);
        const response = await fetch(path);
        
        if (response.ok) {
          quizData = await response.json();
          successPath = path;
          break;
        }
      } catch (error) {
        console.warn(`Échec du chargement depuis ${path}`);
      }
    }

    if (!quizData) {
      throw new Error(`Impossible de charger le quiz ${quizId} depuis aucun emplacement`);
    }

    // Validation
    if (!quizData || quizData.id !== Number(quizId) || !Array.isArray(quizData.questions)) {
      throw new Error(`Structure de quiz invalide pour quiz ${quizId}`);
    }
    
    // Ajouter themeId si absent
    if (!quizData.themeId) {
      quizData.themeId = Number(themeId);
    }

    // Mettre en cache et retourner
    this.cache.quizzes[cacheKey] = quizData;
    console.log(`Quiz ${quizId} (Thème ${themeId}) chargé avec succès depuis ${successPath}`);
    return quizData;
  };

  ResourceManagerClass.prototype.preloadThemeQuizzes = async function(themeId) {
    console.log(`Préchargement des quiz pour le thème ${themeId}...`);
    try {
      const quizzesMeta = await this.getThemeQuizzes(themeId);
      if (!quizzesMeta || quizzesMeta.length === 0) return;

      // Précharger en arrière-plan
      for (const quizMeta of quizzesMeta) {
        this.getQuiz(themeId, quizMeta.id).catch(error => {
          console.warn(`[Préchargement] Échec du préchargement du quiz ${quizMeta.id}: ${error.message}`);
        });
        
        // Petite pause
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Préchargement terminé pour le thème ${themeId}`);
    } catch (error) {
      console.error(`Erreur lors du préchargement pour le thème ${themeId}:`, error);
    }
  };

  ResourceManagerClass.prototype.clearCache = function(type = 'all') {
    if (type === 'all' || type === 'metadata') {
      this.cache.metadata = null;
      console.log("Cache des métadonnées vidé");
    }
    if (type === 'all' || type === 'quizzes') {
      this.cache.quizzes = {};
      console.log("Cache des quiz vidé");
    }
  };

  // Retourner une instance unique (singleton)
  return new ResourceManagerClass();
})();

// Pour compatibilité avec la version module
var resourceManager = window.ResourceManager;