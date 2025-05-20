/*
 * js/data/storage.js - Version 2.2.2 (Non-module)
 * Gestion du stockage local (localStorage) pour la progression et les statistiques.
 */

// Éviter les imports avec une référence globale
// var resourceManager = window.ResourceManager; // Sera défini après chargement de resourceManager.js

// Classe StorageManager
function StorageManager() {
  this.progressKey = 'tyf_quiz_progress_v2.2';
  this.statsKey = 'tyf_global_stats_v2.2';
  this.badgeKey = 'tyf_user_badges_v2.2';
  console.log("StorageManager initialized (non-module version)");
}

// ----- Méthodes générales localStorage -----

StorageManager.prototype._saveData = function(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
     if (e.name === 'QuotaExceededError') {
         alert("Storage limit reached! Cannot save further progress. Older data might be removed automatically by the browser.");
     }
    return false;
  }
};

StorageManager.prototype._getData = function(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error(`Error retrieving or parsing ${key} from localStorage:`, e);
    return null;
  }
};

StorageManager.prototype._clearData = function(key) {
  try {
    localStorage.removeItem(key);
    console.log(`Data cleared for key: ${key}`);
    return true;
  } catch (e) {
    console.error(`Error clearing ${key} from localStorage:`, e);
    return false;
  }
};

// ----- Gestion de la Progression par Quiz -----

