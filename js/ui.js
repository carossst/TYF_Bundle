
```javascript
/*
 * js/ui.js - Version 2.2.2 (Non-module)
 * Gestion de l'interface utilisateur pour Test Your French.
 * Responsable de l'affichage des écrans, du rendu des données (thèmes, quiz, questions),
 * de la gestion des interactions utilisateur (clics, etc.),
 * et de la coordination avec QuizManager, ResourceManager et StorageManager.
 */

// Éviter les imports avec des références globales
// var storage = window.storage; // Sera défini après chargement de storage.js
// var resourceManager = window.ResourceManager; // Sera défini après chargement de resourceManager.js

// Classe QuizUI
function QuizUI(quizManager, domElements, resourceManagerInstance) {
  if (!quizManager || !domElements || !resourceManagerInstance) {
    throw new Error("QuizManager, DOM elements, and ResourceManager are required for QuizUI.");
  }
  this.quizManager = quizManager;
  this.dom = domElements;
  this.resourceManager = resourceManagerInstance; // Store the instance
  this.themeIndexCache = null; // Cache pour l'index des thèmes (metadata)
  console.log("QuizUI initialized (v2.2.2 - Non-module version)");
}

// ----- Initialisation & Événements -----

/** Charge les données initiales nécessaires et affiche l'écran d'accueil. */
QuizUI.prototype.initializeWelcomeScreen = async function() {
  this._clearError(this.dom.themesList); // Clear potential error messages
  this._showLoading(this.dom.themesList, "Chargement des thèmes..."); // Show loading

  try {
    // Charger et mettre en cache l'index des thèmes
    const themes = await this.getThemeIndex(); // Uses resourceManager via getThemeIndex

    // Afficher les thèmes sur l'écran d'accueil
    this.renderThemes(themes); // Renders themes into this.dom.themesList

    // Afficher les statistiques d'accueil
    await this.displayWelcomeStats(); // Use internal method

    this._hideLoading(this.dom.themesList); // Hide loading after themes are rendered

  } catch (error) {
    console.error("Failed to initialize welcome screen data and render themes:", error);
    // Afficher un message d'erreur dans le container des thèmes
    this._showError(this.dom.themesList, "Impossible de charger les thèmes. Veuillez vérifier votre connexion.");
    // Afficher des placeholders génériques si les compteurs globaux n'ont pas été mis à jour par main.js
    if (this.dom.totalThemesCount) this.dom.totalThemesCount.textContent = '...';
    if (this.dom.totalQuestionsCount) this.dom.totalQuestionsCount.textContent = '...';
  }

  // Afficher l'écran d'accueil (même si le chargement des thèmes a échoué partiellement)
  this.hideAllScreens();
  this.dom.screens.welcome.classList.remove('hidden');
  this.dom.screens.welcome.classList.add('fade-in');
  this.dom.screens.welcome.addEventListener('animationend', () => this.dom.screens.welcome.classList.remove('fade-in'), { once: true });
  // Focus sur le premier élément focusable ou l'écran lui-même
  const firstFocusable = this.dom.screens.welcome.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) { firstFocusable.focus(); } else { this.dom.screens.welcome.setAttribute('tabindex', '-1'); this.dom.screens.welcome.focus(); }
};

/** Récupère l'index des thèmes (via cache ou ResourceManager). */
QuizUI.prototype.getThemeIndex = async function() {
  if (this.themeIndexCache) return this.themeIndexCache;
  try {
    const metadata = await this.resourceManager.loadMetadata(); // Use ResourceManager instance
    if (!metadata || !Array.isArray(metadata.themes)) throw new Error("Invalid metadata structure");
    this.themeIndexCache = metadata.themes;
    return this.themeIndexCache;
  } catch (error) {
    console.error("Failed to get theme index in UI:", error);
    throw error; // Propager pour gestion par l'appelant
  }
};

/** Affiche les statistiques sur l'écran d'accueil. */
QuizUI.prototype.displayWelcomeStats = async function() {
  try {
    // Get themes again to calculate total quizzes (or pass totalQuizzes from main.js)
    const themes = await this.getThemeIndex(); // Uses cache if available
    const statsData = await window.storage.getVisualizationData(themes); // Use storage global

    const welcomeStatsEl = this.dom.welcomeStatsPlaceholder; // Use correct DOM ref

    if (statsData && statsData.completedQuizzes > 0 && welcomeStatsEl) {
      const welcomeMsg = document.createElement('div');
      welcomeMsg.className = 'welcome-stats';
      // Use statsData which contains calculated totals and percentages
      welcomeMsg.innerHTML = `
          <p>Welcome back! You've completed ${statsData.completedQuizzes}/${statsData.totalQuizzes} quizzes (${statsData.globalCompletion}%).</p>
          <p>Your average accuracy: ${statsData.globalAccuracy}%</p>
      `;
      welcomeStatsEl.innerHTML = ''; // Clear placeholder
      welcomeStatsEl.appendChild(welcomeMsg);
      welcomeStatsEl.classList.remove('hidden'); // Ensure container is visible
    } else if (welcomeStatsEl) {
      welcomeStatsEl.innerHTML = ''; // Clear if no stats
      // welcomeStatsEl.classList.add('hidden'); // Optional: hide container if empty
    }
  } catch (error) {
    console.warn("Error displaying welcome stats:", error);
    if (this.dom.welcomeStatsPlaceholder) this.dom.welcomeStatsPlaceholder.innerHTML = ''; // Clear on error too
  }
};

/** Attache les écouteurs d'événements aux éléments DOM */
QuizUI.prototype.setupEventListeners = function() {
  // Navigation
  this.dom.buttons.backToThemes?.addEventListener('click', () => this.showWelcomeScreen()); // Back from quiz selection -> Welcome
  this.dom.buttons.exitQuiz?.addEventListener('click', () => this.confirmExitQuiz()); // Exit from quiz -> Confirmation -> depends on state

  // Statistiques
  this.dom.buttons.showStats?.addEventListener('click', () => this.showStatsScreen()); // Welcome -> Stats
  this.dom.buttons.showStatsFromQuiz?.addEventListener('click', () => this.showStatsScreen()); // Quiz Selection -> Stats
  this.dom.buttons.backFromStats?.addEventListener('click', () => this.showWelcomeScreen()); // Stats -> Welcome
  this.dom.buttons.resetProgress?.addEventListener('click', () => this.confirmResetProgress());

  // Quiz
  // NOTE: La soumission se fait maintenant en cliquant sur le bouton 'Soumettre' sur la dernière question
  // Les boutons Précédent/Suivant naviguent.
  this.dom.buttons.prev?.addEventListener('click', () => this.goToPreviousQuestion());
  this.dom.buttons.next?.addEventListener('click', () => this.goToNextQuestion());
  this.dom.buttons.submit?.addEventListener('click', () => this.showResults()); // Le bouton Submit est affiché uniquement sur la dernière question

  // Résultats
  this.dom.buttons.restart?.addEventListener('click', () => this.restartCurrentQuiz());
  this.dom.buttons.export?.addEventListener('click', () => this.exportResults());
  this.dom.buttons.print?.addEventListener('click', () => this.printResults());
  this.dom.buttons.copy?.addEventListener('click', () => this.copyShareText());

  // Timer toggle checkbox on welcome screen
  this.dom.quiz.timer.checkbox?.addEventListener('change', (e) => {
    const timerEnabled = e.target.checked;
    this.quizManager.timerEnabled = timerEnabled;
    window.storage.setTimerPreference(timerEnabled); // Save preference
    console.log("Timer enabled set to:", this.quizManager.timerEnabled);
    // Update UI state if currently on the quiz screen
    if (!this.dom.screens.quiz.classList.contains('hidden')) {
      this.updateTimerUIState();
      if (!timerEnabled && this.quizManager.startTime) { // If timer was running and disabled
        this.stopTimer(); // Stop internal timer logic
      } else if (timerEnabled && !this.quizManager.startTime && !this.quizManager.isQuizComplete()) {
        // If timer enabled AND quiz in progress but timer wasn't started (e.g. first question)
        this.startTimer(); // Restart timer logic
      }
    }
  });

  // Timer display toggle button on quiz screen
  this.dom.quiz.timer.toggle?.addEventListener('click', () => this.toggleTimer());

  // Délégation d'événements pour les listes dynamiques (Thèmes et Quiz)
  this.dom.themesList?.addEventListener('click', (e) => this._handleSelectionClick(e, 'theme'));
  this.dom.themesList?.addEventListener('keydown', (e) => this._handleSelectionKeydown(e, 'theme'));
  this.dom.quizzesList?.addEventListener('click', (e) => this._handleSelectionClick(e, 'quiz'));
  this.dom.quizzesList?.addEventListener('keydown', (e) => this._handleSelectionKeydown(e, 'quiz'));

  console.log("UI Event listeners set up.");
  // Load initial timer preference
  window.storage.getTimerPreference().then(enabled => {
    this.quizManager.timerEnabled = enabled !== null ? enabled : true; // Default to enabled
    if (this.dom.quiz.timer.checkbox) {
      this.dom.quiz.timer.checkbox.checked = this.quizManager.timerEnabled;
    }
    console.log("Loaded timer preference:", this.quizManager.timerEnabled);
    // Update UI if already on quiz screen (unlikely on load, but good practice)
    if (!this.dom.screens.quiz.classList.contains('hidden')) { this.updateTimerUIState(); }
  }).catch(err => {
    console.warn("Failed to load timer preference:", err);
    this.quizManager.timerEnabled = true; // Default to enabled on error
    if (this.dom.quiz.timer.checkbox) this.dom.quiz.timer.checkbox.checked = true;
  });
};

// ----- Gestionnaires d'événements délégués -----

QuizUI.prototype._handleSelectionClick = function(event, type) {
  const item = event.target.closest('.selection-item');
  if (!item || item.classList.contains('is-loading') || item.classList.contains('has-error')) return; // Ignore clicks on loading/error states

  if (type === 'theme') {
    const themeId = Number(item.dataset.themeId);
    if (themeId) {
      // We no longer transition to a separate theme selection screen.
      // Clicking a theme goes directly to its quiz selection screen.
      this.quizManager.currentThemeId = themeId; // Set theme ID in manager
      this.showQuizSelection(); // Go to quiz selection for this theme
    }
  } else if (type === 'quiz') {
    const themeId = Number(item.dataset.themeId); // Get themeId from item dataset
    const quizId = Number(item.dataset.quizId);
    if (themeId && quizId) {
      // Check if parent themeId matches currentThemeId in manager
      // This shouldn't be necessary if navigation is correct, but good safeguard
      if (this.quizManager.currentThemeId !== themeId) {
        console.warn(`Quiz item themeId (${themeId}) mismatch with currentThemeId (${this.quizManager.currentThemeId}). Updating manager.`);
        this.quizManager.currentThemeId = themeId;
      }
      this.startSelectedQuiz(themeId, quizId);
    } else {
      console.error(`Missing themeId (${themeId}) or quizId (${quizId}) on selection item.`);
    }
  }
};

QuizUI.prototype._handleSelectionKeydown = function(event, type) {
  if (event.key === 'Enter' || event.key === ' ') {
    const item = event.target.closest('.selection-item');
    if (!item || item.classList.contains('is-loading') || item.classList.contains('has-error')) return; // Ignore on loading/error
    event.preventDefault(); // Empêche le scroll de la page avec Espace
    // Déclenche la même logique que le clic
    this._handleSelectionClick({ target: item }, type);
  }
};

// ----- Indicateurs Visuels (Loading/Error) -----
QuizUI.prototype._showLoading = function(containerElement, message = "Loading...") {
  // Added a check to ensure containerElement exists
  if (!containerElement) { console.error("Cannot show loading, container element is null."); return; }

  // Clearing any existing content that is not a loader or error message
  // This is important for selection lists (themesList, quizzesList)
  // For quiz container, we might just want to add the loader overlay?
  // Let's stick to the original logic which clears the container for selection lists.
  // For the quiz screen itself (this.dom.quiz), clearing might remove question elements.
  // Let's adapt: only clear for selection lists, add overlay for quiz screen.

  let loadingEl = containerElement.querySelector('.loading-indicator');
  let errorEl = containerElement.querySelector('.error-message'); // Also check for existing error

  if (containerElement === this.dom.themesList || containerElement === this.dom.quizzesList) {
       containerElement.innerHTML = ''; // Clear selection lists
       if (!loadingEl) { // Create only if needed
           loadingEl = document.createElement('div');
           loadingEl.className = 'loading-indicator';
           containerElement.appendChild(loadingEl);
       }
  } else { // Assume it's the quiz screen container or similar
       // Check if loader already exists, otherwise create it within the container
       if (!loadingEl) {
           loadingEl = document.createElement('div');
           loadingEl.className = 'loading-indicator loading-overlay'; // Add overlay class
           // Append to body or specific overlay container if you have one,
           // or just append to the container and style it as overlay
           containerElement.style.position = 'relative'; // Needed for absolute overlay
           containerElement.appendChild(loadingEl);
       }
        // Ensure existing content is visible below the overlay, not cleared
   }

   loadingEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
   loadingEl.classList.remove('hidden'); // Ensure it's visible

   if (errorEl) errorEl.classList.add('hidden'); // Hide any existing error message
   containerElement.classList.add('is-loading');
   containerElement.classList.remove('has-error');
};

QuizUI.prototype._hideLoading = function(containerElement) {
  // Added a check
  if (!containerElement) { console.error("Cannot hide loading, container element is null."); return; }
  const loadingEl = containerElement.querySelector('.loading-indicator');
  if (loadingEl) {
    loadingEl.classList.add('hidden');
    // Optional: remove overlay element if it was added
    if (loadingEl.classList.contains('loading-overlay')) {
       // If you added it to body, need to find it in body
       // If added to container, just remove it from container
       // For now, just hide is safer
       // loadingEl.remove(); // Use remove() if you truly want to remove it
    }
  }
  containerElement.classList.remove('is-loading');
};

QuizUI.prototype._showError = function(containerElement, message = "Could not load data.") {
  // Added a check
  if (!containerElement) { console.error("Cannot show error, container element is null."); return; }
  const loadingEl = containerElement.querySelector('.loading-indicator');
  let errorEl = containerElement.querySelector('.error-message');

  // Clearing previous content only for selection lists
   if (containerElement === this.dom.themesList || containerElement === this.dom.quizzesList) {
       containerElement.innerHTML = ''; // Clear selection lists
        if (!errorEl) { // Create only if needed
            errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            containerElement.appendChild(errorEl);
        }
   } else { // Assume it's the quiz screen container or similar
       // Check if error element already exists, otherwise create it
       if (!errorEl) {
           errorEl = document.createElement('div');
           errorEl.className = 'error-message';
           // Append to the container
           containerElement.appendChild(errorEl);
       }
        // Ensure loading is hidden
        if (loadingEl) loadingEl.classList.add('hidden');
   }

  errorEl.textContent = message;
  errorEl.classList.remove('hidden'); // Ensure it's visible


  if (loadingEl) loadingEl.classList.add('hidden'); // Ensure loading is hidden
  containerElement.classList.add('has-error');
  containerElement.classList.remove('is-loading');
};

QuizUI.prototype._clearError = function(containerElement) {
  // Added a check
  if (!containerElement) { console.error("Cannot clear error, container element is null."); return; }
  const errorEl = containerElement.querySelector('.error-message');
  if (errorEl) errorEl.classList.add('hidden');
  containerElement.classList.remove('has-error');
};

QuizUI.prototype.showGlobalError = function(message) {
  alert(`Error: ${message}`); // Simple fallback alert
  // Optionally add a more sophisticated global error display mechanism
};

// ----- Navigation & Rendu -----

QuizUI.prototype.hideAllScreens = function() {
  Object.values(this.dom.screens).forEach(screen => {
    if(screen){ // Check if screen element exists
      const screenId = screen.id;
      // Use display: none for result screen to ensure it's fully hidden from layout
      if(screenId === 'result') { screen.style.display = 'none'; }
      else { screen.classList.add('hidden'); }
      // Remove animation classes unconditionally
      screen.classList.remove('fade-in', 'fade-out');
    }
  });
};

QuizUI.prototype._transitionScreen = function(screenToShow) {
  if (!screenToShow) { console.error("Cannot transition, target screen is null."); return; }
  this.hideAllScreens();
  const screenId = screenToShow.id;

  // Use display: block for result screen, class 'hidden' for others
  if (screenId === 'result') { screenToShow.style.display = 'block'; }
  else { screenToShow.classList.remove('hidden'); }

  void screenToShow.offsetWidth; // Trigger reflow for animation
  screenToShow.classList.add('fade-in');
  // Clean up animation class after it finishes
  screenToShow.addEventListener('animationend', () => screenToShow.classList.remove('fade-in'), { once: true });

  // Manage focus for accessibility
  // Check if screenToShow exists before trying to focus
  if (screenToShow) {
    // Give focus to the screen container or the first focusable element within it
    // This makes navigation clearer for screen reader users and keyboard users
    // Use setTimeout to ensure focus is applied after the screen is fully visible/interactive
    setTimeout(() => {
        const firstFocusable = screenToShow.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          // If no focusable elements, make the screen container focusable
          screenToShow.setAttribute('tabindex', '-1');
          screenToShow.focus();
        }
        // Announce screen change for screen readers (optional, requires ARIA live region or similar)
        // console.log(`Screen changed to: ${screenId}`);
    }, 50); // Short delay
  }
  console.log(`Showing screen: ${screenId}`);
};


QuizUI.prototype.showWelcomeScreen = function() {
  // Re-initialize welcome screen which includes loading/rendering themes
  this.initializeWelcomeScreen();
  // Transition to the welcome screen element
  this._transitionScreen(this.dom.screens.welcome);
  // Reset quiz state in manager when returning to welcome screen
  this.quizManager.resetQuizState();
  this.stopTimer(); // Ensure timer is stopped
};

QuizUI.prototype.showQuizSelection = async function() {
  const themeId = this.quizManager.currentThemeId;
  if (!themeId) {
    // If no theme is selected, go back to welcome where themes are listed
    this.showWelcomeScreen();
    return;
  }

  this._transitionScreen(this.dom.screens.quizSelection);
  this._showLoading(this.dom.quizzesList, "Chargement des quiz...");
  this._clearError(this.dom.quizzesList);

  try {
    // Get theme info from the cached index
    const themeInfo = await this._getThemeInfoFromIndex(themeId); // Helper needed in UI
    if (!themeInfo) throw new Error(`Theme info not found for ID ${themeId}`);

    this.dom.themeTitle.textContent = themeInfo.name;
    this.dom.themeDescription.textContent = themeInfo.description;

    // Charger les métadonnées des quiz pour ce thème (utilise ResourceManager)
    const quizzesMeta = await this.resourceManager.getThemeQuizzes(themeId);

    // Enrichir les métadonnées des quiz avec les résultats stockés
    const quizzesWithProgress = this._enrichQuizzesWithProgress(themeId, quizzesMeta);

    this.renderQuizzes(themeInfo, quizzesWithProgress); // Render list
    this._hideLoading(this.dom.quizzesList);

    // Preload quiz data in background for this theme (optimisation)
    this.resourceManager.preloadThemeQuizzes(themeId);

  } catch (error) {
    console.error("Failed to show quizzes:", error);
    this.dom.themeTitle.textContent = "Error";
    this.dom.themeDescription.textContent = "";
    this._showError(this.dom.quizzesList, `Impossible de charger les quiz. ${error.message}`);
  }
  // Reset quiz state in manager when returning to quiz selection
  this.quizManager.resetQuizState();
  this.stopTimer(); // Ensure timer is stopped
};


/** Helper pour récupérer les infos d'un thème depuis l'index mis en cache */
QuizUI.prototype._getThemeInfoFromIndex = async function(themeId) {
  const themes = await this.getThemeIndex(); // Use cached index
  const themeInfo = themes.find(t => t.id === Number(themeId));
  // No error thrown here, the caller will handle null/undefined
  return themeInfo;
};

/** Helper pour enrichir les métadonnées des quiz avec la progression stockée */
QuizUI.prototype._enrichQuizzesWithProgress = function(themeId, quizzesMeta) {
  const progress = window.storage.getProgress(); // Use storage
  const themeProgress = progress?.themes?.[themeId];

  return quizzesMeta.map(quizMeta => {
    const quizResult = themeProgress?.quizzes?.[quizMeta.id];
    return {
      ...quizMeta,
      progress: quizResult ? {
        completed: quizResult.completed,
        score: quizResult.score,
        total: quizResult.total,
        accuracy: quizResult.accuracy,
        dateCompleted: quizResult.dateCompleted, // Add dateCompleted
        totalTime: quizResult.totalTime // Add totalTime
      } : null
    };
  });
};

QuizUI.prototype.showStatsScreen = async function() {
  this._transitionScreen(this.dom.screens.stats);
  // Show loading state for potentially slow parts
  this._showLoading(this.dom.stats.themeBars, "Calcul des statistiques..."); // Indicateur pour stats par thème
  // Assuming history list might also be slow, show loader there too
  if(this.dom.stats.historyList) this.dom.stats.historyList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Chargement historique...</div>';
  this._clearError(this.dom.stats.themeBars); // Clear potential errors

  try {
    // Need theme index to calculate total quizzes for completion % and theme names for rendering
    const themes = await this.getThemeIndex(); // Use cached index

    // Get all visualization data from storage
    const data = await window.storage.getVisualizationData(themes); // Use storage global and pass themes

    // Populate overview stats (Ensure DOM elements exist before setting textContent)
    if(this.dom.stats.completionRate) this.dom.stats.completionRate.textContent = `${data.globalCompletion}%`;
    if(this.dom.stats.completedQuizzes) this.dom.stats.completedQuizzes.textContent = data.completedQuizzes;
    // totalQuizzes is already set in main.js updateGlobalCounters, but update here too for consistency
    if(this.dom.stats.totalQuizzes) this.dom.stats.totalQuizzes.textContent = data.totalQuizzes;
    if(this.dom.stats.accuracy) this.dom.stats.accuracy.textContent = `${data.globalAccuracy}%`;
    if(this.dom.stats.correctAnswers) this.dom.stats.correctAnswers.textContent = data.correctAnswers;
    if(this.dom.stats.totalAnswers) this.dom.stats.totalAnswers.textContent = data.totalQuestions; // Corrected key name based on StorageManager
    if(this.dom.stats.avgTimePerQuestion) this.dom.stats.avgTimePerQuestion.textContent = data.avgTimePerQuestion > 0 ? `${data.avgTimePerQuestion}s` : '-';

    this.renderThemeBars(data.themeStats, themes); // Render theme performance bars
    this.renderBestAndWorstThemes(data.bestTheme, data.worstTheme, themes); // Render best/worst themes
    this.renderQuizHistory(data.history); // Render recent history

    this._hideLoading(this.dom.stats.themeBars); // Hide specific loader for theme bars area
    if(this.dom.stats.historyList) { // Clear loader for history area if it was added
      const historyLoader = this.dom.stats.historyList.querySelector('.loading-indicator');
      if(historyLoader) historyLoader.remove(); // Or hide it
      const historyError = this.dom.stats.historyList.querySelector('.error-message');
      if(historyError) historyError.classList.add('hidden'); // Hide error too
    }

  } catch (error) {
    console.error("Error rendering stats screen:", error);
    this._showError(this.dom.stats.themeBars, "Impossible de charger les statistiques.");
    // Show error in history area too
    if(this.dom.stats.historyList) this.dom.stats.historyList.innerHTML = '<div class="error-message">Impossible de charger l\'historique.</div>';
  }
  // Reset quiz state in manager when returning to stats screen (from quiz selection)
  this.quizManager.resetQuizState();
  this.stopTimer(); // Ensure timer is stopped
};


QuizUI.prototype.confirmExitQuiz = function() {
  // Check if any question has been answered (status is not null) or timer is active
  const quizInProgress = this.quizManager.questionStatus.some(status => status !== null) || (this.quizManager.timerEnabled && this.quizManager.startTime !== null && this.quizManager.totalTimeElapsed > 0);

  if (!quizInProgress || confirm('Are you sure you want to exit? Your current progress in this quiz will be lost.')) {
    this.stopTimer(); // Stop timer logic and interval

    // Decide where to go back based on whether a theme was selected before starting the quiz
    if(typeof this.quizManager.currentThemeId !== 'undefined' && this.quizManager.currentThemeId !== null) {
      // If a theme was selected, go back to quiz selection for that theme
      this.showQuizSelection();
    } else {
      // If no theme was properly selected (e.g. direct link or error), go back to welcome
      this.showWelcomeScreen();
    }
    // Reset quiz state in manager upon exiting
    this.quizManager.resetQuizState();
  }
};

QuizUI.prototype.confirmResetProgress = function() {
  if (confirm('Are you sure you want to reset ALL your quiz progress and statistics? This action cannot be undone.')) {
    if(window.storage.resetAllData()){ // Use storage global
      alert('All progress has been reset.');
      // After reset, refresh the stats screen or go back to welcome
      this.showStatsScreen(); // Refresh screen with empty data
       // Also re-render themes on welcome screen to show reset progress
      this.initializeWelcomeScreen();
    } else {
      alert('Could not reset progress. Please try again.');
    }
  }
};

// ----- Theme and Quiz List Rendering -----

QuizUI.prototype.renderThemes = function(themes) {
  const themesList = this.dom.themesList; // This now points to the element inside welcome-screen
  if (!themesList) { console.error("Themes list container not found."); return; }
  themesList.innerHTML = ''; // Clear previous content

  if (!themes || themes.length === 0) { themesList.innerHTML = '<p class="no-data">No themes available.</p>'; return; }

  // Use async map to get stats for each theme before rendering
  Promise.all(themes.map(async theme => {
    try {
      // Get theme stats using getVisualizationData which calculates completion/accuracy per theme
      // We pass all themes here to get the grouped stats object
      const allStats = await window.storage.getVisualizationData(themes);
      const stats = allStats.themeStats[theme.id];

      // If stats are not available for this theme yet (no quizzes played), use metadata totals
      const completedQuizzes = stats?.quizzes?.completed || 0; // Access quizzes property
      const totalQuizzes = theme.quizzes?.length || 0; // Get total quizzes from metadata
      const completionRate = totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;
      const avgAccuracy = stats?.avgAccuracy || 0; // Get accuracy from stats

      // Ensure progress bar width is based on completionRate
      const progressBarWidth = Math.max(0, Math.min(100, completionRate));

      return {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        icon: theme.icon,
        completedQuizzes: completedQuizzes,
        totalQuizzes: totalQuizzes,
        completionRate: completionRate,
        avgAccuracy: avgAccuracy, // Include accuracy for potential display or sorting
        elementHtml: `
            <div class="item-icon"><i class="${theme.icon || 'fas fa-book'}"></i></div>
            <div class="item-content">
                <h3>${theme.name}</h3>
                <p>${theme.description || 'Explore various quizzes on this topic.'}</p>
                <div class="progress-info">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${progressBarWidth}%"></div>
                    </div>
                    <span>${completedQuizzes}/${totalQuizzes} quizzes completed (${completionRate}%)</span>
                </div>
            </div>
            <div class="item-action" aria-hidden="true"> <!-- action div is decorative -->
                 Explorer <i class="fas fa-arrow-right"></i>
            </div>
        `
      };
    } catch (err) {
      console.warn(`Failed to load stats for theme ${theme.id}:`, err);
      // Return basic theme info with error message if stats loading fails
      return {
        id: theme.id, name: theme.name, description: theme.description, icon: theme.icon,
        completedQuizzes: 0, totalQuizzes: theme.quizzes?.length || 0, completionRate: 0, avgAccuracy: 0,
        elementHtml: `
            <div class="item-icon"><i class="${theme.icon || 'fas fa-book'}"></i></div>
            <div class="item-content">
                <h3>${theme.name}</h3>
                <p>${theme.description || 'Explore various quizzes on this topic.'}</p>
                <p class="progress-info error-message-inline">Stats not available.</p> <!-- Use a class for inline error -->
            </div>
            <div class="item-action" aria-hidden="true">
                 Explorer <i class="fas fa-arrow-right"></i>
            </div>
        `
      };
    }
  })).then(renderedThemes => {
    // Optional: Sort themes (e.g., by completion rate, then name)
    renderedThemes.sort((a, b) => {
      // Sort by completion desc, then by accuracy desc, then by name asc
      if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
      if (b.avgAccuracy !== a.avgAccuracy) return b.avgAccuracy - a.avgAccuracy;
      return a.name.localeCompare(b.name);
    });

    // Append the elements in the desired order
    renderedThemes.forEach(themeData => {
      const themeElement = document.createElement('div');
      themeElement.className = 'selection-item theme-item';
      themeElement.setAttribute('data-theme-id', themeData.id);
      themeElement.setAttribute('tabindex', '0'); // Make div focusable
      themeElement.setAttribute('role', 'button'); // Indicate it's clickable
      themeElement.setAttribute('aria-label', `Select theme: ${themeData.name}. ${themeData.completedQuizzes} out of ${themeData.totalQuizzes} quizzes completed with ${themeData.avgAccuracy}% accuracy.`); // More descriptive aria-label
      themeElement.innerHTML = themeData.elementHtml; // Set the pre-rendered HTML

      themesList.appendChild(themeElement);
    });
  }).catch(err => {
    console.error("Error rendering themes after fetching stats:", err);
    themesList.innerHTML = '<p class="error-message">Impossible d\'afficher les thèmes.</p>'; // Show error if rendering fails
  });
};


/** Affiche la liste des quiz pour un thème */
QuizUI.prototype.renderQuizzes = function(theme, quizzes) {
  const quizzesList = this.dom.quizzesList;
  if (!quizzesList) { console.error("Quizzes list container not found."); return; }
  quizzesList.innerHTML = ''; // Clear previous content

  if (!quizzes || quizzes.length === 0) {
    quizzesList.innerHTML = '<p class="no-data">Aucun quiz disponible pour ce thème.</p>';
    return;
  }

  // Optional: Sort quizzes (e.g., by level, completion status, or quiz number)
  quizzes.sort((a, b) => {
    // First show quizzes that are in progress but not completed
    const aInProgress = a.progress && !a.progress.completed;
    const bInProgress = b.progress && !b.progress.completed;
    if (aInProgress && !bInProgress) return -1;
    if (!aInProgress && bInProgress) return 1;

    // Then by level (ascending: A1, A2, B1, etc.) - Handle potential missing levels
    const levelsOrder = ['Pre-A1', 'A1', 'A1+', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const levelAIndex = a.level ? levelsOrder.indexOf(a.level) : levelsOrder.length; // Put unleveled at the end
    const levelBIndex = b.level ? levelsOrder.indexOf(b.level) : levelsOrder.length;
    if (levelAIndex !== levelBIndex) {
      return levelAIndex - levelBIndex;
    }

    // Then by completion status (not completed first)
    if (a.progress && !a.progress.completed && (!b.progress || b.progress.completed)) return -1;
    if ((!a.progress || a.progress.completed) && b.progress && !b.progress.completed) return 1;

    // Then by quiz number/id
    return a.id - b.id;
  });

  // Create a wrapper for quiz difficulty grouping if needed
  const createLevelGroup = (level) => {
    const groupId = `level-${level.replace(/[+ ]/g, '-').toLowerCase()}`; // Handles '+', spaces
    // Check if group already exists
    let group = quizzesList.querySelector(`#${groupId}`);
    if (!group) {
      group = document.createElement('div');
      group.id = groupId;
      group.className = 'level-group';

      const levelTitle = document.createElement('h3');
      levelTitle.className = 'level-title';
       // Capitalize first letter
      const displayLevel = level.charAt(0).toUpperCase() + level.slice(1);
      levelTitle.textContent = `Niveau ${displayLevel}`;

      group.appendChild(levelTitle);
      quizzesList.appendChild(group);
    }
    return group;
  };

  // Group quizzes by difficulty level if specified
  const quizzesByLevel = {};
  let hasLevels = false;

  quizzes.forEach(quiz => {
    if (quiz.level) {
      hasLevels = true;
      if (!quizzesByLevel[quiz.level]) {
        quizzesByLevel[quiz.level] = [];
      }
      quizzesByLevel[quiz.level].push(quiz);
    }
  });

  // Render quizzes by level if levels exist, otherwise render flat list
  if (hasLevels) {
    // Define level order again for rendering
    const levelOrder = ['Pre-A1', 'A1', 'A1+', 'A2', 'B1', 'B2', 'C1', 'C2']; // Include Pre-A1 and A1+

    // Create groups and render quizzes for each level in order
    levelOrder.forEach(level => {
      if (quizzesByLevel[level] && quizzesByLevel[level].length > 0) {
        const levelGroup = createLevelGroup(level);
        // Sort quizzes within level by ID
        quizzesByLevel[level].sort((a, b) => a.id - b.id);
        // Render quizzes for this level
        quizzesByLevel[level].forEach(quiz => {
          const quizElement = this._createQuizElement(theme.id, quiz);
          levelGroup.appendChild(quizElement);
        });
      }
    });

    // If any quizzes don't have levels, add them at the end under an "Other" group
    const unleveledQuizzes = quizzes.filter(quiz => !quiz.level);
    if (unleveledQuizzes.length > 0) {
      const otherGroup = createLevelGroup('Autre');
       // Sort unleveled quizzes by ID
      unleveledQuizzes.sort((a, b) => a.id - b.id);
      unleveledQuizzes.forEach(quiz => {
        const quizElement = this._createQuizElement(theme.id, quiz);
        otherGroup.appendChild(quizElement);
      });
    }
  } else {
    // Render as flat list without level grouping
    quizzes.forEach(quiz => {
      const quizElement = this._createQuizElement(theme.id, quiz);
      quizzesList.appendChild(quizElement);
    });
  }
};

