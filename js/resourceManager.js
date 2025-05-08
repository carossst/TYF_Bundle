/*
 * js/resourceManager.js - Version 2.2.0 (12 avril 2024)
 * Gestionnaire centralisé pour charger les ressources de données dynamiques.
 * Charge metadata.json et les fichiers quiz_XXX.json individuels à la demande.
 * Inclut un cache en mémoire simple.
 */

class ResourceManager {
  constructor() {
    this.cache = {
      metadata: null,
      quizzes: {} // Cache pour les données de quiz : { "quiz_ID": data }
    };
    // Optionnel: Définir le chemin de base pour les données
    this.baseDataPath = 'js/data/';
    console.log("ResourceManager initialized (V2.2).");
  }

  /**
   * Charge et met en cache les métadonnées globales des thèmes et quizzes.
   * @returns {Promise<Object>} L'objet metadata complet.
   * @throws {Error} Si le chargement ou le parsing échoue.
   */
  async loadMetadata() {
    // Vérifier le cache d'abord
    if (this.cache.metadata) {
      // console.log("Serving metadata from cache.");
      return this.cache.metadata;
    }

    const metadataUrl = `${this.baseDataPath}metadata.json`;
    console.log(`Fetching metadata from: ${metadataUrl}`);

    try {
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        // Gérer les erreurs HTTP (ex: 404 Not Found)
        throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
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
      // Renvoyer une erreur pour que l'appelant puisse la gérer (ex: afficher un message à l'utilisateur)
      throw new Error(`Could not load essential application data (metadata). ${error.message}`);
    }
  }

  /**
   * Récupère la liste des métadonnées des quizzes pour un thème donné.
   * Nécessite que loadMetadata ait été appelé avec succès auparavant.
   * @param {number} themeId - L'ID du thème.
   * @returns {Promise<Array>} Un tableau d'objets quiz (id, name, description) ou un tableau vide.
   * @throws {Error} Si les métadonnées ne sont pas chargées ou si le thème est introuvable.
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
   * Charge et met en cache les données complètes (avec questions) d'un quiz spécifique.
   * @param {number} themeId - L'ID du thème contenant le quiz.
   * @param {number} quizId - L'ID du quiz à charger.
   * @returns {Promise<Object>} Les données complètes du quiz.
   * @throws {Error} Si le chargement ou le parsing échoue.
   */
  async getQuiz(themeId, quizId) {
    const cacheKey = `quiz_${quizId}`; // Clé de cache basée sur l'ID unique du quiz

    // 1. Vérifier le cache
    if (this.cache.quizzes[cacheKey]) {
      // console.log(`Serving quiz ${quizId} from cache.`);
      return this.cache.quizzes[cacheKey];
    }

    // 2. Construire le chemin et fetch
    // Assure une structure de dossier cohérente: js/data/quizzes/theme_X/quiz_Y.json
    const filePath = `${this.baseDataPath}quizzes/theme_${themeId}/quiz_${quizId}.json`;
    console.log(`Fetching quiz data from: ${filePath}`);

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch quiz ${quizId}: ${response.status} ${response.statusText}`);
      }
      const quizData = await response.json();

      // 3. Validation simple de la structure
       if (!quizData || quizData.id !== Number(quizId) || !Array.isArray(quizData.questions)) {
            console.error("Invalid quiz data structure received:", quizData);
            throw new Error(`Invalid data structure loaded for quiz ${quizId}.`);
       }
       // Ajouter themeId aux données chargées si absent (utile pour contexte)
       if (!quizData.themeId) {
           quizData.themeId = Number(themeId);
       }


      // 4. Mettre en cache et retourner
      this.cache.quizzes[cacheKey] = quizData;
      console.log(`Quiz ${quizId} (Theme ${themeId}) loaded and cached.`);
      return quizData;
    } catch (error) {
      console.error(`Failed to load quiz ${quizId} (Theme ${themeId}) from ${filePath}:`, error);
      throw new Error(`Could not load quiz data. ${error.message}`);
    }
  }

  /**
   * Précharge (fetch et cache) les données de quiz pour un thème donné.
   * Utile pour améliorer la réactivité après sélection d'un thème.
   * Ne bloque pas et ignore les erreurs individuelles de chargement.
   * @param {number} themeId - L'ID du thème dont les quiz doivent être préchargés.
   */
  async preloadThemeQuizzes(themeId) {
    console.log(`Preloading quizzes for theme ${themeId}...`);
    try {
      const quizzesMeta = await this.getThemeQuizzes(themeId); // Récupère la liste des quiz du thème
      if (!quizzesMeta || quizzesMeta.length === 0) return;

      // Créer un tableau de promesses de chargement pour chaque quiz
      const preloadPromises = quizzesMeta.map(quizMeta =>
        this.getQuiz(themeId, quizMeta.id) // getQuiz mettra en cache si succès
          .catch(error => {
            // Log l'échec mais ne bloque pas les autres
            console.warn(`[Preload] Failed to preload quiz ${quizMeta.id}: ${error.message}`);
            return null; // Résout la promesse pour que Promise.all continue
          })
      );

      // Attendre que toutes les tentatives de préchargement soient terminées
      await Promise.all(preloadPromises);
      console.log(`Preloading attempt finished for theme ${themeId}.`);

    } catch (error) {
      console.error(`Error during quiz preloading for theme ${themeId}:`, error);
      // Ne pas propager l'erreur car c'est une optimisation
    }
  }

  // ----- Gestion du Cache (Optionnel) -----

  /**
   * Vide une partie ou l'ensemble du cache en mémoire.
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