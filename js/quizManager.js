/*
 * js/quizManager.js - Version 2.2.0 (12 avril 2024)
 * Gère la logique et l'état d'un quiz en cours.
 * Responsable de la navigation entre les questions, de la validation des réponses,
 * du calcul du score et du temps pour le quiz actif.
 * Ne contient pas les données brutes des quiz, elles sont chargées via loadQuizData.
 */

class QuizManager {
  constructor() {
    this.currentThemeId = null;
    this.currentQuizId = null;
    this.currentQuizData = null; // Données complètes du quiz actif { id, themeId, name, questions: [...] }
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.selectedAnswers = []; // Stocke le texte de la réponse sélectionnée pour chaque question
    this.questionStatus = [];  // Stocke 'correct', 'incorrect', ou null pour chaque question
    this.questionTimes = [];   // Stocke le temps pris (secondes) pour chaque question

    this.startTime = null;     // Timestamp du début de la question ou du quiz (pour le timer)
    this.timerEnabled = true;  // Contrôlé par l'UI via la checkbox
    this.timerInterval = null; // Référence à l'intervalle du timer (géré par l'UI)
    this.totalTimeElapsed = 0; // Temps total cumulé pour la tentative de quiz actuelle

    console.log("QuizManager initialized (V2.2).");
  }

  // ----- Chargement des Données du Quiz -----

  /**
   * Charge les données d'un quiz spécifique et réinitialise l'état.
   * Appelé par l'UI après avoir récupéré les données via resourceManager.
   * @param {Object} quizData - L'objet contenant les données complètes du quiz ({ id, themeId, name, questions }).
   * @returns {boolean} True si les données sont valides et chargées, false sinon.
   */
  loadQuizData(quizData) {
      if (!quizData || typeof quizData.id === 'undefined' || !Array.isArray(quizData.questions)) {
          console.error("Invalid or incomplete quiz data structure provided to loadQuizData:", quizData);
          this.currentQuizData = null;
          this.currentQuizId = null;
          this.currentThemeId = null;
          this.resetQuizState(); // Assure un état propre même en cas d'échec
          return false;
      }
      this.currentQuizData = quizData;
      this.currentQuizId = Number(quizData.id); // Assurer que l'ID est un nombre
      this.currentThemeId = Number(quizData.themeId); // Assurer que l'ID est un nombre

      this.resetQuizState(); // Réinitialise score, réponses, temps, etc. pour le nouveau quiz

      // Initialiser les tableaux d'état basés sur le nombre de questions chargées
      const questionCount = this.currentQuizData.questions.length;
      this.selectedAnswers = Array(questionCount).fill(null);
      this.questionStatus = Array(questionCount).fill(null);
      this.questionTimes = Array(questionCount).fill(0);

      console.log(`Quiz data loaded for Quiz ID: ${this.currentQuizId}, Theme ID: ${this.currentThemeId}. ${questionCount} questions.`);
      return true;
  }

  // ----- Accès aux Données Actives -----

  getCurrentQuizData() { return this.currentQuizData; }
  getCurrentThemeId() { return this.currentThemeId; }
  getCurrentQuizId() { return this.currentQuizId; }

  /**
   * Renvoie l'objet de la question actuelle.
   * @returns {Object|null} L'objet question ou null si invalide.
   */
  getCurrentQuestion() {
    if (!this.currentQuizData || !this.currentQuizData.questions) {
        console.warn("Attempting to get current question, but quiz data is not loaded.");
        return null;
    }
    const questions = this.currentQuizData.questions;
    // Vérification des limites de l'index
    if (this.currentQuestionIndex < 0 || this.currentQuestionIndex >= questions.length) {
        console.error(`Invalid question index requested: ${this.currentQuestionIndex}. Max index: ${questions.length - 1}`);
        return null;
    }
    return questions[this.currentQuestionIndex];
  }

  /**
   * Retourne le nombre total de questions dans le quiz actuel.
   * @returns {number} Le nombre de questions.
   */
  getCurrentQuizLength() {
      return this.currentQuizData?.questions?.length || 0;
  }

  // ----- Navigation -----

  /**
   * Passe à la question suivante si possible.
   * @returns {boolean} True si le passage a réussi, false si c'était la dernière question.
   */
  nextQuestion() {
    const totalQuestions = this.getCurrentQuizLength();
    if (totalQuestions === 0) return false; // Pas de questions à naviguer

    if (this.currentQuestionIndex < totalQuestions - 1) {
      this.currentQuestionIndex++;
      this.startTime = this.timerEnabled ? new Date() : null; // Réinitialise le timer pour la nouvelle question
      console.log(`Moved to next question: ${this.currentQuestionIndex}`);
      return true;
    }
    console.log("Reached end of quiz.");
    return false; // C'était la dernière question
  }

