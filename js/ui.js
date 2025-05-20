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
  this.dom.buttons.prev?.addEventListener('click', () => this.goToPreviousQuestion());
  this.dom.buttons.next?.addEventListener('click', () => this.goToNextQuestion());
  this.dom.buttons.submit?.addEventListener('click', () => this.showResults());

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
  
  // Get or create loading indicator
  let loadingEl = containerElement.querySelector('.loading-indicator');
  const errorEl = containerElement.querySelector('.error-message');
  
  containerElement.innerHTML = ''; // Clearing as per original logic for selection containers

  if (!loadingEl) { // Create if doesn't exist
    const newLoadingEl = document.createElement('div');
    newLoadingEl.className = 'loading-indicator';
    containerElement.appendChild(newLoadingEl);
    loadingEl = newLoadingEl;
  }
  
  loadingEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
  loadingEl.classList.remove('hidden'); // Ensure it's visible

  if (errorEl) errorEl.classList.add('hidden');
  containerElement.classList.add('is-loading');
  containerElement.classList.remove('has-error');
};

QuizUI.prototype._hideLoading = function(containerElement) {
  // Added a check
  if (!containerElement) { console.error("Cannot hide loading, container element is null."); return; }
  const loadingEl = containerElement.querySelector('.loading-indicator');
  if (loadingEl) loadingEl.classList.add('hidden');
  containerElement.classList.remove('is-loading');
};

QuizUI.prototype._showError = function(containerElement, message = "Could not load data.") {
  // Added a check
  if (!containerElement) { console.error("Cannot show error, container element is null."); return; }
  const loadingEl = containerElement.querySelector('.loading-indicator');
  let errorEl = containerElement.querySelector('.error-message');
  
  // Only clear if we are replacing existing content
  containerElement.innerHTML = ''; // Clearing as per original logic for selection containers

  if (!errorEl) { // Create if doesn't exist
    const newErrorEl = document.createElement('div');
    newErrorEl.className = 'error-message';
    containerElement.appendChild(newErrorEl);
    errorEl = newErrorEl;
  }
  
  errorEl.textContent = message;
  errorEl.classList.remove('hidden'); // Ensure it's visible

  if (loadingEl) loadingEl.classList.add('hidden');
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
    const firstFocusable = screenToShow.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      // If no focusable elements, make the screen container focusable
      screenToShow.setAttribute('tabindex', '-1');
      screenToShow.focus();
    }
  }
  console.log(`Showing screen: ${screenId}`);
};

QuizUI.prototype.showWelcomeScreen = function() {
  // Re-initialize welcome screen which includes loading/rendering themes
  this.initializeWelcomeScreen();
  // Transition to the welcome screen element
  this._transitionScreen(this.dom.screens.welcome);
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

    // Charger les métadonnées des quiz pour ce thème
    // Use ResourceManager instance to get quiz metadata list for the theme
    const quizzesMeta = await this.resourceManager.getThemeQuizzes(themeId); // Use resourceManager instance

    // Enrichir les métadonnées des quiz avec les résultats stockés
    const quizzesWithProgress = this._enrichQuizzesWithProgress(themeId, quizzesMeta);

    this.renderQuizzes(themeInfo, quizzesWithProgress); // Render list
    this._hideLoading(this.dom.quizzesList);

    // Preload quiz data in background for this theme
    this.resourceManager.preloadThemeQuizzes(themeId); // Use resourceManager instance

  } catch (error) {
    console.error("Failed to show quizzes:", error);
    this.dom.themeTitle.textContent = "Error";
    this.dom.themeDescription.textContent = "";
    this._showError(this.dom.quizzesList, `Impossible de charger les quiz. ${error.message}`);
  }
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
};