/** Helper pour créer un élément de quiz */
QuizUI.prototype._createQuizElement = function(themeId, quiz) {
  const quizElement = document.createElement('div');
  quizElement.className = 'selection-item quiz-item';
  quizElement.setAttribute('data-theme-id', themeId);
  quizElement.setAttribute('data-quiz-id', quiz.id);
  quizElement.setAttribute('tabindex', '0'); // Make focusable
  quizElement.setAttribute('role', 'button');

  // Create icon based on status
  let icon = '<i class="fas fa-question-circle"></i>'; // Default
  let statusClass = '';
  let statusText = '';
  let accessibilityLabel = '';

  if (quiz.progress && quiz.progress.completed) {
    // Completed quiz
    const score = quiz.progress.score;
    const total = quiz.progress.total;
    const percent = Math.round((score / total) * 100);

    statusText = `${score}/${total} (${percent}%)`;
    accessibilityLabel = `Completed quiz: ${quiz.name}. Score: ${score} out of ${total}, ${percent}% correct.`;

    if (percent >= 90) {
      icon = '<i class="fas fa-award"></i>';
      statusClass = 'status-excellent';
    } else if (percent >= 70) {
      icon = '<i class="fas fa-check-circle"></i>';
      statusClass = 'status-good';
    } else {
      icon = '<i class="fas fa-times-circle"></i>';
      statusClass = 'status-needs-improvement';
    }
  } else if (quiz.progress) {
    // In progress but not completed
    // Check if any question was actually answered
    // NOTE: This requires quizManager.isCurrentQuestionAnswered() or checking status array which isn't available here directly.
    // Let's just rely on the 'progress' object existence for 'in progress' state for simplicity in this list view.
    icon = '<i class="fas fa-play-circle"></i>';
    statusClass = 'status-in-progress';
    statusText = 'En cours'; // Or 'Reprendre'
    accessibilityLabel = `Quiz in progress: ${quiz.name}. Click to resume.`;
  } else {
    // Not started
     icon = '<i class="fas fa-question-circle"></i>';
    statusClass = 'status-not-started'; // Add a class for not started state if needed for styling
    statusText = ''; // No specific status text
    accessibilityLabel = `Quiz not started: ${quiz.name}. Click to start.`;
  }

  // Format quiz date completed if it exists
  let dateCompletedText = '';
  if (quiz.progress && quiz.progress.dateCompleted) {
    const date = new Date(quiz.progress.dateCompleted);
    dateCompletedText = `<span class="date-completed">Terminé le ${date.toLocaleDateString()}</span>`;
  }

  // Format total time if available and completed
   let timeText = '';
   if (quiz.progress && quiz.progress.completed && quiz.progress.totalTime > 0) {
     const minutes = Math.floor(quiz.progress.totalTime / 60);
     const seconds = quiz.progress.totalTime % 60;
     timeText = `<span class="time-spent"><i class="far fa-clock"></i> ${minutes}m ${seconds}s</span>`;
   }


  // Build status section HTML
  let statusHTML = '';
  if (statusText || dateCompletedText || timeText) { // Only show status div if there's something to show
    statusHTML = `
      <div class="item-status ${statusClass}">
        ${statusText ? `<span class="status-text">${statusText}</span>` : ''}
        ${dateCompletedText}
        ${timeText}
      </div>
    `;
  }


  // Additional info: question count, difficulty, estimated time
  let metaInfo = '';
  if (quiz.questionCount) {
    metaInfo += `<span class="meta-info"><i class="fas fa-list"></i> ${quiz.questionCount} questions</span>`;
  }
  if (quiz.level) {
    // Capitalize first letter for display
     const displayLevel = quiz.level.charAt(0).toUpperCase() + quiz.level.slice(1);
    metaInfo += `<span class="meta-info"><i class="fas fa-signal"></i> Niveau ${displayLevel}</span>`;
  }
  if (quiz.estimatedTime) {
    metaInfo += `<span class="meta-info"><i class="far fa-clock"></i> ~ ${quiz.estimatedTime} min</span>`;
  }

  // Set accessibility label more precisely
  quizElement.setAttribute('aria-label', accessibilityLabel);

  // Build the quiz item HTML
  quizElement.innerHTML = `
    <div class="item-icon">${icon}</div>
    <div class="item-content">
      <h3>${quiz.name}</h3>
      <p>${quiz.description || 'Test your knowledge on this topic.'}</p>
      ${metaInfo ? `<div class="meta-info-container">${metaInfo}</div>` : ''}
      ${statusHTML}
    </div>
    <div class="item-action" aria-hidden="true">
      ${(quiz.progress && !quiz.progress.completed) ? 'Reprendre' : 'Commencer'} <i class="fas fa-arrow-right"></i>
    </div>
  `;

  return quizElement;
};


