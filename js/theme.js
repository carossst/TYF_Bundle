/*
 * js/themeController.js - Version 2.2.1 (Fixed version)
 * Contrôleur pour la gestion des thèmes et des quiz dans l'application
 * Implémente le chargement à la demande et le cycle de vie des données
 */

import resourceManager from './resourceManager.js';
import storage from './storage.js';

class ThemeController {
  constructor() {
    // État des données actuellement chargées
    this.currentThemeId = null;
    this.currentQuizId = null;
    this.loadingStatus = {
      themes: false,
      quizzes: false
    };
    
    console.log("ThemeController initialisé (v2.2.1 - Fixed)");
  }

  /**
   * Récupère les métadonnées de tous les thèmes
   * @returns {Promise<Array>} Liste des thèmes avec informations de base
   */
  async getAllThemes() {
    this.loadingStatus.themes = true;
    try {
      const metadata = await resourceManager.loadMetadata();
      
      // Enrichir les métadonnées avec les informations de progression
      const enrichedThemes = await this.enrichThemesWithProgress(metadata.themes);
      
      this.loadingStatus.themes = false;
      return enrichedThemes;
    } catch (error) {
      this.loadingStatus.themes = false;
      console.error("Erreur lors du chargement des thèmes:", error);
      throw error;
    }
  }
  
  /**
   * Ajoute les informations de progression aux thèmes
   * @param {Array} themes - Liste des thèmes à enrichir
   * @returns {Array} Thèmes enrichis avec la progression
   */
  async enrichThemesWithProgress(themes) {
    // Récupérer toutes les données de progression
    const progress = storage.getProgress();
    
    return themes.map(theme => {
      // Récupérer la progression pour ce thème
      const themeProgress = progress?.themes?.[theme.id] || null;
      
      // Informations de base sur la progression
      let completedQuizzes = 0;
      const totalQuizzes = theme.quizzes ? theme.quizzes.length : 0;
      
      // Si des données de progression existent pour ce thème et qu'il y a des quiz
      if (themeProgress && themeProgress.quizzes && theme.quizzes) {
        // Compter les quiz complétés
        for (const quizId in themeProgress.quizzes) {
          if (themeProgress.quizzes[quizId] && themeProgress.quizzes[quizId].completed) {
            completedQuizzes++;
          }
        }
        
        // Enrichir chaque quiz avec sa progression
        theme.quizzes = theme.quizzes.map(quiz => {
          const quizProgress = themeProgress.quizzes[quiz.id];
          return {
            ...quiz,
            progress: quizProgress ? {
              completed: quizProgress.completed,
              score: quizProgress.score,
              total: quizProgress.total,
              accuracy: quizProgress.accuracy
            } : null
          };
        });
      }
      
      // Ajouter les informations de progression au thème
      return {
        ...theme,
        progress: {
          completedQuizzes,
          totalQuizzes,
          completionRate: totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0
        }
      };
    });
  }
  
