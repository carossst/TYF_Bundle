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
    
    // Utiliser la configuration si disponible, sinon utiliser un chemin par défaut
    // qui est plus flexible avec plusieurs possibilités
    this.baseDataPath = window.resourceManagerConfig?.baseDataPath || './';
    
    // Détecter si nous sommes sur GitHub Pages
    this.isGitHubPages = window.location.hostname.includes('github.io');
    this.repoName = this.isGitHubPages ? window.location.pathname.split('/')[1] : '';
    
    console.log("ResourceManager initialized - Flexible version for GitHub Pages");
    console.log("Base path:", this.baseDataPath);
    console.log("GitHub Pages detected:", this.isGitHubPages);
    if (this.isGitHubPages) console.log("Repository name:", this.repoName);
  }
  
  // Méthodes
  ResourceManagerClass.prototype.loadMetadata = async function() {
    // Vérifier le cache d'abord
    if (this.cache.metadata) {
      console.log("Using cached metadata");
      return this.cache.metadata;
    }

    console.log("Attempting to load metadata from multiple possible locations...");

    // Liste étendue des chemins possibles à essayer
    const pathsToTry = [
      // Chemins directs
      './metadata.json',
      './js/data/metadata.json',
      './js/data/themes/metadata.json',
      './themes/metadata.json',
      
      // Chemins relatifs au baseDataPath
      `${this.baseDataPath}metadata.json`,
      `${this.baseDataPath}js/data/metadata.json`,
      `${this.baseDataPath}themes/metadata.json`,
      `${this.baseDataPath}data/metadata.json`,
      
      // Chemins absolus
      '/metadata.json',
      '/js/data/metadata.json',
      '/themes/metadata.json',
      
      // Chemins GitHub Pages spécifiques
      `/TYF_Bundle/metadata.json`,
      `/TYF_Bundle/js/data/metadata.json`,
      `/TYF_Bundle/js/data/themes/metadata.json`,
      
      // Chemins dynamiques GitHub Pages basés sur le nom du repo détecté
      `/${this.repoName}/metadata.json`,
      `/${this.repoName}/js/data/metadata.json`,
      `/${this.repoName}/js/data/themes/metadata.json`
    ];

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

    if (!metadata) {
      console.error("❗ CRITICAL ERROR: Could not load metadata from any location");
      throw new Error("Could not load metadata from any location. Check network tab for details.");
    }

    // Validation simple
    if (!metadata || !Array.isArray(metadata.themes)) {
      console.error("❗ CRITICAL ERROR: Invalid metadata structure");
      throw new Error("Invalid metadata structure. Check metadata.json format.");
    }

    this.cache.metadata = metadata;
    console.log(`✅ Metadata successfully cached from ${successPath}`);
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

    // Liste étendue des chemins possibles à essayer
    const pathsToTry = [
      // Noms de fichiers variables avec structure de dossiers variées
      `./js/data/themes/theme-${themeId}/quiz_${quizId}.json`,
      `./themes/theme-${themeId}/quiz_${quizId}.json`,
      `./data/themes/theme-${themeId}/quiz_${quizId}.json`,
      `./theme-${themeId}/quiz_${quizId}.json`,
      `./quiz_${quizId}.json`,
      
      // Sans préfixe "quiz_"
      `./js/data/themes/theme-${themeId}/${quizId}.json`,
      `./themes/theme-${themeId}/${quizId}.json`,
      
      // Chemins relatifs au baseDataPath
      `${this.baseDataPath}themes/theme-${themeId}/quiz_${quizId}.json`,
      `${this.baseDataPath}js/data/themes/theme-${themeId}/quiz_${quizId}.json`,
      `${this.baseDataPath}data/themes/theme-${themeId}/quiz_${quizId}.json`,
      `${this.baseDataPath}theme-${themeId}/quiz_${quizId}.json`,
      `${this.baseDataPath}quiz_${quizId}.json`,
      
      // Noms de fichiers variables avec underscore ou tiret
      `./js/data/themes/theme_${themeId}/quiz_${quizId}.json`,
      `./js/data/themes/theme-${themeId}/quiz-${quizId}.json`,
      `./themes/theme_${themeId}/quiz_${quizId}.json`,
      
      // Format avec 3 chiffres (exemple: quiz_101.json, quiz_902.json)
      `./js/data/themes/theme-${themeId}/quiz_${quizId.toString().padStart(3, '0')}.json`,
      `./themes/theme-${themeId}/quiz_${quizId.toString().padStart(3, '0')}.json`,
      `./${quizId.toString().padStart(3, '0')}.json`,
      `./quiz_${quizId.toString().padStart(3, '0')}.json`,
      
      // Chemins GitHub Pages spécifiques
      `/TYF_Bundle/js/data/themes/theme-${themeId}/quiz_${quizId}.json`,
      `/TYF_Bundle/themes/theme-${themeId}/quiz_${quizId}.json`,
      
      // Chemins dynamiques GitHub Pages basés sur le nom du repo détecté
      `/${this.repoName}/js/data/themes/theme-${themeId}/quiz_${quizId}.json`,
      `/${this.repoName}/themes/theme-${themeId}/quiz_${quizId}.json`,
      `/${this.repoName}/js/data/themes/theme-${themeId}/quiz_${quizId.toString().padStart(3, '0')}.json`
    ];

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