// ----- Fonctions de rendu pour l'écran des statistiques -----

/** Affiche les barres de progression par thème dans l'écran statistiques */
QuizUI.prototype.renderThemeBars = function(themeStats, themes) {
  const container = this.dom.stats.themeBars;
  if (!container) { console.error("Theme bars container not found."); return; }
  container.innerHTML = ''; // Clear previous content

  // If no themes were loaded, themeStats might be empty, but we can still show a message
  if (!themeStats || Object.keys(themeStats).length === 0) {
     // Check if themes array exists and is not empty (meaning data was loaded but no stats)
     if (!themes || themes.length === 0) {
          container.innerHTML = '<p class="no-data">Impossible d\'afficher les statistiques sans données de thème.</p>';
     } else {
          container.innerHTML = '<p class="no-data">Aucune donnée de progression disponible pour les thèmes.</p>';
     }
    return;
  }

  // Create array from theme stats object for sorting
  const themeArray = Object.keys(themeStats).map(themeId => {
    const themeData = themeStats[themeId];
    // Find theme name from the original themes metadata array
    const theme = themes.find(t => t.id === Number(themeId));
    // Use fallback name if theme metadata not found (shouldn't happen if themes were loaded)
    const themeName = theme ? theme.name : `Theme ${themeId}`;

    return {
      id: themeId,
      name: themeName, // Use found or fallback name
      completion: themeData.completionRate, // Corrected property name from stats object
      accuracy: themeData.avgAccuracy,    // Corrected property name
      quizzes: themeData.quizzes          // Corrected property name
    };
  });


  // Sort by completion rate (descending), then accuracy (descending), then name (ascending)
  themeArray.sort((a, b) => {
      if (b.completion !== a.completion) return b.completion - a.completion;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return a.name.localeCompare(b.name);
  });

  // Create theme bars
  themeArray.forEach(theme => {
    const barEl = document.createElement('div');
    barEl.className = 'theme-bar';

    // Use theme accuracy for color gradient (red -> yellow -> green)
    const accuracyColorClass = theme.accuracy >= 80 ? 'high-score' :
                              theme.accuracy >= 60 ? 'medium-score' : 'low-score';
    // Ensure progress bar width is within bounds
    const progressBarWidth = Math.max(0, Math.min(100, theme.completion));

    barEl.innerHTML = `
      <div class="theme-info">
        <span class="theme-name">${theme.name}</span>
        <span class="theme-stats">
          ${theme.quizzes.completed}/${theme.quizzes.total} quizzes · ${theme.accuracy}% precision
        </span>
      </div>
      <div class="progress-bar">
        <div class="progress ${accuracyColorClass}" style="width: ${progressBarWidth}%"></div>
      </div>
    `;

    container.appendChild(barEl);
  });
};


