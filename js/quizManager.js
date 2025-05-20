/*
 * js/data/quizManager.js - Version 2.2.2 (Non-module)
 * Gère la logique et l'état d'un quiz en cours.
 */

// Constructeur
function QuizManager() {
  this.currentThemeId = null;
  this.currentQuizId = null;
  this.currentQuizData = null;
  this.currentQuestionIndex = 0;
  this.score = 0;
  this.selectedAnswers = [];
  this.questionStatus = [];
  this.questionTimes = [];

  this.startTime = null;
  this.timerEnabled = true;
  this.timerInterval = null;
  this.totalTimeElapsed = 0;

  console.log("QuizManager initialized (non-module version)");
}

// ----- Chargement des Données du Quiz -----

/**
 * Charge les données d'un quiz spécifique et réinitialise l'état.
 */
QuizManager.prototype.loadQuizData = function(quizData) {
    if (!quizData || typeof quizData.id === 'undefined' || !Array.isArray(quizData.questions)) {
        console.error("Invalid or incomplete quiz data structure provided to loadQuizData:", quizData);
        this.currentQuizData = null;
        this.currentQuizId = null;
        this.currentThemeId = null;
        this.resetQuizState(); // Assure un état propre même en cas d'échec
        return false;
    }
    this.currentQuizData = quizData;
    this.currentQuizId = Number(quizData.id);
    this.currentThemeId = Number(quizData.themeId);

    this.resetQuizState(); // Réinitialise score, réponses, etc.

    // Initialiser les tableaux d'état basés sur le nombre de questions
    const questionCount = this.currentQuizData.questions.length;
    this.selectedAnswers = Array(questionCount).fill(null);
    this.questionStatus = Array(questionCount).fill(null);
    this.questionTimes = Array(questionCount).fill(0);

    console.log(`Quiz data loaded for Quiz ID: ${this.currentQuizId}, Theme ID: ${this.currentThemeId}. ${questionCount} questions.`);
    return true;
};

// ----- Accès aux Données Actives -----

QuizManager.prototype.getCurrentQuizData = function() { 
  return this.currentQuizData; 
};

QuizManager.prototype.getCurrentThemeId = function() { 
  return this.currentThemeId; 
};

QuizManager.prototype.getCurrentQuizId = function() { 
  return this.currentQuizId; 
};

/**
 * Renvoie l'objet de la question actuelle.
 */
QuizManager.prototype.getCurrentQuestion = function() {
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
};

/**
 * Retourne le nombre total de questions dans le quiz actuel.
 */
QuizManager.prototype.getCurrentQuizLength = function() {
    return this.currentQuizData?.questions?.length || 0;
};

// ----- Navigation -----

/**
 * Passe à la question suivante si possible.
 */
QuizManager.prototype.nextQuestion = function() {
  const totalQuestions = this.getCurrentQuizLength();
  if (totalQuestions === 0) return false; // Pas de questions à naviguer

  if (this.currentQuestionIndex < totalQuestions - 1) {
    this.currentQuestionIndex++;
    this.startTime = this.timerEnabled ? new Date() : null; // Réinitialise le timer
    console.log(`Moved to next question: ${this.currentQuestionIndex}`);
    return true;
  }
  console.log("Reached end of quiz.");
  return false; // C'était la dernière question
};

/**
 * Revient à la question précédente si possible.
 */
QuizManager.prototype.previousQuestion = function() {
  if (this.currentQuestionIndex > 0) {
    this.currentQuestionIndex--;
    this.startTime = null; // Ne pas redémarrer le timer en revenant
    console.log(`Moved to previous question: ${this.currentQuestionIndex}`);
    return true;
  }
  return false;
};

// ----- Gestion de l'État du Quiz -----

/**
 * Réinitialise l'état interne pour commencer ou recommencer un quiz.
 */
QuizManager.prototype.resetQuizState = function() {
  this.currentQuestionIndex = 0;
  this.score = 0;
  // Réinitialiser les tableaux
  this.selectedAnswers = this.selectedAnswers.map(() => null);
  this.questionStatus = this.questionStatus.map(() => null);
  this.questionTimes = this.questionTimes.map(() => 0);
  this.totalTimeElapsed = 0;
  this.startTime = null;
  this.stopTimer();
  console.log("Quiz state reset.");
};

/**
 * Traite la soumission d'une réponse pour la question actuelle.
 */
