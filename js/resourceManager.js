// resourceManager.js - Version adaptée à votre structure
class ResourceManager {
  constructor() {
    this.cache = {
      metadata: null,
      quizzes: {} // Cache pour les données de quiz : { "quiz_ID": data }
    };
    // Chemin adapté à votre structure de fichiers
    this.baseDataPath = './themes/';
    this.metadataPath = './metadata.json'; // Le fichier est à la racine de themes
    console.log("ResourceManager initialized (structured version).");
  }

  /**
   * Charge et met en cache les métadonnées globales des thèmes et quizzes.
   * @returns {Promise<Object>} L'objet metadata complet.
   */
  async loadMetadata() {
    // Vérifier le cache d'abord
    if (this.cache.metadata) {
      return this.cache.metadata;
    }

    try {
      // Premier essai avec le chemin principal
      let response = await fetch(this.metadataPath);
      
      // Si échec, essayer des chemins alternatifs
      if (!response.ok) {
        console.warn(`Failed to fetch metadata from ${this.metadataPath}, trying alternatives...`);
        
        // Essayer les chemins alternatifs
        const alternativePaths = [
          './themes/metadata.json',
          './data/metadata.json',
          './js/data/metadata.json'
        ];
        
        for (const path of alternativePaths) {
          try {
            const altResponse = await fetch(path);
            if (altResponse.ok) {
              response = altResponse;
              console.log(`Metadata found at alternate location: ${path}`);
              break;
            }
          } catch (error) {
            console.warn(`Failed to fetch from ${path}`);
          }
        }
        
        // Si toujours pas trouvé
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata from any location.`);
        }
      }
      
      const metadata = await response.json();

      // Validation simple de la structure reçue
      if (!metadata || !Array.isArray(metadata.themes)) {
        throw new Error("Invalid metadata structure received.");
      }

      this.cache.metadata = metadata; // Mettre en cache
      console.log("Metadata loaded and cached successfully.");
      return metadata;
    } catch (error) {
      console.error("Failed to load or parse metadata:", error);
      throw new Error(`Could not load essential application data (metadata). ${error.message}`);
    }
  }

  /**
   * Récupère la liste des métadonnées des quizzes pour un thème donné.
   * @param {number} themeId - L'ID du thème.
   * @returns {Promise<Array>} Un tableau d'objets quiz.
   */
  async getThemeQuizzes(themeId) {
      try {
        // Assurer que les métadonnées sont chargées (utilise le cache si possible)
        const metadata = await this.loadMetadata();
        const theme = metadata.themes.find(t => t.id === Number(themeId));

        if (!theme) {
            throw new Error(`Theme with ID ${themeId} not found in metadata.`);
        }
        return theme.quizzes || []; // Retourne la liste ou un tableau vide
      } catch(error) {
          console.error(`Error getting quizzes metadata for theme ${themeId}:`, error);
          throw error; // Propager l'erreur
      }
  }

  /**
   * Charge et met en cache les données complètes d'un quiz spécifique.
   * Adapté à votre structure de dossiers.
   * @param {number} themeId - L'ID du thème contenant le quiz.
   * @param {number} quizId - L'ID du quiz à charger.
   * @returns {Promise<Object>} Les données complètes du quiz.
   */
  async getQuiz(themeId, quizId) {
    const cacheKey = `quiz_${quizId}`; // Clé de cache basée sur l'ID unique du quiz

    // 1. Vérifier le cache
    if (this.cache.quizzes[cacheKey]) {
      return this.cache.quizzes[cacheKey];
    }

    // 2. Construire les chemins possibles basés sur votre structure
    const possiblePaths = [
      `./theme-${themeId}/quiz_${quizId}.json`,
      `./themes/theme-${themeId}/quiz_${quizId}.json`
    ];
    
    let quizData = null;
    let successPath = null;
    
    // 3. Essayer chaque chemin
    for (const path of possiblePaths) {
      try {
        console.log(`Trying to fetch quiz data from: ${path}`);
        const response = await fetch(path);
        
        if (response.ok) {
          quizData = await response.json();
          successPath = path;
          break;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${path}, trying next path...`);
      }
    }
    
    // 4. Vérifier si nous avons trouvé des données
    if (!quizData) {
      throw new Error(`Failed to fetch quiz ${quizId} from any location.`);
    }

    // 5. Validation simple de la structure
    if (!quizData || quizData.id !== Number(quizId) || !Array.isArray(quizData.questions)) {
        console.error("Invalid quiz data structure received:", quizData);
        throw new Error(`Invalid data structure loaded for quiz ${quizId}.`);
    }
    
    // Ajouter themeId aux données chargées si absent (utile pour contexte)
    if (!quizData.themeId) {
        quizData.themeId = Number(themeId);
    }

    // 6. Mettre en cache et retourner
    this.cache.quizzes[cacheKey] = quizData;
    console.log(`Quiz ${quizId} (Theme ${themeId}) loaded and cached from ${successPath}.`);
    return quizData;
  }

  /**
   * Précharge les données de quiz pour un thème donné.
   * @param {number} themeId - L'ID du thème.
   */
  async preloadThemeQuizzes(themeId) {
    console.log(`Preloading quizzes for theme ${themeId}...`);
    try {
      const quizzesMeta = await this.getThemeQuizzes(themeId);
      if (!quizzesMeta || quizzesMeta.length === 0) return;

      // Précharger chaque quiz
      for (const quizMeta of quizzesMeta) {
        try {
          await this.getQuiz(themeId, quizMeta.id);
        } catch (error) {
          console.warn(`[Preload] Failed to preload quiz ${quizMeta.id}: ${error.message}`);
        }
        // Petite pause pour ne pas surcharger
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Preloading finished for theme ${themeId}.`);
    } catch (error) {
      console.error(`Error during quiz preloading for theme ${themeId}:`, error);
    }
  }

  /**
   * Vide le cache en mémoire.
   * @param {'metadata'|'quizzes'|'all'} [type='all'] - Le type de cache à vider.
   */
  clearCache(type = 'all') {
    if (type === 'all' || type === 'metadata') {
      this.cache.metadata = null;
      console.log("Metadata cache cleared.");
    }
    if (type === 'all' || type === 'quizzes') {
      this.cache.quizzes = {};
      console.log("Quizzes cache cleared.");
    }
  }
}

// Exporter une seule instance (singleton) du gestionnaire
export default new ResourceManager();