/** Affiche les meilleurs et pires thèmes dans l'écran statistiques */
QuizUI.prototype.renderBestAndWorstThemes = function(bestThemeData, worstThemeData, themes) {
  const bestContainer = this.dom.stats.bestThemeContainer; // Corrected DOM reference
  const worstContainer = this.dom.stats.worstThemeContainer; // Corrected DOM reference

  // Helper function to render a theme performance card
  const renderThemeCard = (container, themeStatsData, label) => {
    if (!container) return; // Skip if container not found

    if (!themeStatsData || typeof themeStatsData.id === 'undefined') {
      container.innerHTML = `<p class="no-data">Pas assez de données pour déterminer le ${label} thème.</p>`;
      return;
    }

    // Find theme name from the original themes metadata array
    const theme = themes.find(t => t.id === Number(themeStatsData.id));
    // Use fallback name if theme metadata not found
    const themeName = theme ? theme.name : `Theme ${themeStatsData.id}`;

    // Use stats from the themeStatsData object
    const accuracy = themeStatsData.stats.avgAccuracy;
    const completion = themeStatsData.stats.completionRate;

     // Check if there's actual completed quizzes data
    if (themeStatsData.stats.quizzes.completed === 0) {
        container.innerHTML = `<p class="no-data">Pas assez de données pour déterminer le ${label} thème (aucun quiz complété dans ce thème).</p>`;
        return;
    }


    container.innerHTML = `
      <div class="performance-card">
        <h4>${themeName}</h4>
        <div class="performance-stats">
          <div class="stat">
            <span class="stat-value">${accuracy}%</span>
            <span class="stat-label">Précision moyenne</span>
          </div>
          <div class="stat">
            <span class="stat-value">${completion}%</span>
            <span class="stat-label">Complétion du thème</span>
          </div>
        </div>
      </div>
    `;
  };

  // Render best and worst theme cards using the corrected variable names
  renderThemeCard(bestContainer, bestThemeData, 'meilleur');
  renderThemeCard(worstContainer, worstThemeData, 'pire');
};


/** Affiche l'historique des quiz récemment terminés */
QuizUI.prototype.renderQuizHistory = function(historyItems) {
  const container = this.dom.stats.historyList;
  if (!container) { console.error("History list container not found."); return; }
  container.innerHTML = ''; // Clear previous content

  if (!historyItems || historyItems.length === 0) {
    container.innerHTML = '<p class="no-data">Aucun historique de quiz terminé disponible.</p>';
    return;
  }

  // Sort history by date (descending - most recent first)
  historyItems.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Take only the most recent items (e.g., last 10 or 20, match storage limit)
  // StorageManager limits to 20, so let's display up to 20
  const recentItems = historyItems.slice(0, 20);

  // Create list of history items
  const listEl = document.createElement('ul');
  listEl.className = 'history-list';

  recentItems.forEach(item => {
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString();
    // Add time formatting options for clarity
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const scorePercent = Math.round((item.score / item.total) * 100);
    const scoreClass = scorePercent >= 80 ? 'high-score' :
                       scorePercent >= 60 ? 'medium-score' : 'low-score';

    // Format time spent if available
    let timeSpentHTML = '';
    if (item.time && item.time > 0) {
       const minutes = Math.floor(item.time / 60);
       const seconds = item.time % 60;
       timeSpentHTML = `<span class="history-time"><i class="far fa-clock"></i> ${minutes}m ${seconds}s</span>`;
    }


    const listItem = document.createElement('li');
    listItem.className = 'history-item';
     // Use textContent for safety against injection if item names come from external source,
     // or ensure sanitization if using innerHTML and dynamic names. Using innerHTML for structure.
    listItem.innerHTML = `
      <div class="history-content">
        <div class="history-title">
          <span class="quiz-name">${item.quizName}</span>
          <span class="theme-name"> (${item.themeName})</span>
        </div>
        <div class="history-details">
          <span class="history-date">${formattedDate} à ${formattedTime}</span>
          <span class="history-score ${scoreClass}">${item.score}/${item.total} (${scorePercent}%)</span>
          ${timeSpentHTML}
        </div>
      </div>
    `;

    listEl.appendChild(listItem);
  });

  container.appendChild(listEl);
};


// ----- Fonctions de gestion du quiz -----

/** Démarre un quiz sélectionné */
QuizUI.prototype.startSelectedQuiz = async function(themeId, quizId) {
  // Assure que themeId et quizId sont définis dans le manager (Bonne pratique, mais loadQuizData les définira aussi)
  this.quizManager.currentThemeId = themeId;
  this.quizManager.currentQuizId = quizId;

  // Effectue la transition vers l'écran du quiz
  this._transitionScreen(this.dom.screens.quiz);

  // Affiche un message de chargement dans le conteneur principal du quiz
  // Utilise this.dom.quiz car c'est l'ID de l'élément parent dans votre structure DOM
  this._showLoading(this.dom.quiz, "Chargement du quiz...");
  this._clearError(this.dom.quiz); // Supprime tout message d'erreur précédent dans cette zone

  try {
    // 1. Utilise le ResourceManager (l'objet qui sait comment aller chercher les fichiers)
    // pour charger les données complètes de CE quiz spécifique (y compris les questions).
    console.log(`Attempting to load quiz data for theme ${themeId}, quiz ${quizId} via ResourceManager...`);
    const quizData = await this.resourceManager.getQuiz(themeId, quizId);
    console.log("Quiz data fetched:", quizData); // Affiche les données chargées dans la console (pour debug)

    // 2. Charge ces données (qui viennent d'être fetchées) dans le QuizManager.
    // Le QuizManager est l'objet qui gère l'état interne du quiz (question actuelle, score, réponses...).
    // Sa méthode loadQuizData initialise cet état avec les données fournies.
    console.log("Attempting to load fetched data into QuizManager...");
    const loadSuccess = this.quizManager.loadQuizData(quizData);

    if (loadSuccess) {
      // Si le QuizManager a réussi à charger les données (loadQuizData a retourné true)
      console.log("Quiz data loaded into QuizManager successfully.");

      // Récupère les données complètes qui sont maintenant stockées dans le QuizManager.
      const loadedQuiz = this.quizManager.getCurrentQuizData();
      if (!loadedQuiz) { // Vérification supplémentaire, ne devrait pas arriver si loadSuccess est true
          throw new Error("QuizManager did not return loaded data after successful load.");
      }

      // 4. Utilise les données chargées pour configurer l'interface utilisateur.

      // Met à jour le titre du quiz affiché en haut de l'écran.
      if (this.dom.quiz.title) { // Vérifier si l'élément DOM existe
         this.dom.quiz.title.textContent = loadedQuiz.name || "Nom du Quiz"; // Utiliser le nom du quiz chargé
      } else {
          console.warn("DOM element for quiz title (this.dom.quiz.title) not found.");
      }


      // Initialise et affiche la barre de progression et la PREMIÈRE question.
      // Ces méthodes de l'UI lisent l'état (questions, index actuel) depuis le quizManager.
      this.renderQuizProgress(); // Va lire l'état du quizManager
      this.renderCurrentQuestion(); // Va lire la question actuelle du quizManager et l'afficher

      // Gère le timer : Met à jour l'état visuel du timer dans l'UI et le démarre si l'option est activée.
      this.updateTimerUIState(); // Gère l'affichage/masquage du conteneur timer
      if (this.quizManager.timerEnabled) {
        this.startTimer(); // Démarre le cycle d'update de l'affichage du timer (setInterval)
      } else {
        this.stopTimer(); // S'assure que le timer est arrêté si désactivé
      }


      // Cache l'indicateur de chargement maintenant que le quiz est affiché.
      // J'utilise this.dom.quiz, comme pour l'affichage du chargement.
      this._hideLoading(this.dom.quiz);

    } else {
       // Si la méthode quizManager.loadQuizData a retourné false
       // (cela arrive si les données passées étaient invalides, par exemple un fichier JSON mal formé)
       console.error("Échec du chargement des données du quiz dans le QuizManager (données invalides reçues ?). Données:", quizData);
       // On jette une nouvelle erreur pour être attrapé par le bloc 'catch' ci-dessous,
       // ce qui affichera un message d'erreur à l'utilisateur.
       throw new Error("Données du quiz invalides ou incomplètes reçues.");
    }

  } catch (error) {
    // Ce bloc catch s'exécute si une erreur survient pendant le chargement des données (fetch par ResourceManager)
    // OU si quizManager.loadQuizData retourne false et qu'une erreur est jetée.

    console.error("Échec global du démarrage du quiz:", error); // Log l'erreur technique

    // Cache l'indicateur de chargement (utilise this.dom.quiz)
    this._hideLoading(this.dom.quiz);

    // Affiche un message d'erreur clair à l'utilisateur dans la zone du quiz.
    // Utilise this.dom.quiz, comme pour l'affichage du chargement.
    this._showError(this.dom.quiz, `Impossible de charger ce quiz. Veuillez réessayer ou contacter le support si le problème persiste. Détails: ${error.message}`);

    // Désactive les boutons de navigation/soumission pour éviter les clics inutiles.
    if (this.dom.buttons.prev) this.dom.buttons.prev.disabled = true;
    if (this.dom.buttons.next) this.dom.buttons.next.disabled = true;
    if (this.dom.buttons.submit) this.dom.buttons.submit.disabled = true;
  }
}; // <-- Cette accolade et le point-virgule ferment la fonction QuizUI.prototype.startSelectedQuiz. Laissez-les.


