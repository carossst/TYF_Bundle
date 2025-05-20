/*
 * js/ui.js - Version 2.2.0 (12 avril 2024)
 * Gestion de l'interface utilisateur pour Test Your French.
 * Responsable de l'affichage des écrans, du rendu des données (thèmes, quiz, questions),
 * de la gestion des interactions utilisateur (clics, etc.),
 * et de la coordination avec QuizManager, ResourceManager et StorageManager.
 */

import storage from './storage.js'; // Import storage manager pour affichage stats/progression
// Import ResourceManager directly as UI now uses it for metadata/theme/quiz loading
import ResourceManager from './resourceManager.js';

class QuizUI {
  constructor(quizManager, domElements, resourceManagerInstance) { // Pass resourceManager instance
    if (!quizManager || !domElements || !resourceManagerInstance) {
      throw new Error("QuizManager, DOM elements, and ResourceManager are required for QuizUI.");
    }
    this.quizManager = quizManager;
    this.dom = domElements;
    // Renamed to resourceManagerInstance to avoid conflict if class is imported
    this.resourceManager = resourceManagerInstance; // Store the instance
    this.themeIndexCache = null; // Cache pour l'index des thèmes (metadata)
    console.log("QuizUI initialized (V2.2 - Dynamic JSON Load)");
  }

  // ----- Initialisation & Événements -----

