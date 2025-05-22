/* resourceManager.js – Version corrigée pour la vraie structure des fichiers */

window.ResourceManager = (function() {
  function ResourceManagerClass() {
    this.cache = {
      metadata: null,
      quizzes: {}
    };
    
    this.isGitHubPages = window.location.hostname.includes('github.io');
    this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Mapping des clés de thèmes - CORRIGÉ avec minuscules
    this.themeKeys = {
      1: "colors", 2: "numbers", 3: "gender", 4: "singular_plural", 5: "present_tense",
      6: "accents", 7: "ca_va", 8: "metro", 9: "boulangerie", 10: "cafe"
    };
    
    // Configuration des chemins selon l'environnement  
    this.baseDataPath = this.getBasePath();
    
    console.log(`🔧 ResourceManager: Environment=${this.getEnvironment()}, basePath=${this.baseDataPath}`);
  }

  // Détection de l'environnement
  ResourceManagerClass.prototype.getEnvironment = function() {
    if (this.isDevelopment) return 'development';
    if (this.isGitHubPages) return 'github-pages';
    return 'production';
  };

  // Configuration du chemin de base
  ResourceManagerClass.prototype.getBasePath = function() {
    // Configuration manuelle si définie
    if (window.resourceManagerConfig?.baseDataPath) {
      return window.resourceManagerConfig.baseDataPath;
    }
    
    // GitHub Pages
    if (this.isGitHubPages) {
      return '/TYF_Bundle/js/data/';
    }
    
    // Développement local
    return './js/data/';
  };

  // Chargement des métadonnées avec plusieurs chemins de fallback
  ResourceManagerClass.prototype.loadMetadata = async function() {
    if (this.cache.metadata) {
      console.log("📦 Using cached metadata");
      return this.cache.metadata;
    }

    // Chemins à essayer pour metadata.json
    const pathsToTry = [
      `${this.baseDataPath}metadata.json`,
      './js/data/metadata.json',
      './metadata.json'
    ];
    
    // Ajout de chemins spécifiques GitHub Pages
    if (this.isGitHubPages) {
      pathsToTry.unshift('/TYF_Bundle/js/data/metadata.json');
      pathsToTry.push('/TYF_Bundle/metadata.json');
    }

    let metadata = null;
    for (const path of pathsToTry) {
      try {
        console.log(`🔍 Trying to load metadata from: ${path}`);
        const response = await fetch(path);
        if (response.ok) {
          metadata = await response.json();
          console.log(`✅ Metadata loaded from: ${path}`);
          break;
        } else {
          console.warn(`❌ HTTP ${response.status} for: ${path}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to load metadata from ${path}:`, error.message);
      }
    }

    if (!metadata) {
      console.error("❌ Unable to load metadata from any path");
      throw new Error("Failed to load metadata");
    }

    // Validation basique
    if (!metadata.themes || !Array.isArray(metadata.themes)) {
      console.error("❌ Invalid metadata structure");
      throw new Error("Invalid metadata structure");
    }

    this.cache.metadata = metadata;
    return metadata;
  };

  // Récupération des quiz d'un thème
  ResourceManagerClass.prototype.getThemeQuizzes = async function(themeId) {
    const metadata = await this.loadMetadata();
    const theme = metadata.themes.find(t => t.id === Number(themeId));
    
    if (!theme) {
      console.error(`Theme ${themeId} not found in metadata`);
      throw new Error(`Theme ${themeId} not found`);
    }
    
    return theme.quizzes || [];
  };

  // Chargement d'un quiz - CORRECTION MAJEURE
  ResourceManagerClass.prototype.getQuiz = async function(themeId, quizId) {
    const cacheKey = `quiz_${quizId}`;
    
    if (this.cache.quizzes[cacheKey]) {
      console.log(`📦 Using cached quiz ${quizId}`);
      return this.cache.quizzes[cacheKey];
    }

    // ✅ CORRECTION : Utiliser le bon format avec themeKey
    // Vos fichiers s'appellent "themekey_quiz_XXX.json" (ex: colors_quiz_101.json)
    const filename = `${themeKey}_quiz_${quizId}.json`;

    // Chemins à essayer pour le fichier quiz
    const pathsToTry = [
      `${this.baseDataPath}themes/theme-${themeId}/${filename}`,
      `./js/data/themes/theme-${themeId}/${filename}`
    ];
    
    // Ajout de chemins GitHub Pages
    if (this.isGitHubPages) {
      pathsToTry.unshift(`/TYF_Bundle/js/data/themes/theme-${themeId}/${filename}`);
    }

    let quizData = null;
    for (const path of pathsToTry) {
      try {
        console.log(`🔍 Trying to load quiz from: ${path}`);
        const response = await fetch(path);
        if (response.ok) {
          quizData = await response.json();
          
          // Validation basique du quiz
          if (this.validateQuiz(quizData, themeId, quizId)) {
            this.cache.quizzes[cacheKey] = quizData;
            console.log(`✅ Quiz ${quizId} loaded from: ${path}`);
            return quizData;
          } else {
            console.warn(`⚠️ Quiz validation failed for: ${path}`);
          }
        } else {
          console.warn(`❌ HTTP ${response.status} for: ${path}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to load quiz from ${path}:`, error.message);
      }
    }

    console.error(`❌ Quiz ${quizId} not found in any location`);
    throw new Error(`Quiz ${quizId} not found`);
  };

  // Validation de la structure d'un quiz
  ResourceManagerClass.prototype.validateQuiz = function(quizData, expectedThemeId, expectedQuizId) {
    if (!quizData) return false;
    
    // Validation flexible - vos quiz peuvent avoir des structures différentes
    const hasValidId = quizData.id === Number(expectedQuizId) || !quizData.id;
    const hasValidThemeId = quizData.themeId === Number(expectedThemeId) || !quizData.themeId;
    const hasQuestions = Array.isArray(quizData.questions) && quizData.questions.length > 0;
    
    if (!hasQuestions) {
      console.error("Quiz validation failed: no questions array found");
      return false;
    }
    
    if (!hasValidId) {
      console.warn(`Quiz ID mismatch: expected ${expectedQuizId}, got ${quizData.id}`);
    }
    
    if (!hasValidThemeId) {
      console.warn(`Theme ID mismatch: expected ${expectedThemeId}, got ${quizData.themeId}`);
    }
    
    return hasQuestions;
  };

  // Chemin des fichiers audio
  ResourceManagerClass.prototype.getAudioPath = function(themeId, audioFilename) {
    return `${this.baseDataPath}themes/theme-${themeId}/audio/${audioFilename}`;
  };

  // Préchargement d'un thème complet
  ResourceManagerClass.prototype.preloadTheme = async function(themeId) {
    try {
      const quizzes = await this.getThemeQuizzes(themeId);
      const loadPromises = quizzes.map(quiz => this.getQuiz(themeId, quiz.id));
      await Promise.all(loadPromises);
      console.log(`✅ Theme ${themeId} preloaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to preload theme ${themeId}:`, error);
      throw error;
    }
  };

  // Nettoyage du cache
  ResourceManagerClass.prototype.clearCache = function() {
    this.cache = { metadata: null, quizzes: {} };
    console.log("🧹 Cache cleared");
  };

  // Diagnostic pour debugging
  ResourceManagerClass.prototype.diagnose = async function() {
    console.group("🔧 ResourceManager Diagnostics");
    
    console.log("Environment:", this.getEnvironment());
    console.log("Base path:", this.baseDataPath);
    console.log("Current URL:", window.location.href);
    
    try {
      const metadata = await this.loadMetadata();
      console.log("✅ Metadata loaded successfully");
      console.log("Themes found:", metadata.themes?.length || 0);
      
      if (metadata.themes?.length > 0) {
        const firstTheme = metadata.themes[0];
        console.log("Testing first theme:", firstTheme.id, firstTheme.name);
        
        if (firstTheme.quizzes?.length > 0) {
          const firstQuiz = firstTheme.quizzes[0];
          console.log("Testing first quiz:", firstQuiz.id);
          
          try {
            await this.getQuiz(firstTheme.id, firstQuiz.id);
            console.log("✅ First quiz loaded successfully");
          } catch (error) {
            console.error("❌ Failed to load first quiz:", error);
          }
        }
      }
    } catch (error) {
      console.error("❌ Metadata loading failed:", error);
    }
    
    console.groupEnd();
  };

  return new ResourceManagerClass();
})();

// Diagnostic automatique en mode développement
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.addEventListener('load', () => {
    setTimeout(() => ResourceManager.diagnose(), 1000);
  });
}