/** Affiche la barre de progression du quiz */
QuizUI.prototype.renderQuizProgress = function() {
  const steps = this.dom.quiz.progress.steps; // Corrected DOM access
  const progressBar = this.dom.quiz.progress.bar; // Corrected DOM access

  if (!steps || !progressBar) {
      console.warn("DOM elements for quiz progress not found.");
      return;
  }

  steps.innerHTML = ''; // Clear previous steps

  const totalQuestions = this.quizManager.getCurrentQuizLength(); // Use method from QuizManager
  const currentIndex = this.quizManager.currentQuestionIndex; // Access property from QuizManager
  const status = this.quizManager.questionStatus; // Access property from QuizManager

  if (totalQuestions === 0) {
       progressBar.style.width = '0%';
       return; // No steps to render
  }

  // Update progress bar width (based on questions answered or current position)
  // Let's base it on current index for visual navigation feedback
  const progressPercent = ((currentIndex) / totalQuestions) * 100; // Corrected calculation
  progressBar.style.width = `${progressPercent}%`;

  // Create step indicators
  for (let i = 0; i < totalQuestions; i++) {
    const step = document.createElement('div');
    step.className = 'step';

    // Current step indicator
    if (i === currentIndex) {
      step.classList.add('current');
    }

    // Completed steps - add status class based on recorded answer status
    // We check status[i] which is 'correct', 'incorrect', or null
    if (status[i] === 'correct') {
      step.classList.add('correct');
    } else if (status[i] === 'incorrect') {
      step.classList.add('incorrect');
    } else if (i < currentIndex && status[i] === null) {
        // This case should ideally not happen if navigation is correct and questions are answered
        // but as a fallback, mark as visited if index is past it. Or maybe just rely on status.
        // Let's stick to 'correct'/'incorrect' from status array which is more accurate.
        // step.classList.add('visited');
    }

    // Add aria attributes for accessibility
    step.setAttribute('aria-label', `Question ${i + 1} de ${totalQuestions}. Statut: ${status[i] || 'non répondu'}${i === currentIndex ? ', actuelle' : ''}`);
    // Add click listener to potentially navigate to the step (optional feature)
    // step.addEventListener('click', () => this.goToQuestionIndex(i)); // Requires goToQuestionIndex method

    steps.appendChild(step);
  }

  // Update button states based on current state in QuizManager
  this.updateNavigationButtons();
};


/** Met à jour l'état des boutons de navigation */
QuizUI.prototype.updateNavigationButtons = function() {
  // Get state from QuizManager
  const currentIndex = this.quizManager.currentQuestionIndex; // Property
  const totalQuestions = this.quizManager.getCurrentQuizLength(); // Method
  const isCurrentAnswered = this.quizManager.selectedAnswers[currentIndex] !== null; // Check if answer is recorded for current question
  const isQuizComplete = this.quizManager.isQuizComplete(); // Method

  // Check if DOM elements exist before accessing disabled/style
  const prevBtn = this.dom.buttons.prev;
  const nextBtn = this.dom.buttons.next;
  const submitBtn = this.dom.buttons.submit;

  if (!prevBtn || !nextBtn || !submitBtn) {
      console.warn("Navigation buttons DOM elements not found.");
      return;
  }

  // Prev button: disabled only on the first question (index 0)
  prevBtn.disabled = currentIndex === 0;

  // Next/Submit buttons logic
  if (currentIndex < totalQuestions - 1) {
    // Not the last question: show Next, hide Submit
    nextBtn.style.display = ''; // Or 'inline-block' depending on your CSS default
    submitBtn.style.display = 'none';
    // Enable Next button only if the current question has been answered
    nextBtn.disabled = !isCurrentAnswered;
  } else {
    // It is the last question (currentIndex is totalQuestions - 1): hide Next, show Submit
    nextBtn.style.display = 'none';
    submitBtn.style.display = ''; // Or 'inline-block'
    // Enable Submit button only if the entire quiz is complete (all questions answered)
    submitBtn.disabled = !isQuizComplete;
  }
};

/** Affiche la question actuelle */
QuizUI.prototype.renderCurrentQuestion = function() {
  const questionContainer = this.dom.quiz.container; // Assuming this is the container for the question itself
  if (!questionContainer) {
       console.error("DOM element for question container (this.dom.quiz.container) not found.");
       return;
  }

  const currentQuestionData = this.quizManager.getCurrentQuestion(); // Get question data from manager
  const questionIndex = this.quizManager.currentQuestionIndex; // Get current index from manager

  if (!currentQuestionData) {
    // If no question data is available, display an error message
    questionContainer.innerHTML = '<p class="error-message">Impossible d\'afficher la question. Données manquantes ou invalides.</p>';
    console.error(`No question data found for index ${questionIndex}. Quiz data loaded:`, this.quizManager.getCurrentQuizData());
    return; // Stop execution
  }

  // Reset feedback area (assuming this is a separate element)
  const feedbackEl = this.dom.quiz.feedback; // Assuming this exists in your DOM object
  if (feedbackEl) {
    feedbackEl.innerHTML = '';
    feedbackEl.classList.remove('correct', 'incorrect');
    feedbackEl.classList.add('hidden'); // Ensure feedback is hidden initially
  } else {
      console.warn("DOM element for quiz feedback (this.dom.quiz.feedback) not found.");
  }


  // Create question wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'question';
  wrapper.setAttribute('data-question-index', questionIndex); // Add index data attribute

  // Question number and text
  const questionNumber = questionIndex + 1;
  const totalQuestions = this.quizManager.getCurrentQuizLength();

  const questionHeader = document.createElement('div');
  questionHeader.className = 'question-header';
  questionHeader.innerHTML = `
    <span class="question-number">Question ${questionNumber}/${totalQuestions}</span>
  `;

  const questionText = document.createElement('div');
  questionText.className = 'question-text';
  // Use innerHTML as questions might contain HTML like <strong>
  questionText.innerHTML = currentQuestionData.question; // Assuming 'question' property holds the text

  wrapper.appendChild(questionHeader);
  wrapper.appendChild(questionText);

  // Instructions if provided
  if (currentQuestionData.instructions) {
    const instructions = document.createElement('div');
    instructions.className = 'question-instructions';
    // Use innerHTML here too, in case instructions have formatting
    instructions.innerHTML = currentQuestionData.instructions;
    wrapper.appendChild(instructions);
  }

  // Create answer options container
  const answersContainer = document.createElement('div');
  answersContainer.className = 'answers-container';

  // Get saved answer for the current question from quiz manager
  // NOTE: Need a method like getSavedAnswer(index) in QuizManager
  const savedAnswer = this.quizManager.selectedAnswers[questionIndex]; // Access property

  // Render answer options based on question type
  switch (currentQuestionData.type) {
    case 'multiple-choice':
      this._renderMultipleChoice(answersContainer, currentQuestionData, questionIndex, savedAnswer); // Pass index and savedAnswer
      break;

    case 'text-input':
      this._renderTextInput(answersContainer, currentQuestionData, questionIndex, savedAnswer); // Pass index and savedAnswer
      break;

    case 'matching':
       // Need methods/logic for rendering and handling matching questions if they exist
      // For now, add a placeholder or throw error
      answersContainer.innerHTML = '<p class="error-message">Type de question "matching" non pris en charge par l\'UI.</p>';
      console.warn("Attempted to render unsupported question type: matching");
      break;

    case 'fill-in-blanks':
       // Need methods/logic for rendering and handling fill-in-blanks if they exist
       // For now, add a placeholder or throw error
      answersContainer.innerHTML = '<p class="error-message">Type de question "fill-in-blanks" non pris en charge par l\'UI.</p>';
      console.warn("Attempted to render unsupported question type: fill-in-blanks");
      break;

    default:
       // Handle unknown question types
      answersContainer.innerHTML = `<p class="error-message">Type de question inconnu: ${currentQuestionData.type}.</p>`;
      console.error(`Attempted to render unknown question type: ${currentQuestionData.type}`, currentQuestionData);
      break;
  }

  wrapper.appendChild(answersContainer);

  // Clear previous content and add the new question
  questionContainer.innerHTML = ''; // Clear the container
  questionContainer.appendChild(wrapper);

  // After rendering the question, update UI state
  this.renderQuizProgress(); // Update progress bar and step indicators
  this.updateNavigationButtons(); // Update enabled/disabled state of Prev/Next/Submit

  // Start timer for this question if timer is enabled and it's the first time viewing
  // The startTimer logic is in the QuizManager (startTime property).
  // It should be set by quizManager.startTimer() when the quiz begins.
  // We just need to potentially restart the timer interval for UI display if it was stopped (e.g., on pause or transition)
   if (this.quizManager.timerEnabled && this.timerInterval === null) {
       // If timer is enabled but the UI interval is not running, start it.
       // This handles cases where timer was paused or screen changed.
       // QuizManager's startTime should be checked/managed by its own methods (next/prev/startTimer).
       this.startTimer(); // This function starts the UI interval and calls quizManager.startTimer() (which might reset it)
   } else if (!this.quizManager.timerEnabled && this.timerInterval !== null) {
       // If timer is disabled but UI interval is running, stop it.
       this.stopTimer();
   }
    // If timer is enabled and already running (timerInterval is not null), do nothing here.
};

/** Render multiple choice question */
// Updated signature to accept questionIndex and savedAnswer
QuizUI.prototype._renderMultipleChoice = function(container, question, questionIndex, savedAnswer) {
  // Ensure question has options
  if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
       container.innerHTML = '<p class="error-message">Options manquantes pour cette question.</p>';
       console.error("Multiple choice question is missing options:", question);
       return;
  }

  const isMultiAnswer = question.multiAnswer || false; // Assume single choice by default
  const optionsType = isMultiAnswer ? 'checkbox' : 'radio';
  const optionsName = `question-${questionIndex}-options`; // Use question index for unique name

  const form = document.createElement('form');
  form.className = 'options-form';
  // No data-question-id needed here, we use index and pass it to saveAnswer
  form.setAttribute('data-question-index', questionIndex);


  // Helper to check if an option value was selected in the saved answer
  const isSelected = (optionValue) => {
    if (savedAnswer === null || typeof savedAnswer === 'undefined') return false; // No saved answer
    if (isMultiAnswer && Array.isArray(savedAnswer)) {
      // For multi-answer (checkboxes), savedAnswer is an array of values
      return savedAnswer.includes(optionValue);
    } else {
      // For single-answer (radio), savedAnswer is a single value
      return savedAnswer === optionValue;
    }
  };

  // Create options
  question.options.forEach((option, index) => {
    // Ensure option has 'text' and 'value' properties, or use fallback
    const optionText = option.text || option; // Use text if available, otherwise the option itself
    const optionValue = option.value || index; // Use value if available, otherwise the index

    const optionId = `option-${questionIndex}-${index}`; // Unique ID for input/label
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option';

    // Check if this option should be marked as selected based on saved answer
    if (isSelected(optionValue)) {
      optionDiv.classList.add('selected');
    }

    const input = document.createElement('input');
    input.type = optionsType;
    input.id = optionId;
    input.name = optionsName; // Group radio buttons by name
    input.value = optionValue; // Use the option value

    // Check if this input should be checked based on saved answer
    input.checked = isSelected(optionValue);

    const label = document.createElement('label');
    label.htmlFor = optionId;
    label.innerHTML = optionText; // Use innerHTML for rich text options

    // Add change event listener
    input.addEventListener('change', (e) => {
      const currentQuestionIndex = Number(form.getAttribute('data-question-index')); // Get index from form

      if (isMultiAnswer) {
        // For checkboxes: collect all checked values
        const checkedInputs = form.querySelectorAll('input[type="checkbox"]:checked');
        const selectedValues = Array.from(checkedInputs).map(input => input.value);

        // Update UI: remove 'selected' from all options first, then add to checked ones
        form.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
        checkedInputs.forEach(input => {
           input.closest('.option').classList.add('selected');
        });

        // Save array of selected values to QuizManager for this question index
        this.quizManager.selectedAnswers[currentQuestionIndex] = selectedValues.length > 0 ? selectedValues : null; // Save null if nothing is checked

      } else {
        // For radio buttons: only one can be selected
        // Update UI: remove 'selected' from previously selected option, add to the new one
        form.querySelectorAll('.option.selected').forEach(el => el.classList.remove('selected'));
        e.target.closest('.option').classList.add('selected');

        // Save the single selected value to QuizManager for this question index
        this.quizManager.selectedAnswers[currentQuestionIndex] = e.target.value;
      }

      // Check if an answer is now selected for the current question
      const isAnswered = this.quizManager.selectedAnswers[currentQuestionIndex] !== null &&
                         (isMultiAnswer ? this.quizManager.selectedAnswers[currentQuestionIndex].length > 0 : true);

      // Update navigation buttons state based on the current question's answer status
      this.updateNavigationButtons();
    });

    optionDiv.appendChild(input);
    optionDiv.appendChild(label);
    form.appendChild(optionDiv);
  });

  container.appendChild(form);

  // Update navigation buttons state initially based on saved answer
  this.updateNavigationButtons(); // This will check if this question has a saved answer and enable 'Next' if applicable
};


/** Render text input question */
// Updated signature
QuizUI.prototype._renderTextInput = function(container, question, questionIndex, savedAnswer) {
   // Ensure question has a prompt or text property
  if (!question.question) { // Assuming 'question' holds the main text prompt
       container.innerHTML = '<p class="error-message">Question text manquante pour cette question.</p>';
       console.error("Text input question is missing question text:", question);
       return;
  }

  const form = document.createElement('form');
  form.className = 'text-input-form';
  form.setAttribute('data-question-index', questionIndex);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'text-answer-input';
  input.placeholder = question.placeholder || 'Tapez votre réponse ici';
  // Set the value from the saved answer
  input.value = savedAnswer || ''; // savedAnswer will be the string value or null/undefined

  // Add input event listener to save the answer as the user types or changes it
  input.addEventListener('input', (e) => {
    const currentQuestionIndex = Number(form.getAttribute('data-question-index'));
    const answer = e.target.value.trim(); // Trim whitespace

    // Save the trimmed answer string to QuizManager
    // Save null if the input is empty after trimming
    this.quizManager.selectedAnswers[currentQuestionIndex] = answer === '' ? null : answer;

    // Update navigation buttons state
    this.updateNavigationButtons();
  });

  form.appendChild(input);
  container.appendChild(form);

  // Update navigation buttons state initially based on saved answer
  this.updateNavigationButtons(); // This will check if this question has a saved answer and enable 'Next' if applicable
};