  /**
   * Revient à la question précédente si possible.
   * @returns {boolean} True si le retour a réussi, false si c'était la première question.
   */
  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.startTime = null; // Ne pas redémarrer le timer en revenant en arrière
      console.log(`Moved to previous question: ${this.currentQuestionIndex}`);
      return true;
    }
    return false;
  }

  // ----- Gestion de l'État du Quiz -----

  /**
   * Réinitialise l'état interne pour commencer ou recommencer un quiz.
   */
  resetQuizState() {
    this.currentQuestionIndex = 0;
    this.score = 0;
    // Garder les tableaux initialisés s'ils existent déjà (pour éviter recréation inutile)
    this.selectedAnswers = this.selectedAnswers.map(() => null);
    this.questionStatus = this.questionStatus.map(() => null);
    this.questionTimes = this.questionTimes.map(() => 0);
    this.totalTimeElapsed = 0;
    this.startTime = null; // Le timer sera démarré par l'UI si nécessaire
    this.stopTimer(); // Assure l'arrêt de tout intervalle précédent
    console.log("Quiz state reset.");
  }

  /**
   * Traite la soumission d'une réponse pour la question actuelle.
   * @param {number} optionIndex - L'index de l'option choisie par l'utilisateur.
   * @returns {Object|null} Un objet avec { isCorrect, selectedAnswer, correctAnswer } ou null si invalide.
   */
  submitAnswer(optionIndex) {
    const currentQuestion = this.getCurrentQuestion();
    // Vérifier si la question existe et n'a pas déjà été répondue
    if (!currentQuestion || this.questionStatus[this.currentQuestionIndex] !== null) {
        console.warn(`Cannot submit answer for Q${this.currentQuestionIndex + 1}. Already answered or no question data.`);
        return null;
    }
    // Vérifier la validité de l'index
    if (optionIndex < 0 || optionIndex >= currentQuestion.options.length) {
        console.error(`Invalid option index provided: ${optionIndex}`);
        return null;
    }

    const selectedAnswerText = currentQuestion.options[optionIndex];
    const correctAnswerText = currentQuestion.correctAnswer;

    // Vérification cruciale : la correctAnswer existe-t-elle dans les options ?
    if (!currentQuestion.options.includes(correctAnswerText)) {
         console.error(`Data Error: Correct answer "${correctAnswerText}" for Q${this.currentQuestionIndex + 1} not found in options:`, currentQuestion.options);
         // Dans ce cas, on considère la réponse comme incorrecte pour éviter des bugs
         this.recordAnswer(selectedAnswerText, false);
         this.recordQuestionTime(); // Enregistre quand même le temps
         // Retourner l'info, mais signaler le problème de données
         return { isCorrect: false, selectedAnswer: selectedAnswerText, correctAnswer: `[Data Error: ${correctAnswerText}]` };
     }

    const isCorrect = selectedAnswerText === correctAnswerText;
    this.recordAnswer(selectedAnswerText, isCorrect); // Enregistre la réponse et met à jour le score
    this.recordQuestionTime(); // Enregistre le temps pris

    console.log(`Answer submitted for Q${this.currentQuestionIndex + 1}: "${selectedAnswerText}". Correct: ${isCorrect}`);
    return { isCorrect, selectedAnswer: selectedAnswerText, correctAnswer: correctAnswerText };
  }

  /**
   * Enregistre la réponse et le statut (correct/incorrect) pour la question actuelle.
   * Met à jour le score si la réponse est correcte.
   * @param {string} selectedAnswerText - Le texte de l'option choisie.
   * @param {boolean} isCorrect - Si la réponse est correcte.
   */
  recordAnswer(selectedAnswerText, isCorrect) {
    // Vérifier les limites et si déjà répondu
    if (this.currentQuestionIndex < this.questionStatus.length && this.questionStatus[this.currentQuestionIndex] === null) {
        this.selectedAnswers[this.currentQuestionIndex] = selectedAnswerText;
        this.questionStatus[this.currentQuestionIndex] = isCorrect ? 'correct' : 'incorrect';
        if (isCorrect) {
          this.score++;
          console.log(`Score incremented: ${this.score}`);
        }
    } else {
        console.warn(`Could not record answer for Q${this.currentQuestionIndex + 1}. Index: ${this.currentQuestionIndex}, Status: ${this.questionStatus[this.currentQuestionIndex]}`);
    }
  }

  /**
   * Enregistre le temps passé sur la question actuelle si le timer est activé.
   */
  recordQuestionTime() {
    if (!this.timerEnabled || !this.startTime) return; // Ne rien faire si timer désactivé ou non démarré pour cette question

    const endTime = new Date();
    const timeTaken = Math.max(0, Math.floor((endTime - this.startTime) / 1000)); // Temps en secondes

    // Enregistrer seulement si pas déjà fait et index valide
    if (this.currentQuestionIndex < this.questionTimes.length && this.questionTimes[this.currentQuestionIndex] === 0) {
      const validTime = timeTaken >= 0 ? timeTaken : 0; // Assurer un temps non négatif
      this.questionTimes[this.currentQuestionIndex] = validTime;
      this.totalTimeElapsed += validTime;
      // console.log(`Time recorded for Q${this.currentQuestionIndex + 1}: ${validTime}s. Total elapsed: ${this.totalTimeElapsed}s`);
    }
    // Important: Le startTime est réinitialisé par nextQuestion() ou startTimer()
    // On le met à null ici pour signifier que le temps pour *cette* question est figé.
    this.startTime = null;
  }

  // ----- Gestion du Timer (contrôlé par l'UI) -----

  /** Démarre la logique du timer pour un nouveau quiz */
  startTimer() {
    if (!this.timerEnabled) return;
    this.stopTimer(); // Arrêter l'ancien intervalle si existant
    this.startTime = new Date(); // Temps de départ pour la PREMIÈRE question
    this.totalTimeElapsed = 0; // Remise à zéro du temps total pour ce quiz
    // Réinitialiser les temps individuels
    this.questionTimes = this.questionTimes.map(() => 0);
    console.log("Quiz timer logic started.");
    // L'intervalle d'affichage est géré par ui.js
  }

  /** Arrête la logique du timer */
  stopTimer() {
    // L'intervalle est géré par ui.js, ici on arrête juste le calcul du temps
    this.startTime = null;
    // Ne pas effacer timerInterval ici, car il appartient à l'UI
    console.log("Quiz timer logic stopped.");
  }

  // ----- Résultats et Évaluation -----

  /**
   * Compile et retourne les résultats finaux du quiz actif.
   * @returns {Object|null} Un objet détaillé des résultats ou null si invalide.
   */
  getResults() {
    const quiz = this.getCurrentQuizData();
    const themeId = this.currentThemeId;

    if (!quiz || !quiz.questions || typeof themeId === 'undefined' || themeId === null) {
      console.error("Cannot get results: Active quiz/theme data missing.");
      return null;
    }

    // Vérification finale du score
    const calculatedScore = this.questionStatus.filter(s => s === 'correct').length;
    if (calculatedScore !== this.score) {
      console.warn(`Score mismatch detected in getResults! Stored: ${this.score}, Calculated: ${calculatedScore}. Using calculated.`);
      this.score = calculatedScore;
    }

    const totalQuestions = quiz.questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((this.score / totalQuestions) * 100) : 0;

    // Calculer les stats de temps basé sur les temps enregistrés
    const validTimes = this.questionTimes.filter((t, index) => this.questionStatus[index] !== null && t >= 0);
    const avgTime = validTimes.length ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(1) : 'N/A';
    const fastest = validTimes.length ? Math.min(...validTimes) : 'N/A';
    const slowest = validTimes.length ? Math.max(...validTimes) : 'N/A';

    // Vérifier si toutes les questions ont été répondues
    const completed = this.questionStatus.every(status => status !== null);

    console.log("Generating final results:", {
        score: this.score, total: totalQuestions, accuracy, totalTime: this.totalTimeElapsed
    });

    return {
      theme: { id: themeId /* Le nom sera ajouté par l'UI si possible */ },
      quiz: { id: quiz.id, name: quiz.name, questions: quiz.questions }, // Inclure les questions pour le résumé
      score: this.score,
      total: totalQuestions,
      accuracy: accuracy,
      answers: [...this.selectedAnswers], // Copie des tableaux
      status: [...this.questionStatus],
      times: [...this.questionTimes],
      totalTime: this.totalTimeElapsed,
      avgTime: avgTime,
      fastest: fastest,
      slowest: slowest,
      completed: completed, // Vrai si toutes les questions ont une réponse
      dateCompleted: new Date().toISOString()
    };
  }

  /**
   * Évalue le niveau CECRL approximatif basé sur le score.
   * @param {number} score - Le nombre de bonnes réponses.
   * @param {number} total - Le nombre total de questions.
   * @returns {Object} Un objet { level: string, description: string }.
   */
  evaluateLevel(score, total) {
    if (total === 0) return { level: 'N/A', description: 'No questions in this quiz.' };
    const percentage = Math.round((score / total) * 100);

    // Descriptions en anglais
    if (percentage >= 80) { return { level: 'A2', description: 'You have mastered the basics of French communication. You can introduce yourself, ask for directions, and understand simple phrases used in everyday life.' }; }
    if (percentage >= 60) { return { level: 'A1+', description: 'You know the fundamentals and are approaching the A2 level. With a bit more practice on everyday expressions, you\'ll soon reach the A2 level.' }; }
    if (percentage >= 40) { return { level: 'A1', description: 'You know some basic expressions, but you still need to practice to reach level A2. Keep learning!' }; }
    if (percentage >= 20) { return { level: 'Pre-A1', description: 'You have started learning French. With more practice on basic expressions, you\'ll progress to A1 level.' }; }
    return { level: 'Beginner', description: 'You\'re just beginning with French. Don\'t worry! Everyone starts somewhere. Keep practicing!' };
  }
}

export default QuizManager;