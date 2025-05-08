/*
 * js/storage.js - Version 2.2.0 (12 avril 2024)
 * Gestion du stockage local (localStorage) pour la progression et les statistiques.
 * Fournit des méthodes pour sauvegarder/récupérer les résultats des quiz,
 * calculer et stocker les statistiques globales, et gérer l'historique.
 * Note: Aligné avec storage.test.js pour tester localStorage.
 */

// Import dynamique pour obtenir le nombre total de quizzes depuis metadata
// Note: C'est un peu inhabituel d'importer des données ici, mais nécessaire
// pour calculer le taux de complétion global sans dupliquer l'info.
// Une alternative serait de passer le totalQuizCount en argument de getVisualizationData.
import resourceManager from './resourceManager.js';

class StorageManager {
  constructor() {
    this.progressKey = 'tyf_quiz_progress_v2.2'; // Clé pour la progression détaillée par quiz
    this.statsKey = 'tyf_global_stats_v2.2';    // Clé pour les statistiques globales agrégées
    this.badgeKey = 'tyf_user_badges_v2.2';     // Clé pour les badges (si fonctionnalité activée)
    // this.streakKey = 'tyf_user_streaks_v2.2'; // Clé pour les séries (si fonctionnalité activée)
    console.log("StorageManager initialized (V2.2 - localStorage).");
  }

  // ----- Méthodes générales localStorage -----