  /**
   * Récupère les informations de base sur les quiz d'un thème
   * @param {number} themeId - ID du thème
   * @returns {Promise<Array>} Liste des quiz avec métadonnées et progression
   */
  async getThemeQuizzes(themeId) {
    try {
      // Récupérer les quiz depuis les métadonnées
      const quizzes = await resourceManager.getThemeQuizzes(themeId);
      
      // Enrichir avec les données de progression
      const progress = storage.getProgress();
      const themeProgress = progress?.themes?.[themeId] || null;
      
      return quizzes.map(quiz => {
        const quizProgress = themeProgress?.quizzes?.[quiz.id] || null;
        return {
          ...quiz,
          progress: quizProgress ? {
            completed: quizProgress.completed,
            score: quizProgress.score,
            total: quizProgress.total,
            accuracy: quizProgress.accuracy
          } : null
        };
      });
    } catch (error) {
      console.error(`Erreur lors du chargement des quiz pour le thème ${themeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Charge les données complètes d'un quiz
   * @param {number} themeId - ID du thème
   * @param {number} quizId - ID du quiz
   * @returns {Promise<Object>} Données complètes du quiz avec questions
   */
  async getQuiz(themeId, quizId) {
    this.currentThemeId = themeId;
    this.currentQuizId = quizId;
    this.loadingStatus.quizzes = true;
    
    try {
      // Charger le quiz complet
      const quizData = await resourceManager.getQuiz(themeId, quizId);
      
      // Précharger les autres quiz de ce thème en arrière-plan
      this.preloadOtherQuizzes(themeId, quizId);
      
      this.loadingStatus.quizzes = false;
      return quizData;
    } catch (error) {
      this.loadingStatus.quizzes = false;
      console.error(`Erreur lors du chargement du quiz ${quizId} (thème ${themeId}):`, error);
      throw error;
    }
  }
  
  /**
   * Précharge le premier quiz de chaque thème
   * @param {number} themeId - ID du thème sélectionné
   * @private
   */
  async preloadFirstQuizzes(themeId) {
    try {
      // Charger les métadonnées si nécessaire
      const metadata = await resourceManager.loadMetadata();
      const themeInfo = metadata.themes.find(theme => theme.id === Number(themeId));
      
      if (themeInfo && themeInfo.quizzes && themeInfo.quizzes.length > 0) {
        // Précharger le premier quiz de ce thème
        const firstQuiz = themeInfo.quizzes[0];
        resourceManager.getQuiz(themeId, firstQuiz.id).catch(error => {
          // Attraper l'erreur pour ne pas interrompre le flux
          console.warn(`Échec du préchargement du premier quiz ${firstQuiz.id}:`, error);
        });
      }
    } catch (error) {
      console.warn("Échec du préchargement des premiers quiz:", error);
      // Ne pas propager l'erreur, c'est une optimisation non critique
    }
  }
  
  /**
   * Précharge les autres quiz d'un thème après sélection d'un quiz
   * @param {number} themeId - ID du thème
   * @param {number} selectedQuizId - ID du quiz actuellement sélectionné
   * @private
   */
  async preloadOtherQuizzes(themeId, selectedQuizId) {
    try {
      // Obtenir les métadonnées des quiz pour ce thème
      const quizzes = await resourceManager.getThemeQuizzes(themeId);
      
      // Filtrer pour exclure le quiz déjà chargé
      const otherQuizzes = quizzes.filter(quiz => quiz.id !== Number(selectedQuizId));
      
      // Précharger en arrière-plan
      for (const quiz of otherQuizzes) {
        resourceManager.getQuiz(themeId, quiz.id).catch(error => {
          // Attraper l'erreur pour ne pas interrompre le flux
          console.warn(`Échec du préchargement du quiz ${quiz.id}:`, error);
        });
        
        // Petite pause pour ne pas surcharger les ressources
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.warn("Échec du préchargement des autres quiz:", error);
      // Ne pas propager l'erreur, c'est une optimisation non critique
    }
  }
  
  /**
   * Sauvegarde les résultats d'un quiz
   * @param {number} themeId - ID du thème
   * @param {number} quizId - ID du quiz
   * @param {Object} results - Résultats du quiz à sauvegarder
   * @returns {Promise<boolean>} Succès de la sauvegarde
   */
  async saveQuizResults(themeId, quizId, results) {
    if (!results || !themeId || !quizId) {
      console.error("Données de résultats invalides pour la sauvegarde");
      return false;
    }
    
    try {
      // Utiliser le service de stockage pour enregistrer les résultats
      const success = await storage.saveQuizResult(themeId, quizId, results);
      
      if (success) {
        console.log(`Résultats du quiz ${quizId} (thème ${themeId}) sauvegardés avec succès`);
      } else {
        console.error(`Échec de la sauvegarde des résultats du quiz ${quizId}`);
      }
      
      return success;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des résultats:", error);
      return false;
    }
  }
  
  /**
   * Nettoie les ressources après utilisation
   * Utile pour libérer de la mémoire si nécessaire
   */
  cleanup() {
    this.currentThemeId = null;
    this.currentQuizId = null;
    resourceManager.clearCache('quizzes');
    console.log("ThemeController: nettoyage effectué");
  }
}

export default ThemeController;