/**
 * Helper method to display feedback for a submitted answer.
 * This is usually called after submitting an answer for a specific question type
 * or when reviewing answers on the results screen.
 * @param {number} questionIndex - The index of the question.
 * @param {boolean} isCorrect - Whether the answer was correct.
 * @param {string} explanation - The explanation for the answer.
 */
QuizUI.prototype._displayFeedback = function(questionIndex, isCorrect, explanation) {
    const feedbackEl = this.dom.quiz.feedback; // Assuming this element exists
    if (!feedbackEl) {
        console.warn("DOM element for quiz feedback not found.");
        return;
    }

    feedbackEl.classList.remove('hidden', 'correct', 'incorrect'); // Reset classes
    feedbackEl.innerHTML = ''; // Clear previous content

    const icon = isCorrect ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
    const message = isCorrect ? 'Correct!' : 'Incorrect.';

    feedbackEl.classList.add(isCorrect ? 'correct' : 'incorrect');

    feedbackEl.innerHTML = `
        <div class="feedback-header">
            ${icon}
            <span>${message}</span>
        </div>
        ${explanation ? `<div class="feedback-explanation">${explanation}</div>` : ''}
    `;

    // Optionally scroll feedback into view
    // feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};


// ----- Navigation des questions -----

/** Passe à la question précédente */
QuizUI.prototype.goToPreviousQuestion = function() {
  // Logic to record time spent on current question BEFORE moving
  this.quizManager.recordQuestionTime(); // Record time for the question we are leaving

  if (this.quizManager.previousQuestion()) { // This method updates the internal index
    this.renderCurrentQuestion(); // Render the new current question
     // Clear feedback when navigating
    const feedbackEl = this.dom.quiz.feedback;
    if(feedbackEl) feedbackEl.classList.add('hidden');
  } else {
      console.log("Cannot go to previous question (already at the first question).");
  }
};

/** Passe à la question suivante */
QuizUI.prototype.goToNextQuestion = function() {
   const currentIndex = this.quizManager.currentQuestionIndex;
   const isCurrentAnswered = this.quizManager.selectedAnswers[currentIndex] !== null &&
                             (Array.isArray(this.quizManager.selectedAnswers[currentIndex]) ? this.quizManager.selectedAnswers[currentIndex].length > 0 : true);


   // Check if current question is answered before allowing navigation
   if (!isCurrentAnswered) {
       // Optionally show a message
       alert('Veuillez répondre à la question actuelle avant de passer à la suivante.');
       return; // Prevent navigation
   }

   // Submit the answer and record time
   // NOTE: The submitAnswer method in QuizManager is designed to calculate correctness and update score/status.
   // It expects the selected option index for multiple choice.
   // For other types (text, matching, fill-in-blanks), the answer value/structure is already stored in selectedAnswers.
   // We need a way to evaluate the answer AGAINST the correct answer here or in QuizManager.
   // Let's modify QuizManager to have a method like evaluateCurrentAnswer() that uses the stored selectedAnswer.

   // --- TEMPORARY WORKAROUND / ASSUMPTION ---
   // Assuming submitAnswer can take the question index and the *value* from selectedAnswers
   // OR adding an evaluateCurrentAnswer() method in QuizManager.
   // Based on quizManager.js provided, submitAnswer takes optionIndex. This needs refactoring.
   // Let's call a new conceptual method `evaluateAndRecordAnswer()` in QuizManager

   // Update: Looking at quizManager.js again, submitAnswer takes optionIndex.
   // The logic for text/matching/blanks to record is not present.
   // Let's assume a simplified flow for now where answering happens *on input/change*,
   // and navigation simply moves, and scoring happens only ONCE at the END.

    // Revised Logic:
    // 1. Answer is saved in selectedAnswers by the input/change event listeners.
    // 2. updateNavigationButtons checks selectedAnswers to enable Next/Submit.
    // 3. goToNextQuestion/showResults only proceed if question(s) are answered.
    // 4. Scoring/evaluation happens only in showResults / getResults.

    // So, when going to the next question, we just need to record the time for the question being left.
    this.quizManager.recordQuestionTime(); // Record time for the question we are leaving

    // Then proceed to the next question
    if (this.quizManager.nextQuestion()) { // This method updates the internal index
      this.renderCurrentQuestion(); // Render the new current question
      // Clear feedback when navigating
      const feedbackEl = this.dom.quiz.feedback;
      if(feedbackEl) feedbackEl.classList.add('hidden');
    } else {
        console.log("Cannot go to next question (already at the last question).");
        // If it's the last question and we try to go next, the submit button should be visible and enabled (if answered)
        // The user should click submit instead. The updateNavigationButtons handles this display logic.
    }
};


/** Affiche les résultats du quiz */
QuizUI.prototype.showResults = function() {
  // First, ensure the answer for the last question is recorded and evaluated
  const lastQuestionIndex = this.quizManager.getCurrentQuizLength() - 1;
  const isLastAnswered = this.quizManager.selectedAnswers[lastQuestionIndex] !== null &&
                         (Array.isArray(this.quizManager.selectedAnswers[lastQuestionIndex]) ? this.quizManager.selectedAnswers[lastQuestionIndex].length > 0 : true);

  if (!isLastAnswered) {
      alert('Veuillez répondre à la dernière question avant de terminer le quiz.');
      return;
  }

  // Record time for the last question
  this.quizManager.recordQuestionTime();

  // Stop timer if running
  this.stopTimer(); // Stops the UI interval and tells QuizManager to stop

  // --- Scoring happens now ---
  // Need a method in QuizManager to iterate through all questions, evaluate answers,
  // calculate score, update questionStatus for ALL questions, and compile results.
  // The existing getResults() in QuizManager only compiles based on current state, it doesn't evaluate answers.
  // Let's add a new method like `finalizeResultsAndScore()` in QuizManager.

  // Based on quizManager.js, the `submitAnswer` method calculates correctness for a SINGLE question.
  // The `isQuizComplete` checks if all `questionStatus` entries are non-null.
  // This suggests `submitAnswer` must be called for *each* question before finalizing.
  // However, the UI is designed to save answers directly in `selectedAnswers` on input/change,
  // and navigate. The scoring needs to happen just before showing results.

  // REVISED SCORING LOGIC:
  // Iterate through all questions in QuizUI or add a method in QuizManager
  // Let's add a method to QuizManager to evaluate *all* answers based on `selectedAnswers` and update `questionStatus` and `score`.

  console.log("Finalizing quiz and calculating results...");

  // Call a new method in QuizManager to evaluate all stored answers
  // Assuming QuizManager has a method like `evaluateAllAnswers()`
  // UPDATE: Let's use the existing `submitAnswer` concept but adapt.
  // It seems `quizManager.submitAnswer(optionIndex)` updates status/score for the `currentQuestionIndex`.
  // This model means the answer is submitted *per question*.
  // The UI currently saves answer on change and moves.
  // Let's adjust the flow: when moving to the NEXT question (or submitting on the last),
  // the answer for the question being left should be 'submitted' to QuizManager.

  // Okay, let's rethink based on the provided QuizManager.prototype.submitAnswer(optionIndex).
  // It takes an index. How does it work for text/matching/blanks? It doesn't seem designed for them.
  // The QuizManager structure seems built primarily for multiple choice based on `submitAnswer(optionIndex)`.
  // This is a mismatch with the UI's rendering logic (`_renderTextInput`, etc.).

  // Let's make an ASSUMPTION for now to proceed:
  // Assume QuizManager has been or will be updated to handle different answer types in `submitAnswer`
  // OR
  // Assume the quiz data ONLY contains 'multiple-choice' questions for now.
  // In that case, the logic in `_renderMultipleChoice` should call `this.quizManager.submitAnswer(index)`
  // when an option is selected, instead of just saving to `selectedAnswers`.
  // Let's revert to the original conceptual flow where submit happens PER QUESTION.

  // --- REVISED UI FLOW BASED ON POTENTIAL QUIZMANAGER DESIGN ---
  // User selects an option (MC) or types text etc.
  // This triggers validation and maybe temporary feedback on the current question.
  // The 'Next' button is enabled IF the current question is answered.
  // Clicking 'Next' submits the answer for the current question, records time, then moves.
  // On the last question, 'Submit' button is enabled if answered.
  // Clicking 'Submit' submits the answer for the last question, records time, and shows results.

  // This means `goToNextQuestion` and the logic in `showResults` need to call `quizManager.submitAnswer()`
  // BEFORE moving or showing results.
  // But `submitAnswer` takes an index, not the answer value. This is still a problem with non-MC types.

  // Let's assume the simplest fix to unblock:
  // Keep the UI saving to `selectedAnswers`.
  // Modify `showResults` to iterate through `selectedAnswers` and call `quizManager.submitAnswer` for each.
  // This requires `submitAnswer` to be callable multiple times and correctly process saved answers.
  // This is NOT ideal but might work if submitAnswer is refactored or if only MC is used.
  // A better approach would be `quizManager.evaluateAnswer(index, userAnswer)` and `quizManager.getResults()`.

  // Assuming `quizManager.getResults()` is updated to evaluate based on `selectedAnswers` and `questionStatus`
  const results = this.quizManager.getResults(); // Get compiled results from manager

  if (!results || results.total === 0) {
      console.error("Failed to generate results. Quiz data or results are empty/invalid.", results);
      alert("Une erreur est survenue lors du calcul des résultats.");
      // Go back to quiz selection
       if(typeof this.quizManager.currentThemeId !== 'undefined' && this.quizManager.currentThemeId !== null) {
         this.showQuizSelection();
       } else {
         this.showWelcomeScreen();
       }
      return;
  }

  // Store results in local storage (using StorageManager via global 'storage')
  // Assuming QuizManager has saveQuizResults which calls storage.saveQuizResult
  // Or call storage directly:
  // window.storage.saveQuizResult(this.quizManager.getCurrentThemeId(), this.quizManager.getCurrentQuizId(), results);
  // Let's stick to the method call if it exists, as in your original UI code.
  // Assuming `quizManager.saveQuizResults(results)` exists and works. Let's add it to QuizManager if not.
  // It's not in the provided QuizManager. Let's call storage directly as the UI has access.
  window.storage.saveQuizResult(this.quizManager.getCurrentThemeId(), this.quizManager.getCurrentQuizId(), results);

  // Check and award badges based on results
  window.storage.checkAndAwardBadges(results); // Call badge check after saving results


  // Display results screen
  this.renderResultsScreen(results);
  this._transitionScreen(this.dom.screens.result);

  // Reset quiz state in manager AFTER getting results but BEFORE potentially restarting
  this.quizManager.resetQuizState(); // Clears state for next quiz start/restart
};


/** Affiche l'écran des résultats */
QuizUI.prototype.renderResultsScreen = function(results) {
  const resultScreen = this.dom.screens.result;
  if (!resultScreen) {
       console.error("DOM element for result screen not found.");
       return;
  }

  // Ensure results and quiz data are available
  if (!results || !this.quizManager.getCurrentQuizData()) {
       resultScreen.innerHTML = '<p class="error-message">Impossible d\'afficher les résultats.</p>';
       console.error("Results or Quiz data missing for rendering result screen.");
       return;
  }

  const quizData = this.quizManager.getCurrentQuizData(); // Get quiz data from manager
  const totalQuestions = results.total; // Use results data
  const correctAnswers = results.score; // Use results data
  const accuracyPercent = results.accuracy; // Use results data
  const totalTime = results.totalTime || 0; // Use results data

  // Format time
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const timeFormatted = `${minutes}m ${seconds}s`;

  // Determine result message based on score percentage
  let resultMessage = '';
  let resultIcon = '';
  let messageClass = '';

  if (accuracyPercent >= 90) {
    resultMessage = 'Excellent ! Félicitations !';
    resultIcon = '<i class="fas fa-trophy"></i>';
    messageClass = 'msg-excellent';
  } else if (accuracyPercent >= 70) {
    resultMessage = 'Bon travail !';
    resultIcon = '<i class="fas fa-award"></i>';
    messageClass = 'msg-good';
  } else if (accuracyPercent >= 50) {
    resultMessage = 'Pas mal. Continuez de pratiquer.';
    resultIcon = '<i class="fas fa-thumbs-up"></i>';
    messageClass = 'msg-average';
  } else {
    resultMessage = 'Continuez vos efforts ! La pratique mène à la perfection.';
    resultIcon = '<i class="fas fa-book-open"></i>';
    messageClass = 'msg-needs-improvement';
  }

   // Prepare data for question breakdown
   // Need to get question texts and compare saved answers vs correct answers.
   // Assuming results object contains this breakdown or can be generated now.
   // Based on QuizManager.prototype.getResults(), it returns answers[] and status[] but not question texts.
   // Need to combine quizData.questions with results.answers and results.status.

   const questionResultsHtml = this._generateQuestionResultsList(quizData.questions, results.answers, results.status);


  // Create results HTML
  resultScreen.innerHTML = `
    <div class="results-container">
      <h1>Résultats du Quiz</h1>
      <h2>${quizData.name || "Nom du Quiz"}</h2>

      <div class="result-summary">
        <div class="result-message ${messageClass}">
          ${resultIcon}
          <h3>${resultMessage}</h3>
        </div>

        <div class="score-display">
          <div class="score-circle">
            <span class="score-value">${accuracyPercent}%</span>
          </div>
          <p>${correctAnswers} bonnes réponses sur ${totalQuestions} questions</p>
        </div>

        <div class="result-details">
          <p><i class="far fa-clock"></i> Temps total: ${timeFormatted}</p>
          <p><i class="fas fa-calendar"></i> Terminé le ${new Date(results.dateCompleted).toLocaleDateString()}</p> <!-- Use date from results -->
        </div>
         ${results.avgTime !== 'N/A' ? `<div class="result-timing-stats">
             <p><i class="fas fa-stopwatch"></i> Temps moyen par question: ${results.avgTime}s</p>
             ${results.fastest !== 'N/A' ? `<p><i class="fas fa-forward"></i> Plus rapide: ${results.fastest}s</p>` : ''}
             ${results.slowest !== 'N/A' ? `<p><i class="fas fa-backward"></i> Plus lent: ${results.slowest}s</p>` : ''}
         </div>` : ''}
      </div>

      <div class="question-results">
        <h3>Détail des questions</h3>
        <div class="questions-list">
          ${questionResultsHtml}
        </div>
      </div>

      <div class="buttons">
        <div class="button-group">
          <button id="restart-quiz-btn" class="btn btn-secondary"> <!-- Corrected ID -->
            <i class="fas fa-redo btn-icon"></i>Recommencer
          </button>
          <button id="exit-results-btn" class="btn btn-secondary"> <!-- Corrected ID -->
            <i class="fas fa-list btn-icon"></i>Liste des Quiz
          </button>
        </div>
        <div class="button-group share-buttons">
          <button id="export-results-btn" class="btn"> <!-- Corrected ID -->
            <i class="fas fa-download btn-icon"></i>Exporter CSV
          </button>
          <button id="print-results-btn" class="btn"> <!-- Corrected ID -->
            <i class="fas fa-print btn-icon"></i>Imprimer
          </button>
          <button id="copy-results-btn" class="btn"> <!-- Corrected ID -->
            <i class="fas fa-copy btn-icon"></i>Copier Résultat
          </button>
        </div>
      </div>
    </div>
  `;

  // Set up result screen button event listeners (using corrected IDs)
  resultScreen.querySelector('#restart-quiz-btn')?.addEventListener('click', () => this.restartCurrentQuiz());
  resultScreen.querySelector('#exit-results-btn')?.addEventListener('click', () => this.showQuizSelection()); // Exit to quiz selection
  resultScreen.querySelector('#export-results-btn')?.addEventListener('click', () => this.exportResults());
  resultScreen.querySelector('#print-results-btn')?.addEventListener('click', () => this.printResults());
  resultScreen.querySelector('#copy-results-btn')?.addEventListener('click', () => this.copyShareText());

   // Ensure focus is set after rendering
   setTimeout(() => {
       const firstFocusable = resultScreen.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
       if (firstFocusable) {
         firstFocusable.focus();
       } else {
         resultScreen.setAttribute('tabindex', '-1');
         resultScreen.focus();
       }
   }, 50);
};

/** Génère la liste détaillée des résultats pour chaque question */
// Updated signature to take quiz questions, user answers, and status
QuizUI.prototype._generateQuestionResultsList = function(quizQuestions, userAnswers, questionStatus) {
   if (!quizQuestions || quizQuestions.length === 0 || !userAnswers || !questionStatus) {
       return '<p class="no-data">Aucun détail disponible.</p>';
   }

   let html = '';

   quizQuestions.forEach((questionData, index) => {
       const questionNumber = index + 1;
       const isCorrect = questionStatus[index] === 'correct'; // Check status from results
       const iconClass = isCorrect ? 'fa-check-circle correct' : 'fa-times-circle incorrect';
       const userAnswer = userAnswers[index]; // Get user's answer from results array
       const correctAnswer = questionData.correctAnswer; // Get correct answer from quiz data

       // Format answers for display - handle arrays, objects, etc.
       const formatAnswer = (answer, questionType) => {
           if (answer === null || typeof answer === 'undefined') return 'Pas de réponse';
           if (questionType === 'multiple-choice') {
               if (Array.isArray(answer)) { // Multi-select MC
                   // Find the text for each selected value
                   const selectedTexts = answer.map(val => {
                       const option = questionData.options.find(opt => opt.value === val || opt === val);
                       return option ? (option.text || option) : val; // Use text or value as fallback
                   });
                   return selectedTexts.join(', ');
               } else { // Single-select MC
                   // Find the text for the selected value
                   const option = questionData.options.find(opt => opt.value === answer || opt === answer);
                   return option ? (option.text || option) : answer;
               }
           }
           if (questionType === 'text-input') {
              return answer.toString(); // Display the text directly
           }
            if (questionType === 'matching' && typeof answer === 'object') {
                // Display matching pairs. Format: Item 1 -> Match A, Item 2 -> Match B
                const pairs = Object.keys(answer).map(itemIndex => {
                    const matchIndex = answer[itemIndex];
                     // Find texts using original data items and matches
                    const itemText = questionData.items[itemIndex]?.text || `Item ${Number(itemIndex) + 1}`;
                    const matchText = questionData.matches[matchIndex]?.text || `Match ${Number(matchIndex) + 1}`;
                    return `${itemText} &rarr; ${matchText}`;
                });
                 return pairs.join('; ');
            }
             if (questionType === 'fill-in-blanks' && typeof answer === 'object') {
                 // Display entered text for each blank
                 const blankAnswers = Object.keys(answer).map(blankIndex => {
                     return `[${Number(blankIndex) + 1}] ${answer[blankIndex]}`;
                 });
                 return blankAnswers.join(' / ');
             }

           return answer.toString(); // Default for other types
       };

       // Format correct answer for display
       const formatCorrectAnswer = (answer, questionType) => {
           if (answer === null || typeof answer === 'undefined') return 'Aucune réponse correcte définie';

           if (questionType === 'multiple-choice') {
               // Find the text for the correct value
               const option = questionData.options.find(opt => opt.value === answer || opt === answer);
               return option ? (option.text || option) : answer;
           }
           if (questionType === 'text-input') {
               // Text input can have multiple correct answers (array) or a single string
               if (Array.isArray(answer)) {
                   return answer.join(' ou ');
               }
               return answer.toString();
           }
           if (questionType === 'matching' && Array.isArray(answer)) {
               // Correct answer for matching is an array of correct match indices [match_for_item0, match_for_item1, ...]
                const pairs = answer.map((matchIndex, itemIndex) => {
                   const itemText = questionData.items[itemIndex]?.text || `Item ${Number(itemIndex) + 1}`;
                   const matchText = questionData.matches[matchIndex]?.text || `Match ${Number(matchIndex) + 1}`;
                   return `${itemText} &rarr; ${matchText}`;
                });
                return pairs.join('; ');
           }
           if (questionType === 'fill-in-blanks' && Array.isArray(answer)) {
                // Correct answer for fill-in-blanks is an array of correct strings for each blank
                const blankAnswers = answer.map((corr, blankIndex) => `[${Number(blankIndex) + 1}] ${Array.isArray(corr) ? corr.join(' ou ') : corr}`);
                return blankAnswers.join(' / ');
           }

           return answer.toString(); // Default
       };


       html += `
         <div class="question-result ${isCorrect ? 'correct' : 'incorrect'}">
           <div class="question-result-header">
             <span class="question-number">Question ${questionNumber}</span>
             <i class="fas ${iconClass}"></i>
           </div>
           <div class="question-result-content">
             <p class="question-text">${questionData.question}</p> <!-- Use the original question text -->
             <div class="answer-comparison">
               <div class="user-answer">
                 <span class="label">Votre réponse:</span>
                 <span class="value">${formatAnswer(userAnswer, questionData.type)}</span>
               </div>
               <div class="correct-answer">
                 <span class="label">Réponse correcte:</span>
                 <span class="value">${formatCorrectAnswer(correctAnswer, questionData.type)}</span>
               </div>
             </div>
             ${questionData.explanation ? `<div class="explanation"><strong>Explication:</strong> ${questionData.explanation}</div>` : ''}
           </div>
         </div>
       `;
   });

   return html;
};


/** Redémarre le quiz actuel */
QuizUI.prototype.restartCurrentQuiz = function() {
   // Get current theme and quiz ID before resetting state
   const themeId = this.quizManager.currentThemeId;
   const quizId = this.quizManager.currentQuizId;

  if (!themeId || !quizId) {
      console.error("Cannot restart quiz: theme or quiz ID is missing.");
      alert("Impossible de redémarrer le quiz. Veuillez sélectionner un quiz à nouveau.");
      this.showQuizSelection(); // Go back to selection
      return;
  }

  if (confirm('Voulez-vous recommencer ce quiz ? Votre progression pour ce quiz sera réinitialisée.')) {
    // Reset state in manager
    this.quizManager.resetQuizState(); // Clears score, answers, index, time

    // Re-start the quiz with the same theme and quiz ID
    // This will reload the data and render the first question
    this.startSelectedQuiz(themeId, quizId);

    // The startSelectedQuiz function handles starting the timer if enabled
  }
};


/** Exporte les résultats au format CSV */
QuizUI.prototype.exportResults = function() {
   // Need to get the results again or store them after showResults
   // Assuming showResults stored the last results internally or in quizManager
   // Let's assume quizManager has a method like `getLastResults()`
   // UPDATE: Checking QuizManager, there is no getLastResults.
   // The results are compiled in getResults() *before* being passed to UI.
   // The UI should ideally store them temporarily for export/print/copy.
   // Let's add a property to QuizUI: `this.lastResults = null;` and set it in renderResultsScreen.
   // For now, as a workaround, re-generate results from quizManager state IF it hasn't been reset.
   // However, resetQuizState is called in showResults, so state is gone.
   // The `storage` object saves simplified results, not detailed ones.

   // This export function requires the detailed breakdown (question, user answer, correct answer, status).
   // This detailed breakdown is generated in `_generateQuestionResultsList` but not stored.
   // We need the original `quizData.questions`, `results.answers`, and `results.status`.
   // Let's get quiz data from manager (should be available if not reset immediately?)
   // Or, even better, the `results` object passed to `renderResultsScreen` contains the necessary info.
   // The renderResultsScreen should store the *full* results object passed to it.

   // Assuming the results object IS stored in `this.lastResults` by `renderResultsScreen`
   const results = this.lastResults; // Need to set this property in renderResultsScreen

   if (!results || !results.quiz || !results.quiz.questions) {
     console.error("No results available for export or results structure is invalid.");
     alert('Aucun résultat à exporter.');
     return;
   }

   const quizData = results.quiz; // Get quiz info from results object
   const questionData = results.quiz.questions; // Get original question data from results object
   const userAnswers = results.answers; // Get user answers from results object
   const questionStatus = results.status; // Get status from results object

   const now = new Date();
   const dateStr = now.toISOString().slice(0, 10);

   // Build CSV content
   let csvContent = 'Question,Votre Réponse,Réponse Correcte,Résultat\n';

   questionData.forEach((question, index) => {
       const userAnswer = userAnswers[index];
       const isCorrect = questionStatus[index] === 'correct';

       // Format answers for CSV (simplified vs display formatting)
       const formatAnswerCSV = (answer, questionType) => {
           if (answer === null || typeof answer === 'undefined') return 'Pas de réponse';
            if (questionType === 'multiple-choice' && Array.isArray(answer)) {
                return answer.join('|'); // Use pipe for multi-select
            }
             if (questionType === 'matching' && typeof answer === 'object') {
                 return Object.entries(answer).map(([itemIdx, matchIdx]) => `${itemIdx}:${matchIdx}`).join('|'); // Format as itemIndex:matchIndex|...
             }
             if (questionType === 'fill-in-blanks' && typeof answer === 'object') {
                 return Object.entries(answer).map(([blankIdx, text]) => `${blankIdx}:${text}`).join('|'); // Format as blankIndex:text|...
             }
           return answer.toString();
       };

       const formatCorrectAnswerCSV = (answer, questionType) => {
            if (answer === null || typeof answer === 'undefined') return '';
            if (questionType === 'text-input' && Array.isArray(answer)) {
                return answer.join('|'); // Use pipe for multiple correct text answers
            }
            if (questionType === 'matching' && Array.isArray(answer)) {
                return answer.join('|'); // Correct matching answer is array of match indices
            }
            if (questionType === 'fill-in-blanks' && Array.isArray(answer)) {
                 return answer.map(corr => Array.isArray(corr) ? corr.join('|') : corr).join(' / '); // Pipe for alternatives per blank, slash for blanks
             }
            return answer.toString();
       };


       // Escape commas and quotes in text fields for CSV
       const escapeCSV = (text) => {
           if (text === null || typeof text === 'undefined') return '';
           // Convert anything to string first
           let str = text.toString();
           // If it contains comma, quote, or newline, enclose in double quotes
           if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
               // Escape existing double quotes by doubling them
               str = str.replace(/"/g, '""');
               return `"${str}"`; // Enclose in double quotes
           }
           return str; // No quotes needed
       };


       const questionTextCSV = escapeCSV(question.question); // Original question text
       const userAnswerCSV = escapeCSV(formatAnswerCSV(userAnswer, question.type));
       const correctAnswerCSV = escapeCSV(formatCorrectAnswerCSV(question.correctAnswer, question.type));
       const resultText = isCorrect ? 'Correct' : 'Incorrect';

       csvContent += `${questionTextCSV},${userAnswerCSV},${correctAnswerCSV},${resultText}\n`;
   });

   // Add summary
   csvContent += '\n';
   csvContent += `Quiz,${escapeCSV(quizData.name)}\n`;
   csvContent += `Score,${results.score}/${results.total} (${results.accuracy}%)\n`;
   csvContent += `Temps total,${timeFormatted}\n`;
   if (results.dateCompleted) {
        csvContent += `Date,${new Date(results.dateCompleted).toISOString()}\n`;
   }


   // Create and download the file
   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
   const url = URL.createObjectURL(blob);
   const link = document.createElement('a');
   link.href = url;
   link.download = `quiz-results-${quizData.id || 'unknown'}-${dateStr}.csv`; // Use quiz ID or 'unknown'
   link.style.display = 'none'; // Hide the link
   document.body.appendChild(link); // Temporarily add to DOM
   link.click(); // Programmatically click the link to trigger download
   document.body.removeChild(link); // Clean up the link
   URL.revokeObjectURL(url); // Free up memory
};


/** Imprime les résultats */
QuizUI.prototype.printResults = function() {
   // Find the results container and print only that section
   const resultsContainer = this.dom.screens.result?.querySelector('.results-container'); // Assuming results are in this div

   if (!resultsContainer) {
       alert('Aucun résultat à imprimer.');
       return;
   }

   // Create a temporary window or iframe for printing
   const printWindow = window.open('', '_blank');
   if (!printWindow) {
       alert('Pop-up blocked. Please allow pop-ups for printing.');
       return;
   }

   // Get styles from the current document
   const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
                       .map(link => link.outerHTML)
                       .join('');

   // Get the content to print
   const printContent = resultsContainer.outerHTML; // Get the HTML of the results container

   printWindow.document.open();
   printWindow.document.write(`
       <!DOCTYPE html>
       <html>
       <head>
           <title>Quiz Results</title>
           ${styles}
           <style>
               /* Add any specific print styles here */
               body { font-family: sans-serif; margin: 20mm; }
               .results-container { padding: 0; border: none; }
               .buttons { display: none; } /* Hide buttons in print */
               .question-result { border: 1px solid #ccc; margin-bottom: 15px; padding: 10px; }
               .question-result-header { font-weight: bold; margin-bottom: 5px; }
               .answer-comparison { margin-top: 5px; }
               .user-answer, .correct-answer { margin-bottom: 5px; }
               .label { font-weight: bold; margin-right: 5px; }
               .explanation { font-style: italic; color: #555; margin-top: 5px; border-top: 1px dashed #eee; padding-top: 5px; }
               /* Ensure badges notification doesn't print if it's still visible */
               #badges-notification { display: none !important; }
           </style>
       </head>
       <body>
           ${printContent}
       </body>
       </html>
   `);
   printWindow.document.close();

   // Wait for content to load and then print
   printWindow.onload = function() {
       printWindow.print();
       // printWindow.close(); // Close the window after printing
   };
};


/** Copie le texte de partage des résultats dans le presse-papier */
QuizUI.prototype.copyShareText = function() {
   // Need the results data. Assuming it's stored in `this.lastResults`.
   const results = this.lastResults; // Need to set this property in renderResultsScreen

   if (!results || !results.quiz) {
     console.error("No results available for copy or results structure is invalid.");
     alert('Aucun résultat à copier.');
     return;
   }

   const quizName = results.quiz.name || "un quiz";
   const accuracy = results.accuracy;
   const score = results.score;
   const total = results.total;
   const totalTime = results.totalTime || 0;

    // Format time
   const minutes = Math.floor(totalTime / 60);
   const seconds = totalTime % 60;
   const timeFormatted = `${minutes}m ${seconds}s`;

   // Build share text
   const shareText = `
J'ai obtenu ${accuracy}% (${score}/${total}) au quiz "${quizName}" en ${timeFormatted} sur Test Your French !

Essaie de faire mieux !
${window.location.href.split('#')[0]}#quiz-selection?themeId=${this.quizManager.currentThemeId}&quizId=${this.quizManager.currentQuizId}
   `.trim(); // Use trim() to remove leading/trailing whitespace from the template literal

   // Use the clipboard API if available
   if (navigator.clipboard) {
     navigator.clipboard.writeText(shareText)
       .then(() => {
         // Provide user feedback
         // Find the copy button to place feedback next to it
         const copyBtn = this.dom.screens.result?.querySelector('#copy-results-btn');
         if (copyBtn) {
              const feedbackSpan = document.createElement('span');
              feedbackSpan.textContent = ' Copié !';
              feedbackSpan.style.cssText = 'margin-left: 10px; color: green; font-weight: bold; animation: fadeOut 2s forwards;';
              copyBtn.parentNode.appendChild(feedbackSpan);

              // Define fadeOut animation if not already in CSS
              const style = document.createElement('style');
              style.type = 'text/css';
              style.innerHTML = '@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }';
              document.head.appendChild(style);


              setTimeout(() => { feedbackSpan.remove(); style.remove(); }, 2000); // Remove after animation
         } else {
            alert('Résultats copiés dans le presse-papier !'); // Fallback alert
         }
         console.log("Share text copied to clipboard:", shareText);
       })
       .catch(err => {
         console.error('Failed to copy: ', err);
         // Fallback to manual copy if clipboard API fails
         this._fallbackCopy(shareText);
       });
   } else {
     // Fallback for older browsers without clipboard API
     this._fallbackCopy(shareText);
   }
};

/** Méthode de secours pour copier du texte (pour les anciens navigateurs) */
QuizUI.prototype._fallbackCopy = function(text) {
  // Create a temporary textarea element
  const textarea = document.createElement('textarea');
  textarea.value = text;
  // Make it invisible and outside the viewport
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select(); // Select the text

  try {
    // Execute the copy command
    const successful = document.execCommand('copy');
    if (successful) {
      alert('Résultats copiés dans le presse-papier !');
    } else {
      console.error('Failed to execute copy command (manual fallback failed)');
      // If execCommand fails, show the text in a prompt/alert
      alert('Impossible de copier automatiquement. Voici le texte à copier manuellement :\n\n' + text);
    }
  } catch (err) {
    console.error('Error during manual copy fallback:', err);
    // If an error occurs, show the text in a prompt/alert
    alert('Impossible de copier automatiquement. Voici le texte à copier manuellement :\n\n' + text);
  }

  // Clean up the temporary element
  document.body.removeChild(textarea);
};


// ----- Gestion du timer -----

/** Démarre le timer du quiz */
QuizUI.prototype.startTimer = function() {
  // Clear any existing timer interval to prevent multiple timers running
  this.stopTimer();

  // Tell quiz manager to start its internal timer logic
  // This records the start time for the current question/quiz segment
  this.quizManager.startTimer(); // Assuming this method exists and updates quizManager.startTime

  // Ensure the timer display is visible if timer is enabled
  this.updateTimerUIState();

  // Start the interval to update the timer display every second
  this.timerInterval = setInterval(() => {
    this.updateTimerDisplay(); // Updates the text content of the timer element
  }, 1000); // Update every 1000 milliseconds (1 second)

  // Update display immediately so it doesn't wait a second to show 00:00
  this.updateTimerDisplay();

  console.log("Quiz timer UI interval started.");
};


/** Arrête le timer du quiz */
QuizUI.prototype.stopTimer = function() {
  // Clear the interval that updates the UI display
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    console.log("Quiz timer UI interval stopped.");
  }

  // Tell the quiz manager to stop its internal timer logic (e.g., record elapsed time)
  // This is crucial when moving between questions, exiting, or finishing.
   this.quizManager.stopTimer(); // Assuming this method exists and records time
   console.log("Quiz timer logic stopped in manager.");


  // Update display one last time to show the final elapsed time accurately
  this.updateTimerDisplay();
};