QuizUI.prototype.confirmExitQuiz = function() {
  // Check if any question has been answered (status is not null)
  const quizInProgress = this.quizManager.questionStatus.some(status => status !== null) || (this.quizManager.timerEnabled && this.quizManager.startTime); // Also consider timer running

  if (!quizInProgress || confirm('Are you sure you want to exit? Your progress in this quiz will be lost.')) {
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
      const allStats = await window.storage.getVisualizationData(themes); // Need all themes to get per-theme stats object
      const stats = allStats.themeStats[theme.id];

      // If stats are not available for this theme yet (no quizzes played), use metadata totals
      const completedQuizzes = stats?.quizzes.completed || 0;
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
      if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate; // Sort by completion desc
      if (b.avgAccuracy !== a.avgAccuracy) return b.avgAccuracy - a.avgAccuracy; // Then by accuracy desc
      return a.name.localeCompare(b.name); // Then by name asc
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
    
    // Then by level (ascending: A1, A2, B1, etc.)
    if (a.level !== b.level) {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      return levels.indexOf(a.level) - levels.indexOf(b.level);
    }
    
    // Finally by quiz number/id
    return a.id - b.id;
  });
  
  // Create a wrapper for quiz difficulty grouping if needed
  const createLevelGroup = (level) => {
    const groupId = `level-${level.toLowerCase()}`;
    
    // Check if group already exists
    let group = quizzesList.querySelector(`#${groupId}`);
    if (!group) {
      group = document.createElement('div');
      group.id = groupId;
      group.className = 'level-group';
      
      const levelTitle = document.createElement('h3');
      levelTitle.className = 'level-title';
      levelTitle.textContent = `Niveau ${level}`;
      
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
    // Define level order
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    
    // Create groups for each level that has quizzes
    levelOrder.forEach(level => {
      if (quizzesByLevel[level] && quizzesByLevel[level].length > 0) {
        const levelGroup = createLevelGroup(level);
        
        // Render quizzes for this level
        quizzesByLevel[level].forEach(quiz => {
          const quizElement = this._createQuizElement(theme.id, quiz);
          levelGroup.appendChild(quizElement);
        });
      }
    });
    
    // If any quizzes don't have levels, add them at the end
    const unleveledQuizzes = quizzes.filter(quiz => !quiz.level);
    if (unleveledQuizzes.length > 0) {
      const otherGroup = createLevelGroup('Autre');
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
    icon = '<i class="fas fa-play-circle"></i>';
    statusClass = 'status-in-progress';
    statusText = 'En cours';
    accessibilityLabel = `Quiz in progress: ${quiz.name}.`;
  } else {
    // Not started
    accessibilityLabel = `Quiz not started: ${quiz.name}.`;
  }
  
  // Format quiz date completed if it exists
  let dateCompletedText = '';
  if (quiz.progress && quiz.progress.dateCompleted) {
    const date = new Date(quiz.progress.dateCompleted);
    dateCompletedText = `<span class="date-completed">Terminé le ${date.toLocaleDateString()}</span>`;
  }
  
  // Format total time if available
  let timeText = '';
  if (quiz.progress && quiz.progress.totalTime) {
    const minutes = Math.floor(quiz.progress.totalTime / 60);
    const seconds = quiz.progress.totalTime % 60;
    timeText = `<span class="time-spent">Temps: ${minutes}m ${seconds}s</span>`;
  }
  
  // Build status section HTML
  let statusHTML = '';
  if (statusText) {
    statusHTML = `
      <div class="item-status ${statusClass}">
        <span class="status-text">${statusText}</span>
        ${dateCompletedText}
        ${timeText}
      </div>
    `;
  }
  
  // Additional info: question count, difficulty
  let metaInfo = '';
  if (quiz.questionCount) {
    metaInfo += `<span class="meta-info"><i class="fas fa-list"></i> ${quiz.questionCount} questions</span>`;
  }
  if (quiz.level) {
    metaInfo += `<span class="meta-info"><i class="fas fa-signal"></i> Niveau ${quiz.level}</span>`;
  }
  if (quiz.estimatedTime) {
    metaInfo += `<span class="meta-info"><i class="far fa-clock"></i> ~ ${quiz.estimatedTime} min</span>`;
  }
  
  // Set accessibility label
  quizElement.setAttribute('aria-label', accessibilityLabel);
  
  // Build the quiz item HTML
  quizElement.innerHTML = `
    <div class="item-icon">${icon}</div>
    <div class="item-content">
      <h3>${quiz.name}</h3>
      <p>${quiz.description || 'Test your knowledge on this topic.'}</p>
      <div class="meta-info-container">
        ${metaInfo}
      </div>
      ${statusHTML}
    </div>
    <div class="item-action" aria-hidden="true">
      Commencer <i class="fas fa-arrow-right"></i>
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
  
  if (!themeStats || Object.keys(themeStats).length === 0) {
    container.innerHTML = '<p class="no-data">Aucune donnée de progression disponible.</p>';
    return;
  }
  
  // Create array from theme stats object for sorting
  const themeArray = Object.keys(themeStats).map(themeId => {
    const themeData = themeStats[themeId];
    // Find theme name from themes array
    const theme = themes.find(t => t.id === Number(themeId));
    return {
      id: themeId,
      name: theme ? theme.name : `Theme ${themeId}`,
      completion: themeData.completion,
      accuracy: themeData.avgAccuracy,
      quizzes: themeData.quizzes
    };
  });
  
  // Sort by completion rate (descending)
  themeArray.sort((a, b) => b.completion - a.completion);
  
  // Create theme bars
  themeArray.forEach(theme => {
    const barEl = document.createElement('div');
    barEl.className = 'theme-bar';
    
    // Use theme accuracy for color gradient (red -> yellow -> green)
    const accuracyColorClass = theme.accuracy >= 80 ? 'high-score' : 
                              theme.accuracy >= 60 ? 'medium-score' : 'low-score';
    
    barEl.innerHTML = `
      <div class="theme-info">
        <span class="theme-name">${theme.name}</span>
        <span class="theme-stats">
          ${theme.quizzes.completed}/${theme.quizzes.total} quizzes · ${theme.accuracy}% accuracy
        </span>
      </div>
      <div class="progress-bar">
        <div class="progress ${accuracyColorClass}" style="width: ${theme.completion}%"></div>
      </div>
    `;
    
    container.appendChild(barEl);
  });
};

/** Affiche les meilleurs et pires thèmes dans l'écran statistiques */
QuizUI.prototype.renderBestAndWorstThemes = function(bestTheme, worstTheme, themes) {
  const bestContainer = this.dom.stats.bestTheme;
  const worstContainer = this.dom.stats.worstTheme;
  
  // Helper function to render a theme performance card
  const renderThemeCard = (container, themeData, label) => {
    if (!container) return; // Skip if container not found
    
    if (!themeData || !themeData.id) {
      container.innerHTML = `<p class="no-data">Pas assez de données pour déterminer le ${label} thème.</p>`;
      return;
    }
    
    // Find theme name from themes array
    const theme = themes.find(t => t.id === Number(themeData.id));
    const themeName = theme ? theme.name : `Theme ${themeData.id}`;
    
    container.innerHTML = `
      <div class="performance-card">
        <h4>${themeName}</h4>
        <div class="performance-stats">
          <div class="stat">
            <span class="stat-value">${themeData.accuracy}%</span>
            <span class="stat-label">Précision</span>
          </div>
          <div class="stat">
            <span class="stat-value">${themeData.completion}%</span>
            <span class="stat-label">Complétion</span>
          </div>
        </div>
      </div>
    `;
  };
  
  // Render best and worst theme cards
  renderThemeCard(bestContainer, bestTheme, 'meilleur');
  renderThemeCard(worstContainer, worstTheme, 'pire');
};

/** Affiche l'historique des quiz récemment terminés */
QuizUI.prototype.renderQuizHistory = function(historyItems) {
  const container = this.dom.stats.historyList;
  if (!container) { console.error("History list container not found."); return; }
  container.innerHTML = ''; // Clear previous content
  
  if (!historyItems || historyItems.length === 0) {
    container.innerHTML = '<p class="no-data">Aucun historique disponible.</p>';
    return;
  }
  
  // Sort history by date (descending - most recent first)
  historyItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Take only the most recent items (e.g., last 10)
  const recentItems = historyItems.slice(0, 10);
  
  // Create list of history items
  const listEl = document.createElement('ul');
  listEl.className = 'history-list';
  
  recentItems.forEach(item => {
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const scorePercent = Math.round((item.score / item.total) * 100);
    const scoreClass = scorePercent >= 80 ? 'high-score' : 
                       scorePercent >= 60 ? 'medium-score' : 'low-score';
    
    const listItem = document.createElement('li');
    listItem.className = 'history-item';
    listItem.innerHTML = `
      <div class="history-content">
        <div class="history-title">
          <span class="quiz-name">${item.quizName}</span>
          <span class="theme-name">${item.themeName}</span>
        </div>
        <div class="history-details">
          <span class="history-date">${formattedDate} à ${formattedTime}</span>
          <span class="history-score ${scoreClass}">${item.score}/${item.total} (${scorePercent}%)</span>
          ${item.time ? `<span class="history-time"><i class="far fa-clock"></i> ${Math.floor(item.time / 60)}m ${item.time % 60}s</span>` : ''}
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
  // Ensure themeId and quizId are set in manager
  this.quizManager.currentThemeId = themeId;
  this.quizManager.currentQuizId = quizId;
  
  this._transitionScreen(this.dom.screens.quiz);
  this._showLoading(this.dom.quiz, "Chargement du quiz...");
  this._clearError(this.dom.quiz);
  
  try {
    // Load quiz data via the quiz manager
    await this.quizManager.loadQuiz(themeId, quizId);
    
    // Once loaded, setup quiz UI components
    const quiz = this.quizManager.getQuizData();
    
    // Set quiz name
    this.dom.quizName.textContent = quiz.name;
    
    // Initialize quiz UI state
    this.renderQuizProgress();
    this.renderCurrentQuestion();
    
    // Start timer if enabled
    this.updateTimerUIState();
    if (this.quizManager.timerEnabled) {
      this.startTimer();
    }
    
    this._hideLoading(this.dom.quiz);
    
  } catch (error) {
    console.error("Failed to start quiz:", error);
    this._showError(this.dom.quiz, `Impossible de charger le quiz. ${error.message}`);
    
    // Disable navigation buttons on error
    this.dom.buttons.prev.disabled = true;
    this.dom.buttons.next.disabled = true;
    this.dom.buttons.submit.disabled = true;
  }
};

/** Affiche la barre de progression du quiz */
QuizUI.prototype.renderQuizProgress = function() {
  const steps = this.dom.progressSteps;
  if (!steps) return;
  
  steps.innerHTML = ''; // Clear previous steps
  
  const totalQuestions = this.quizManager.getQuestionCount();
  const currentIndex = this.quizManager.getCurrentQuestionIndex();
  const status = this.quizManager.questionStatus;
  
  // Update progress bar width
  const progressPercent = ((currentIndex) / (totalQuestions)) * 100;
  this.dom.progress.style.width = `${progressPercent}%`;
  
  // Create step indicators
  for (let i = 0; i < totalQuestions; i++) {
    const step = document.createElement('div');
    step.className = 'step';
    
    // Current step
    if (i === currentIndex) {
      step.classList.add('current');
    }
    
    // Completed steps - add status class
    if (i < currentIndex) {
      // Check the status from quiz manager
      if (status[i] === true) {
        step.classList.add('correct');
      } else if (status[i] === false) {
        step.classList.add('incorrect');
      } else {
        step.classList.add('completed');
      }
    }
    
    // Add aria attributes for accessibility
    step.setAttribute('aria-label', `Question ${i + 1} de ${totalQuestions}`);
    
    steps.appendChild(step);
  }
  
  // Update button states
  this.updateNavigationButtons();
};

/** Met à jour l'état des boutons de navigation */
QuizUI.prototype.updateNavigationButtons = function() {
  const currentIndex = this.quizManager.getCurrentQuestionIndex();
  const totalQuestions = this.quizManager.getQuestionCount();
  const isAnswered = this.quizManager.isCurrentQuestionAnswered();
  
  // Prev button - disable on first question
  this.dom.buttons.prev.disabled = currentIndex === 0;
  
  // Next/Submit buttons
  if (currentIndex < totalQuestions - 1) {
    // Not last question - show Next, hide Submit
    this.dom.buttons.next.style.display = '';
    this.dom.buttons.submit.style.display = 'none';
    // Enable Next if question is answered
    this.dom.buttons.next.disabled = !isAnswered;
  } else {
    // Last question - hide Next, show Submit
    this.dom.buttons.next.style.display = 'none';
    this.dom.buttons.submit.style.display = '';
    // Enable Submit if all questions are answered
    this.dom.buttons.submit.disabled = !this.quizManager.isQuizComplete();
  }
};

/** Affiche la question actuelle */
QuizUI.prototype.renderCurrentQuestion = function() {
  const questionContainer = this.dom.quiz;
  if (!questionContainer) return;
  
  const currentQuestionData = this.quizManager.getCurrentQuestion();
  if (!currentQuestionData) {
    questionContainer.innerHTML = '<p class="error-message">Question non disponible.</p>';
    return;
  }
  
  // Reset feedback area
  if (this.dom.feedback) {
    this.dom.feedback.innerHTML = '';
    this.dom.feedback.classList.remove('correct', 'incorrect');
  }
  
  // Create question container
  const wrapper = document.createElement('div');
  wrapper.className = 'question';
  
  // Question number and text
  const questionIndex = this.quizManager.getCurrentQuestionIndex();
  const questionNumber = questionIndex + 1;
  const totalQuestions = this.quizManager.getQuestionCount();
  
  const questionHeader = document.createElement('div');
  questionHeader.className = 'question-header';
  questionHeader.innerHTML = `
    <span class="question-number">Question ${questionNumber}/${totalQuestions}</span>
  `;
  
  const questionText = document.createElement('div');
  questionText.className = 'question-text';
  questionText.innerHTML = currentQuestionData.text;
  
  wrapper.appendChild(questionHeader);
  wrapper.appendChild(questionText);
  
  // Instructions if provided
  if (currentQuestionData.instructions) {
    const instructions = document.createElement('div');
    instructions.className = 'question-instructions';
    instructions.textContent = currentQuestionData.instructions;
    wrapper.appendChild(instructions);
  }
  
  // Create answer options based on question type
  const answersContainer = document.createElement('div');
  answersContainer.className = 'answers-container';
  
  // Get saved answer from quiz manager if question was already answered
  const savedAnswer = this.quizManager.getSavedAnswer(questionIndex);
  
  switch (currentQuestionData.type) {
    case 'multiple-choice':
      this._renderMultipleChoice(answersContainer, currentQuestionData, savedAnswer);
      break;
      
    case 'text-input':
      this._renderTextInput(answersContainer, currentQuestionData, savedAnswer);
      break;
      
    case 'matching':
      this._renderMatching(answersContainer, currentQuestionData, savedAnswer);
      break;
      
    case 'fill-in-blanks':
      this._renderFillInBlanks(answersContainer, currentQuestionData, savedAnswer);
      break;
      
    default:
      answersContainer.innerHTML = '<p class="error-message">Type de question non pris en charge.</p>';
  }
  
  wrapper.appendChild(answersContainer);
  
  // Clear and add new question
  questionContainer.innerHTML = '';
  questionContainer.appendChild(wrapper);
  
  // Update UI state
  this.renderQuizProgress();
};

/** Render multiple choice question */
QuizUI.prototype._renderMultipleChoice = function(container, question, savedAnswer) {
  const isMultiAnswer = question.multiAnswer || false;
  const optionsType = isMultiAnswer ? 'checkbox' : 'radio';
  const optionsName = `question-${question.id}-options`;
  
  const form = document.createElement('form');
  form.className = 'options-form';
  form.setAttribute('data-question-id', question.id);
  
  // Helper to check if an option was selected in saved answer
  const isSelected = (optionValue) => {
    if (!savedAnswer) return false;
    if (Array.isArray(savedAnswer)) {
      return savedAnswer.includes(optionValue);
    }
    return savedAnswer === optionValue;
  };
  
  // Create options
  question.options.forEach((option, index) => {
    const optionId = `option-${question.id}-${index}`;
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option';
    
    // If saved answer exists and matches this option, add selected class
    if (isSelected(option.value || index)) {
      optionDiv.classList.add('selected');
    }
    
    const input = document.createElement('input');
    input.type = optionsType;
    input.id = optionId;
    input.name = optionsName;
    input.value = option.value || index;
    input.checked = isSelected(option.value || index);
    
    const label = document.createElement('label');
    label.htmlFor = optionId;
    label.innerHTML = option.text;
    
    // Add change event listener
    input.addEventListener('change', (e) => {
      // Update UI
      const selectedOptions = form.querySelectorAll('.selected');
      selectedOptions.forEach(el => el.classList.remove('selected'));
      
      if (isMultiAnswer) {
        // For checkboxes, add selected class to all checked options
        const checkedInputs = form.querySelectorAll('input:checked');
        checkedInputs.forEach(input => {
          input.closest('.option').classList.add('selected');
        });
        
        // Get all selected values
        const selectedValues = Array.from(checkedInputs).map(input => input.value);
        this.quizManager.saveAnswer(question.id, selectedValues);
      } else {
        // For radio, just add to the clicked option
        e.target.closest('.option').classList.add('selected');
        this.quizManager.saveAnswer(question.id, e.target.value);
      }
      
      // Update navigation buttons
      this.updateNavigationButtons();
    });
    
    optionDiv.appendChild(input);
    optionDiv.appendChild(label);
    form.appendChild(optionDiv);
  });
  
  container.appendChild(form);
};

/** Render text input question */
QuizUI.prototype._renderTextInput = function(container, question, savedAnswer) {
  const form = document.createElement('form');
  form.className = 'text-input-form';
  form.setAttribute('data-question-id', question.id);
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'text-answer-input';
  input.placeholder = question.placeholder || 'Tapez votre réponse ici';
  input.value = savedAnswer || '';
  
  // Add input event listener
  input.addEventListener('input', (e) => {
    const answer = e.target.value.trim();
    this.quizManager.saveAnswer(question.id, answer);
    this.updateNavigationButtons();
  });
  
  form.appendChild(input);
  container.appendChild(form);
};

/** Render matching question */
QuizUI.prototype._renderMatching = function(container, question, savedAnswer) {
  const matchingContainer = document.createElement('div');
  matchingContainer.className = 'matching-container';
  
  // Create left column items
  const leftColumn = document.createElement('div');
  leftColumn.className = 'matching-column left-column';
  
  question.items.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'matching-item';
    itemDiv.setAttribute('data-item-id', index);
    itemDiv.innerHTML = `
      <span class="item-number">${index + 1}.</span>
      <span class="item-text">${item.text}</span>
    `;
    leftColumn.appendChild(itemDiv);
  });
  
  // Create right column (matches)
  const rightColumn = document.createElement('div');
  rightColumn.className = 'matching-column right-column';
  
  // Create selects for each item
  question.items.forEach((item, index) => {
    const selectDiv = document.createElement('div');
    selectDiv.className = 'matching-select';
    
    const select = document.createElement('select');
    select.setAttribute('data-item-id', index);
    
    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Choisir --';
    select.appendChild(emptyOption);
    
    // Add match options
    question.matches.forEach((match, matchIndex) => {
      const option = document.createElement('option');
      option.value = matchIndex;
      option.textContent = match.text;
      
      // If saved answer exists and matches this item, select it
      if (savedAnswer && savedAnswer[index] === matchIndex) {
        option.selected = true;
      }
      
      select.appendChild(option);
    });
    
    // Add change event listener
    select.addEventListener('change', () => {
      const currentAnswer = savedAnswer ? {...savedAnswer} : {};
      
      if (select.value === '') {
        // Remove this match from answer
        delete currentAnswer[index];
      } else {
        // Add or update this match
        currentAnswer[index] = Number(select.value);
      }
      
      this.quizManager.saveAnswer(question.id, currentAnswer);
      this.updateNavigationButtons();
    });
    
    selectDiv.appendChild(select);
    rightColumn.appendChild(selectDiv);
  });
  
  matchingContainer.appendChild(leftColumn);
  matchingContainer.appendChild(rightColumn);
  container.appendChild(matchingContainer);
};


      /** Render fill-in-blanks question (suite) */