   /** Charge les données initiales nécessaires et affiche l'écran d'accueil. */
   async initializeWelcomeScreen() {
        this._clearError(this.dom.themesList); // Clear potential error messages
        this._showLoading(this.dom.themesList, "Chargement des thèmes..."); // Show loading

        try {
            // Charger et mettre en cache l'index des thèmes
            const themes = await this.getThemeIndex(); // Uses resourceManager via getThemeIndex

            // Afficher les thèmes sur l'écran d'accueil
            this.renderThemes(themes); // Renders themes into this.dom.themesList

            // Afficher les statistiques d'accueil
            // The logic for showing welcome stats based on completed quizzes now relies on storage.getVisualizationData
            // which is more accurate. Let's call that here.
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
   }

   /** Récupère l'index des thèmes (via cache ou ResourceManager). */
   async getThemeIndex() {
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
   }

   /** Affiche les statistiques sur l'écran d'accueil. */
   async displayWelcomeStats() { // Removed totalPossibleQuizzes parameter
        try {
            // Get themes again to calculate total quizzes (or pass totalQuizzes from main.js)
            const themes = await this.getThemeIndex(); // Uses cache if available
            const statsData = await storage.getVisualizationData(themes); // Use storage

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
    }


  /** Attache les écouteurs d'événements aux éléments DOM */
  setupEventListeners() {
    // Navigation
    // exploreThemes button is removed from HTML and DOM map
    // backToWelcome button seems unused, commented out listener
    // this.dom.buttons.backToWelcome?.addEventListener('click', () => this.showWelcomeScreen());
    // Change these back buttons to go to welcome screen
    this.dom.buttons.backToThemes?.addEventListener('click', () => this.showWelcomeScreen()); // Back from quiz selection -> Welcome
    // backToQuizzes is on Results screen, let it go back to Quiz Selection
    // this.dom.buttons.backToQuizzes?.addEventListener('click', () => this.showQuizSelection()); // Back from results -> Quiz Selection
    this.dom.buttons.exitQuiz?.addEventListener('click', () => this.confirmExitQuiz()); // Exit from quiz -> Confirmation -> depends on state

    // Statistiques
    // showStats button is on welcome screen
    this.dom.buttons.showStats?.addEventListener('click', () => this.showStatsScreen()); // Welcome -> Stats
    // showStatsFromQuiz is on quiz selection screen (new ID if added)
    this.dom.buttons.showStatsFromQuiz?.addEventListener('click', () => this.showStatsScreen()); // Quiz Selection -> Stats
    // Change this back button to go to welcome screen
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
        storage.setTimerPreference(timerEnabled); // Save preference
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
    // Listeners remain attached to the #themes-list and #quizzes-list elements
    // These elements are now located within the #welcome-screen and #quiz-selection screens respectively.
    // The delegation logic _handleSelectionClick and _handleSelectionKeydown remains the same.
    this.dom.themesList?.addEventListener('click', (e) => this._handleSelectionClick(e, 'theme'));
    this.dom.themesList?.addEventListener('keydown', (e) => this._handleSelectionKeydown(e, 'theme'));
    this.dom.quizzesList?.addEventListener('click', (e) => this._handleSelectionClick(e, 'quiz'));
    this.dom.quizzesList?.addEventListener('keydown', (e) => this._handleSelectionKeydown(e, 'quiz'));


    console.log("UI Event listeners set up.");
    // Load initial timer preference
    storage.getTimerPreference().then(enabled => {
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
  }

   // ----- Gestionnaires d'événements délégués -----

   _handleSelectionClick(event, type) {
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
   }

   _handleSelectionKeydown(event, type) {
       if (event.key === 'Enter' || event.key === ' ') {
           const item = event.target.closest('.selection-item');
           if (!item || item.classList.contains('is-loading') || item.classList.contains('has-error')) return; // Ignore on loading/error
           event.preventDefault(); // Empêche le scroll de la page avec Espace
           // Déclenche la même logique que le clic
           this._handleSelectionClick({ target: item }, type);
       }
   }


  // ----- Indicateurs Visuels (Loading/Error) -----
  // (Code unchanged - these methods work on any container element passed to them)
  _showLoading(containerElement, message = "Loading...") {
       // ... (code unchanged) ...
       // Added a check to ensure containerElement exists
       if (!containerElement) { console.error("Cannot show loading, container element is null."); return; }
        const loadingEl = containerElement.querySelector('.loading-indicator');
        const errorEl = containerElement.querySelector('.error-message');
        // Only clear if we are replacing existing content, maybe not necessary if loader is outside content
        // containerElement.innerHTML = ''; // Removing this line to avoid clearing dynamic content when adding loader


        if (!loadingEl) { // Create if doesn't exist
            const newLoadingEl = document.createElement('div');
            newLoadingEl.className = 'loading-indicator';
            // Find a place to append: maybe just before the first child or at the end?
            // Let's assume loader/error are siblings to main content or replace it
            // Based on HTML structure, they replace the loading-message p, so clearing is ok
            containerElement.innerHTML = ''; // Re-adding clear as per original logic for selection containers
            containerElement.appendChild(newLoadingEl);
            loadingEl = newLoadingEl;
        }
        loadingEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
        loadingEl.classList.remove('hidden'); // Ensure it's visible

        if (errorEl) errorEl.classList.add('hidden');
        containerElement.classList.add('is-loading');
        containerElement.classList.remove('has-error');
   }


  _hideLoading(containerElement) {
     // Added a check
     if (!containerElement) { console.error("Cannot hide loading, container element is null."); return; }
      const loadingEl = containerElement.querySelector('.loading-indicator');
      if (loadingEl) loadingEl.classList.add('hidden');
      containerElement.classList.remove('is-loading');
  }

  _showError(containerElement, message = "Could not load data.") {
     // Added a check
     if (!containerElement) { console.error("Cannot show error, container element is null."); return; }
      const loadingEl = containerElement.querySelector('.loading-indicator');
      const errorEl = containerElement.querySelector('.error-message');
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
  }

   _clearError(containerElement) {
       // Added a check
       if (!containerElement) { console.error("Cannot clear error, container element is null."); return; }
        const errorEl = containerElement.querySelector('.error-message');
        if (errorEl) errorEl.classList.add('hidden');
        containerElement.classList.remove('has-error');
   }

   showGlobalError(message) {
       alert(`Error: ${message}`); // Simple fallback alert
       // Optionally add a more sophisticated global error display mechanism
   }


  // ----- Navigation & Rendu -----

  hideAllScreens() {
    Object.values(this.dom.screens).forEach(screen => {
        if(screen){ // Check if screen element exists
           const screenId = screen.id;
           if(screenId === 'result') { screen.style.display = 'none'; }
           else { screen.classList.add('hidden'); }
            // Remove animation classes unconditionally
           screen.classList.remove('fade-in', 'fade-out');
        }
    });
  }

   _transitionScreen(screenToShow) {
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
   }

  showWelcomeScreen() {
      // Re-initialize welcome screen which includes loading/rendering themes
      this.initializeWelcomeScreen();
      // Transition to the welcome screen element
      this._transitionScreen(this.dom.screens.welcome);
  }

  // Removed showThemeSelection as it's merged into showWelcomeScreen

  async showQuizSelection() {
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
  }

   /** Helper pour récupérer les infos d'un thème depuis l'index mis en cache */
   async _getThemeInfoFromIndex(themeId) {
       const themes = await this.getThemeIndex(); // Use cached index
       const themeInfo = themes.find(t => t.id === Number(themeId));
       // No error thrown here, the caller will handle null/undefined
       return themeInfo;
   }

   /** Helper pour enrichir les métadonnées des quiz avec la progression stockée */
   _enrichQuizzesWithProgress(themeId, quizzesMeta) {
        const progress = storage.getProgress(); // Use storage
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
   }


  async showStatsScreen() {
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
        const data = await storage.getVisualizationData(themes); // Use storage and pass themes

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
  }

  confirmExitQuiz() {
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
  }

  confirmResetProgress() {
    if (confirm('Are you sure you want to reset ALL your quiz progress and statistics? This action cannot be undone.')) {
      if(storage.resetAllData()){ // Use storage manager
           alert('All progress has been reset.');
           // After reset, refresh the stats screen or go back to welcome
           this.showStatsScreen(); // Refresh screen with empty data
       } else {
            alert('Could not reset progress. Please try again.');
       }
    }
  }


  // ----- Theme and Quiz List Rendering -----

  renderThemes(themes) {
    const themesList = this.dom.themesList; // This now points to the element inside welcome-screen
    if (!themesList) { console.error("Themes list container not found."); return; }
    themesList.innerHTML = ''; // Clear previous content

    if (!themes || themes.length === 0) { themesList.innerHTML = '<p class="no-data">No themes available.</p>'; return; }

    // Use async map to get stats for each theme before rendering
    Promise.all(themes.map(async theme => {
        try {
            // Get theme stats using getVisualizationData which calculates completion/accuracy per theme
             const allStats = await storage.getVisualizationData(themes); // Need all themes to get per-theme stats object
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
   }


  renderQuizzes(themeInfo, quizzesWithProgress) {
       const quizzesList = this.dom.quizzesList; // Targets #quizzes-list
       if (!quizzesList) { console.error("Quizzes list container not found."); return; }
       quizzesList.innerHTML = ''; // Clear previous content

      if (!quizzesWithProgress || quizzesWithProgress.length === 0) {
          quizzesList.innerHTML = '<p class="no-data">No quizzes available for this theme yet.</p>';
          return;
      }

      quizzesWithProgress.forEach(quiz => {
          const quizElement = document.createElement('div');
          quizElement.className = 'selection-item quiz-item';
          quizElement.setAttribute('data-quiz-id', quiz.id);
          quizElement.setAttribute('data-theme-id', themeInfo.id); // Important for delegated click/keydown
          quizElement.setAttribute('tabindex', '0'); // Make focusable
          quizElement.setAttribute('role', 'button'); // Indicate clickable
          let ariaLabel = `${quiz.progress ? 'Reprendre' : 'Démarrer'} quiz: ${quiz.name}.`;
          if(quiz.progress && quiz.progress.completed) {
              ariaLabel += ` Dernière tentative: Score ${quiz.progress.score} sur ${quiz.progress.total}, Précision ${quiz.progress.accuracy}%.`;
          }
          quizElement.setAttribute('aria-label', ariaLabel);


          let resultHtml = '';
          if (quiz.progress && quiz.progress.completed) {
              resultHtml = `<div class="quiz-result">
                                <span class="score-badge">${quiz.progress.score}/${quiz.progress.total}</span>
                                <span class="accuracy-badge">${quiz.progress.accuracy}%</span>
                            </div>`;
          }
          quizElement.innerHTML = `
              <div class="item-content">
                  <h3>${quiz.name}</h3>
                  <p>${quiz.description || `Test your knowledge on ${quiz.name}.`}</p>
                  ${resultHtml}
              </div>
              <div class="item-action" aria-hidden="true"> <!-- action div is decorative -->
                  <span class="action-button">${quiz.progress ? 'Reprendre' : 'Démarrer'} Quiz <i class="fas ${quiz.progress ? 'fa-redo' : 'fa-play'}"></i></span>
              </div>`;
          // The listeners are managed by delegation in setupEventListeners
          quizzesList.appendChild(quizElement);
      });
  }

  // ----- Timer UI -----
  // (Code unchanged, but ensure this.dom.quiz.timer.checkbox is correctly mapped in main.js)
   startTimer() { if (!this.quizManager.timerEnabled) return; this.quizManager.startTimer(); this.startTimerInterval(); }
  stopTimer() { this.quizManager.stopTimer(); if (this.quizManager.timerInterval) { clearInterval(this.quizManager.timerInterval); this.quizManager.timerInterval = null; } }
  startTimerInterval() { if (!this.quizManager.timerEnabled) return; this.stopTimer(); this.updateTimerDisplay(); this.quizManager.timerInterval = setInterval(() => this.updateTimerDisplay(), 1000); }
  updateTimerDisplay() {
       const timerValueElement = this.dom.quiz.timer.value;
       // Ensure timerValueElement exists and quiz data is loaded before updating
       if (!timerValueElement || !this.quizManager.currentQuizData) { return; }

       let displayTime = this.quizManager.totalTimeElapsed;

       // If timer is enabled and running (startTime is set), add current question time to total
       if (this.quizManager.timerEnabled && this.quizManager.startTime) {
           const now = new Date();
           // Calculate time taken *for the current question*
           const timeOnCurrentQ = Math.max(0, Math.floor((now - this.quizManager.startTime) / 1000));
           // Total time shown = total time elapsed on *previous* questions + time elapsed on *current* question
            displayTime = this.quizManager.totalTimeElapsed + timeOnCurrentQ;
       }
       // Format time
       const minutes = Math.floor(displayTime / 60).toString().padStart(2, '0');
       const seconds = (displayTime % 60).toString().padStart(2, '0');
       timerValueElement.textContent = `${minutes}:${seconds}`;

        // Control visibility of the timer container based on timerEnabled
       this.dom.quiz.timer.container?.classList.toggle('hidden', !this.quizManager.timerEnabled);
    }

  toggleTimer() {
       const timerContainer = this.dom.quiz.timer.container;
       const button = this.dom.quiz.timer.toggle;

       if (!timerContainer || !button) return; // Check elements exist

       const isHidden = timerContainer.classList.toggle('timer-hidden'); // Toggle the display class
       if (isHidden) {
           button.innerHTML = '<i class="fas fa-eye"></i>';
           button.setAttribute('aria-label', 'Show timer');
       } else {
           button.innerHTML = '<i class="fas fa-eye-slash"></i>';
           button.setAttribute('aria-label', 'Hide timer');
       }
   }

    updateTimerUIState() {
        const timerContainer = this.dom.quiz.timer.container;
        const timerCheckbox = this.dom.quiz.timer.checkbox; // Get checkbox reference
        const timerToggleBtn = this.dom.quiz.timer.toggle; // Get toggle button reference

        if (!timerContainer || !timerCheckbox || !timerToggleBtn) return; // Ensure elements exist

        // 1. Control visibility of the *container* based on the checkbox state
        timerContainer.classList.toggle('hidden', !this.quizManager.timerEnabled);

        // 2. If the timer is enabled, ensure the display *within* the container is not hidden by the toggle button class
        if (this.quizManager.timerEnabled) {
            // Check if the toggle button logic is currently hiding the timer display
            // The toggle button logic already toggles the 'timer-hidden' class on the *container*
            // So, the visibility is controlled by the checkbox state and the timer-hidden class on the container
            // No extra steps needed here beyond the first line, as the toggle button listener handles the 'timer-hidden' class.
            // Ensure the display is updated immediately if it becomes visible
             if (!timerContainer.classList.contains('hidden')) {
                 this.updateTimerDisplay(); // Update display immediately
             }
        } else {
             // If timer is disabled, ensure the timer interval is stopped (handled by stopTimer)
             // And the display shows 00:00 or similar (updateTimerDisplay handles this implicitly)
              this.updateTimerDisplay(); // Set display to 00:00 etc.
        }
        console.log("Updated Timer UI State. Timer Enabled:", this.quizManager.timerEnabled);
    }


  // ----- Question Display & Interaction -----
  // (Code unchanged, use quizManager methods)
  showQuestion() { /* ... */ }
  // attachOptionEventListeners() { /* ... handled by delegation ... */ }
  // removeOptionEventListeners() { /* ... handled by delegation ... */ }
  // handleOptionSelection(event) { /* ... handled by delegation ... */ }
  // handleOptionKeydown(event) { /* ... handled by delegation ... */ }
  selectOption(selectedOptionElement) { /* ... calls quizManager.submitAnswer ... */ }
  updateFeedback() { /* ... */ }
  goToNextQuestion() { if (this.quizManager.nextQuestion()) { this.showQuestion(); } else { this.showResults(); } }
  goToPreviousQuestion() { if (this.quizManager.previousQuestion()) { this.showQuestion(); } }
  updateButtons() { /* ... */ }
  createProgressSteps() { /* ... */ }
  updateProgressBar() { /* ... */ }

  // ----- Results Display -----
  // (Code unchanged, uses quizManager methods)
  async showResults() {
    this.stopTimer(); // Stop the timer interval

    // Record time for the LAST question before getting results, if timer was active
    if (this.quizManager.timerEnabled && this.quizManager.startTime) {
         this.quizManager.recordQuestionTime();
    }

    const results = this.quizManager.getResults(); // Get final results
    if (!results) {
        console.error("Failed to get quiz results.");
         // Decide where to go back if results are null
        if(typeof this.quizManager.currentThemeId !== 'undefined' && this.quizManager.currentThemeId !== null) {
            this.showQuizSelection(); // Back to quiz list for the theme
        } else {
             this.showWelcomeScreen(); // Back to welcome/theme list
        }
        return; // Stop process
    }

    // Evaluate level based on results
    const evaluation = this.quizManager.evaluateLevel(results.score, results.total);

    // Enrich results with theme/quiz names from metadata (more reliable than manager data potentially)
     // Although the manager results object SHOULD have names if loaded correctly,
     // fetching from metadata is a robust way to ensure they are available for saving/display.
     let themeName = `Theme ${results.theme.id}`; // Fallback
     let quizName = `Quiz ${results.quiz.id}`; // Fallback
     try {
         const themeInfo = await this._getThemeInfoFromIndex(results.theme.id); // Use helper
         if(themeInfo) themeName = themeInfo.name;
         // Find quiz name within themeInfo's quizzes array
         const quizInfo = themeInfo?.quizzes?.find(q => q.id === results.quiz.id);
         if(quizInfo) quizName = quizInfo.name;
     } catch(e) {
         console.warn("Could not fetch theme/quiz name for results display/saving:", e);
     }
     // Update results object with names for saving and display
     results.theme.name = themeName;
     results.quiz.name = quizName;


    // Populate results screen DOM elements
    this.dom.results.quizName.textContent = `${results.quiz.name} Results (${results.theme.name})`;
    if(this.dom.results.score) this.dom.results.score.textContent = results.score;
    if(this.dom.results.totalQuestions) this.dom.results.totalQuestions.textContent = results.total;
    if(this.dom.results.stats.accuracy) this.dom.results.stats.accuracy.textContent = `${results.accuracy}%`;
    if(this.dom.results.stats.avgTime) this.dom.results.stats.avgTime.textContent = results.avgTime !== 'N/A' ? `${results.avgTime}s` : results.avgTime;
    if(this.dom.results.stats.fastestAnswer) this.dom.results.stats.fastestAnswer.textContent = results.fastest !== 'N/A' ? `${results.fastest}s` : results.fastest;
    if(this.dom.results.stats.slowestAnswer) this.dom.results.stats.slowestAnswer.textContent = results.slowest !== 'N/A' ? `${results.slowest}s` : results.slowest;

    // Populate evaluation message
    if(this.dom.results.message) {
        this.dom.results.message.innerHTML = `<h3>Estimated Level: ${evaluation.level}</h3><p>${evaluation.description}</p>`;
    }


    this.displayAnswerSummary(results); // Render the summary section

    // Generate share text
    const shareTextTemplate = `I scored ${results.score}/${results.total} (${results.accuracy}%) on the "${results.quiz.name}" quiz in the "${results.theme.name}" theme on Test Your French! 🇫🇷 Find it at: [Your App URL Here] #FrenchQuiz #TestYourFrench`; // TODO: Replace [Your App URL Here] with the actual URL
    if(this.dom.results.shareText) {
         this.dom.results.shareText.value = shareTextTemplate;
    }


    // Save results to storage
    // The saveQuizResult method now expects the enriched results object
    storage.saveQuizResult(results.theme.id, results.quiz.id, results);

    // Check for badges after saving results
    storage.checkAndAwardBadges(results).then(newBadges => {
        if (newBadges && newBadges.length > 0) {
            // showBadgeNotification is now handled by a global event listener in main.js
            console.log("New badges earned (event dispatched):", newBadges);
        }
    }).catch(err => {
        console.error("Error checking for badges:", err);
    });

    // Transition to the results screen
    this._transitionScreen(this.dom.screens.result);

     // Reset quiz state in manager after results are shown (ready for next quiz)
    this.quizManager.resetQuizState();
  }

  displayAnswerSummary(results) { /* ... (code unchanged) ... */ }
  restartCurrentQuiz() {
      // Need the original themeId and quizId to restart
      const themeId = this.quizManager.getCurrentThemeId();
      const quizId = this.quizManager.getCurrentQuizId(); // This gets the ID of the quiz that was just completed/exited from

      if(typeof themeId !== 'undefined' && themeId !== null && typeof quizId !== 'undefined' && quizId !== null) {
         console.log(`Restarting quiz Theme ${themeId}, Quiz ${quizId}`);
          // Reset state in the manager
         this.quizManager.resetQuizState(); // Reset BEFORE loading data for the new attempt
         // Start the quiz again with the same theme and quiz ID
         this.startSelectedQuiz(themeId, quizId);
      } else {
           console.error("Cannot restart quiz: Theme or Quiz ID is missing.");
           // Go back to welcome or quiz selection if restart info is missing
           if(typeof themeId !== 'undefined' && themeId !== null) {
               this.showQuizSelection(); // Back to quiz list for the theme
           } else {
               this.showWelcomeScreen(); // Back to welcome/theme list
           }
      }
  }


  // ----- Share, Export, Print -----
  copyShareText() { /* ... */ }
  exportResults() { /* ... */ }
  printResults() { window.print(); }

  // ----- Statistics Screen Rendering -----
  // (Code unchanged, uses storage and internal render methods)
  async renderStatsScreen() {
    this._showLoading(this.dom.stats.themeBars, "Calcul des statistiques..."); // Indicateur pour stats par thème
     // Ensure history list area is also handled
     if(this.dom.stats.historyList) this.dom.stats.historyList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Chargement historique...</div>';
      this._clearError(this.dom.stats.themeBars); // Clear potential errors

     try {
        // Need theme index for names and total quizzes
        const themes = await this.getThemeIndex(); // Use cached index

        // Get all visualization data from storage
        const data = await storage.getVisualizationData(themes); // Use storage and pass themes

        // Populate overview stats (Ensure DOM elements exist before setting textContent)
        if(this.dom.stats.completionRate) this.dom.stats.completionRate.textContent = `${data.globalCompletion}%`;
        if(this.dom.stats.completedQuizzes) this.dom.stats.completedQuizzes.textContent = data.completedQuizzes;
        if(this.dom.stats.totalQuizzes) this.dom.stats.totalQuizzes.textContent = data.totalQuizzes;
        if(this.dom.stats.accuracy) this.dom.stats.accuracy.textContent = `${data.globalAccuracy}%`;
        if(this.dom.stats.correctAnswers) this.dom.stats.correctAnswers.textContent = data.correctAnswers;
        if(this.dom.stats.totalAnswers) this.dom.stats.totalAnswers.textContent = data.totalQuestions; // Corrected key name
        if(this.dom.stats.avgTimePerQuestion) this.dom.stats.avgTimePerQuestion.textContent = data.avgTimePerQuestion > 0 ? `${data.avgTimePerQuestion}s` : '-';


        this.renderThemeBars(data.themeStats, themes); // Render theme performance bars
        this.renderBestAndWorstThemes(data.bestTheme, data.worstTheme, themes); // Render best/worst themes
        this.renderQuizHistory(data.history); // Render recent history

        this._hideLoading(this.dom.stats.themeBars); // Hide specific loader for theme bars area
         if(this.dom.stats.historyList) { // Clear loader for history area
            const historyLoader = this.dom.stats.historyList.querySelector('.loading-indicator');
            if(historyLoader) historyLoader.remove();
             const historyError = this.dom.stats.historyList.querySelector('.error-message');
             if(historyError) historyError.classList.add('hidden'); // Hide error too
         }

    } catch (error) {
        console.error("Error rendering stats screen:", error);
        this._showError(this.dom.stats.themeBars, "Impossible de charger les statistiques.");
        // Show error in history area too
        if(this.dom.stats.historyList) this.dom.stats.historyList.innerHTML = '<div class="error-message">Impossible de charger l\'historique.</div>';
    }
  }


  renderThemeBars(themeStats, themesIndex) {
      const container = this.dom.stats.themeBars;
      if (!container) { console.error("Themes bar container not found."); return; }
      container.innerHTML = ''; // Clear previous content

      const themeStatsArray = Object.values(themeStats);

      if (!themeStatsArray || themeStatsArray.length === 0 || themeStatsArray.every(s => s.quizzes.total === 0)) {
          container.innerHTML = '<p class="no-data">Play quizzes to see theme performance here.</p>';
          return;
      }

      themeStatsArray.sort((a, b) => {
         // Sort by completion, then accuracy, then name
          if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
          if (b.avgAccuracy !== a.avgAccuracy) return b.avgAccuracy - a.avgAccuracy;
          return a.name.localeCompare(b.name);
      });


      themeStatsArray.forEach(stats => {
           // Find the theme name from themesIndex if needed (already in stats object now)
           // const themeInfo = themesIndex.find(t => t.id === stats.id);
           // const themeName = themeInfo ? themeInfo.name : `Theme ${stats.id}`; // Fallback

           const barElement = document.createElement('div');
           barElement.className = 'theme-bar';
           // Ensure width is between 0 and 100
           const fillWidth = Math.max(0, Math.min(100, stats.avgAccuracy)); // Using accuracy for bar fill

           barElement.innerHTML = `
               <div class="theme-bar-header">
                   <span class="theme-name">${stats.name}</span>
                   <span class="theme-value">${stats.avgAccuracy}%</span>
               </div>
               <div class="theme-bar-bg">
                   <div class="theme-bar-fill" style="width: ${fillWidth}%"></div>
               </div>
               <div class="theme-completion">${stats.quizzes.completed}/${stats.quizzes.total} quizzes completed</div>
           `;
           container.appendChild(barElement);
       });
  }


  renderBestAndWorstThemes(bestTheme, worstTheme, themesIndex) {
      const bestNameEl = this.dom.stats.bestThemeName;
      const bestAccuracyEl = this.dom.stats.bestThemeAccuracy;
      const worstNameEl = this.dom.stats.worstThemeName;
      const worstAccuracyEl = this.dom.stats.worstThemeAccuracy;

      // Ensure elements exist
      if (!bestNameEl || !bestAccuracyEl || !worstNameEl || !worstAccuracyEl) {
          console.error("Best/Worst theme display elements not found.");
          return;
      }

      // Reset to default state
      bestNameEl.textContent = 'Aucune donnée';
      bestAccuracyEl.textContent = '-';
      worstNameEl.textContent = 'Aucune donnée';
      worstAccuracyEl.textContent = '-';

      if (bestTheme) {
          // const themeInfo = themesIndex.find(t => t.id === bestTheme.id);
          // const themeName = themeInfo ? themeInfo.name : `Theme ${bestTheme.id}`; // Fallback
          bestNameEl.textContent = bestTheme.stats.name;
          bestAccuracyEl.textContent = `${bestTheme.stats.avgAccuracy}%`;
      }

      if (worstTheme) {
         // const themeInfo = themesIndex.find(t => t.id === worstTheme.id);
          // const themeName = themeInfo ? themeInfo.name : `Theme ${worstTheme.id}`; // Fallback
          worstNameEl.textContent = worstTheme.stats.name;
          worstAccuracyEl.textContent = `${worstTheme.stats.avgAccuracy}%`;
      }
   }

   renderQuizHistory(history) {
       const container = this.dom.stats.historyList;
       if (!container) { console.error("History list container not found."); return; }
       container.innerHTML = ''; // Clear previous content

       if (!history || history.length === 0) {
           container.innerHTML = '<p class="no-history">No quiz history yet.</p>';
           return;
       }

       history.forEach(item => {
           const historyItemEl = document.createElement('div');
           historyItemEl.className = 'history-item';

           const date = new Date(item.date);
           const formattedDate = date.toLocaleDateString();
           const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g., 10:30 AM

           const scoreHtml = item.total > 0 ? `${item.score}/${item.total}` : '-';
           const accuracyHtml = item.total > 0 ? `${item.accuracy}%` : '-';
            const timeHtml = item.time > 0 ? `${item.time}s` : '-';


           historyItemEl.innerHTML = `
               <div class="history-content">
                   <div class="history-title">${item.quizName} (${item.themeName})</div>
                   <div class="history-details">
                       <span class="history-date">${formattedDate}</span>
                       <span class="history-time">${formattedTime}</span>
                       <span>Score: ${scoreHtml}</span>
                        <span>Accuracy: ${accuracyHtml}</span>
                         <span>Time: ${timeHtml}</span>
                   </div>
               </div>
               <div class="history-score">${scoreHtml}</div> <!-- Display score badge on the right -->
           `;
           container.appendChild(historyItemEl);
       });
   }

} // End Class QuizUI


// NOTE: Helper functions like updateGlobalCounters and displayWelcomeStats
// are now handled/called differently or moved to main.js or are internal to QuizUI.

export default QuizUI;