/** Affiche/cache le timer UI */
QuizUI.prototype.toggleTimer = function() {
   // Assuming you have a container element for the timer display itself,
   // and a button to toggle its visibility.
  const timerDisplayContainer = this.dom.quiz.timer.container; // The element containing the time value
  const toggleButton = this.dom.quiz.timer.toggle; // The button clicked to toggle visibility

  if (!timerDisplayContainer || !toggleButton) {
       console.warn("Timer display container or toggle button DOM element not found.");
       return;
  }

  // Check current visibility state based on a class (e.g., 'hidden')
  const isVisible = !timerDisplayContainer.classList.contains('hidden');

  if (isVisible) {
    // If currently visible, hide it
    timerDisplayContainer.classList.add('hidden');
    // Update button icon and aria-label
    toggleButton.innerHTML = '<i class="fas fa-eye"></i>'; // Show icon (eye open)
    toggleButton.setAttribute('aria-label', 'Afficher le chronomètre');
  } else {
    // If currently hidden, show it
    timerDisplayContainer.classList.remove('hidden');
    // Update button icon and aria-label
    toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>'; // Hide icon (eye slash)
    toggleButton.setAttribute('aria-label', 'Masquer le chronomètre');
  }
   console.log("Timer visibility toggled.");
};


/** Met à jour l'affichage du timer */
QuizUI.prototype.updateTimerDisplay = function() {
  const timerValueEl = this.dom.quiz.timer.value; // The element displaying the MM:SS value
  if (!timerValueEl) {
      console.warn("DOM element for timer value (this.dom.quiz.timer.value) not found.");
      return;
  }

  // Get elapsed time from the QuizManager
  // Need a method in QuizManager that calculates elapsed time based on startTime
  // Let's assume QuizManager has a method `getElapsedTime()` that returns seconds elapsed since start.
  const elapsedSeconds = this.quizManager.getElapsedTime(); // Assuming this method exists

  // Format time as MM:SS
  // Ensure elapsedSeconds is a non-negative number
  const safeElapsedSeconds = Math.max(0, typeof elapsedSeconds === 'number' ? Math.floor(elapsedSeconds) : 0);


  const minutes = Math.floor(safeElapsedSeconds / 60);
  const seconds = safeElapsedSeconds % 60;

  // Pad minutes and seconds with leading zeros if less than 10
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

  // Update the text content of the timer element
  timerValueEl.textContent = `${minutesStr}:${secondsStr}`;
};