QuizUI.prototype._renderFillInBlanks = function(container, question, savedAnswer) {
  const fillBlanksContainer = document.createElement('div');
  fillBlanksContainer.className = 'fill-blanks-container';
  
  // Parse text and replace blanks with input fields
  const segments = question.text.split(/\{blank(\d+)\}/);
  const blanksCount = segments.length > 1 ? (segments.length - 1) / 2 : 0;
  
  const textContainer = document.createElement('div');
  textContainer.className = 'fill-blanks-text';
  
  for (let i = 0; i < segments.length; i++) {
    // Text segments
    if (i % 2 === 0) {
      const textSpan = document.createElement('span');
      textSpan.innerHTML = segments[i];
      textContainer.appendChild(textSpan);
    } else {
      // Blank inputs
      const blankIndex = parseInt(segments[i]) - 1;
      const inputId = `blank-${question.id}-${blankIndex}`;
      
      const inputWrapper = document.createElement('span');
      inputWrapper.className = 'blank-input-wrapper';
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'blank-input';
      input.id = inputId;
      input.setAttribute('data-blank-index', blankIndex);
      
      // Set saved value if exists
      if (savedAnswer && savedAnswer[blankIndex]) {
        input.value = savedAnswer[blankIndex];
      }
      
      // Add input event listener
      input.addEventListener('input', () => {
        const currentAnswer = savedAnswer ? {...savedAnswer} : {};
        currentAnswer[blankIndex] = input.value.trim();
        this.quizManager.saveAnswer(question.id, currentAnswer);
        this.updateNavigationButtons();
      });
      
      inputWrapper.appendChild(input);
      textContainer.appendChild(inputWrapper);
    }
  }
  
  fillBlanksContainer.appendChild(textContainer);
  container.appendChild(fillBlanksContainer);
};

