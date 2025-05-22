/* quizManager.js – version corrigée pour la structure JSON réelle */

function QuizManager() {
  this.currentThemeId = null;
  this.currentQuizId = null;
  this.currentQuizData = null;
  this.currentQuestionIndex = 0;
  this.selectedAnswers = [];
  this.questionStatus = [];
  this.questionTimes = [];
  this.score = 0;
  this.totalTimeElapsed = 0;
  this.startTime = null;
  this.timerEnabled = true;
}

QuizManager.prototype.resetQuizState = function() {
  this.currentThemeId = null;
  this.currentQuizId = null;
  this.currentQuizData = null;
  this.currentQuestionIndex = 0;
  this.selectedAnswers = [];
  this.questionStatus = [];
  this.questionTimes = [];
  this.score = 0;
  this.totalTimeElapsed = 0;
  this.startTime = null;
};

QuizManager.prototype.loadQuizData = function(data) {
  if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
    console.warn("QuizManager: Invalid quiz data provided to loadQuizData.");
    this.resetQuizState();
    return false;
  }

  // CORRECTION : Préprocesser les questions pour ajouter correctIndex
  data.questions.forEach((question, index) => {
    if (!question.hasOwnProperty('correctIndex') && question.correctAnswer) {
      // Trouver l'index de la bonne réponse
      const correctIndex = question.options.findIndex(option => option === question.correctAnswer);
      if (correctIndex !== -1) {
        question.correctIndex = correctIndex;
        console.log(`Question ${index + 1}: correctIndex défini à ${correctIndex} pour "${question.correctAnswer}"`);
      } else {
        console.warn(`Question ${index + 1}: Réponse correcte "${question.correctAnswer}" non trouvée dans les options`);
        question.correctIndex = 0; // Fallback
      }
    }
  });

  this.currentQuizData = data;
  const len = data.questions.length;
  this.selectedAnswers = new Array(len).fill(null);
  this.questionStatus = new Array(len).fill(null);
  this.questionTimes = new Array(len).fill(0);

  console.log(`Quiz data loaded for Quiz ID: ${data.id}. ${len} questions. State arrays initialized.`);
  return true;
};

QuizManager.prototype.startQuiz = async function(themeId, quizId) {
  console.log(`QuizManager: Starting quiz Theme ${themeId}, Quiz ${quizId}`);
  this.currentThemeId = themeId;
  this.currentQuizId = quizId;
  this.currentQuestionIndex = 0;
  this.score = 0;
  this.totalTimeElapsed = 0;
  this.startTime = null;

  try {
    const quizData = await window.ResourceManager.getQuiz(themeId, quizId);
    const success = this.loadQuizData(quizData);

    if (success) {
      console.log("QuizManager: Quiz data loaded successfully, state reset.");
      if (this.timerEnabled) {
        this.startTime = Date.now();
      }
    } else {
      console.error("QuizManager: Failed to initialize quiz state after loading data.");
      this.currentQuizData = null;
      this.resetQuizState();
    }
  } catch (error) {
    console.error(`QuizManager: Error loading quiz ${quizId} for theme ${themeId}:`, error);
    this.currentQuizData = null;
    this.resetQuizState();
  }
};

QuizManager.prototype.getCurrentQuestion = function() {
  if (!this.currentQuizData || !Array.isArray(this.currentQuizData.questions)) return null;
  return this.currentQuizData.questions[this.currentQuestionIndex] || null;
};

QuizManager.prototype.selectAnswer = function(index) {
  const currentQuestion = this.getCurrentQuestion();
  if (!currentQuestion || index < 0 || index >= currentQuestion.options.length) {
    console.warn("QuizManager: selectAnswer - invalid selection or state");
    return;
  }

  this.selectedAnswers[this.currentQuestionIndex] = index;
  
  // CORRECTION : Utiliser correctIndex calculé
  const correct = currentQuestion.correctIndex;
  this.questionStatus[this.currentQuestionIndex] = index === correct ? "correct" : "incorrect";
  
  console.log(`Question ${this.currentQuestionIndex + 1}: Selected ${index}, Correct ${correct}, Status: ${this.questionStatus[this.currentQuestionIndex]}`);
};

QuizManager.prototype.goToNextQuestion = function() {
  if (this.currentQuizData && this.currentQuestionIndex < this.currentQuizData.questions.length - 1) {
    this.currentQuestionIndex++;
    return true;
  }
  return false;
};

QuizManager.prototype.goToPreviousQuestion = function() {
  if (this.currentQuestionIndex > 0) {
    this.currentQuestionIndex--;
    return true;
  }
  return false;
};

QuizManager.prototype.isLastQuestion = function() {
  return this.currentQuizData && this.currentQuestionIndex === this.currentQuizData.questions.length - 1;
};

QuizManager.prototype.isFirstQuestion = function() {
  return this.currentQuestionIndex === 0;
};

QuizManager.prototype.getSelectedAnswer = function(questionIndex = null) {
  const index = questionIndex !== null ? questionIndex : this.currentQuestionIndex;
  return this.selectedAnswers[index];
};

QuizManager.prototype.hasAnsweredCurrentQuestion = function() {
  return this.selectedAnswers[this.currentQuestionIndex] !== null;
};

QuizManager.prototype.calculateScore = function() {
  if (!this.currentQuizData) return 0;
  
  let correctCount = 0;
  this.questionStatus.forEach(status => {
    if (status === "correct") correctCount++;
  });
  
  this.score = correctCount;
  return {
    score: correctCount,
    total: this.currentQuizData.questions.length,
    percentage: Math.round((correctCount / this.currentQuizData.questions.length) * 100)
  };
};

QuizManager.prototype.submitQuiz = function() {
  if (!this.currentQuizData) return null;
  
  if (this.startTime) {
    this.totalTimeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
  }
  
  const results = this.calculateScore();
  console.log("QuizManager: Quiz submitted.", results, `Time: ${this.totalTimeElapsed}s`);
  
  return {
    ...results,
    timeElapsed: this.totalTimeElapsed,
    answers: this.selectedAnswers.slice(),
    status: this.questionStatus.slice(),
    quizData: this.currentQuizData
  };
};

QuizManager.prototype.getQuizProgress = function() {
  if (!this.currentQuizData) return { current: 0, total: 0, percentage: 0 };
  
  const answeredCount = this.selectedAnswers.filter(answer => answer !== null).length;
  const total = this.currentQuizData.questions.length;
  
  return {
    current: this.currentQuestionIndex + 1,
    total: total,
    answered: answeredCount,
    percentage: Math.round(((this.currentQuestionIndex + 1) / total) * 100)
  };
};

// Expose la classe globalement
window.QuizManager = QuizManager;