  _saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      // console.log(`Data saved for key: ${key}`, data); // Uncomment for debug
      return true;
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
       if (e.name === 'QuotaExceededError') {
           alert("Storage limit reached! Cannot save further progress. Older data might be removed automatically by the browser.");
       }
      return false;
    }
  }

  _getData(key) {
    try {
      const data = localStorage.getItem(key);
      // console.log(`Data retrieved for key: ${key}`, data ? JSON.parse(data) : null); // Uncomment for debug
      return data ? JSON.parse(data) : null;
    } catch (e) {
      // Si les données sont corrompues, les supprimer peut être une option
      console.error(`Error retrieving or parsing ${key} from localStorage:`, e);
      // localStorage.removeItem(key); // Optionnel: nettoyer les données corrompues
      return null;
    }
  }

  _clearData(key) {
    try {
      localStorage.removeItem(key);
      console.log(`Data cleared for key: ${key}`);
      return true;
    } catch (e) {
      console.error(`Error clearing ${key} from localStorage:`, e);
      return false;
    }
  }

  // ----- Gestion de la Progression par Quiz -----

  saveQuizResult(themeId, quizId, results) {
     if (!results || typeof results !== 'object' || !results.theme || !results.quiz) { console.error("Invalid results object provided to saveQuizResult."); return false; }
     console.log(`Saving results for Theme ${themeId}, Quiz ${quizId}`);
     let progress = this.getProgress() || { themes: {} };
     if (!progress.themes[themeId]) { progress.themes[themeId] = { quizzes: {} }; }

     // Sauvegarder un résumé du résultat (sans les questions/réponses complètes)
     const simplifiedResult = {
         score: results.score, total: results.total, accuracy: results.accuracy,
         completed: results.completed, // Important
         dateCompleted: results.dateCompleted,
         totalTime: results.totalTime || 0
     };
     progress.themes[themeId].quizzes[quizId] = simplifiedResult;

     if (this._saveData(this.progressKey, progress)) {
          if (results.completed) {
             this.updateGlobalStats(results); // Met à jour les stats globales si le quiz est terminé
          }
          return true;
      }
      return false;
  }

  getQuizResult(themeId, quizId) {
    const progress = this.getProgress();
    return progress?.themes?.[themeId]?.quizzes?.[quizId] || null;
  }

  getProgress() { return this._getData(this.progressKey); }

  // ----- Gestion des Statistiques Globales -----

   updateGlobalStats(quizResults) {
     if (!quizResults || !quizResults.completed) { return; } // Agit seulement si le quiz est complété
     console.log("Updating global stats...");
     let stats = this.getGlobalStats() || {
        completedQuizzesSet: {}, // Track unique completed quizzes { 'themeId_quizId': true }
        totalQuestionsAnswered: 0, // Sum of total questions ONLY from uniquely completed quizzes
        totalCorrectAnswers: 0,    // Sum of scores ONLY from uniquely completed quizzes
        totalTimePlayedSeconds: 0, // Cumulative time across ALL attempts
        quizHistory: []            // Last N attempts (completed or not could be a choice)
     };
     const quizKey = `${quizResults.theme.id}_${quizResults.quiz.id}`;
     const isNewCompletion = !stats.completedQuizzesSet[quizKey];

     // Mettre à jour les compteurs de précision seulement si c'est une NOUVELLE complétion unique
     if (isNewCompletion) {
         stats.completedQuizzesSet[quizKey] = true;
         stats.totalQuestionsAnswered += quizResults.total;
         stats.totalCorrectAnswers += quizResults.score;
     }
     // Toujours ajouter le temps de jeu, même pour les reprises
     stats.totalTimePlayedSeconds += quizResults.totalTime || 0;

     // Ajouter à l'historique (toujours)
     stats.quizHistory.unshift({
        date: quizResults.dateCompleted || new Date().toISOString(),
        themeId: quizResults.theme.id,
        // Utiliser le nom du thème/quiz des résultats si disponible, sinon fallback
        themeName: quizResults.theme.name || `Theme ${quizResults.theme.id}`,
        quizId: quizResults.quiz.id,
        quizName: quizResults.quiz.name || `Quiz ${quizResults.quiz.id}`,
        score: quizResults.score,
        total: results.total,
        accuracy: results.accuracy,
        time: results.totalTime || 0
     });

     // Limiter l'historique
     const maxHistory = 20;
     if (stats.quizHistory.length > maxHistory) {
        stats.quizHistory.splice(maxHistory); // Enlève les plus anciens
     }

     this._saveData(this.statsKey, stats);
     console.log("Global stats updated and saved.");
   }

  getGlobalStats() { return this._getData(this.statsKey); }

  // Calcule les statistiques agrégées pour l'affichage (utilise metadata via resourceManager)
  async getVisualizationData() {
     let allThemesData = [];
     let totalPossibleQuizzes = 50; // Fallback value
     try {
         const metadata = await resourceManager.loadMetadata();
         allThemesData = metadata.themes || [];
         // Calculer le total réel des quiz depuis les métadonnées
         totalPossibleQuizzes = allThemesData.reduce((sum, theme) => sum + (theme.quizzes?.length || 0), 0);
     } catch (e) {
         console.error("Could not load metadata for visualization, using fallback counts.", e);
     }

     const progress = this.getProgress() || { themes: {} };
     const globalStats = this.getGlobalStats() || { completedQuizzesSet: {}, totalQuestionsAnswered: 0, totalCorrectAnswers: 0, totalTimePlayedSeconds: 0, quizHistory: [] };
     let themeStats = {};

     allThemesData.forEach(themeInfo => {
         const themeId = themeInfo.id;
         const themeProgress = progress.themes ? progress.themes[themeId] : null;
         const quizzesInThemeMeta = themeInfo.quizzes || [];
         const totalQuizzesInTheme = quizzesInThemeMeta.length;

         let themeCorrect = 0; let themeTotalAnsweredInCompleted = 0; let themeCompletedCount = 0;

         if (themeProgress && themeProgress.quizzes) {
             quizzesInThemeMeta.forEach(quizInfo => {
                 const result = themeProgress.quizzes[quizInfo.id];
                 if (result && result.completed) {
                     themeCompletedCount++;
                     themeCorrect += result.score;
                     themeTotalAnsweredInCompleted += result.total;
                 }
             });
         }

          themeStats[themeId] = {
             id: themeId, name: themeInfo.name,
             avgAccuracy: themeTotalAnsweredInCompleted > 0 ? Math.round((themeCorrect / themeTotalAnsweredInCompleted) * 100) : 0,
             completionRate: totalQuizzesInTheme > 0 ? Math.round((themeCompletedCount / totalQuizzesInTheme) * 100) : 0,
             quizzes: { completed: themeCompletedCount, total: totalQuizzesInTheme }
         };
     });

     const uniqueCompletedCount = Object.keys(globalStats.completedQuizzesSet).length;
     // Utiliser totalPossibleQuizzes calculé depuis metadata
     const globalCompletion = totalPossibleQuizzes > 0 ? Math.round((uniqueCompletedCount / totalPossibleQuizzes) * 100) : 0;
     const globalAccuracy = globalStats.totalQuestionsAnswered > 0 ? Math.round((globalStats.totalCorrectAnswers / globalStats.totalQuestionsAnswered) * 100) : 0;
     const avgTimePerQuestion = globalStats.totalQuestionsAnswered > 0 ? Math.round(globalStats.totalTimePlayedSeconds / globalStats.totalQuestionsAnswered) : 0;

     let bestTheme = null; let worstTheme = null;
     let highestAccuracy = -1; let lowestAccuracy = 101;
     Object.values(themeStats).forEach(stats => {
         if (stats.quizzes.completed > 0) {
             if (stats.avgAccuracy >= highestAccuracy) { if (stats.avgAccuracy > highestAccuracy || (bestTheme && stats.completionRate > bestTheme.stats.completionRate)) { highestAccuracy = stats.avgAccuracy; bestTheme = { id: stats.id, stats: stats }; } }
             if (stats.avgAccuracy <= lowestAccuracy) { if (stats.avgAccuracy < lowestAccuracy || (worstTheme && stats.completionRate < worstTheme.stats.completionRate)) { lowestAccuracy = stats.avgAccuracy; worstTheme = { id: stats.id, stats: stats }; } }
         }
     });

     return {
        themeStats: themeStats, globalCompletion: globalCompletion, globalAccuracy: globalAccuracy,
        totalQuizzes: totalPossibleQuizzes, completedQuizzes: uniqueCompletedCount,
        totalQuestions: globalStats.totalQuestionsAnswered, correctAnswers: globalStats.totalCorrectAnswers,
        avgTimePerQuestion: avgTimePerQuestion, bestTheme: bestTheme, worstTheme: worstTheme,
        history: globalStats.quizHistory || []
     };
   }

  resetAllData() {
    // La confirmation est gérée dans l'UI
    const progressCleared = this._clearData(this.progressKey);
    const statsCleared = this._clearData(this.statsKey);
    const badgesCleared = this._clearData(this.badgeKey); // Supprimer aussi les badges
    // const streaksCleared = this._clearData(this.streakKey); // Si implémenté

    if (progressCleared && statsCleared && badgesCleared) {
      console.log("All progress, stats, and badges reset.");
      return true;
    }
    console.error("Failed to reset all data.");
    return false;
  }

    // ----- Fonctions Badges (Exemple simple) -----
    async getUserBadges() { return this._getData(this.badgeKey) || []; }

    async addBadge(badge) {
        if (!badge || !badge.id) { console.error("Invalid badge object."); return false; }
        const badges = await this.getUserBadges();
        if (!badges.some(b => b.id === badge.id)) {
            console.log(`Awarding new badge: ${badge.name}`);
            badges.push({ ...badge, dateEarned: new Date().toISOString() });
            this._saveData(this.badgeKey, badges);
            // Déclencher un événement pour notifier l'UI
            document.dispatchEvent(new CustomEvent('badgesEarned', { detail: { badges: [badge] } }));
            return true; // Nouveau badge ajouté
        }
        return false; // Badge déjà possédé
    }

     // Fonction à appeler après un quiz pour vérifier les badges
     async checkAndAwardBadges(results) {
        if (!results || !results.completed) return;

        let newBadges = [];
        const allBadges = await this.getUserBadges();
        const stats = await this.getVisualizationData(await resourceManager.loadMetadata().then(m=>m.themes)); // Need full stats

        // Badge: Premier Quiz Terminé
        if (!allBadges.some(b => b.id === 'first_completed')) {
            if (await this.addBadge({ id: 'first_completed', name: 'First Step', description: 'Completed your first quiz!', icon: 'fas fa-flag' })) {
                 newBadges.push(allBadges.find(b => b.id === 'first_completed') || { name: 'First Step', icon: 'fas fa-flag' });
            }
        }

         // Badge: Score Parfait
         if (results.accuracy === 100) {
             if (await this.addBadge({ id: 'perfect_score', name: 'Perfectionist', description: 'Achieved a perfect score!', icon: 'fas fa-star' })) {
                 newBadges.push(allBadges.find(b => b.id === 'perfect_score') || { name: 'Perfectionist', icon: 'fas fa-star'});
             }
         }

         // Badge: Compléter un thème
         const themeId = results.theme.id;
         const themeStats = stats.themeStats[themeId];
         if (themeStats && themeStats.completionRate === 100) {
              const badgeId = `theme_${themeId}_completed`;
             if (await this.addBadge({ id: badgeId, name: `Master of ${themeStats.name}`, description: `Completed all quizzes in the ${themeStats.name} theme!`, icon: 'fas fa-medal' })) {
                  newBadges.push(allBadges.find(b => b.id === badgeId) || { name: `Master of ${themeStats.name}`, icon: 'fas fa-medal'});
             }
         }

        // // Badge: Compléter tous les quiz
        // if (stats.globalCompletion === 100) {
        //     if (await this.addBadge({ id: 'all_completed', name: 'Quiz Master', description: 'Completed all available quizzes!', icon: 'fas fa-crown' })) {
        //         newBadges.push(allBadges.find(b => b.id === 'all_completed'));
        //     }
        // }

        // (Ajouter d'autres logiques de badge ici : séries, vitesse, etc.)

        // Retourner les nouveaux badges gagnés (pour notification UI)
        return newBadges;
    }

}

export default new StorageManager();