// ----- Navigation des questions -----

/** Passe à la question précédente */
QuizUI.prototype.goToPreviousQuestion = function() {
  if (this.quizManager.goToPrevQuestion()) {
    this.renderCurrentQuestion();
  }
};

/** Passe à la question suivante */
QuizUI.prototype.goToNextQuestion = function() {
  if (this.quizManager.goToNextQuestion()) {
    this.renderCurrentQuestion();
  }
};

/** Affiche les résultats du quiz */
QuizUI.prototype.showResults = function() {
  // Verify all questions are answered
  if (!this.quizManager.isQuizComplete()) {
    alert('Veuillez répondre à toutes les questions avant de terminer le quiz.');
    return;
  }
  
  // Stop timer if running
  this.stopTimer();
  
  // Calculate results
  const results = this.quizManager.calculateResults();
  
  // Store results in local storage
  this.quizManager.saveQuizResults(results);
  
  // Display results screen
  this.renderResultsScreen(results);
  this._transitionScreen(this.dom.screens.result);
};

/** Affiche l'écran des résultats */
QuizUI.prototype.renderResultsScreen = function(results) {
  const resultScreen = this.dom.screens.result;
  if (!resultScreen) return;
  
  const quizData = this.quizManager.getQuizData();
  const totalQuestions = results.totalQuestions;
  const correctAnswers = results.correctAnswers;
  const score = results.score;
  const totalTime = results.totalTime || 0;
  
  // Format time
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const timeFormatted = `${minutes}m ${seconds}s`;
  
  // Determine result message based on score
  let resultMessage = '';
  let resultIcon = '';
  
  if (score >= 90) {
    resultMessage = 'Excellent !';
    resultIcon = '<i class="fas fa-trophy"></i>';
  } else if (score >= 70) {
    resultMessage = 'Bon travail !';
    resultIcon = '<i class="fas fa-award"></i>';
  } else if (score >= 50) {
    resultMessage = 'Pas mal.';
    resultIcon = '<i class="fas fa-thumbs-up"></i>';
  } else {
    resultMessage = 'Continue tes efforts.';
    resultIcon = '<i class="fas fa-book"></i>';
  }
  
  // Create results HTML
  resultScreen.innerHTML = `
    <div class="results-container">
      <h1>Résultats du Quiz</h1>
      <h2>${quizData.name}</h2>
      
      <div class="result-summary">
        <div class="result-message">
          ${resultIcon}
          <h3>${resultMessage}</h3>
        </div>
        
        <div class="score-display">
          <div class="score-circle">
            <span class="score-value">${score}%</span>
          </div>
          <p>${correctAnswers} sur ${totalQuestions} réponses correctes</p>
        </div>
        
        <div class="result-details">
          <p><i class="far fa-clock"></i> Temps total: ${timeFormatted}</p>
          <p><i class="fas fa-calendar"></i> Terminé le ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
      
      <div class="question-results">
        <h3>Détail des questions</h3>
        <div class="questions-list">
          ${this._generateQuestionResultsList(results.questionResults)}
        </div>
      </div>
      
      <div class="buttons">
        <div class="button-group">
          <button id="restart-quiz" class="btn btn-secondary">
            <i class="fas fa-redo btn-icon"></i>Recommencer
          </button>
          <button id="exit-results" class="btn btn-secondary">
            <i class="fas fa-list btn-icon"></i>Liste des Quiz
          </button>
        </div>
        <div class="button-group">
          <button id="export-results" class="btn">
            <i class="fas fa-download btn-icon"></i>Exporter
          </button>
          <button id="print-results" class="btn">
            <i class="fas fa-print btn-icon"></i>Imprimer
          </button>
          <button id="copy-results" class="btn">
            <i class="fas fa-copy btn-icon"></i>Copier
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Set up result screen button event listeners
  resultScreen.querySelector('#restart-quiz').addEventListener('click', () => this.restartCurrentQuiz());
  resultScreen.querySelector('#exit-results').addEventListener('click', () => this.showQuizSelection());
  resultScreen.querySelector('#export-results').addEventListener('click', () => this.exportResults());
  resultScreen.querySelector('#print-results').addEventListener('click', () => this.printResults());
  resultScreen.querySelector('#copy-results').addEventListener('click', () => this.copyShareText());
};

/** Génère la liste détaillée des résultats pour chaque question */
QuizUI.prototype._generateQuestionResultsList = function(questionResults) {
  if (!questionResults || questionResults.length === 0) {
    return '<p class="no-data">Aucun détail disponible.</p>';
  }
  
  let html = '';
  
  questionResults.forEach((result, index) => {
    const questionNumber = index + 1;
    const iconClass = result.isCorrect ? 'fa-check-circle correct' : 'fa-times-circle incorrect';
    
    html += `
      <div class="question-result ${result.isCorrect ? 'correct' : 'incorrect'}">
        <div class="question-result-header">
          <span class="question-number">Question ${questionNumber}</span>
          <i class="fas ${iconClass}"></i>
        </div>
        <div class="question-result-content">
          <p>${result.question}</p>
          <div class="answer-comparison">
            <div class="user-answer">
              <span class="label">Votre réponse:</span>
              <span class="value">${result.userAnswer}</span>
            </div>
            <div class="correct-answer">
              <span class="label">Réponse correcte:</span>
              <span class="value">${result.correctAnswer}</span>
            </div>
          </div>
          ${result.explanation ? `<div class="explanation">${result.explanation}</div>` : ''}
        </div>
      </div>
    `;
  });
  
  return html;
};

/** Redémarre le quiz actuel */
QuizUI.prototype.restartCurrentQuiz = function() {
  if (confirm('Voulez-vous recommencer ce quiz ?')) {
    this.quizManager.restartQuiz();
    this._transitionScreen(this.dom.screens.quiz);
    this.renderQuizProgress();
    this.renderCurrentQuestion();
    
    // Reset and start timer if enabled
    if (this.quizManager.timerEnabled) {
      this.startTimer();
    }
  }
};

/** Exporte les résultats au format CSV */
QuizUI.prototype.exportResults = function() {
  const results = this.quizManager.getLastResults();
  if (!results) {
    alert('Aucun résultat à exporter.');
    return;
  }
  
  const quizData = this.quizManager.getQuizData();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  
  // Build CSV content
  let csvContent = 'Question,Votre Réponse,Réponse Correcte,Résultat\n';
  
  results.questionResults.forEach(result => {
    // Escape commas and quotes in text fields
    const question = `"${result.question.replace(/"/g, '""')}"`;
    const userAnswer = `"${result.userAnswer.replace(/"/g, '""')}"`;
    const correctAnswer = `"${result.correctAnswer.replace(/"/g, '""')}"`;
    const isCorrect = result.isCorrect ? 'Correct' : 'Incorrect';
    
    csvContent += `${question},${userAnswer},${correctAnswer},${isCorrect}\n`;
  });
  
  // Add summary
  csvContent += '\n';
  csvContent += `"Quiz","${quizData.name}"\n`;
  csvContent += `"Score","${results.score}%"\n`;
  csvContent += `"Correct Answers","${results.correctAnswers}/${results.totalQuestions}"\n`;
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `quiz-results-${quizData.id}-${dateStr}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** Imprime les résultats */
QuizUI.prototype.printResults = function() {
  window.print();
};

/** Copie le texte de partage des résultats */
QuizUI.prototype.copyShareText = function() {
  const results = this.quizManager.getLastResults();
  if (!results) {
    alert('Aucun résultat à partager.');
    return;
  }
  
  const quizData = this.quizManager.getQuizData();
  
  // Build share text
  const shareText = `
