// resourceManager.js - Version simplifiée et corrigée
class ResourceManager {
  constructor() {
    this.cache = {
      metadata: null,
      quizzes: {}
    };
    // Utilisation de chemins relatifs simples
    console.log("ResourceManager initialized (fixed path version)");
  }

  /**
   * Charge et met en cache les métadonnées des thèmes et quizzes.
   */
  async loadMetadata() {
    // Vérifier le cache d'abord
    if (this.cache.metadata) {
      return this.cache.metadata;
    }

    console.log("Tentative de chargement des métadonnées...");

    // Liste des chemins possibles à essayer
    const pathsToTry = [
      './themes/metadata.json',
      './metadata.json',
      './data/metadata.json'
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
  }

  /**
   * Récupère la liste des quiz pour un thème donné.
   */
  async getThemeQuizzes(themeId) {
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
  }

  /**
   * Charge et met en cache les données d'un quiz spécifique.
   */
  async getQuiz(themeId, quizId) {
    const cacheKey = `quiz_${quizId}`;

    // Vérifier le cache
    if (this.cache.quizzes[cacheKey]) {
      return this.cache.quizzes[cacheKey];
    }

    // Liste des chemins possibles à essayer
    const pathsToTry = [
      `./theme-${themeId}/quiz_${quizId}.json`,
      `./themes/theme-${themeId}/quiz_${quizId}.json`,
      `./quizzes/theme-${themeId}/quiz_${quizId}.json`,
      `./quiz_${quizId}.json` // Fallback
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
  }

  /**
   * Précharge les quiz d'un thème.
   */
  async preloadThemeQuizzes(themeId) {
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
  }

  /**
   * Vide le cache.
   */
  clearCache(type = 'all') {
    if (type === 'all' || type === 'metadata') {
      this.cache.metadata = null;
      console.log("Cache des métadonnées vidé");
    }
    if (type === 'all' || type === 'quizzes') {
      this.cache.quizzes = {};
      console.log("Cache des quiz vidé");
    }
  }
}

// Exporter une instance unique
export default new ResourceManager();