/* resourceManager.js – Version finale corrigée pour colors_quiz_101.json */

window.ResourceManager = (function() {
  function ResourceManagerClass() {
    this.cache = {
      metadata: null,
      quizzes: {}
    };
    
    this.isGitHubPages = window.location.hostname.includes('github.io');
    this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // ✅ CORRECTION FINALE : Mapping avec minuscules selon vos VRAIS fichiers GitHub
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
    if (window.resourceManagerConfig?.baseDataPath) {
      return window.resourceManagerConfig.baseDataPath;
    }
    
    if (this.isGitHubPages) {
      return '/TYF_Bundle/js/data/';
    }
    
    return './js/data/';
  };

  // Vérification si le cache est activé
  ResourceManagerClass.prototype.isCacheEnabled = function() {
    return !this.isDevelopment || window.resourceManagerConfig?.forceCache === true;
  };

  // Chargement des métadonnées avec retry et fallback
  ResourceManagerClass.prototype.loadMetadata = async function() {
    if (this.cache.metadata && this.isCacheEnabled()) {
      console.log("📦 Using cached metadata");
      return this.cache.metadata;
    }

    const pathsToTry = this.getMetadataPaths();
    let lastError = null;

    for (let i = 0; i < pathsToTry.length; i++) {
      const path = pathsToTry[i];
      try {
        console.log(`🔍 Attempting to load metadata from: ${path} (${i + 1}/${pathsToTry.length})`);
        
        const response = await this.fetchWithTimeout(path, 5000);
        if (response.ok) {
          const metadata = await response.json();
          
          if (this.validateMetadata(metadata)) {
            this.cache.metadata = metadata;
            console.log(`✅ Metadata loaded successfully from: ${path}`);
            return metadata;
          } else {
            console.warn(`⚠️ Invalid metadata structure from: ${path}`);
          }
        } else {
          console.warn(`❌ HTTP ${response.status} for: ${path}`);
        }
      } catch (error) {
        lastError = error;
        console.warn(`❌ Failed to load metadata from ${path}:`, error.message);
      }
    }

    console.error("❌ All metadata loading attempts failed");
    throw new Error(`Failed to load metadata: ${lastError?.message || 'Unknown error'}`);
  };

  // Génération des chemins de métadonnées à essayer
  ResourceManagerClass.prototype.getMetadataPaths = function() {
    const paths = [`${this.baseDataPath}metadata.json`];
    
    if (this.isGitHubPages && !this.baseDataPath.includes('/TYF_Bundle/')) {
      paths.unshift('/TYF_Bundle/js/data/metadata.json', '/TYF_Bundle/metadata.json');
    }
    
    if (!this.isGitHubPages && this.baseDataPath !== './') {
      paths.push('./metadata.json', './js/data/metadata.json');
    }
    
    return [...new Set(paths)];
  };

  // Validation de la structure des métadonnées
  ResourceManagerClass.prototype.validateMetadata = function(metadata) {
    return metadata && 
           metadata.themes && 
           Array.isArray(metadata.themes) && 
           metadata.themes.length > 0 &&
           metadata.themes.every(theme => theme.id && theme.name && Array.isArray(theme.quizzes));
  };

  // Récupération des quiz d'un thème
  ResourceManagerClass.prototype.getThemeQuizzes = async function(themeId) {
    const metadata = await this.loadMetadata();
    const theme = metadata.themes.find(t => t.id === Number(themeId));
    
    if (!theme) {
      throw new Error(`Theme ${themeId} not found in metadata`);
    }
    
    return theme.quizzes || [];
  };

  // ✅ CHARGEMENT D'UN QUIZ - VERSION FINALE CORRIGÉE
  ResourceManagerClass.prototype.getQuiz = async function(themeId, quizId) {
    const cacheKey = `quiz_${quizId}`;
    
    if (this.cache.quizzes[cacheKey] && this.isCacheEnabled()) {
      console.log(`📦 Using cached quiz ${quizId}`);
      return this.cache.quizzes[cacheKey];
    }

    // ✅ RÉCUPÉRER LE THEME KEY
    const themeKey = this.themeKeys[themeId];
    if (!themeKey) {
      throw new Error(`Unknown theme ID ${themeId}`);
    }

    // ✅ CONSTRUIRE LE BON NOM DE FICHIER - CORRECTION CRITIQUE
    const filename = `${themeKey}_quiz_${quizId}.json`;
    console.log(`🔍 DEBUG: Looking for file: ${filename}`);
    console.log(`🔍 DEBUG: Theme ${themeId} -> Key: ${themeKey} -> File: ${filename}`);
    console.log(`🔍 DEBUG: themeKeys mapping:`, this.themeKeys);

    // Chemins à essayer pour le fichier quiz
    const pathsToTry = [
      `${this.baseDataPath}themes/theme-${themeId}/${filename}`
    ];
    
    // Ajout de chemins GitHub Pages
    if (this.isGitHubPages) {
      pathsToTry.unshift(`/TYF_Bundle/js/data/themes/theme-${themeId}/${filename}`);
    }

    let quizData = null;
    for (const path of pathsToTry) {
      try {
        console.log(`🧪 Tentative de chargement quiz via : ${path}`);
        
        const response = await this.fetchWithTimeout(path, 8000);
        if (response.ok) {
          quizData = await response.json();
          
          // Validation du quiz
          if (this.validateQuiz(quizData, themeId, quizId)) {
            this.cache.quizzes[cacheKey] = quizData;
            console.log(`✅ Quiz ${quizId} chargé depuis : ${path}`);
            console.log(`✅ Questions trouvées: ${quizData.questions?.length || 0}`);
            return quizData;
          } else {
            console.warn(`⚠️ Quiz validation failed for: ${path}`);
            console.warn(`⚠️ Quiz data:`, quizData);
          }
        } else {
          console.warn(`❌ HTTP ${response.status} for: ${path}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to load quiz from ${path}:`, error.message);
      }
    }

    console.error(`❌ Quiz ${quizId} not found: filename should be ${filename}`);
    console.error(`❌ Paths tried:`, pathsToTry);
    throw new Error(`Quiz ${quizId} not found: filename should be ${filename}`);
  };

  // Validation de la structure d'un quiz
  ResourceManagerClass.prototype.validateQuiz = function(quizData, expectedThemeId, expectedQuizId) {
    if (!quizData) return false;
    
    const hasValidId = quizData.id === Number(expectedQuizId) || !quizData.id;
    const hasValidThemeId = quizData.themeId === Number(expectedThemeId) || !quizData.themeId;
    const hasQuestions = Array.isArray(quizData.questions) && quizData.questions.length > 0;
    
    if (!hasQuestions) {
      console.error("Quiz validation failed: no questions array found");
      return false;
    }
    
    return hasQuestions;
  };

  // Fetch avec timeout
  ResourceManagerClass.prototype.fetchWithTimeout = function(url, timeout = 5000) {
    return Promise.race([
      fetch(url),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      )
    ]);
  };

  // Gestion des chemins audio
  ResourceManagerClass.prototype.getAudioPath = function(themeId, audioFilename) {
    return `${this.baseDataPath}themes/theme-${themeId}/audio/${audioFilename}`;
  };

  // Préchargement d'un thème complet
  ResourceManagerClass.prototype.preloadTheme = async function(themeId) {
    try {
      const quizzes = await this.getThemeQuizzes(themeId);
      const promises = quizzes.map(quiz => this.getQuiz(themeId, quiz.id));
      await Promise.all(promises);
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
    console.log("Theme keys:", this.themeKeys);
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
          
          const expectedFilename = `${this.themeKeys[firstTheme.id]}_quiz_${firstQuiz.id}.json`;
          console.log("Expected filename:", expectedFilename);
          
          try {
            const quizData = await this.getQuiz(firstTheme.id, firstQuiz.id);
            console.log("✅ First quiz loaded successfully");
            console.log("Questions found:", quizData.questions?.length || 0);
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