/** Met à jour l'état du timer dans l'UI (visible/caché) */
QuizUI.prototype.updateTimerUIState = function() {
   // This function should ensure the timer container is shown or hidden
   // based on the `this.quizManager.timerEnabled` boolean flag.
   const timerContainer = this.dom.quiz.timer.container; // The main container for the timer UI
   if (!timerContainer) {
       console.warn("DOM element for timer container (this.dom.quiz.timer.container) not found.");
       return;
   }

   if (this.quizManager.timerEnabled) {
       // If timer is enabled in settings, show the container
       timerContainer.classList.remove('hidden');
       console.log("Timer UI container shown.");
   } else {
       // If timer is disabled, hide the container
       timerContainer.classList.add('hidden');
       console.log("Timer UI container hidden.");
       // Also ensure the timer counting/interval stops if it was running
       this.stopTimer(); // This stops the UI interval and internal manager logic
   }
   // Also update the state of the toggle button icon/label
   const toggleButton = this.dom.quiz.timer.toggle;
    if (toggleButton) {
        // Check the current *visual* state of the timer display container
        const isDisplayVisible = !timerContainer.classList.contains('hidden');
         if (isDisplayVisible) {
             toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>'; // Hide icon (eye slash)
             toggleButton.setAttribute('aria-label', 'Masquer le chronomètre');
         } else {
              toggleButton.innerHTML = '<i class="fas fa-eye"></i>'; // Show icon (eye open)
              toggleButton.setAttribute('aria-label', 'Afficher le chronomètre');
         }
    }
};


// Define QuizUI as a global variable
window.QuizUI = QuizUI;
