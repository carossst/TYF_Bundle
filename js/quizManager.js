/* quizManager.js – version propre et unifiée */

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
  if (
    !this.currentQuizData ||
    index < 0 ||
    index >= this.currentQuizData.questions[this.currentQuestionIndex].options.length
  ) {
    console.warn("QuizManager: selectAnswer - invalid selection or state");
    return;
  }

  this.selectedAnswers[this.currentQuestionIndex] = index;
  const correct = this.currentQuizData.questions[this.currentQuestionIndex].correctIndex;
  this.questionStatus[this.currentQuestionIndex] = index === correct ? "correct" : "incorrect";
};

QuizManager.prototype.goToNextQuestion = function() {
  if (
    this.currentQuizData &&
    this.currentQuestionIndex < this.currentQuizData.questions.length - 1
  ) {
    this.currentQuestionIndex++;
  }
};

QuizManager.prototype.goToPreviousQuestion = function() {
  if (this.currentQuestionIndex > 0) {
    this.currentQuestionIndex--;
  }
};

QuizManager.prototype.submitQuiz = function() {
  if (!this.currentQuizData) return;
  this.totalTimeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
  console.log("QuizManager: Quiz submitted in", this.totalTimeElapsed, "seconds.");
};
