// js/tests/quiz.test.js - Version 2.2.0 (11/04/2025)
// Tests unitaires pour les fonctions critiques du QuizManager

// Utilisation du framework de test Jest
// Pour exécuter ces tests : npx jest quiz.test.js

import QuizManager from '../quizManager.js';

// Simulacre des données de quiz pour les tests
const mockQuizData = {
  themeId: 1,
  quizzes: [
    {
      id: 101,
      name: "Test Quiz",
      description: "Quiz for testing purposes",
      questions: [
        {
          question: "Question 1",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option A",
          explanation: "Explanation for Question 1"
        },
        {
          question: "Question 2",
          options: ["Option E", "Option F", "Option G", "Option H"],
          correctAnswer: "Option G",
          explanation: "Explanation for Question 2"
        }
      ]
    }
  ]
};

// Groupe de tests pour QuizManager
describe('QuizManager', () => {
  let quizManager;
  
  // Avant chaque test, créer une nouvelle instance de QuizManager
  beforeEach(() => {
    quizManager = new QuizManager();
    quizManager.loadThemeData(mockQuizData);
    quizManager.setQuiz(101);
  });
  
  // Test pour vérifier le chargement du thème
  test('doit charger correctement les données du thème', () => {
    expect(quizManager.getCurrentThemeData()).toEqual(mockQuizData);
    expect(quizManager.currentThemeId).toBe(1);
  });
  
  // Test pour vérifier la sélection du quiz
  test('doit définir correctement le quiz actif', () => {
    const quiz = quizManager.getCurrentQuiz();
    expect(quiz.id).toBe(101);
    expect(quiz.questions.length).toBe(2);
  });
  
  // Test pour vérifier la navigation entre les questions
  test('doit naviguer correctement entre les questions', () => {
    // Question initiale est 0
    expect(quizManager.currentQuestionIndex).toBe(0);
    
    // Passer à la question suivante
    const hasNext = quizManager.nextQuestion();
    expect(hasNext).toBe(true);
    expect(quizManager.currentQuestionIndex).toBe(1);
    
    // Essayer de passer à une question suivante qui n'existe pas
    const hasNextAgain = quizManager.nextQuestion();
    expect(hasNextAgain).toBe(false);
    expect(quizManager.currentQuestionIndex).toBe(1);
    
    // Revenir à la question précédente
    const hasPrev = quizManager.previousQuestion();
    expect(hasPrev).toBe(true);
    expect(quizManager.currentQuestionIndex).toBe(0);
    
    // Essayer de revenir à une question précédente qui n'existe pas
    const hasPrevAgain = quizManager.previousQuestion();
    expect(hasPrevAgain).toBe(false);
    expect(quizManager.currentQuestionIndex).toBe(0);
  });
  
  // Test pour vérifier la soumission d'une réponse correcte
  test('doit correctement identifier une réponse correcte', () => {
    // La bonne réponse pour la question 0 est "Option A", qui est à l'index 0
    const result = quizManager.submitAnswer(0);
    
    expect(result.isCorrect).toBe(true);
    expect(result.selectedAnswer).toBe("Option A");
    expect(result.correctAnswer).toBe("Option A");
    expect(quizManager.score).toBe(1);
    expect(quizManager.questionStatus[0]).toBe('correct');
  });
  
  // Test pour vérifier la soumission d'une réponse incorrecte
  test('doit correctement identifier une réponse incorrecte', () => {
    // Soumettre une réponse incorrecte (index 1 = "Option B")
    const result = quizManager.submitAnswer(1);
    
    expect(result.isCorrect).toBe(false);
    expect(result.selectedAnswer).toBe("Option B");
    expect(result.correctAnswer).toBe("Option A");
    expect(quizManager.score).toBe(0);
    expect(quizManager.questionStatus[0]).toBe('incorrect');
  });
  
  // Test pour vérifier le calcul du score final
  test('doit calculer correctement le score final', () => {
    // Soumettre une réponse correcte pour la question 1
    quizManager.submitAnswer(0);
    
    // Passer à la question 2
    quizManager.nextQuestion();
    
    // Soumettre une réponse incorrecte pour la question 2
    quizManager.submitAnswer(0); // Index 0 = "Option E", qui est incorrect
    
    // Vérifier les résultats
    const results = quizManager.getResults();
    
    expect(results.score).toBe(1);
    expect(results.total).toBe(2);
    expect(results.accuracy).toBe(50);
    expect(results.status).toEqual(['correct', 'incorrect']);
  });
  
  // Test pour vérifier la réinitialisation du quiz
  test('doit correctement réinitialiser l\'état du quiz', () => {
    // Soumettre quelques réponses
    quizManager.submitAnswer(0);
    quizManager.nextQuestion();
    quizManager.submitAnswer(1);
    
    // Vérifier que le score est mis à jour
    expect(quizManager.score).toBe(1);
    
    // Réinitialiser
    quizManager.resetQuizState();
    
    // Vérifier l'état réinitialisé
    expect(quizManager.currentQuestionIndex).toBe(0);
    expect(quizManager.score).toBe(0);
    expect(quizManager.selectedAnswers).toEqual([]);
    expect(quizManager.questionStatus).toEqual([]);
    expect(quizManager.questionTimes).toEqual([]);
  });
  
  // Test pour vérifier l'évaluation du niveau
  test('doit correctement évaluer le niveau en fonction du score', () => {
    // Score parfait (niveau A2)
    let levelInfo = quizManager.evaluateLevel(10, 10);
    expect(levelInfo.level).toBe('A2');
    
    // Score de 70% (niveau A1+)
    levelInfo = quizManager.evaluateLevel(7, 10);
    expect(levelInfo.level).toBe('A1+');
    
    // Score de 50% (niveau A1)
    levelInfo = quizManager.evaluateLevel(5, 10);
    expect(levelInfo.level).toBe('A1');
    
    // Score de 30% (niveau Pre-A1)
    levelInfo = quizManager.evaluateLevel(3, 10);
    expect(levelInfo.level).toBe('Pre-A1');
    
    // Score très bas (niveau Débutant)
    levelInfo = quizManager.evaluateLevel(1, 10);
    expect(levelInfo.level).toBe('Débutant');
    
    // Cas particulier : aucune question
    levelInfo = quizManager.evaluateLevel(0, 0);
    expect(levelInfo.level).toBe('N/A');
  });
  
  // Test pour vérifier l'enregistrement du temps
  test('doit correctement enregistrer le temps passé par question', () => {
    // Simuler un temps de départ
    const mockDate = new Date();
    quizManager.startTime = new Date(mockDate.getTime() - 5000); // 5 secondes avant
    quizManager.timerEnabled = true;
    
    // Soumettre une réponse
    quizManager.submitAnswer(0);
    
    // Vérifier que le temps est enregistré
    expect(quizManager.questionTimes[0]).toBeGreaterThanOrEqual(5);
    expect(quizManager.totalTimeElapsed).toBeGreaterThanOrEqual(5);
  });
});
