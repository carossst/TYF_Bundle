/*
 * js/ui.js -quizManager` pour la logique et `resourceManager` pour charger les données.

--- START OF FILE js/ui.js ---

```javascript
/*
 * js/ui.js - Version 2.2.0 (12 avril 2024)
 * Gestion de Version 2.2.0 (12 avril 2024)
 * G l'interface utilisateur pour Test Your French.
 * Responsable de l'affichage des écrère toutes les mises à jour de l'interface utilisateur (DOM) et les interactions.ans, du rendu des données (thèmes, quiz, questions),
 * de la gestion des interactions utilisateur (clics, etc.),
 * et de la coordination avec QuizManager, ResourceManager et StorageManager.
 */

import storage from './storage.js';
 * Utilise QuizManager pour la logique du quiz et ResourceManager pour charger les données.
 * Interagit avec // Import storage manager pour stats et progression

class QuizUI {
  /** StorageManager pour afficher la progression et les statistiques.
 */

import storage from './storage.js'; // Import
   * Constructeur de QuizUI.
   * @param {Quiz storage manager pour affichage stats/progression

class QuizUI {
  constructor(quizManager, domElementsManager} quizManager - Instance du gestionnaire de logique de quiz.
   * @param {, resourceManager) { // Prend resourceManager en argument
    if (!quizManager || !Object} domElements - Objet contenant les références aux éléments DOM.
   * @param {ResourceManagerdomElements || !resourceManager) {
      throw new Error("QuizManager,} resourceManager - Instance du gestionnaire de ressources.
   */
   DOM elements, and ResourceManager are required for QuizUI.");
    }
    constructor(quizManager, domElements, resourceManager) {
    if (!quizManager || !domElements || !resourceManager) {
      throw new Error("QuizManager, DOM elements, and ResourceManager are required for QuizUI.");
    }
    this.quizManager = quizManager;
    this.dom = domElements;this.quizManager = quizManager;
    this.dom = domElements;
    this.resourceManager = resourceManager; // Stocker la référence
    this.themeIndex
    this.resourceManager = resourceManager;
    this.themeIndexCache = null; // Cache pour l'index des thèmes
    console.log("QuizUI initialized (V2.2 - Dynamic JSON Load)");
  }

  // ----- InitialCache = null; // Cache pour l'index des thèmes (metadata)
    console.log("QuizUI initialized (V2.2 - Dynamic JSON Load)");
  }

  // -----isation & Événements -----

   /** Charge l'index des thèmes et met à Initialisation & Événements -----

   /** Charge les données initiales nécessaires jour l'écran d'accueil */
   async initializeWelcomeScreen() {
         et affiche l'écran d'accueil. */
   async initializeWelcomeScreen() {
        try {
            const themes = await this.getThemeIndex(); // Charge/cache l'index via resourceManager
            updateGlobalCounters(themes, this.dom);    try {
            // Charger et mettre en cache l'index des thèmes
            const// Met à jour les compteurs sur la page
            await displayWelcomeStats( themes = await this.getThemeIndex();

            // Calculer les totaux (plus fiable depuis l'index)
            const totalThemes = themes.length;
            letthis.dom);         // Affiche stats sur accueil
        } catch (error) {
             totalQuizzes = 0;
            let totalQuestions = 0; //console.error("Failed to initialize welcome screen components fully:", error);
            // On assume 10/quiz si non spécifié
            themes.forEach(theme => { Afficher un message d'erreur plus visible si les métadonnées échouent
             this.showGlobal
                const quizCount = theme.quizzes?.length || 0;
                totalError("Could not load application data. Some features might be unavailable.");
             // MQuizzes += quizCount;
                totalQuestions += quizCount * 1ettre à jour les compteurs avec des valeurs par défaut
             if (this.dom.total0;
            });

            // Mettre à jour les placeholders
            if (this.dom.totalThemesGlobalPlaceholder) this.dom.totalThemesGlobalPlaceholder.textContent = 'severalThemesGlobalPlaceholder) this.dom.totalThemesGlobalPlaceholder.textContent = total';
             if (this.dom.totalQuestionsGlobalPlaceholder) this.Themes;
            if (this.dom.totalQuestionsGlobalPlaceholder) this.dom.totalQuestionsGlobalPlaceholder.textContent = totalQuestions;
            ifdom.totalQuestionsGlobalPlaceholder.textContent = 'many';
        }
        // (this.dom.stats.totalQuizzes) this.dom.stats.totalQuizzes.textContent = totalQuizzes;

            // Afficher les statistiques d Afficher l'écran d'accueil même en cas d'échec part'accueil
            await this.displayWelcomeStats(totalQuizzes);

        } catch (error) {
            console.error("Failed to initialize welcome screen dataiel
        this.hideAllScreens();
        this.dom.screens.welcome.classList.remove:", error);
            // Afficher des placeholders génériques en cas d'erreur
             ('hidden');
        this.dom.screens.welcome.classList.addif (this.dom.totalThemesGlobalPlaceholder) this.dom.total('fade-in');
        this.dom.screens.welcome.addEventListener('animationend', () => this.dom.screens.welcome.classList.remove('fade-in'), { once: true });
   }

   ThemesGlobalPlaceholder.textContent = 'multiple';
             if (this.dom.totalQuestionsGlobalPlaceholder) this.dom.totalQuestionsGlobalPlaceholder.textContent/** Récupère l'index des thèmes (depuis cache ou resource = 'many';
            this.showGlobalError("Could not load essential application data. Please check connection.");Manager) */
   async getThemeIndex() {
       if (this.themeIndexCache)
        }

        // Afficher l'écran d'accueil
        this.hideAllScreens();
        this.dom.screens.welcome.classList.remove(' { return this.themeIndexCache; }
       try {
           const metadata = await this.resourceManager.loadMetadata(); // Utilise resourceManager
           this.themeIndexCache = metadatahidden');
        this.dom.screens.welcome.classList.add('fade-in');
        this.dom.screens.welcome.addEventListener('.themes || []; // Assure que c'est un tableau
           return this.themeIndexCache;
       } catch (error) {
           animationend', () => this.dom.screens.welcome.classList.removeconsole.error("Failed to load theme index in UI:", error);
           throw error('fade-in'), { once: true });
        // Focus sur le bouton; // Propager pour gestion par l'appelant
       }
   }

 principal
        this.dom.buttons.exploreThemes?.focus();
   }

     /** Attache les écouteurs d'événements aux éléments DOM */
  setupEventListeners() {
    // Navigation
    this.dom./** Récupère l'index des thèmes (via cache ou ResourceManager).buttons.exploreThemes.addEventListener('click', () => this.showThemeSelection */
   async getThemeIndex() {
       if (this.themeIndexCache) return());
    this.dom.buttons.backToWelcome.addEventListener('click this.themeIndexCache;
       try {
           const metadata = await this.resourceManager.loadMetadata();
           if (!metadata || !Array', () => this.showWelcomeScreen());
    this.dom.buttons.isArray(metadata.themes)) throw new Error("Invalid metadata structure");
           this.themeIndexCache =.backToThemes.addEventListener('click', () => this.showThemeSelection());
    this.dom.buttons.backToQuizzes.addEventListener(' metadata.themes;
           return this.themeIndexCache;
       }click', () => this.showQuizSelection());
    this.dom.buttons.exitQuiz.addEventListener('click', () => this.confirmExitQuiz());

     catch (error) {
           console.error("Failed to get theme index:",// Statistiques
    this.dom.buttons.showStats.addEventListener('click', () => error);
           throw error;
       }
   }

   /** Affiche les statistiques sur l'écran d'accueil. */
   async display this.showStatsScreen());
    this.dom.buttons.backFromStats.addEventListener('click', () => this.showThemeSelection());
    this.dom.buttons.resetProgress.addEventListener('clickWelcomeStats(totalPossibleQuizzes) {
        try {
            const themes = await', () => this.confirmResetProgress());

    // Quiz
    this.dom.buttons.prev.addEventListener('click', () => this.goToPreviousQuestion());
    this.dom.buttons.next.addEventListener('click', () => this this.getThemeIndex(); // Nécessaire pour le calcul précis des stats
            const statsData = storage.goToNextQuestion());
    this.dom.buttons.submit.addEventListener('click', () => this.showResults());

    // Résultats
    this.dom.buttons..getVisualizationData(themes); // Utilise le storage
            const welcomerestart.addEventListener('click', () => this.restartCurrentQuiz());
    StatsEl = this.dom.welcomeStatsPlaceholder;

            if (statsData && statsData.completedQuizzes > 0 && welcomeStatsEl) {
                const welcomeMsg = document.createElement('divthis.dom.buttons.export.addEventListener('click', () => this.');
                welcomeMsg.className = 'welcome-stats';
                //exportResults());
    this.dom.buttons.print.addEventListener('click Utiliser totalPossibleQuizzes calculé à partir de metadata pour le %
                const', () => this.printResults());
    this.dom.buttons.copy.addEventListener('click', () => this.copyShareText());

    // Timer
    this.dom.quiz.timer.toggle.addEventListener(' completionPercent = totalPossibleQuizzes > 0 ? Math.round((statsData.completedQuizzes / totalPossibleQuizzes) * 100) : 0;
                welcomeMsg.innerHTMLclick', () => this.toggleTimer());
    this.dom.quiz = `
                    <p>Welcome back! You've completed ${statsData.completedQuizzes}/${.timer.checkbox.addEventListener('change', (e) => {
      this.quizManager.timerEnabled = e.target.checked;
      totalPossibleQuizzes} quizzes (${completionPercent}%).</p>
                    <p>Your average accuracy: ${statsData.globalAccuracy}%</p>
                console.log("Timer enabled set to:", this.quizManager.timerEnabled);
      if (!`;
                welcomeStatsEl.innerHTML = '';
                welcomeStatsEl.appendChild(welcomeMsgthis.dom.screens.quiz.classList.contains('hidden')) { this.updateTimerUIState(); }
    });
    console.log("UI Event listeners set up.");
  }

  // ----- Indicateurs Vis);
            } else if (welcomeStatsEl) {
                welcomeStatsEl.innerHTML = ''; // Clear if no stats
            }
        } catch (error) {
uels (Loading/Error) -----

  _showLoading(containerElement, message =            console.warn("Error displaying welcome stats:", error);
             if (this.dom.welcomeStatsPlaceholder) this.dom.welcomeStatsPlaceholder. "Loading...") {
      const loadingEl = containerElement.querySelector('.loading-indicator');
      const errorEl = containerElement.querySelector('.error-message');
      containerElement.innerHTML = ''; // Clear previousinnerHTML = ''; // Clear on error too
        }
    }


  /** Met en content before showing loader/error

      if (!loadingEl) { // Create if doesn't exist
          const newLoadingEl = document.createElement('div');
          newLoadingEl.className = 'loading-indicator';
          containerElement.appendChild(newLoadingEl place tous les écouteurs d'événements de l'UI. */
  setup);
          loadingEl = newLoadingEl;
      }
      loadingEl.innerHTML =EventListeners() {
    // Navigation
    this.dom.buttons.explore `<i class="fas fa-spinner fa-spin"></i> ${message}`;
      loadingThemes?.addEventListener('click', () => this.showThemeSelection());
    this.dom.buttons.backToWelcome?.addEventListener('click', () => this.showWelcomeScreen());
    this.dom.buttons.backToThemes?.El.classList.remove('hidden');

      if (errorEl) errorEladdEventListener('click', () => this.showThemeSelection());
    this.dom..classList.add('hidden');
      containerElement.classList.add('is-loading');
      containerElement.classList.remove('has-error');
  }

buttons.backToQuizzes?.addEventListener('click', () => this.show  _hideLoading(containerElement) {
      const loadingEl = containerElement.querySelector('.loading-indicator');
      if (loadingEl) loadingQuizSelection()); // Garde le thème courant
    this.dom.buttons.exitQuiz?.addEventListener('click', () => this.confirmExitQuiz());

    // Statistiques
    this.dom.buttons.showStats?.addEventListener('click', () =>El.classList.add('hidden');
      containerElement.classList.remove('is-loading');
  }

  _showError(containerElement, message = "Could not load data.") {
      const loadingEl = containerElement.querySelector('.loading-indicator');
      const errorEl = containerElement this.showStatsScreen());
    this.dom.buttons.backFromStats?.addEventListener('click', () => this.showThemeSelection());
    this.dom.buttons.resetProgress?.addEventListener('click', () => this.confirmResetProgress());

    // Quiz
    this.dom.buttons.prev.querySelector('.error-message');
      containerElement.innerHTML = ''; // Clear previous content

      if (!errorEl) { // Create if doesn't exist
           const newErrorEl = document.createElement('div');
           newErrorEl.className =?.addEventListener('click', () => this.goToPreviousQuestion());
    this.dom.buttons.next?.addEventListener('click', () => this.goToNextQuestion());
    this.dom.buttons.submit?.addEventListener('click 'error-message';
           containerElement.appendChild(newErrorEl);
           errorEl = newErrorEl;
      }
      errorEl.textContent', () => this.showResults());

    // Résultats
    this.dom.buttons.restart?.addEventListener('click', () => this.restartCurrentQuiz());
    this.dom.buttons.export?.addEventListener('click', () => this. = message;
      errorEl.classList.remove('hidden');

      if (loadingEl) loadingEl.classList.add('hidden');
      containerElement.classList.addexportResults());
    this.dom.buttons.print?.addEventListener('click('has-error');
      containerElement.classList.remove('is-', () => this.printResults());
    this.dom.buttons.loading');
  }

   _clearError(containerElement) {
        const errorEl = containerElement.querySelector('.error-message');
        if (errorEl) errorEl.classList.add('hidden');
        containercopy?.addEventListener('click', () => this.copyShareText());

    // Timer
    this.dom.quiz.timer.toggle?.addEventListener('click', () => this.toggleTimer());
    this.dom.quiz.timer.checkboxElement.classList.remove('has-error');
   }

   showGlobalError(message) {
       alert(`Error: ${message}`); // Simple fallback alert
   }


  // ----- Navigation & Rendu -----

  hideAllScreens() {
    Object.values(this.dom.screens).forEach(screen => {
        const screenId = screen.id;
?.addEventListener('change', (e) => {
        this.quizManager.timerEnabled =        if(screenId === 'result') { screen.style.display = 'none'; }
        else { screen.classList.add('hidden'); }
         e.target.checked;
        console.log("Timer enabled set to:", this.quizManagerscreen.classList.remove('fade-in', 'fade-out');
    });
  }

   _transitionScreen(screenToShow) {
        .timerEnabled);
        if (!this.dom.screens.quiz.this.hideAllScreens();
        const screenId = screenToShow.idclassList.contains('hidden')) { this.updateTimerUIState(); }
    });

    // Délégation d'événements pour les listes dynam;
        if (screenId === 'result') { screenToShow.style.display = 'blockiques (Thèmes et Quiz)
    this.dom.themesList?.'; }
        else { screenToShow.classList.remove('hidden'); }
        void screenToShow.offsetWidth; // Reflow
        screenToShow.classList.add('fade-addEventListener('click', (e) => this._handleSelectionClick(e, 'theme'));
    this.dom.themesList?.addEventListener('keydown', (e) => this._handleSelectionKeydown(e, 'theme'));
    this.dom.quizzesListin');
        screenToShow.addEventListener('animationend', () => screenToShow.classList.remove('?.addEventListener('click', (e) => this._handleSelectionClick(e, 'quiz'));
    this.dom.quizzesList?.addEventListener('keydown', (e) =>fade-in'), { once: true });
        if (screenToShow.getAttribute('tabindex') === '-1') { screenToShow.focus(); }
        else { const firstFocusable = screenToShow.querySelector('button, [href], input, select, textarea, [ this._handleSelectionKeydown(e, 'quiz'));


    console.log("UItabindex]:not([tabindex="-1"])'); if (firstFocusable) { firstFocusable.focus(); } else { screenToShow.setAttribute('tabindex', '-1'); screenToShow.focus(); } }
        console.log(`Showing screen: ${screenId}`);
    Event listeners set up.");
  }

   // ----- Gestionnaires d'événements délégués -----

   _handleSelectionClick(event, type) {
       const item}

  showWelcomeScreen() { this.initializeWelcomeScreen(); this._transitionScreen = event.target.closest('.selection-item');
       if (!item) return;

(this.dom.screens.welcome); }

  async showThemeSelection() {
     this._transitionScreen(this.dom.screens.themeSelection);
     this       if (type === 'theme') {
           const themeId = Number(item.dataset.themeId);
           if (themeId) {._showLoading(this.dom.themesList, "Loading themes...");
     this._clearError(this.dom.themesList);
     try
               this.quizManager.currentThemeId = themeId; // Met {
         const themes = await this.getThemeIndex();
         this.render à jour l'ID dans le manager
               this.showQuizSelection();
           }
       }Themes(themes);
         this._hideLoading(this.dom.themesList);
     } catch (error) {
         console.error("Failed to show themes:", error);
         this._showError(this.dom.themesList, "Could not load else if (type === 'quiz') {
            const themeId = Number(item. themes. Please check your connection.");
     }
  }

  async showQuizSelectiondataset.themeId);
            const quizId = Number(item.dataset.quizId);
            if (themeId && quizId) {
() {
      const themeId = this.quizManager.currentThemeId;
      if                this.startSelectedQuiz(themeId, quizId);
            } (!themeId) { this.showThemeSelection(); return; } // Go
       }
   }

   _handleSelectionKeydown(event, type) {
 back if no theme selected

      this._transitionScreen(this.dom.screens.quizSelection);
      this._showLoading(this.dom.quizzesList, "Loading        if (event.key === 'Enter' || event.key === ' ') {
           const item = event.target.closest('.selection-item');
           if (! quizzes...");
      this._clearError(this.dom.quizzesList);

      try {
item) return;
           event.preventDefault(); // Empêche le scroll          const themeInfo = await this.resourceManager.getThemeInfoFromMetadata(themeId); // Helper needed in resourceManager
          if (!themeInfo) throw new Error(`Theme info not found for ID ${themeId}`);

          this. de la page avec Espace

            if (type === 'theme') {dom.themeTitle.textContent = themeInfo.name;
          this.
                const themeId = Number(item.dataset.themeId);
                if (themeId) {
                    this.quizManager.currentThemedom.themeDescription.textContent = themeInfo.description;

          const quizzesMetaId = themeId;
                    this.showQuizSelection();
                }
            } else if (type === 'quiz') {
                 const themeId = Number(item. = await this.resourceManager.getThemeQuizzes(themeId); //dataset.themeId);
                 const quizId = Number(item.dataset.quizId);
                 if (themeId && quizId) {
 Get quiz list from metadata
          this.renderQuizzes(themeInfo, quizzesMeta); // Render list
          this._hideLoading(this.dom.quizzesList);

                     this.startSelectedQuiz(themeId, quizId);
                 }
            }
       }
   }


  // ----- Indicateurs Visuels (Loading/Error) -----

  _showLoading(containerElement, message =          // Preload quiz data in background
          this.resourceManager.preloadTheme "Loading...") { /* ... (code inchangé) ... */ }
  _hideLoading(containerElement) { /* ... (code inchangé) ... */ }
  _showErrorQuizzes(themeId);

      } catch (error) {
          console.error("Failed to show quizzes:", error);
          this.dom.themeTitle.textContent = "(containerElement, message = "Could not load data.") { /* ... (code inchangé)Error"; this.dom.themeDescription.textContent = "";
          this._showError( ... */ }
  _clearError(containerElement) { /* ... (code inchangé) ... */ }
  showGlobalError(message) { alert(`Error: ${message}`); }

  // -----this.dom.quizzesList, `Could not load quizzes. ${error.message}`);
      }
  }

  async showStatsScreen() {
      Navigation & Rendu -----

  hideAllScreens() { /* ... (code inchangé) ... */ }
  _transitionScreen(screenToShow) { /* ... (code inchangé) ... */ }
  showWelcomeScreen() { this.initializeWelcomeScreen(); this._transitionthis._transitionScreen(this.dom.screens.stats);
     //Screen(this.dom.screens.welcome); }

  async showThemeSelection() {
     this._transitionScreen(this.dom.screens.themeSelection);
     this._ Show loading state for potentially slow parts
     this._showLoading(this.dom.statsshowLoading(this.dom.themesList, "Loading themes...");
     .themeBars, "Calculating statistics...");
     this.dom.stats.historyList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loadingthis._clearError(this.dom.themesList);
     try { history...</div>';
     try {
        await this.renderStatsScreen(); // Render all stats
         const themes = await this.getThemeIndex(); // Utilise le cache interne ou resourceManager
         this.renderThemes(themes);
         
        this._hideLoading(this.dom.stats.themeBars); //this._hideLoading(this.dom.themesList);
     } catch (error) {
         console.error("Failed to show themes:", error);
         this._showError(this.dom.themesList, "Could not load themes. Please Hide specific loader
     } catch (error) {
          console.error("Error rendering stats screen:", error);
          this._showError(this.dom.stats.themeBars, "Could not load performance data.");
          this.dom.stats.historyList.innerHTML check connection or try refreshing.");
     }
  }

  async showQuizSelection() {
      const themeId = this.quizManager.currentThemeId;
       = '<div class="error-message">Could not load history.</div>';
     }
  }if (!themeId) { this.showThemeSelection(); return; }

      this._transitionScreen(this.dom.screens.quizSelection);
      this._showLoading(this

  confirmExitQuiz() {
    const quizInProgress = this.quizManager.selectedAnswers.some(a => a !== null) || this.quizManager.timerInterval !== null;.dom.quizzesList, "Loading quizzes...");
      this._clearError(this.dom.quizzesList);

      try {
          
    if (!quizInProgress || confirm('Are you sure you want to exitconst themeInfo = await this._getThemeInfoFromIndex(themeId); // Helper pour utiliser le cache
          this.dom.themeTitle.textContent = themeInfo.? Your progress in this quiz will be lost.')) {
        this.name;
          this.dom.themeDescription.textContent = themeInfo.description;

          // Charger les métadonnées des quiz pour ce thème
stopTimer();
        if(this.quizManager.currentThemeId) { this.showQuizSelection          const quizzesMeta = await this.resourceManager.getThemeQuizzes(themeId);
          (); }
        else { this.showThemeSelection(); }
    }
  }

  confirmResetProgress() {
    if (confirm('Are you sure you want to reset ALL your quiz progress and statistics? This action cannot be undone.')) {const quizzesWithProgress = this._enrichQuizzesWithProgress(themeId, quizzesMeta);


      if(storage.resetAllData()){
          alert('All progress has been reset.');
          this.showStatsScreen(); // Refresh screen with empty data
      } else { alert('Could not reset progress. Please try again.'); }
              this.renderQuizzes(themeInfo, quizzesWithProgress);
          }
  }

  async startSelectedQuiz(themeId, quizId) {
      this._hideLoading(this.dom.quizzesList);

          this.resourceManager.preloadThemeQuizzes(themeId); // Précharger en arrière-plan

      } catch (console.log(`UI: Starting quiz - Theme ${themeId}, Quiz ${quizId}`);error) {
          console.error("Failed to show quizzes:", error);
          this.dom.themeTitle.textContent = "Error";
          this.dom.themeDescription.textContent = "";
      this._transitionScreen(this.dom.screens.quiz); //
          this._showError(this.dom.quizzesList, ` Show quiz screen immediately
      this.dom.quiz.title.textContent = "Loading Quiz..."; // Initial title
      this.dom.quiz.container.innerHTML = '<div class="Could not load quizzes. ${error.message}`);
      }
  }

   /** Helper pour récupérer les infos d'un thème depuis l'index mis en cache */
   loading-indicator"><i class="fas fa-spinner fa-spin"></i>async _getThemeInfoFromIndex(themeId) {
       const themes = await this.getThemeIndex();
       const themeInfo = themes.find(t => t.id === Number(themeId));
       if (!themeInfo) throw new Error(`Theme info not found for Loading questions...</div>'; // Show loading in question area

      try {
          const quizData = await this.resourceManager.getQuiz(themeId, quiz ID ${themeId}`);
       return themeInfo;
   }

   Id);
          if (!this.quizManager.loadQuizData(quizData)) { throw new Error("Failed to initialize quiz manager."); }

          this.dom.quiz/** Helper pour enrichir les métadonnées des quiz avec la progression stockée */
   _enrichQuizzes.title.textContent = quizData.name || "French Quiz";
          this.updateTimerUIState();
          if(this.quizManager.timerEnabled) thisWithProgress(themeId, quizzesMeta) {
        const progress = storage.startTimer();

          this.showQuestion(); // Render the first question

      } catch (error) {
           console.error(`Failed to start quiz ${quizId}:.getProgress();
        const themeProgress = progress?.themes?.[themeId];`, error);
           this.showGlobalError(`Could not load the quiz. Please
        return quizzesMeta.map(quizMeta => {
            const quiz try again later.`);
           this.showQuizSelection(); // Go back
Result = themeProgress?.quizzes?.[quizMeta.id];
            return {
                ...      }
  }

  // ----- Theme and Quiz List Rendering -----

  renderThemes(themes) { /* ... (code inchangé mais utilise storage.getThemeStats) ... */ }
  quizMeta,
                progress: quizResult ? {
                    completed: quizResult.completed, score:renderQuizzes(themeInfo, quizzesMeta) { /* ... (code inchangé mais utilise storage.getQuizResult) ... */ }

  // ----- Timer UI quizResult.score,
                    total: quizResult.total, accuracy: quizResult.accuracy
 -----

  startTimer() { if (!this.quizManager.timerEnabled) return; this.quizManager.startTimer(); this.startTimerInterval(); }
  stopTimer() { this.quiz                } : null
            };
        });
   }


  async showStatsScreen() {
     this._transitionScreen(this.dom.screens.stats);
      Manager.stopTimer(); if (this.quizManager.timerInterval) {this._showLoading(this.dom.stats.themeBars, "Loading stats..."); // Indicateur pour stats
      this._clearError(this.dom.stats.themeBars);
      try {
           await this.renderStatsScreen(); clearInterval(this.quizManager.timerInterval); this.quizManager.timerInterval = null; } }
  startTimerInterval() { if (!this.quizManager.timerEnabled) // La fonction gère maintenant le fetch interne
           this._hideLoading(this.dom.stats.themeBars);
      } catch (error) {
           console.error("Error rendering stats screen return; this.stopTimer(); this.updateTimerDisplay(); this.quizManager.timerInterval = setInterval(() => this.updateTimerDisplay(), 1000); }
  updateTimerDisplay() { /* ... (code:", error);
           this._showError(this.dom.stats.themeBars, "Could not load statistics data.");
      }
  }

 inchangé, utilise quizManager) ... */ }
  toggleTimer() { /* ... (code inch  confirmExitQuiz() {
    const quizInProgress = this.quizManager.selectedangé) ... */ }

  // ----- Question Display & Interaction -----

  showQuestion() { /* ... (code inchangé, utilise quizManager) ... */Answers.some(a => a !== null) || this.quizManager.timerInterval !== null;
    if (!quizInProgress || confirm('Are you sure you want to exit }
  attachOptionEventListeners() { /* ... (code inchangé) ... */ }
  ? Your progress in this quiz will be lost.')) {
        this.stopTimer();
        if(this.quizManager.currentThemeId) { this.showQuizSelectionremoveOptionEventListeners() { /* ... (code inchangé) ... */ }
  handleOptionSelection(event) { /* ... (code inchangé) ...(); }
        else { this.showThemeSelection(); }
    }
  }

  confirmResetProgress() {
    if (confirm('Are you sure you want to */ }
  handleOptionKeydown(event) { /* ... (code reset ALL your quiz progress and statistics? This action cannot be undone.')) {
      if(storage.resetAllData()){
           alert('All progress has inchangé) ... */ }
  selectOption(selectedOptionElement) { /* ... (code inchangé, appelle quizManager.submitAnswer) ... */ }
 been reset.');
           this.showStatsScreen(); // Refresh screen
       } else { alert('Could not reset progress. Please try again.'); }
    }
  }

  async  updateFeedback() { /* ... (code inchangé) ... */ }
 startSelectedQuiz(themeId, quizId) {
      console.log(`UI  goToNextQuestion() { if (this.quizManager.nextQuestion()) { this.showQuestion: Starting quiz - Theme ${themeId}, Quiz ${quizId}`);
      this.hideAllScreens();(); } else { this.showResults(); } }
  goToPreviousQuestion
      this.dom.screens.quiz.classList.remove('hidden');
      this() { if (this.quizManager.previousQuestion()) { this.showQuestion(); } }
  updateButtons() { /* ... (code inchangé) ... */ }
  createProgressSteps() { /* ... (code inchangé) ... */ }
  .dom.quiz.container.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading quiz...</div>';
      this.dom.quiz.title.textContent = "Loading...";

      try {
          constupdateProgressBar() { /* ... (code inchangé) ... */ }

   quizData = await this.resourceManager.getQuiz(themeId, quizId);
          if (!this.quizManager.loadQuizData(quiz// ----- Results Display -----

  async showResults() { // Make async to fetch theme name if needed
    this.stopTimer();
    if (this.quizManagerData)) { throw new Error("Failed to init manager with quiz data."); }

          this.dom.timerEnabled && this.quizManager.startTime && this.quizManager..quiz.title.textContent = quizData.name || "French Quiz";
          this.updateTimerquestionTimes[this.quizManager.currentQuestionIndex] === 0)UIState();
          if(this.quizManager.timerEnabled) this { this.quizManager.recordQuestionTime(); }

    const results = this.quizManager.getResults();
    if (!results) { console.error("Failed to get quiz results."); this.showQuizSelection(); return; }

    const evaluation = this.quiz.startTimer();
          this.showQuestion(); // Affiche la première question
          this._transitionScreen(this.dom.screens.quiz); // Assure la transition correcte

      } catch (error) {
           console.error(`Manager.evaluateLevel(results.score, results.total);

    // Enrich results with theme name before saving and displaying
    try {
        const themeInfo = await this.resourceManager.getThemeInfoFromMetadata(results.theme.id); // Helper neededFailed to start quiz ${quizId}:`, error);
           this.showGlobalError(`Could not load the quiz. ${error.message}`);
           this.showQuizSelection();
        results.theme.name = themeInfo ? themeInfo.name : ` // Retourne à la liste des quiz
      }
  }

  // ----- RTheme ${results.theme.id}`;
    } catch (e) {endu des listes -----

  renderThemes(themes) {
    const themes
        console.warn("Could not fetch theme name for results display.");
        results.theme.nameList = this.dom.themesList; themesList.innerHTML = '';
    if (!themes || themes.length === 0) { themesList.innerHTML = '<p>No = `Theme ${results.theme.id}`; // Fallback
    }

    // themes available.</p>'; return; }
    themes.forEach(theme => {
 Populate results screen
    this.dom.results.quizName.textContent = `${results.        // Note: La progression est maintenant calculée par getThemeStats si besoin,
        // mais on peutquiz.name} Results (${results.theme.name})`;
    this.dom.results. afficher une version simplifiée ici si elle est dans themeIndex
        const progressscore.textContent = results.score;
    this.dom.results. = theme.progress || { completedQuizzes: 0, totalQuizzes: 5, completionRatetotalQuestions.textContent = results.total;
    this.dom.results: 0 }; // Fallback
        const themeElement = document.createElement.stats.accuracy.textContent = `${results.accuracy}%`;
    this.dom.results.stats('div');
        themeElement.className = 'selection-item theme-item';
        themeElement.setAttribute('data-theme-id', theme.id);.avgTime.textContent = results.avgTime !== 'N/A' ? `${results.avgTime}s` : results.avgTime;
    this.
        themeElement.setAttribute('tabindex', '0'); themeElement.dom.results.stats.fastestAnswer.textContent = results.fastestsetAttribute('role', 'button');
        themeElement.setAttribute('aria-label', `Select !== 'N/A' ? `${results.fastest}s` : theme: ${theme.name}`);
        themeElement.innerHTML = `
            <div class="item-icon"><i class="${theme.icon || 'fas fa-book'}"></i></div>
            <div class="item-content">
            <h3>${theme.name results.fastest;
    this.dom.results.stats.slow}</h3>
            <p>${theme.description || 'Explore various quizzes on this topic.'}</pestAnswer.textContent = results.slowest !== 'N/A' ?>
            <div class="progress-info"> <div class="progress-bar">< `${results.slowest}s` : results.slowest;
    this.dom.results.messagediv class="progress" style="width: ${progress.completionRate}%"></div></div> .innerHTML = `<h3>Estimated Level: ${evaluation.level}</h3><p>${evaluation<span>${progress.completedQuizzes}/${progress.totalQuizzes} quizzes completed (${progress.completionRate}%)</span> </div>
            </div>`;
        // Les écouteurs sont maintenant.description}</p>`;

    this.displayAnswerSummary(results);

    const gérés par délégation dans setupEventListeners
        themesList.appendChild(themeElement);
    });
   shareTextTemplate = `I scored ${results.score}/${results.total} (${results.accuracy}%) on the "${results.quiz.name}" quiz in the "${results.theme.name}"}

  renderQuizzes(themeInfo, quizzesWithProgress) {
       theme on Test Your French! 🇫🇷 Try it out: https://www.testyourfrench.com #const quizzesList = this.dom.quizzesList; quizzesList.innerHTML = '';
      ifFrenchQuiz #TestYourFrench`;
    this.dom.results.shareText.value = shareTextTemplate;

    // Save enriched results
    storage.saveQuizResult (!quizzesWithProgress || quizzesWithProgress.length === 0) { quizzes(results.theme.id, results.quiz.id, results);

    // CheckList.innerHTML = '<p>No quizzes available for this theme yet.</p>'; return; }

 for badges after saving results
    storage.checkAndAwardBadges(results      quizzesWithProgress.forEach(quiz => {
          const quizElement = document.createElement('div');
          quizElement.className = 'selection).then(newBadges => {
        if (newBadges &&-item quiz-item';
          quizElement.setAttribute('data-quiz newBadges.length > 0) {
            // showBadgeNotification(newBadges); //-id', quiz.id);
          quizElement.setAttribute('data-theme-id', themeInfo.id); // Important pour le clic délégué
          quizElement.setAttribute(' Assurez-vous que cette fonction existe si vous l'utilisez
            console.log("New badges earned:", newBadges);
        }
    });tabindex', '0'); quizElement.setAttribute('role', 'button');
          quizElement.setAttribute('aria-label', `${quiz.progress ? 'Retake' : 'Start'} quiz: ${quiz.name}`);
          let resultHtml = '';
          if (

    this._transitionScreen(this.dom.screens.result);
quiz.progress && quiz.progress.completed) {
              resultHtml = `<div class="quiz-result"><span class="score-badge">${quiz.progress.score}/${quiz.progress.total  }


  displayAnswerSummary(results) { /* ... (code inchangé) ... */ }
  restartCurrentQuiz() { /* ... (code inchangé) ... */ }}</span><span class="accuracy-badge">${quiz.progress.accuracy}%</span>

  // ----- Share, Export, Print -----
  async copyShareText() { /*</div>`;
          }
          quizElement.innerHTML = `
              <div class="item-content"><h3>${quiz.name}</h3><p>${quiz.description || ` ... (code inchangé) ... */ }
  exportResults() { /* ... (code inchTest your knowledge on ${quiz.name}.`}</p>${resultHtml}</div>
              <div class="item-action"><span class="action-button">${quiz.progress ? 'Retangé) ... */ }
  printResults() { window.print(); }

  // ----- Statistics Screen Rendering -----
  async renderStatsScreen() {
    this._showake' : 'Start'} Quiz <i class="fas ${quiz.progress ? 'faLoading(this.dom.stats.themeBars, "Calculating statistics...");
    this-redo' : 'fa-play'}"></i></span></div>`;
          // Les écouteurs sont gérés par délégation
          quizzesList.appendChild(.dom.stats.historyList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading history...</div>';
    try {
quizElement);
      });
  }

  // ----- Timer UI -----        const themes = await this.getThemeIndex(); // Use cached index
        const data = await storage.getVisualizationData(themes); // Recalculate stats

  startTimer() { if (!this.quizManager.timerEnabled) return; this.quiz

        this.dom.stats.completionRate.textContent = `${data.globalCompletion}%`;
        this.dom.stats.completedQuizzes.textContent = data.completedQuizzes;
        thisManager.startTimer(); this.startTimerInterval(); }
  stopTimer() { this.quizManager.stopTimer(); if (this.quizManager.timerInterval) { clearInterval(this.quizManager.timerInterval); this.quizManager.timer.dom.stats.totalQuizzes.textContent = data.totalQuizzes;
        this.dom.stats.accuracy.textContent = `${data.globalAccuracy}%`;
        this.dom.stats.correctAnswers.textContent = data.correctAnswers;
        this.dom.stats.totalAnswers.textContent = data.totalInterval = null; } }
  startTimerInterval() { if (!this.quizManager.timerEnabled) return; this.stopTimer(); this.updateTimerDisplay(); this.quizManager.timerIntervalQuestions;
        this.dom.stats.avgTimePerQuestion.textContent = data.avgTime = setInterval(() => this.updateTimerDisplay(), 1000); }
  updatePerQuestion > 0 ? `${data.avgTimePerQuestion}s` : '-';

        this.renderThemeBars(data.themeStats, themes);
        TimerDisplay() { const timerValueElement = this.dom.quiz.timer.value; if (!timerthis.renderBestAndWorstThemes(data.bestTheme, data.worstValueElement) return; let displayTime = this.quizManager.totalTimeElapsed; if (this.quizTheme, themes);
        this.renderQuizHistory(data.history);

        Manager.timerEnabled && this.quizManager.startTime) { const now = new Date(); const currentQuestionTime = Math.max(0, Math.floor((nowthis._hideLoading(this.dom.stats.themeBars); // Hide - this.quizManager.startTime) / 1000)); display specific loader

    } catch (error) {
        console.error("Error rendering stats screen:", error);
        this._showError(this.domTime += currentQuestionTime; } const minutes = Math.floor(displayTime / 60)..stats.themeBars, "Could not load statistics.");
        this.toString().padStart(2, '0'); const seconds = (displayTime % 60).toString().padStart(2, '0'); timerValueElement.textContent = `${minutes}:${dom.stats.historyList.innerHTML = '<div class="error-messageseconds}`; this.dom.quiz.timer.container.classList.toggle('hidden', !this.quizManager.timerEnabled); }
  toggleTimer() { const">Could not load history.</div>';
    }
  }

  renderTheme timerContainer = this.dom.quiz.timer.container; const isHiddenBars(themeStats, themesIndex) { /* ... (code inchangé) ... */ }
  render = timerContainer.classList.toggle('timer-hidden'); const button = this.dom.quiz.timer.toggle; if (isHidden) { button.innerHTML = '<BestAndWorstThemes(bestTheme, worstTheme, themesIndex) { /* ... (code inchangé) ... */ }
  renderQuizHistory(historyi class="fas fa-eye"></i>'; button.setAttribute('aria-label', 'Show timer) { /* ... (code inchangé) ... */ }

} // End Class QuizUI

//'); } else { button.innerHTML = '<i class="fas fa-eye ----- Fonctions Helper (déplacées depuis main.js) -----

/** Met-slash"></i>'; button.setAttribute('aria-label', 'Hide timer'); } }

  // ----- à jour les compteurs globaux sur l'écran d'accueil */
 Question Display & Interaction -----

  showQuestion() { /* ... (Code similaire à Vfunction updateGlobalCounters(metadata, DOM) {
    if (!metadata || !Array2.1, utilise quizManager.getCurrentQuestion) ... */ }
  attach.isArray(metadata.themes)) return;
    const totalThemes = metadata.themes.length;
    OptionEventListeners() { /* ... (Code géré par délégation maintenant) ... */ }
  removeOptionlet totalQuizzes = 0; let totalQuestions = 0;
    metadata.EventListeners() { /* ... (Code géré par délégation maintenant) ... */ }
  handleOptionSelection(event) { /* ... (Appelé par délégation) ... */ }
  handlethemes.forEach(theme => {
        if (Array.isArray(theme.quizzes)) {
            totalQuizzes += theme.quizzes.length;
            totalQuestionsOptionKeydown(event) { /* ... (Appelé par délégation) ... */ }
  selectOption += theme.quizzes.length * 10; // Assumption
        }
    });
    if (DOM.totalThemesGlobalPlaceholder) DOM.totalThemesGlobalPlaceholder.textContent = totalThemes;(selectedOptionElement) { /* ... (Code similaire à V2.1, appelle quizManager.submitAnswer) ... */ }
  updateFeedback()
    if (DOM.totalQuestionsGlobalPlaceholder) DOM.totalQuestionsGlobalPlaceholder.textContent = totalQuestions;
    if (DOM.stats.totalQuizzes) DOM.stats { /* ... (Code similaire à V2.1) ... */ }
  goTo.totalQuizzes.textContent = totalQuizzes;
}

/** ANextQuestion() { if (this.quizManager.nextQuestion()) { this.showQuestion(); } else { this.showResults(); } }
  goToPreviousQuestionffiche les statistiques d'utilisation sur l'écran d'accueil */
async function displayWelcomeStats() { if (this.quizManager.previousQuestion()) { this.show(DOM) {
    try {
        // Need theme index to calculateQuestion(); } }
  updateButtons() { /* ... (Code similaire à V2.1) ... */ total quizzes for completion %
        let themes = [];
        try { themes = await new QuizUI(null, DOM, null).getThemeIndex(); }
  createProgressSteps() { /* ... (Code similaire à V2.1) ... */ }
 } // Temporary instance? Not ideal.
        catch { themes = []; } // Fall  updateProgressBar() { /* ... (Code similaire à V2.1)back

        const statsData = await storage.getVisualizationData(themes); ... */ }

  // ----- Results Display -----

  async showResults() { //
        const welcomeStatsEl = DOM.welcomeStatsPlaceholder;

        if (statsData && statsData Make async to fetch theme name if needed
    this.stopTimer();
    if (this.quizManager.timerEnabled && this.quizManager.startTime && this.completedQuizzes > 0 && welcomeStatsEl) {
            const welcomeMsg = document.createElement('div');
            welcomeMsg.className = 'welcome-stats';
            welcomeMsg.innerHTML = `
                <p>Welcome back!.quizManager.questionTimes[this.quizManager.currentQuestionIndex] === 0) { this.quizManager.recordQuestionTime(); }
    const results = this. You've completed ${statsData.completedQuizzes}/${statsData.totalQuizzes} quizzes (${statsData.globalCompletion}%).</p>
                <pquizManager.getResults();
    if (!results) { console.error>Your average accuracy: ${statsData.globalAccuracy}%</p>
            `;
            welcomeStatsEl.innerHTML = ''; welcomeStatsEl.appendChild(welcomeMsg);
        } else if (welcomeStatsEl) { welcomeStatsEl.innerHTML = ''; }
    } catch (error) { console.warn("Error displaying welcome stats:", error); }
}("Failed to get quiz results."); this.showQuizSelection(); return; }
    const


export default QuizUI;