StorageManager.prototype.saveQuizResult = function(themeId, quizId, results) {
   if (!results || typeof results !== 'object' || !results.theme || !results.quiz) { 
     console.error("Invalid results object provided to saveQuizResult."); 
     return false; 
   }
   
   console.log(`Saving results for Theme ${themeId}, Quiz ${quizId}`);
   let progress = this.getProgress() || { themes: {} };
   if (!progress.themes[themeId]) { progress.themes[themeId] = { quizzes: {} }; }

   // Sauvegarder un résumé du résultat
   const simplifiedResult = {
       score: results.score, 
       total: results.total, 
       accuracy: results.accuracy,
       completed: results.completed,
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
};

StorageManager.prototype.getQuizResult = function(themeId, quizId) {
  const progress = this.getProgress();
  return progress?.themes?.[themeId]?.quizzes?.[quizId] || null;
};

StorageManager.prototype.getProgress = function() { 
  return this._getData(this.progressKey); 
};

// ----- Gestion des Statistiques Globales -----

StorageManager.prototype.updateGlobalStats = function(quizResults) {
   if (!quizResults || !quizResults.completed) { return; }
   
   console.log("Updating global stats...");
   let stats = this.getGlobalStats() || {
      completedQuizzesSet: {}, // Pour suivre les quiz uniques complétés
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
      totalTimePlayedSeconds: 0,
      quizHistory: []
   };
   
   const quizKey = `${quizResults.theme.id}_${quizResults.quiz.id}`;
   const isNewCompletion = !stats.completedQuizzesSet[quizKey];

   // Mettre à jour les compteurs seulement pour nouvelle complétion
   if (isNewCompletion) {
       stats.completedQuizzesSet[quizKey] = true;
       stats.totalQuestionsAnswered += quizResults.total;
       stats.totalCorrectAnswers += quizResults.score;
   }
   
   // Toujours ajouter le temps de jeu
   stats.totalTimePlayedSeconds += quizResults.totalTime || 0;

   // Ajouter à l'historique
   stats.quizHistory.unshift({
      date: quizResults.dateCompleted || new Date().toISOString(),
      themeId: quizResults.theme.id,
      themeName: quizResults.theme.name || `Theme ${quizResults.theme.id}`,
      quizId: quizResults.quiz.id,
      quizName: quizResults.quiz.name || `Quiz ${quizResults.quiz.id}`,
      score: quizResults.score,
      total: quizResults.total,
      accuracy: quizResults.accuracy,
      time: quizResults.totalTime || 0
   });

   // Limiter l'historique à 20 entrées
   if (stats.quizHistory.length > 20) {
      stats.quizHistory.splice(20);
   }

   this._saveData(this.statsKey, stats);
   console.log("Global stats updated and saved.");
};

StorageManager.prototype.getGlobalStats = function() {
  return this._getData(this.statsKey);
};

// Calcule les statistiques agrégées pour l'affichage
StorageManager.prototype.getVisualizationData = async function() {
   let allThemesData = [];
   let totalPossibleQuizzes = 50; // Fallback value
   
   try {
       if (window.ResourceManager) { // S'assurer que ResourceManager est disponible
         const metadata = await window.ResourceManager.loadMetadata();
         allThemesData = metadata.themes || [];
         // Calculer le total des quiz depuis les métadonnées
         totalPossibleQuizzes = allThemesData.reduce((sum, theme) => sum + (theme.quizzes?.length || 0), 0);
       } else {
         console.warn("ResourceManager not available for visualization data");
       }
   } catch (e) {
       console.error("Could not load metadata for visualization", e);
   }

   const progress = this.getProgress() || { themes: {} };
   const globalStats = this.getGlobalStats() || { 
     completedQuizzesSet: {}, 
     totalQuestionsAnswered: 0, 
     totalCorrectAnswers: 0, 
     totalTimePlayedSeconds: 0, 
     quizHistory: [] 
   };
   
   let themeStats = {};

   allThemesData.forEach(themeInfo => {
       const themeId = themeInfo.id;
       const themeProgress = progress.themes ? progress.themes[themeId] : null;
       const quizzesInThemeMeta = themeInfo.quizzes || [];
       const totalQuizzesInTheme = quizzesInThemeMeta.length;

       let themeCorrect = 0; 
       let themeTotalAnsweredInCompleted = 0; 
       let themeCompletedCount = 0;

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
   const globalCompletion = totalPossibleQuizzes > 0 ? Math.round((uniqueCompletedCount / totalPossibleQuizzes) * 100) : 0;
   const globalAccuracy = globalStats.totalQuestionsAnswered > 0 ? Math.round((globalStats.totalCorrectAnswers / globalStats.totalQuestionsAnswered) * 100) : 0;
   const avgTimePerQuestion = globalStats.totalQuestionsAnswered > 0 ? Math.round(globalStats.totalTimePlayedSeconds / globalStats.totalQuestionsAnswered) : 0;

   let bestTheme = null; let worstTheme = null;
   let highestAccuracy = -1; let lowestAccuracy = 101;
   
   Object.values(themeStats).forEach(stats => {
       if (stats.quizzes.completed > 0) {
           if (stats.avgAccuracy >= highestAccuracy) { 
             if (stats.avgAccuracy > highestAccuracy || (bestTheme && stats.completionRate > bestTheme.stats.completionRate)) { 
               highestAccuracy = stats.avgAccuracy; 
               bestTheme = { id: stats.id, stats: stats }; 
             } 
           }
           if (stats.avgAccuracy <= lowestAccuracy) { 
             if (stats.avgAccuracy < lowestAccuracy || (worstTheme && stats.completionRate < worstTheme.stats.completionRate)) { 
               lowestAccuracy = stats.avgAccuracy; 
               worstTheme = { id: stats.id, stats: stats }; 
             } 
           }
       }
   });

   return {
      themeStats: themeStats, 
      globalCompletion: globalCompletion, 
      globalAccuracy: globalAccuracy,
      totalQuizzes: totalPossibleQuizzes, 
      completedQuizzes: uniqueCompletedCount,
      totalQuestions: globalStats.totalQuestionsAnswered, 
      correctAnswers: globalStats.totalCorrectAnswers,
      avgTimePerQuestion: avgTimePerQuestion, 
      bestTheme: bestTheme, 
      worstTheme: worstTheme,
      history: globalStats.quizHistory || []
   };
};

StorageManager.prototype.resetAllData = function() {
  const progressCleared = this._clearData(this.progressKey);
  const statsCleared = this._clearData(this.statsKey);
  const badgesCleared = this._clearData(this.badgeKey);

  if (progressCleared && statsCleared && badgesCleared) {
    console.log("All progress, stats, and badges reset.");
    return true;
  }
  console.error("Failed to reset all data.");
  return false;
};

// ----- Fonctions Badges -----
StorageManager.prototype.getUserBadges = async function() { 
  return this._getData(this.badgeKey) || []; 
};

StorageManager.prototype.addBadge = async function(badge) {
    if (!badge || !badge.id) { 
      console.error("Invalid badge object."); 
      return false; 
    }
    
    const badges = await this.getUserBadges();
    if (!badges.some(b => b.id === badge.id)) {
        console.log(`Awarding new badge: ${badge.name}`);
        badges.push({ ...badge, dateEarned: new Date().toISOString() });
        this._saveData(this.badgeKey, badges);
        // Déclencher un événement pour notifier l'UI
        document.dispatchEvent(new CustomEvent('badgesEarned', { 
          detail: { badges: [badge] } 
        }));
        return true; // Nouveau badge ajouté
    }
    return false; // Badge déjà possédé
};

// Fonction pour vérifier les badges
StorageManager.prototype.checkAndAwardBadges = async function(results) {
    if (!results || !results.completed) return [];

    let newBadges = [];
    const allBadges = await this.getUserBadges();
    
    try {
        const stats = await this.getVisualizationData();

        // Badge: Premier Quiz Terminé
        if (!allBadges.some(b => b.id === 'first_completed')) {
            if (await this.addBadge({ 
              id: 'first_completed', 
              name: 'First Step', 
              description: 'Completed your first quiz!', 
              icon: 'fas fa-flag' 
            })) {
                 newBadges.push(
                   allBadges.find(b => b.id === 'first_completed') || 
                   { name: 'First Step', icon: 'fas fa-flag' }
                 );
            }
        }

         // Badge: Score Parfait
         if (results.accuracy === 100) {
             if (await this.addBadge({ 
               id: 'perfect_score', 
               name: 'Perfectionist', 
               description: 'Achieved a perfect score!', 
               icon: 'fas fa-star' 
             })) {
                 newBadges.push(
                   allBadges.find(b => b.id === 'perfect_score') || 
                   { name: 'Perfectionist', icon: 'fas fa-star'}
                 );
             }
         }

         // Badge: Compléter un thème
         const themeId = results.theme.id;
         const themeStats = stats.themeStats[themeId];
         if (themeStats && themeStats.completionRate === 100) {
              const badgeId = `theme_${themeId}_completed`;
             if (await this.addBadge({ 
               id: badgeId, 
               name: `Master of ${themeStats.name}`, 
               description: `Completed all quizzes in the ${themeStats.name} theme!`, 
               icon: 'fas fa-medal' 
             })) {
                  newBadges.push(
                    allBadges.find(b => b.id === badgeId) || 
                    { name: `Master of ${themeStats.name}`, icon: 'fas fa-medal'}
                  );
             }
         }

    } catch (error) {
        console.error("Error checking for badges:", error);
    }

    // Retourner les nouveaux badges gagnés
    return newBadges;
};

// ----- Timer Preferences -----
StorageManager.prototype.setTimerPreference = function(enabled) {
  return this._saveData('tyf_timer_preference', enabled);
};

StorageManager.prototype.getTimerPreference = async function() {
  return this._getData('tyf_timer_preference');
};

// Définition de storage comme variable globale
window.storage = new StorageManager();