J'ai obtenu ${results.score}% au quiz "${quizData.name}" sur Test Your French !
${results.correctAnswers} bonnes réponses sur ${results.totalQuestions} questions.
Essaie de battre mon score !
  `;
  
  // Use the clipboard API if available
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText.trim())
      .then(() => {
        alert('Résultats copiés dans le presse-papier !');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        this._fallbackCopy(shareText.trim());
      });
  } else {
    this._fallbackCopy(shareText.trim());
  }
};

/** Méthode de secours pour copier du texte */
QuizUI.prototype._fallbackCopy = function(text) {
  // Create a temporary textarea
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      alert('Résultats copiés dans le presse-papier !');
    } else {
      console.error('Failed to execute copy command');
      // Show the text to manually copy
      alert('Impossible de copier automatiquement. Voici le texte à copier :\n\n' + text);
    }
  } catch (err) {
    console.error('Failed to copy: ', err);
    // Show the text to manually copy
    alert('Impossible de copier automatiquement. Voici le texte à copier :\n\n' + text);
  }
  
  document.body.removeChild(textarea);
};

// ----- Gestion du timer -----

/** Démarre le timer du quiz */
QuizUI.prototype.startTimer = function() {
  // Clear any existing timer interval
  this.stopTimer();
  
  // Initialize timer start time in quiz manager
  this.quizManager.startTimer();
  
  // Show timer UI
  this.updateTimerUIState();
  
  // Start timer update interval
  this.timerInterval = setInterval(() => {
    this.updateTimerDisplay();
  }, 1000); // Update every second
  
  // Update display immediately
  this.updateTimerDisplay();
};

/** Arrête le timer du quiz */
QuizUI.prototype.stopTimer = function() {
  // Clear interval
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }
  
  // Tell quiz manager to stop and get elapsed time
  this.quizManager.stopTimer();
  
  // Update display one last time
  this.updateTimerDisplay();
};

/** Affiche/cache le timer */
QuizUI.prototype.toggleTimer = function() {
  const timerDisplay = this.dom.quiz.timer.display;
  const toggleButton = this.dom.quiz.timer.toggle;
  
  if (!timerDisplay || !toggleButton) return;
  
  const isVisible = !timerDisplay.classList.contains('timer-hidden');
  
  if (isVisible) {
    // Hide timer
    timerDisplay.classList.add('timer-hidden');
    toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
    toggleButton.setAttribute('aria-label', 'Afficher le chronomètre');
  } else {
    // Show timer
    timerDisplay.classList.remove('timer-hidden');
    toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
    toggleButton.setAttribute('aria-label', 'Masquer le chronomètre');
  }
};

/** Met à jour l'affichage du timer */
QuizUI.prototype.updateTimerDisplay = function() {
  const timerValue = this.dom.quiz.timer.value;
  if (!timerValue) return;
  
  const elapsedSeconds = this.quizManager.getElapsedTime();
  
  // Format time as MM:SS
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
  
  timerValue.textContent = `${minutesStr}:${secondsStr}`;
};

/** Met à jour l'état du timer dans l'UI */
QuizUI.prototype.updateTimerUIState = function() {
  const timerContainer = this.dom.quiz.timer.container;
  if (!timerContainer) return;
  
  if (this.quizManager.timerEnabled) {
    timerContainer.classList.remove('hidden');
  } else {
    timerContainer.classList.add('hidden');
    this.stopTimer(); // Ensure timer is stopped if disabled
  }
};