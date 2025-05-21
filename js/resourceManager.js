/* resourceManager.js – version debug avec logs et fallback désactivé */

window.ResourceManager = (function() {
  function ResourceManagerClass() {
    this.cache = {
      metadata: null,
      quizzes: {}
    };
    this.isGitHubPages = window.location.hostname.includes('github.io');
    this.baseDataPath = this.isGitHubPages ? '/TYF_Bundle/' : window.resourceManagerConfig?.baseDataPath || './';
    console.log(`🔧 ResourceManager: baseDataPath = ${this.baseDataPath}`);
  }

  ResourceManagerClass.prototype.loadMetadata = async function() {
    if (this.cache.metadata) {
      console.log("Using cached metadata");
      return this.cache.metadata;
    }

    const pathsToTry = [
      '/TYF_Bundle/metadata.json',
      '/TYF_Bundle/js/data/metadata.json',
      './metadata.json',
      './js/data/metadata.json',
      `${this.baseDataPath}metadata.json`,
      `${this.baseDataPath}js/data/metadata.json`
    ];

    let metadata = null;
    for (const path of pathsToTry) {
      try {
        console.warn("🧪 Tentative de chargement metadata via :", path);
        const response = await fetch(path);
        if (response.ok) {
          metadata = await response.json();
          console.log(`✅ Metadata chargée depuis : ${path}`);
          break;
        } else {
          console.warn(`❌ Échec de chargement metadata depuis ${path} : ${response.status}`);
        }
      } catch (e) {
        console.warn(`❌ Exception lors du chargement metadata depuis ${path}: ${e.message}`);
      }
    }

    if (!metadata) {
      console.error("❌ Aucune metadata chargée. Aucune donnée fallback utilisée en mode debug.");
      return null;
    }

    this.cache.metadata = metadata;
    return metadata;
  };

  ResourceManagerClass.prototype.getThemeQuizzes = async function(themeId) {
    const metadata = await this.loadMetadata();
    const theme = metadata?.themes?.find(t => t.id === Number(themeId));
    if (!theme) throw new Error(`Theme ${themeId} not found`);
    return theme.quizzes || [];
  };

  ResourceManagerClass.prototype.getQuiz = async function(themeId, quizId) {
    const cacheKey = `quiz_${quizId}`;
    if (this.cache.quizzes[cacheKey]) return this.cache.quizzes[cacheKey];

    const pathsToTry = [
      `/TYF_Bundle/js/data/themes/theme-${themeId}/quiz_${quizId}.json`,
      `./js/data/themes/theme-${themeId}/quiz_${quizId}.json`,
      `${this.baseDataPath}js/data/themes/theme-${themeId}/quiz_${quizId}.json`
    ];

    let quizData = null;
    for (const path of pathsToTry) {
      try {
        console.warn("🧪 Tentative de chargement quiz via :", path);
        const response = await fetch(path);
        if (response.ok) {
          quizData = await response.json();
          this.cache.quizzes[cacheKey] = quizData;
          console.log(`✅ Quiz ${quizId} chargé depuis ${path}`);
          break;
        } else {
          console.warn(`❌ Échec de chargement quiz depuis ${path} : ${response.status}`);
        }
      } catch (e) {
        console.warn(`❌ Exception lors du chargement quiz ${quizId} depuis ${path}: ${e.message}`);
      }
    }

    if (!quizData) {
      console.error(`❌ Aucun fichier quiz_${quizId}.json trouvé pour thème ${themeId}. Fallback désactivé.`);
      throw new Error(`Quiz ${quizId} not found`);
    }

    return quizData;
  };

  return new ResourceManagerClass();
})();