QuizManager.prototype.submitAnswer = function(optionIndex) {
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

  // Vérification: la correctAnswer existe-t-elle dans les options ?
  if (!currentQuestion.options.includes(correctAnswerText)) {
       console.error(`Data Error: Correct answer "${correctAnswerText}" for Q${this.currentQuestionIndex + 1} not found in options:`, currentQuestion.options);
       // Réponse considérée comme incorrecte
       this.recordAnswer(selectedAnswerText, false);
       this.recordQuestionTime();
       return { isCorrect: false, selectedAnswer: selectedAnswerText, correctAnswer: `[Data Error: ${correctAnswerText}]` };
   }

  const isCorrect = selectedAnswerText === correctAnswerText;
  this.recordAnswer(selectedAnswerText, isCorrect); // Enregistre la réponse
  this.recordQuestionTime(); // Enregistre le temps

  console.log(`Answer submitted for Q${this.currentQuestionIndex + 1}: "${selectedAnswerText}". Correct: ${isCorrect}`);
  return { isCorrect, selectedAnswer: selectedAnswerText, correctAnswer: correctAnswerText };
};

/**
 * Enregistre la réponse et le statut pour la question actuelle.
 */
QuizManager.prototype.recordAnswer = function(selectedAnswerText, isCorrect) {
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
};

/**
 * Enregistre le temps passé sur la question actuelle si le timer est activé.
 */
QuizManager.prototype.recordQuestionTime = function() {
  if (!this.timerEnabled || !this.startTime) return; // Ne rien faire si timer désactivé

  const endTime = new Date();
  const timeTaken = Math.max(0, Math.floor((endTime - this.startTime) / 1000)); // Temps en secondes

  // Enregistrer seulement si pas déjà fait et index valide
  if (this.currentQuestionIndex < this.questionTimes.length && this.questionTimes[this.currentQuestionIndex] === 0) {
    const validTime = timeTaken >= 0 ? timeTaken : 0; // Temps non négatif
    this.questionTimes[this.currentQuestionIndex] = validTime;
    this.totalTimeElapsed += validTime;
  }
  // Le startTime est réinitialisé par nextQuestion() ou startTimer()
  this.startTime = null;
};

// ----- Gestion du Timer -----

/** Démarre la logique du timer pour un nouveau quiz */
QuizManager.prototype.startTimer = function() {
  if (!this.timerEnabled) return;
  this.stopTimer(); // Arrêter l'ancien intervalle
  this.startTime = new Date(); // Temps de départ
  this.totalTimeElapsed = 0;
  // Réinitialiser les temps individuels
  this.questionTimes = this.questionTimes.map(() => 0);
  console.log("Quiz timer logic started.");
  // L'intervalle d'affichage est géré par ui.js
};

/** Arrête la logique du timer */
QuizManager.prototype.stopTimer = function() {
  this.startTime = null;
  console.log("Quiz timer logic stopped.");
};

/**
 * Vérifie si le quiz est terminé (toutes les questions répondues).
 */
QuizManager.prototype.isQuizComplete = function() {
  // Un quiz est considéré comme terminé quand toutes les questions ont une réponse
  return this.questionStatus.every(status => status !== null);
};

// ----- Résultats et Évaluation -----

/**
 * Compile et retourne les résultats finaux du quiz actif.
 */
QuizManager.prototype.getResults = function() {
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

  // Calculer les stats de temps
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
    theme: { id: themeId /* Le nom sera ajouté par l'UI */ },
    quiz: { id: quiz.id, name: quiz.name, questions: quiz.questions },
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
    completed: completed,
    dateCompleted: new Date().toISOString()
  };
};

/**
 * Évalue le niveau CECRL approximatif basé sur le score.
 */
QuizManager.prototype.evaluateLevel = function(score, total) {
  if (total === 0) return { level: 'N/A', description: 'No questions in this quiz.' };
  const percentage = Math.round((score / total) * 100);

  if (percentage >= 80) { 
    return { level: 'A2', description: 'You have mastered the basics of French communication. You can introduce yourself, ask for directions, and understand simple phrases used in everyday life.' }; 
  }
  if (percentage >= 60) { 
    return { level: 'A1+', description: 'You know the fundamentals and are approaching the A2 level. With a bit more practice on everyday expressions, you\'ll soon reach the A2 level.' }; 
  }
  if (percentage >= 40) { 
    return { level: 'A1', description: 'You know some basic expressions, but you still need to practice to reach level A2. Keep learning!' }; 
  }
  if (percentage >= 20) { 
    return { level: 'Pre-A1', description: 'You have started learning French. With more practice on basic expressions, you\'ll progress to A1 level.' }; 
  }
  return { level: 'Beginner', description: 'You\'re just beginning with French. Don\'t worry! Everyone starts somewhere. Keep practicing!' };
};

// Définir comme variable globale
window.QuizManager = QuizManager;