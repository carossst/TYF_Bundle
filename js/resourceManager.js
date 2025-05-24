/* resourceManager.js – Version 2.3.1 CORRIGÉE - Chemins unifiés avec index.html */

window.ResourceManager = (function() {
  function ResourceManagerClass() {
    this.cache = {
      metadata: null,
      quizzes: {}
    };
    
    // 🔧 CORRECTION - Détection environnement simplifiée
    this.isGitHubPages = window.location.hostname.includes('github.io');
    this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // ✅ CORRECTION : Mapping avec noms exacts des fichiers
    this.themeKeys = {
      1: "colors", 2: "numbers", 3: "gender", 4: "singular_plural", 5: "present_tense",
      6: "accents", 7: "ca_va", 8: "metro", 9: "boulangerie", 10: "cafe"
    };
    
    // 🎵 Mapping des dossiers audio (cohérent avec README)
    this.audioFolders = {
      1: 'Colors', 2: 'Numbers', 3: 'Gender', 4: 'Singular_Plural',
      5: 'Present_Tense', 6: 'Accents', 7: 'Ca_va', 8: 'Metro',
      9: 'Boulangerie', 10: 'Cafe'
    };
    
    // 🔧 CORRECTION CRITIQUE - Utilise la config de index.html
    this.baseDataPath = this.getBasePath();
    
    console.log(`🔧 ResourceManager v2.3.1: Environment=${this.getEnvironment()}, basePath=${this.baseDataPath}`);
  }

  ResourceManagerClass.prototype.getEnvironment = function() {
    if (this.isDevelopment) return 'development';
    if (this.isGitHubPages) return 'github-pages';
    return 'production';
  };

  // 🔧 CORRECTION MAJEURE - Cohérence avec index.html
  ResourceManagerClass.prototype.getBasePath = function() {
    // Utilise la configuration définie dans index.html
    if (window.resourceManagerConfig?.baseDataPath) {
      console.log(`🔧 Using config baseDataPath: ${window.resourceManagerConfig.baseDataPath}`);
      return window.resourceManagerConfig.baseDataPath;
    }
    
    // Fallback si pas de config (ne devrait pas arriver)
    console.warn('⚠️ No resourceManagerConfig found, using fallback');
    if (this.isGitHubPages) {
      return '/TYF_Bundle/js/data/';
    }
    return './js/data/';
  };

  ResourceManagerClass.prototype.isCacheEnabled = function() {
    return !this.isDevelopment || window.resourceManagerConfig?.cacheEnabled === true;
  };

  ResourceManagerClass.prototype.loadMetadata = async function() {
    if (this.cache.metadata && this.isCacheEnabled()) {
      console.log("📦 Using cached metadata");
      return this.cache.metadata;
    }

    // 🔧 CORRECTION - Chemin simplifié
    const metadataPath = `${this.baseDataPath}metadata.json`;
    
    try {
      console.log(`🔍 Loading metadata from: ${metadataPath}`);
      
      const response = await this.fetchWithTimeout(metadataPath, 8000);
      if (response.ok) {
        const metadata = await response.json();
        
        if (this.validateMetadata(metadata)) {
          this.cache.metadata = metadata;
          console.log(`✅ Metadata loaded successfully from: ${metadataPath}`);
          console.log(`📊 Found ${metadata.themes?.length || 0} themes`);
          return metadata;
        } else {
          throw new Error('Invalid metadata structure');
        }
      } else {
        throw new Error(`HTTP ${response.status} for: ${metadataPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to load metadata from ${metadataPath}:`, error.message);
      throw new Error(`Failed to load metadata: ${error.message}`);
    }
  };

  ResourceManagerClass.prototype.validateMetadata = function(metadata) {
    const isValid = metadata && 
           metadata.themes && 
           Array.isArray(metadata.themes) && 
           metadata.themes.length > 0 &&
           metadata.themes.every(theme => theme.id && theme.name && Array.isArray(theme.quizzes));
    
    if (!isValid) {
      console.error('❌ Metadata validation failed:', {
        hasMetadata: !!metadata,
        hasThemes: !!metadata?.themes,
        isArray: Array.isArray(metadata?.themes),
        themesCount: metadata?.themes?.length || 0
      });
    }
    
    return isValid;
  };

  ResourceManagerClass.prototype.getThemeQuizzes = async function(themeId) {
    const metadata = await this.loadMetadata();
    const theme = metadata.themes.find(t => t.id === Number(themeId));
    
    if (!theme) {
      throw new Error(`Theme ${themeId} not found in metadata`);
    }
    
    return theme.quizzes || [];
  };

  ResourceManagerClass.prototype.getQuiz = async function(themeId, quizId) {
    const cacheKey = `quiz_${themeId}_${quizId}`;
    
    if (this.cache.quizzes[cacheKey] && this.isCacheEnabled()) {
      console.log(`📦 Using cached quiz ${quizId}`);
      return this.cache.quizzes[cacheKey];
    }

    const themeKey = this.themeKeys[themeId];
    if (!themeKey) {
      throw new Error(`Unknown theme ID ${themeId}`);
    }

    // 🔧 CORRECTION - Chemin simplifié et cohérent
    const filename = `${themeKey}_quiz_${quizId}.json`;
    const quizPath = `${this.baseDataPath}themes/theme-${themeId}/${filename}`;
    
    try {
      console.log(`🔍 Loading quiz from: ${quizPath}`);
      
      const response = await this.fetchWithTimeout(quizPath, 8000);
      if (response.ok) {
        const quizData = await response.json();
        
        if (this.validateQuiz(quizData, themeId, quizId)) {
          this.cache.quizzes[cacheKey] = quizData;
          console.log(`✅ Quiz ${quizId} loaded successfully`);
          console.log(`📝 Questions found: ${quizData.questions?.length || 0}`);
          return quizData;
        } else {
          throw new Error('Quiz validation failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Failed to load quiz ${quizId} from theme ${themeId}:`, error.message);
      throw new Error(`Quiz ${quizId} not found: expected ${filename} in theme-${themeId}/`);
    }
  };

  ResourceManagerClass.prototype.validateQuiz = function(quizData, expectedThemeId, expectedQuizId) {
    if (!quizData) {
      console.error('❌ Quiz validation: No quiz data');
      return false;
    }
    
    if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      console.error('❌ Quiz validation: No questions array or empty questions');
      return false;
    }
    
    // Validation des questions
    const validQuestions = quizData.questions.every(q => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length > 0 && 
      q.correctAnswer
    );
    
    if (!validQuestions) {
      console.error('❌ Quiz validation: Invalid question structure');
      return false;
    }
    
    console.log(`✅ Quiz validation passed: ${quizData.questions.length} valid questions`);
    return true;
  };

  ResourceManagerClass.prototype.fetchWithTimeout = function(url, timeout = 8000) {
    return Promise.race([
      fetch(url),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      )
    ]);
  };

  // 🎵 CORRECTION AUDIO - Chemins cohérents avec structure README
  ResourceManagerClass.prototype.getAudioPath = function(themeId, audioFilename) {
    const audioFolder = this.audioFolders[themeId];
    if (!audioFolder) {
      console.warn(`⚠️ Unknown theme ID for audio: ${themeId}, using Colors as fallback`);
      return `./audio/Colors/${audioFilename}`;
    }
    
    // Structure cohérente : audio/Ca_va/TYF_Ca va_3_1.mp3
    const path = `./audio/${audioFolder}/${audioFilename}`;
    console.log(`🎵 Audio path: ${path}`);
    return path;
  };

  // 🆕 Vérifier si un fichier audio existe
  ResourceManagerClass.prototype.checkAudioExists = async function(themeId, audioFilename) {
    const audioPath = this.getAudioPath(themeId, audioFilename);
    
    try {
      const response = await fetch(audioPath, { method: 'HEAD' });
      const exists = response.ok;
      console.log(`🎵 Audio ${audioFilename}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
      return exists;
    } catch (error) {
      console.warn(`🎵 Audio check failed for ${audioPath}:`, error.message);
      return false;
    }
  };

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

  ResourceManagerClass.prototype.clearCache = function() {
    this.cache = { metadata: null, quizzes: {} };
    console.log("🧹 Cache cleared");
  };

  // 🔧 DIAGNOSTIC AMÉLIORÉ
  ResourceManagerClass.prototype.diagnose = async function() {
    console.group("🔧 ResourceManager Diagnostics v2.3.1");
    
    console.log("🌍 Environment:", this.getEnvironment());
    console.log("📁 Base path:", this.baseDataPath);
    console.log("🗂️ Theme keys:", this.themeKeys);
    console.log("🎵 Audio folders:", this.audioFolders);
    console.log("🔗 Current URL:", window.location.href);
    console.log("⚙️ Config:", window.resourceManagerConfig);
    
    try {
      console.log("📊 Testing metadata loading...");
      const metadata = await this.loadMetadata();
      console.log("✅ Metadata loaded successfully");
      console.log(`📚 Themes found: ${metadata.themes?.length || 0}`);
      
      if (metadata.themes?.length > 0) {
        const firstTheme = metadata.themes[0];
        console.log(`🧪 Testing first theme: ${firstTheme.id} (${firstTheme.name})`);
        
        if (firstTheme.quizzes?.length > 0) {
          const firstQuiz = firstTheme.quizzes[0];
          console.log(`🧪 Testing first quiz: ${firstQuiz.id}`);
          
          try {
            const quizData = await this.getQuiz(firstTheme.id, firstQuiz.id);
            console.log("✅ First quiz loaded successfully");
            console.log(`❓ Questions: ${quizData.questions?.length || 0}`);
          } catch (error) {
            console.error("❌ First quiz failed:", error.message);
          }
        }
      }
    } catch (error) {
      console.error("❌ Diagnostic failed:", error.message);
    }
    
    console.groupEnd();
  };

  return new ResourceManagerClass();
})();