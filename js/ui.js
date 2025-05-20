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