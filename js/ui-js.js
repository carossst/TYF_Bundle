  matchingElement.className = 'matching-container';
  
  const userMatches = status ? status.userAnswer : [];
  const correctMatches = question.answer || [];
  const isAnswered = status !== null;
  
  // Create left and right columns
  const leftColumn = document.createElement('div');
  leftColumn.className = 'matching-column left-column';
  
  const rightColumn = document.createElement('div');
  rightColumn.className = 'matching-column right-column';
  
  // Create the pairs
  question.pairs.forEach((pair, index) => {
    // Left item (always in order)
    const leftItem = document.createElement('div');
    leftItem.className = 'matching-item left-item';
    leftItem.setAttribute('data-index', index);
    leftItem.innerHTML = `<div class="item-content">${pair.left}</div>`;
    leftColumn.appendChild(leftItem);
    
    // Right item (shuffled or fixed based on question config)
    const rightItemIndex = isAnswered ? userMatches[index] : null;
    const rightItem = document.createElement('div');
    rightItem.className = 'matching-item right-item';
    rightItem.setAttribute('data-index', index);
    
    // If answered, add correct/incorrect styling
    if (isAnswered) {
      if (rightItemIndex === correctMatches[index]) {
        rightItem.classList.add('correct-match');
      } else {
        rightItem.classList.add('incorrect-match');
      }
      rightItem.innerHTML = `<div class="item-content">${question.pairs[rightItemIndex].right}</div>`;
    } else {
      // If not answered, allow matching by showing dropdown
      const selectElement = document.createElement('select');
      selectElement.className = 'matching-select';
      selectElement.setAttribute('data-index', index);
      
      // Add default "select" option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select a match';
      defaultOption.selected = true;
      defaultOption.disabled = true;
      selectElement.appendChild(defaultOption);
      
      // Add all right options
      question.pairs.forEach((rightPair, rightIndex) => {
        const option = document.createElement('option');
        option.value = rightIndex;
        option.textContent = rightPair.right;
        selectElement.appendChild(option);
      });
      
      rightItem.appendChild(selectElement);
    }
    
    rightColumn.appendChild(rightItem);
  });
  
  matchingElement.appendChild(leftColumn);
  matchingElement.appendChild(rightColumn);
  container.appendChild(matchingElement);
  
  // If question is not answered yet, add submit button
  if (!isAnswered) {
    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-primary submit-answer disabled';
    submitButton.setAttribute('disabled', true);
    submitButton.textContent = 'Submit Answer';
    container.appendChild(submitButton);
    
    // Store reference for event handling
    this.dom.quiz.submitAnswerBtn = submitButton;
    
    // Store references to select elements
    this.dom.quiz.matchingSelects = Array.from(matchingElement.querySelectorAll('.matching-select'));
  }
};

QuizUI.prototype.renderListeningQuestion = function(container, question, status) {
  if (!question.audioFile) {
    container.innerHTML = '<p class="error">No audio file available for this listening question</p>';
    return;
  }
  
  const listeningElement = document.createElement('div');
  listeningElement.className = 'listening-container';
  
  // Audio player
  const audioContainer = document.createElement('div');
  audioContainer.className = 'audio-container';
  
  // Ensure audioFile path starts with ./ for GitHub Pages compatibility
  const audioPath = question.audioFile.startsWith('./') ? question.audioFile : `./${question.audioFile}`;
  
  audioContainer.innerHTML = `
    <audio class="listening-audio" controls>
      <source src="${audioPath}" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>
    <div class="audio-controls">
      <button class="btn btn-secondary btn-play"><i class="fas fa-play"></i> Play</button>
      <button class="btn btn-secondary btn-pause"><i class="fas fa-pause"></i> Pause</button>
      <button class="btn btn-secondary btn-replay"><i class="fas fa-redo"></i> Replay</button>
    </div>
  `;
  
  listeningElement.appendChild(audioContainer);
  
  // Question part (can be multiple choice or fill-in-the-blank)
  const questionPartElement = document.createElement('div');
  questionPartElement.className = 'listening-question-part';
  
  // Check if we have options (multiple choice) or template (fill-blank)
  if (question.options && question.options.length > 0) {
    // Render as multiple choice
    const subQuestion = {
      type: 'multiple-choice',
      options: question.options,
      answer: question.answer
    };
    this.renderMultipleChoiceQuestion(questionPartElement, subQuestion, status);
  } else if (question.template) {
    // Render as fill-in-the-blank
    const subQuestion = {
      type: 'fill-blank',
      template: question.template,
      answer: question.answer
    };
    this.renderFillBlankQuestion(questionPartElement, subQuestion, status);
  } else {
    questionPartElement.innerHTML = '<p class="error">Invalid listening question format</p>';
  }
  
  listeningElement.appendChild(questionPartElement);
  container.appendChild(listeningElement);
  
  // Store audio element reference
  this.dom.quiz.audioElement = listeningElement.querySelector('.listening-audio');
  this.dom.quiz.playButton = listeningElement.querySelector('.btn-play');
  this.dom.quiz.pauseButton = listeningElement.querySelector('.btn-pause');
  this.dom.quiz.replayButton = listeningElement.querySelector('.btn-replay');
};

QuizUI.prototype.setupQuestionInteractions = function(questionType, status) {
  // Skip if question is already answered
  if (status !== null) return;
  
  const submitBtn = this.dom.quiz.submitAnswerBtn;
  
  switch (questionType) {
    case 'multiple-choice':
      // Handle option selection
      const optionItems = this.dom.quiz.question.querySelectorAll('.option-item');
      optionItems.forEach(option => {
        option.addEventListener('click', () => {
          // Remove selected class from all options
          optionItems.forEach(opt => opt.classList.remove('selected'));
          // Add selected class to clicked option
          option.classList.add('selected');
          // Enable submit button
          if (submitBtn) {
            submitBtn.classList.remove('disabled');
            submitBtn.removeAttribute('disabled');
          }
        });
      });
      
      // Handle submit button
      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          const selectedOption = this.dom.quiz.question.querySelector('.option-item.selected');
          if (selectedOption) {
            const answerIndex = Number(selectedOption.getAttribute('data-index'));
            this.submitAnswer(answerIndex);
          }
        });
      }
      break;
      
    case 'fill-blank':
      // Handle input changes
      const input = this.dom.quiz.fillBlankInput;
      if (input) {
        input.addEventListener('input', () => {
          // Enable submit button if input is not empty
          if (submitBtn) {
            if (input.value.trim() !== '') {
              submitBtn.classList.remove('disabled');
              submitBtn.removeAttribute('disabled');
            } else {
              submitBtn.classList.add('disabled');
              submitBtn.setAttribute('disabled', true);
            }
          }
        });
        
        // Allow submitting with Enter key
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && input.value.trim() !== '') {
            e.preventDefault();
            this.submitAnswer(input.value.trim());
          }
        });
      }
      
      // Handle submit button
      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          if (input && input.value.trim() !== '') {
            this.submitAnswer(input.value.trim());
          }
        });
      }
      break;
      
    case 'matching':
      // Handle select changes
      const selects = this.dom.quiz.matchingSelects;
      if (selects && selects.length > 0) {
        selects.forEach(select => {
          select.addEventListener('change', () => {
            // Check if all selects have a value
            const allSelected = selects.every(s => s.value !== '');
            
            // Enable submit button if all pairs are matched
            if (submitBtn) {
              if (allSelected) {
                submitBtn.classList.remove('disabled');
                submitBtn.removeAttribute('disabled');
              } else {
                submitBtn.classList.add('disabled');
                submitBtn.setAttribute('disabled', true);
              }
            }
          });
        });
        
        // Handle submit button
        if (submitBtn) {
          submitBtn.addEventListener('click', () => {
            // Get all selected values
            const matches = selects.map(select => Number(select.value));
            if (matches.length === selects.length) {
              this.submitAnswer(matches);
            }
          });
        }
      }
      break;
      
    case 'listening':
      // Handle audio player buttons
      if (this.dom.quiz.audioElement) {
        const audio = this.dom.quiz.audioElement;
        
        // Play button
        if (this.dom.quiz.playButton) {
          this.dom.quiz.playButton.addEventListener('click', () => {
            audio.play();
          });
        }
        
        // Pause button
        if (this.dom.quiz.pauseButton) {
          this.dom.quiz.pauseButton.addEventListener('click', () => {
            audio.pause();
          });
        }
        
        // Replay button
        if (this.dom.quiz.replayButton) {
          this.dom.quiz.replayButton.addEventListener('click', () => {
            audio.currentTime = 0;
            audio.play();
          });
        }
        
        // Auto-play once on load
        audio.addEventListener('canplaythrough', () => {
          audio.play();
        }, { once: true });
      }
      
      // For the actual question part, delegate to appropriate type
      if (this.dom.quiz.submitAnswerBtn) {
        submitBtn.addEventListener('click', () => {
          // Check if multiple choice or fill-blank
          const selectedOption = this.dom.quiz.question.querySelector('.option-item.selected');
          const fillBlankInput = this.dom.quiz.question.querySelector('.fill-blank-input');
          
          if (selectedOption) {
            // Multiple choice
            const answerIndex = Number(selectedOption.getAttribute('data-index'));
            this.submitAnswer(answerIndex);
          } else if (fillBlankInput && fillBlankInput.value.trim() !== '') {
            // Fill in the blank
            this.submitAnswer(fillBlankInput.value.trim());
          }
        });
      }
      break;
  }
};

QuizUI.prototype.cleanupQuestionMedia = function() {
  // Cleanup audio elements
  if (this.dom.quiz.audioElement) {
    this.dom.quiz.audioElement.pause();
    this.dom.quiz.audioElement.currentTime = 0;
    this.dom.quiz.audioElement = null;
  }
  
  // Clear any references to temporary UI elements
  this.dom.quiz.submitAnswerBtn = null;
  this.dom.quiz.fillBlankInput = null;
  this.dom.quiz.matchingSelects = null;
  this.dom.quiz.playButton = null;
  this.dom.quiz.pauseButton = null;
  this.dom.quiz.replayButton = null;
};

QuizUI.prototype.updateNavigationButtons = function(currentIndex, totalQuestions, isQuizComplete) {
  // Previous button
  if (this.dom.buttons.prev) {
    if (currentIndex > 0) {
      this.dom.buttons.prev.classList.remove('hidden');
      this.dom.buttons.prev.disabled = false;
    } else {
      this.dom.buttons.prev.classList.add('hidden');
      this.dom.buttons.prev.disabled = true;
    }
  }
  
  // Next button
  if (this.dom.buttons.next) {
    // Show next button if not on last question or if question is answered
    const questionAnswered = this.quizManager.getQuestionStatus(currentIndex) !== null;
    const isLastQuestion = currentIndex === totalQuestions - 1;
    
    if (!isLastQuestion && questionAnswered) {
      this.dom.buttons.next.classList.remove('hidden');
      this.dom.buttons.next.disabled = false;
      this.dom.buttons.next.textContent = 'Next Question';
    } else if (isLastQuestion && questionAnswered) {
      this.dom.buttons.next.classList.remove('hidden');
      this.dom.buttons.next.disabled = false;
      this.dom.buttons.next.textContent = 'Finish Quiz';
    } else {
      this.dom.buttons.next.classList.add('hidden');
      this.dom.buttons.next.disabled = true;
    }
  }
  
  // Submit button (for completing the quiz)
  if (this.dom.buttons.submit) {
    // Show submit button only if all questions are answered
    if (isQuizComplete) {
      this.dom.buttons.submit.classList.remove('hidden');
      this.dom.buttons.submit.disabled = false;
    } else {
      this.dom.buttons.submit.classList.add('hidden');
      this.dom.buttons.submit.disabled = true;
    }
  }
};

QuizUI.prototype.updateProgressBar = function(currentIndex, totalQuestions) {
  // Update progress bar
  if (this.dom.quiz.progressBar) {
    const percentComplete = Math.floor(((currentIndex + 1) / totalQuestions) * 100);
    this.dom.quiz.progressBar.style.width = `${percentComplete}%`;
    this.dom.quiz.progressBar.setAttribute('aria-valuenow', percentComplete);
    
    // Update progress text if available
    if (this.dom.quiz.progressText) {
      this.dom.quiz.progressText.textContent = `Question ${currentIndex + 1} of ${totalQuestions}`;
    }
  }
  
  // Update question status indicators if available
  if (this.dom.quiz.questionIndicators) {
    this.dom.quiz.questionIndicators.innerHTML = '';
    
    for (let i = 0; i < totalQuestions; i++) {
      const indicator = document.createElement('div');
      indicator.className = 'question-indicator';
      
      // Apply status classes
      if (i < currentIndex) {
        indicator.classList.add('completed');
        
        // Add correct/incorrect class based on answer
        const status = this.quizManager.getQuestionStatus(i);
        if (status && status.correct) {
          indicator.classList.add('correct');
        } else if (status) {
          indicator.classList.add('incorrect');
        }
      } else if (i === currentIndex) {
        indicator.classList.add('current');
      }
      
      indicator.setAttribute('data-question', i + 1);
      this.dom.quiz.questionIndicators.appendChild(indicator);
    }
  }
};

QuizUI.prototype.submitAnswer = function(answer) {
  // Submit answer to QuizManager
  const currentIndex = this.quizManager.currentQuestionIndex;
  const result = this.quizManager.submitAnswer(currentIndex, answer);
  
  // Get updated quiz state
  const totalQuestions = this.quizManager.questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const allAnswered = this.quizManager.allQuestionsAnswered();
  
  // Update UI to show results
  this.updateQuizUI();
  
  // Auto-navigate to next question after delay if not the last question
  if (!isLastQuestion && this.quizManager.autoAdvance) {
    setTimeout(() => {
      this.goToNextQuestion();
    }, 1500); // 1.5 second delay to show the result
  }
  
  // Auto-show results if all questions are answered and this was the last one
  if (isLastQuestion && allAnswered && this.quizManager.autoShowResults) {
    setTimeout(() => {
      this.showResults();
    }, 2000); // 2 second delay
  }
  
  return result;
};

QuizUI.prototype.goToNextQuestion = function() {
  // Check if current question is answered
  const currentIndex = this.quizManager.currentQuestionIndex;
  const questionAnswered = this.quizManager.getQuestionStatus(currentIndex) !== null;
  
  if (!questionAnswered) {
    alert('Please answer the current question before proceeding.');
    return;
  }
  
  // Go to next question in manager
  const nextIndex = this.quizManager.goToNextQuestion();
  
  // Update UI
  this.updateQuizUI();
  
  return nextIndex;
};

QuizUI.prototype.goToPreviousQuestion = function() {
  // Go to previous question in manager
  const prevIndex = this.quizManager.goToPreviousQuestion();
  
  // Update UI
  this.updateQuizUI();
  
  return prevIndex;
};

QuizUI.prototype.startTimer = function() {
  // Don't start if timer is disabled in preferences
  if (!this.quizManager.timerEnabled) return;
  
  // Don't restart if timer is already running
  if (this.quizManager.timerInterval) return;
  
  // Start the timer in QuizManager
  this.quizManager.startTimer();
  
  // Update UI timer every second
  this.quizManager.timerInterval = setInterval(() => {
    this.updateTimerDisplay();
  }, 1000);
  
  // Initial update
  this.updateTimerDisplay();
  
  console.log("Timer started");
};

QuizUI.prototype.stopTimer = function() {
  // Stop the timer in QuizManager
  this.quizManager.stopTimer();
  
  // Clear the interval
  if (this.quizManager.timerInterval) {
    clearInterval(this.quizManager.timerInterval);
    this.quizManager.timerInterval = null;
  }
  
  // Final update of timer display
  this.updateTimerDisplay();
  
  console.log("Timer stopped");
};

QuizUI.prototype.updateTimerDisplay = function() {
  if (!this.dom.quiz.timer.display) return;
  
  const elapsedSeconds = this.quizManager.getElapsedTime();
  if (elapsedSeconds === null) {
    this.dom.quiz.timer.display.textContent = '00:00';
    return;
  }
  
  // Format time as mm:ss
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  this.dom.quiz.timer.display.textContent = formattedTime;
};

QuizUI.prototype.toggleTimer = function() {
  // This only toggles the timer display visibility, not the timer itself
  if (!this.dom.quiz.timer.container) return;
  
  this.dom.quiz.timer.container.classList.toggle('minimized');
  
  // Update toggle button icon if available
  if (this.dom.quiz.timer.toggle) {
    const isMinimized = this.dom.quiz.timer.container.classList.contains('minimized');
    this.dom.quiz.timer.toggle.innerHTML = isMinimized ? 
      '<i class="fas fa-stopwatch"></i> Show Timer' : 
      '<i class="fas fa-times"></i> Hide Timer';
  }
};

QuizUI.prototype.updateTimerUIState = function() {
  // Update timer UI elements based on timer enabled state
  if (!this.dom.quiz.timer.container) return;
  
  if (this.quizManager.timerEnabled) {
    this.dom.quiz.timer.container.classList.remove('disabled');
    if (this.dom.quiz.timer.toggle) {
      this.dom.quiz.timer.toggle.disabled = false;
    }
  } else {
    this.dom.quiz.timer.container.classList.add('disabled');
    if (this.dom.quiz.timer.toggle) {
      this.dom.quiz.timer.toggle.disabled = true;
    }
  }
};

// ----- Results Screen -----

QuizUI.prototype.showResults = function() {
  // Stop the timer if running
  this.stopTimer();
  
  // Mark quiz as completed and get results
  const results = this.quizManager.completeQuiz();
  
  // Save results to storage
  window.storage.saveQuizResult(
    this.quizManager.currentThemeId,
    this.quizManager.currentQuizId,
    results
  );
  
  // Prepare and show results screen
  this.renderResults(results);
  
  // Show the results screen (might be different from other screens)
  this._transitionScreen(this.dom.screens.result);
};

QuizUI.prototype.renderResults = function(results) {
  // Check if results screen is available
  if (!this.dom.screens.result) {
    console.error("Results screen not found in DOM elements");
    return;
  }
  
  // Get theme and quiz info
  const themeInfo = this.quizManager.themeInfo || { name: 'Unknown Theme' };
  const quizInfo = this.quizManager.quizData || { name: 'Unknown Quiz', id: 0 };
  
  // Update heading
  if (this.dom.result.title) {
    this.dom.result.title.textContent = quizInfo.name || `Quiz ${quizInfo.id}`;
  }
  if (this.dom.result.subtitle) {
    this.dom.result.subtitle.textContent = themeInfo.name || '';
  }
  
  // Update score
  if (this.dom.result.score) {
    this.dom.result.score.textContent = `${results.score}/${results.total}`;
  }
  if (this.dom.result.percentage) {
    this.dom.result.percentage.textContent = `${results.percentage}%`;
  }
  if (this.dom.result.accuracy) {
    this.dom.result.accuracy.textContent = `${results.accuracy}%`;
  }
  
  // Update time
  if (this.dom.result.time) {
    const minutes = Math.floor(results.totalTime / 60);
    const seconds = results.totalTime % 60;
    this.dom.result.time.textContent = `${minutes}m ${seconds}s`;
  }
  
  // Update level based on accuracy
  if (this.dom.result.level) {
    let level = '';
    if (results.accuracy >= 80) level = 'A2';
    else if (results.accuracy >= 60) level = 'A1+';
    else if (results.accuracy >= 40) level = 'A1';
    else if (results.accuracy >= 20) level = 'Pré-A1';
    else level = 'Débutant';
    
    this.dom.result.level.textContent = level;
  }
  
  // Update feedback based on performance
  if (this.dom.result.feedback) {
    let feedbackMessage = '';
    if (results.accuracy >= 80) {
      feedbackMessage = 'Excellent work! You have a solid grasp of this topic.';
    } else if (results.accuracy >= 60) {
      feedbackMessage = 'Good job! You\'re making great progress with this material.';
    } else if (results.accuracy >= 40) {
      feedbackMessage = 'Nice effort! With more practice, you\'ll continue to improve.';
    } else {
      feedbackMessage = 'This topic needs more practice. Don\'t worry, keep trying!';
    }
    this.dom.result.feedback.textContent = feedbackMessage;
  }
  
  // Render question results
  this.renderQuestionResults(results.questions);
  
  // Render performance chart if needed
  this.renderPerformanceChart(results);
  
  // Update share text
  if (this.dom.result.shareText) {
    const shareText = `I scored ${results.score}/${results.total} (${results.accuracy}%) on ${quizInfo.name} in the Test Your French app! #TestYourFrench`;
    this.dom.result.shareText.value = shareText;
  }
};

QuizUI.prototype.renderQuestionResults = function(questionResults) {
  if (!this.dom.result.questionList) return;
  
  const questionList = this.dom.result.questionList;
  questionList.innerHTML = '';
  
  // Create summary header
  const summaryHeader = document.createElement('div');
  summaryHeader.className = 'results-summary-header';
  summaryHeader.innerHTML = '<h3>Question Summary</h3>';
  questionList.appendChild(summaryHeader);
  
  questionResults.forEach((result, index) => {
    const question = this.quizManager.questions[index];
    if (!question) return;
    
    const questionItem = document.createElement('div');
    questionItem.className = `question-result ${result.correct ? 'correct' : 'incorrect'}`;
    
    // Format user answer and correct answer based on question type
    let userAnswerDisplay = '';
    let correctAnswerDisplay = '';
    
    switch (question.type) {
      case 'multiple-choice':
        userAnswerDisplay = result.userAnswer !== null ? question.options[result.userAnswer] : 'Not answered';
        correctAnswerDisplay = question.options[question.answer];
        break;
      case 'fill-blank':
        userAnswerDisplay = result.userAnswer || 'Not answered';
        correctAnswerDisplay = question.answer;
        break;
      case 'matching':
        if (Array.isArray(result.userAnswer)) {
          userAnswerDisplay = result.userAnswer.map((rightIndex, leftIndex) => {
            return `${question.pairs[leftIndex].left} → ${question.pairs[rightIndex].right}`;
          }).join(', ');
        } else {
          userAnswerDisplay = 'Not answered';
        }
        correctAnswerDisplay = 'Correct matches'; // Simplified for this example
        break;
      case 'listening':
        if (question.options) {
          userAnswerDisplay = result.userAnswer !== null ? question.options[result.userAnswer] : 'Not answered';
          correctAnswerDisplay = question.options[question.answer];
        } else {
          userAnswerDisplay = result.userAnswer || 'Not answered';
          correctAnswerDisplay = question.answer;
        }
        break;
    }
    
    questionItem.innerHTML = `
      <div class="question-result-header">
        <div class="result-icon">
          <i class="fas ${result.correct ? 'fa-check-circle' : 'fa-times-circle'}"></i>
        </div>
        <div class="question-info">
          <h4>Question ${index + 1}</h4>
          <p>${question.prompt || 'Answer the question:'}</p>
        </div>
      </div>
      <div class="question-result-detail">
        <div class="answer-comparison">
          <div class="user-answer ${result.correct ? 'correct' : 'incorrect'}">
            <strong>Your answer:</strong> ${userAnswerDisplay}
          </div>
          ${!result.correct ? `<div class="correct-answer"><strong>Correct answer:</strong> ${correctAnswerDisplay}</div>` : ''}
        </div>
        ${question.explanation ? `<div class="explanation"><p>${question.explanation}</p></div>` : ''}
      </div>
    `;
    
    questionList.appendChild(questionItem);
  });
};

QuizUI.prototype.renderPerformanceChart = function(results) {
  // Implement if needed based on desired chart type
  // This could use a simple canvas or a library to show performance metrics
  
  // Simple example using DOM elements (can be replaced with actual chart library)
  if (this.dom.result.performanceChart) {
    const chartContainer = this.dom.result.performanceChart;
    chartContainer.innerHTML = '';
    
    // Simple bar chart for correct vs incorrect answers
    const correctWidth = `${results.accuracy}%`;
    const incorrectWidth = `${100 - results.accuracy}%`;
    
    chartContainer.innerHTML = `
      <div class="simple-chart">
        <div class="chart-title">Answer Distribution</div>
        <div class="chart-bars">
          <div class="chart-bar correct" style="width: ${correctWidth}">
            <span class="bar-label">${results.score} Correct</span>
          </div>
          <div class="chart-bar incorrect" style="width: ${incorrectWidth}">
            <span class="bar-label">${results.total - results.score} Incorrect</span>
          </div>
        </div>
      </div>
    `;
  }
};

QuizUI.prototype.restartCurrentQuiz = function() {
  // Confirm before restarting if quiz was completed
  if (this.quizManager.quizCompleted && !confirm('Do you want to restart this quiz? Your current results will remain saved.')) {
    return;
  }
  
  // Reset quiz state
  this.quizManager.resetQuizState();
  
  // Reload and reinitialize with same quiz data
  this.startSelectedQuiz(this.quizManager.currentThemeId, this.quizManager.currentQuizId);
};

QuizUI.prototype.exportResults = function() {
  // Get results from QuizManager
  const results = this.quizManager.getResults();
  
  if (!results) {
    alert('No results available to export.');
    return;
  }
  
  // Create formatted results text
  const themeInfo = this.quizManager.themeInfo || { name: 'Unknown Theme' };
  const quizInfo = this.quizManager.quizData || { name: 'Unknown Quiz', id: 0 };
  
  let exportText = `TEST YOUR FRENCH - QUIZ RESULTS\n\n`;
  exportText += `Theme: ${themeInfo.name}\n`;
  exportText += `Quiz: ${quizInfo.name || `Quiz ${quizInfo.id}`}\n\n`;
  exportText += `Score: ${results.score}/${results.total} (${results.accuracy}%)\n`;
  
  // Format time
  const minutes = Math.floor(results.totalTime / 60);
  const seconds = results.totalTime % 60;
  exportText += `Time: ${minutes}m ${seconds}s\n\n`;
  
  // Language level
  let level = '';
  if (results.accuracy >= 80) level = 'A2';
  else if (results.accuracy >= 60) level = 'A1+';
  else if (results.accuracy >= 40) level = 'A1';
  else if (results.accuracy >= 20) level = 'Pré-A1';
  else level = 'Débutant';
  
  exportText += `Level: ${level}\n\n`;
  
  // Question details
  exportText += `QUESTION DETAILS:\n`;
  results.questions.forEach((result, index) => {
    const question = this.quizManager.questions[index];
    if (!question) return;
    
    exportText += `\nQuestion ${index + 1}: ${question.prompt || 'Answer the question'}\n`;
    exportText += `Correct: ${result.correct ? 'Yes' : 'No'}\n`;
    
    // Format answers based on question type
    switch (question.type) {
      case 'multiple-choice':
        if (result.userAnswer !== null) {
          exportText += `Your answer: ${question.options[result.userAnswer]}\n`;
        } else {
          exportText += `Your answer: Not answered\n`;
        }
        exportText += `Correct answer: ${question.options[question.answer]}\n`;
        break;
      case 'fill-blank':
        exportText += `Your answer: ${result.userAnswer || 'Not answered'}\n`;
        exportText += `Correct answer: ${question.answer}\n`;
        break;
      case 'matching':
        exportText += `Your matches:\n`;
        if (Array.isArray(result.userAnswer)) {
          result.userAnswer.forEach((rightIndex, leftIndex) => {
            exportText += `  ${question.pairs[leftIndex].left} → ${question.pairs[rightIndex].right}\n`;
          });
        } else {
          exportText += `  Not answered\n`;
        }
        exportText += `Correct matches:\n`;
        question.answer.forEach((rightIndex, leftIndex) => {
          exportText += `  ${question.pairs[leftIndex].left} → ${question.pairs[rightIndex].right}\n`;
        });
        break;
      case 'listening':
        if (question.options) {
          if (result.userAnswer !== null) {
            exportText += `Your answer: ${question.options[result.userAnswer]}\n`;
          } else {
            exportText += `Your answer: Not answered\n`;
          }
          exportText += `Correct answer: ${question.options[question.answer]}\n`;
        } else {
          exportText += `Your answer: ${result.userAnswer || 'Not answered'}\n`;
          exportText += `Correct answer: ${question.answer}\n`;
        }
        break;
    }
    
    // Add explanation if available
    if (question.explanation) {
      exportText += `Explanation: ${question.explanation}\n`;
    }
  });
  
  // Date of export
  exportText += `\nExported on ${new Date().toLocaleString()}\n`;
  exportText += `Test Your French - Learn French with interactive quizzes\n`;
  
  // Create file and trigger download
  const blob = new Blob([exportText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `TestYourFrench_${themeInfo.name.replace(/\s+/g, '_')}_${quizInfo.name ? quizInfo.name.replace(/\s+/g, '_') : `Quiz${quizInfo.id}`}_Results.txt`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

QuizUI.prototype.printResults = function() {
  // Use browser's print functionality
  window.print();
};

QuizUI.prototype.copyShareText = function() {
  // Copy share text to clipboard
  if (!this.dom.result.shareText) return;
  
  const shareTextArea = this.dom.result.shareText;
  shareTextArea.select();
  shareTextArea.setSelectionRange(0, 99999); // For mobile devices
  
  // Use modern clipboard API with fallback
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareTextArea.value)
      .then(() => {
        // Show success message
        const originalText = this.dom.buttons.copy.textContent;
        this.dom.buttons.copy.textContent = 'Copied!';
        setTimeout(() => {
          this.dom.buttons.copy.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback
        document.execCommand('copy');
      });
  } else {
    // Fallback for older browsers
    document.execCommand('copy');
    // Show success message
    const originalText = this.dom.buttons.copy.textContent;
    this.dom.buttons.copy.textContent = 'Copied!';
    setTimeout(() => {
      this.dom.buttons.copy.textContent = originalText;
    }, 2000);
  }
};

// Make QuizUI global 
window.QuizUI = QuizUI;/*
 * js/ui.js - Version 2.2.3 (Non-module)
 * Gestion de l'interface utilisateur pour Test Your French.
 * Responsable de l'affichage des écrans, du rendu des données (thèmes, quiz, questions),
 * de la gestion des interactions utilisateur (clics, etc.),
 * et de la coordination avec QuizManager, ResourceManager et StorageManager.
 * 
 * Modifié pour la compatibilité avec GitHub Pages:
 * - Assure que tous les chemins commencent par './'
 * - Compatible avec la structure de dossiers sur GitHub Pages
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
  console.log("QuizUI initialized (v2.2.3 - Non-module version, GitHub Pages compatible)");
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

QuizUI.prototype.renderQuizzes = function(themeInfo, quizzesWithProgress) {
  const quizzesList = this.dom.quizzesList; // DOM element for quizzes list
  if (!quizzesList) { console.error("Quizzes list container not found."); return; }
  quizzesList.innerHTML = ''; // Clear previous content

  if (!quizzesWithProgress || quizzesWithProgress.length === 0) {
    quizzesList.innerHTML = '<p class="no-data">No quizzes available for this theme.</p>';
    return;
  }

  // Create a fragment to optimize DOM insertions
  const fragment = document.createDocumentFragment();

  quizzesWithProgress.forEach(quiz => {
    const quizElement = document.createElement('div');
    quizElement.className = 'selection-item quiz-item';
    quizElement.setAttribute('data-theme-id', themeInfo.id);
    quizElement.setAttribute('data-quiz-id', quiz.id);
    quizElement.setAttribute('tabindex', '0'); // Make focusable for keyboard users
    quizElement.setAttribute('role', 'button'); // Indicate it's clickable

    const hasProgress = quiz.progress && quiz.progress.completed;
    const progressClass = hasProgress 
      ? quiz.progress.accuracy >= 80 ? 'excellent' 
        : quiz.progress.accuracy >= 60 ? 'good'
        : quiz.progress.accuracy >= 40 ? 'average'
        : 'needs-improvement' 
      : '';

    let statusIcon = '';
    if (hasProgress) {
      // Show star rating based on accuracy
      if (quiz.progress.accuracy >= 80) {
        statusIcon = '<span class="quiz-status completed excellent"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></span>';
      } else if (quiz.progress.accuracy >= 60) {
        statusIcon = '<span class="quiz-status completed good"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="far fa-star"></i></span>';
      } else if (quiz.progress.accuracy >= 40) {
        statusIcon = '<span class="quiz-status completed average"><i class="fas fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i></span>';
      } else {
        statusIcon = '<span class="quiz-status completed needs-improvement"><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i></span>';
      }
    } else {
      statusIcon = '<span class="quiz-status new"><i class="fas fa-circle"></i> New</span>';
    }

    const progressBar = hasProgress 
      ? `<div class="progress-info">
           <div class="progress-bar">
             <div class="progress ${progressClass}" style="width: ${quiz.progress.accuracy}%"></div>
           </div>
           <span>${quiz.progress.score}/${quiz.progress.total} (${quiz.progress.accuracy}%)</span>
         </div>`
      : '<div class="progress-info"><span class="no-progress">Not started</span></div>';

    const completedDate = hasProgress && quiz.progress.dateCompleted
      ? `<div class="quiz-completed-date">Completed: ${new Date(quiz.progress.dateCompleted).toLocaleDateString()}</div>`
      : '';

    const timeSpent = hasProgress && quiz.progress.totalTime
      ? `<div class="quiz-time-spent">Time: ${formatTime(quiz.progress.totalTime)}</div>`
      : '';

    quizElement.innerHTML = `
      <div class="item-icon">
        <i class="${quiz.icon || getQuizTypeIcon(quiz.type)}"></i>
      </div>
      <div class="item-content">
        <h3>${quiz.name || `Quiz ${quiz.id}`}</h3>
        <p>${quiz.description || getQuizTypeDescription(quiz.type)}</p>
        ${progressBar}
        <div class="quiz-details">
          ${completedDate}
          ${timeSpent}
        </div>
      </div>
      <div class="item-action">
        ${statusIcon}
        <i class="fas fa-play-circle"></i>
      </div>
    `;

    fragment.appendChild(quizElement);
  });

  quizzesList.appendChild(fragment);

  // Helper function for formatting time
  function formatTime(seconds) {
    if (!seconds) return '-';
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  }

  // Helper function to get appropriate icon based on quiz type
  function getQuizTypeIcon(type) {
    if (!type) return 'fas fa-question-circle';
    
    // Map quiz types to FontAwesome icons
    const typeToIcon = {
      'writing': 'fas fa-pen',
      'reading': 'fas fa-book-open',
      'conversation': 'fas fa-comments',
      'listening': 'fas fa-headphones',
      'mixed': 'fas fa-random'
    };
    
    return typeToIcon[type.toLowerCase()] || 'fas fa-question-circle';
  }

  // Helper function to get description based on quiz type
  function getQuizTypeDescription(type) {
    if (!type) return 'Test your French knowledge with this quiz.';
    
    // Map quiz types to descriptions
    const typeToDescription = {
      'writing': 'Practice your written French by completing sentences and phrases.',
      'reading': 'Test your reading comprehension with French texts and questions.',
      'conversation': 'Practice everyday conversation phrases and responses.',
      'listening': 'Test your listening skills with spoken French.',
      'mixed': 'A mix of different question types to test all your French skills.'
    };
    
    return typeToDescription[type.toLowerCase()] || 'Test your French knowledge with this quiz.';
  }
};

QuizUI.prototype.renderThemeBars = function(themeStats, themeList) {
  const themeBarsContainer = this.dom.stats.themeBars;
  if (!themeBarsContainer) { console.error("Theme bars container not found"); return; }
  themeBarsContainer.innerHTML = ''; // Clear previous content

  // If empty, show placeholder message
  if (!themeStats || Object.keys(themeStats).length === 0) {
    themeBarsContainer.innerHTML = '<p class="no-data">No theme stats available yet. Complete quizzes to see your progress.</p>';
    return;
  }

  // Sort theme IDs by performance (best to worst - completion%, then accuracy%)
  const sortedThemeIds = Object.keys(themeStats).sort((a, b) => {
    const completionA = themeStats[a].quizzes.completed / themeStats[a].quizzes.total;
    const completionB = themeStats[b].quizzes.completed / themeStats[b].quizzes.total;
    
    if (completionB !== completionA) return completionB - completionA; // Sort by completion percentage
    return themeStats[b].avgAccuracy - themeStats[a].avgAccuracy; // Then by accuracy
  });

  // Create a fragment for performance
  const fragment = document.createDocumentFragment();
  
  sortedThemeIds.forEach(themeId => {
    const theme = themeStats[themeId];
    // Get theme name from theme list
    const themeName = themeList.find(t => t.id === Number(themeId))?.name || `Theme ${themeId}`;
    
    // Calculate stats
    const completionPercent = Math.round((theme.quizzes.completed / theme.quizzes.total) * 100);
    const accuracyPercent = Math.round(theme.avgAccuracy);
    
    const themeBar = document.createElement('div');
    themeBar.className = 'theme-bar';
    themeBar.setAttribute('data-theme-id', themeId);
    
    themeBar.innerHTML = `
      <h4>${themeName}</h4>
      <div class="theme-stats">
        <div class="stat-item">
          <div class="stat-label">Completion</div>
          <div class="stat-bar">
            <div class="stat-value" style="width: ${completionPercent}%"></div>
          </div>
          <div class="stat-text">${completionPercent}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Accuracy</div>
          <div class="stat-bar">
            <div class="stat-value accuracy" style="width: ${accuracyPercent}%"></div>
          </div>
          <div class="stat-text">${accuracyPercent}%</div>
        </div>
        <div class="stat-summary">
          ${theme.quizzes.completed}/${theme.quizzes.total} quizzes completed
        </div>
      </div>
    `;
    
    fragment.appendChild(themeBar);
  });
  
  themeBarsContainer.appendChild(fragment);
};

QuizUI.prototype.renderBestAndWorstThemes = function(bestTheme, worstTheme, themeList) {
  const bestThemeContainer = this.dom.stats.bestTheme;
  const worstThemeContainer = this.dom.stats.worstTheme;
  
  if (bestThemeContainer) {
    if (bestTheme) {
      // Find theme name
      const themeName = themeList.find(t => t.id === Number(bestTheme.id))?.name || `Theme ${bestTheme.id}`;
      bestThemeContainer.innerHTML = `
        <h4>Best Theme</h4>
        <div class="highlight-theme">
          <div class="theme-name">${themeName}</div>
          <div class="theme-score">${Math.round(bestTheme.avgAccuracy)}% accuracy</div>
        </div>
      `;
    } else {
      bestThemeContainer.innerHTML = '<p class="no-data">Complete more quizzes to see your best theme.</p>';
    }
  }
  
  if (worstThemeContainer) {
    if (worstTheme) {
      // Find theme name
      const themeName = themeList.find(t => t.id === Number(worstTheme.id))?.name || `Theme ${worstTheme.id}`;
      worstThemeContainer.innerHTML = `
        <h4>Needs Improvement</h4>
        <div class="highlight-theme">
          <div class="theme-name">${themeName}</div>
          <div class="theme-score">${Math.round(worstTheme.avgAccuracy)}% accuracy</div>
        </div>
      `;
    } else {
      worstThemeContainer.innerHTML = '<p class="no-data">Complete more quizzes to see areas for improvement.</p>';
    }
  }
};

QuizUI.prototype.renderQuizHistory = function(history) {
  const historyList = this.dom.stats.historyList;
  if (!historyList) { console.error("History list container not found."); return; }
  
  if (!history || history.length === 0) {
    historyList.innerHTML = '<p class="no-data">No quiz history available yet. Complete quizzes to see your history.</p>';
    return;
  }
  
  // Get last 5 quizzes completed
  const recentHistory = history.slice(0, 5);
  
  historyList.innerHTML = '<h4>Recent Quizzes</h4>';
  const historyTable = document.createElement('table');
  historyTable.className = 'history-table';
  
  // Create table header
  historyTable.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Theme</th>
        <th>Quiz</th>
        <th>Score</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  
  const tableBody = historyTable.querySelector('tbody');
  
  // Fill table with history data
  recentHistory.forEach(entry => {
    const row = document.createElement('tr');
    
    // Format the date
    const date = new Date(entry.date);
    const formattedDate = date.toLocaleDateString(); // Format based on user's locale
    
    // Format time
    const formattedTime = entry.totalTime ? formatTime(entry.totalTime) : '-';
    
    // Score class based on accuracy
    let scoreClass = '';
    if (entry.accuracy >= 80) scoreClass = 'excellent';
    else if (entry.accuracy >= 60) scoreClass = 'good';
    else if (entry.accuracy >= 40) scoreClass = 'average';
    else scoreClass = 'needs-improvement';
    
    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${entry.themeName}</td>
      <td>${entry.quizName}</td>
      <td class="${scoreClass}">${entry.score}/${entry.total} (${entry.accuracy}%)</td>
      <td>${formattedTime}</td>
    `;
    
    tableBody.appendChild(row);
  });
  
  historyList.appendChild(historyTable);
  
  // Helper function for formatting time
  function formatTime(seconds) {
    if (!seconds) return '-';
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  }
};

// ----- Quiz Play -----

QuizUI.prototype.startSelectedQuiz = async function(themeId, quizId) {
  // Show loading screen or indicator
  this._transitionScreen(this.dom.screens.loading);

  // Update current selections in quiz manager
  this.quizManager.currentThemeId = Number(themeId);
  this.quizManager.currentQuizId = Number(quizId);

  try {
    const quizData = await this.resourceManager.loadQuiz(themeId, quizId); // Use resourceManager instance

    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
      throw new Error(`Quiz data invalid or empty for theme ${themeId}, quiz ${quizId}`);
    }

    // Get theme info for display
    const themeInfo = await this._getThemeInfoFromIndex(themeId);
    
    // Initialize quiz state in manager
    this.quizManager.initializeQuiz(quizData, themeInfo);

    // Preload audio files if necessary (for listening quizzes)
    if (quizData.type === 'listening' || quizData.type === 'mixed') {
      await this.preloadQuizAudio(quizData);
    }

    // Show the quiz screen & update UI with first question
    this._transitionScreen(this.dom.screens.quiz);
    this.updateQuizUI();

    // Start timer automatically if enabled in preferences
    if (this.quizManager.timerEnabled) {
      this.startTimer();
    }
    this.updateTimerUIState(); // Update timer UI based on enabled state

  } catch (error) {
    console.error(`Error starting quiz ${quizId} for theme ${themeId}:`, error);
    this.showGlobalError(`Could not load the quiz. ${error.message}`);
    // Go back to quiz selection or theme selection
    if (typeof themeId === 'number' && themeId > 0) { 
      this.showQuizSelection(); // If we have a theme, go back to quiz selection
    } else {
      this.showWelcomeScreen(); // Otherwise, go all the way back to welcome screen
    }
  }
};

QuizUI.prototype.preloadQuizAudio = async function(quizData) {
  try {
    if (!quizData || !quizData.questions) return;

    const audioQuestions = quizData.questions.filter(q => q.audioFile);
    if (audioQuestions.length === 0) return;

    // Show audio preloading message
    if (this.dom.quiz.audioPreloadMsg) {
      this.dom.quiz.audioPreloadMsg.textContent = 'Loading audio files...';
      this.dom.quiz.audioPreloadMsg.classList.remove('hidden');
    }

    const preloadPromises = audioQuestions.map(question => {
      const audioFilePath = question.audioFile;
      // Skip if no audio file defined or already preloaded
      if (!audioFilePath) return Promise.resolve();
      
      return new Promise((resolve, reject) => {
        const audio = new Audio();
        // Track attempts - GitHub Pages can sometimes require a few attempts for assets
        let attempts = 0;
        const maxAttempts = 3;
        
        const attemptLoad = (pathVariations, index = 0) => {
          if (index >= pathVariations.length) {
            // If we've tried all path variations, increment attempts
            attempts++;
            if (attempts >= maxAttempts) {
              console.warn(`Failed to preload audio after ${maxAttempts} attempts:`, audioFilePath);
              resolve(); // Resolve anyway to not block quiz if audio fails
              return;
            }
            // Try again with the first path variation
            setTimeout(() => attemptLoad(pathVariations, 0), 500);
            return;
          }
          
          const path = pathVariations[index];
          audio.src = path;
          
          const onLoaded = () => {
            audio.removeEventListener('canplaythrough', onLoaded);
            audio.removeEventListener('error', onError);
            // Cache the successful path if different from original
            if (path !== audioFilePath) {
              question.audioFile = path; // Update the path in the quiz data
            }
            resolve();
          };
          
          const onError = () => {
            console.warn(`Failed to load audio ${path}, trying next variation...`);
            audio.removeEventListener('canplaythrough', onLoaded);
            audio.removeEventListener('error', onError);
            // Try next path variation
            attemptLoad(pathVariations, index + 1);
          };
          
          audio.addEventListener('canplaythrough', onLoaded, { once: true });
          audio.addEventListener('error', onError, { once: true });
          
          // Start loading
          audio.load();
        };
        
        // Try multiple path variations for better compatibility
        const originalPath = audioFilePath;
        const pathVariations = [
          originalPath,
          // Add path variations with proper relative paths for GitHub Pages
          originalPath.startsWith('./') ? originalPath : `./${originalPath}`,
          originalPath.startsWith('./audio/') ? originalPath : `./audio/${originalPath.replace(/^.*[\\/]/, '')}`,
          // Try alternative folders
          `./audio/${originalPath.replace(/^.*[\\/]/, '')}`,
          `./assets/audio/${originalPath.replace(/^.*[\\/]/, '')}`,
          `./js/audio/${originalPath.replace(/^.*[\\/]/, '')}`
        ];
        
        // Start the loading attempt chain
        attemptLoad(pathVariations);
      });
    });

    await Promise.all(preloadPromises);
    
    // Hide preloading message
    if (this.dom.quiz.audioPreloadMsg) {
      this.dom.quiz.audioPreloadMsg.classList.add('hidden');
    }
  } catch (error) {
    console.error("Error preloading quiz audio:", error);
    // Hide preloading message but show warning
    if (this.dom.quiz.audioPreloadMsg) {
      this.dom.quiz.audioPreloadMsg.textContent = 'Audio may not be available.';
      setTimeout(() => {
        this.dom.quiz.audioPreloadMsg.classList.add('hidden');
      }, 3000);
    }
  }
};

QuizUI.prototype.updateQuizUI = function() {
  // Updates UI based on current state in QuizManager
  
  // First clean up any existing event listeners or media elements
  this.cleanupQuestionMedia();
  
  // Get current quiz state
  const currentIndex = this.quizManager.currentQuestionIndex;
  const totalQuestions = this.quizManager.questions.length;
  const currentQuestion = this.quizManager.getCurrentQuestion();
  const questionStatus = this.quizManager.getQuestionStatus(currentIndex);
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isQuizComplete = this.quizManager.isQuizComplete();
  
  // Update question UI (prompt, options, inputs)
  this.updateQuizHeading();
  this.updateQuestionContent(currentQuestion, questionStatus);
  this.updateNavigationButtons(currentIndex, totalQuestions, isQuizComplete);
  this.updateProgressBar(currentIndex, totalQuestions);
  
  // If the quiz is complete and we're still showing the quiz screen, go to results
  if (isQuizComplete && this.quizManager.allQuestionsAnswered()) {
    this.showResults();
    return;
  }
};

QuizUI.prototype.updateQuizHeading = function() {
  // Check if DOM elements exist before updating
  if (!this.dom.quiz.title || !this.dom.quiz.subtitle) return;
  
  const themeInfo = this.quizManager.themeInfo;
  const quizInfo = this.quizManager.quizData;
  
  // Set quiz title and theme subtitle
  this.dom.quiz.title.textContent = quizInfo ? quizInfo.name || `Quiz ${quizInfo.id}` : 'Quiz';
  this.dom.quiz.subtitle.textContent = themeInfo ? themeInfo.name : '';
};

QuizUI.prototype.updateQuestionContent = function(question, status) {
  if (!question || !this.dom.quiz.question) return;
  
  const questionContainer = this.dom.quiz.question;
  // Clear previous content (except any static elements with keep-in-reset class)
  const elementsToKeep = questionContainer.querySelectorAll('.keep-in-reset');
  questionContainer.innerHTML = '';
  elementsToKeep.forEach(el => questionContainer.appendChild(el));
  
  // Create question number and prompt
  const questionHeader = document.createElement('div');
  questionHeader.className = 'question-header';
  
  const currentIndex = this.quizManager.currentQuestionIndex;
  const totalQuestions = this.quizManager.questions.length;
  
  questionHeader.innerHTML = `
    <div class="question-number">Question ${currentIndex + 1} of ${totalQuestions}</div>
    <div class="question-prompt">${question.prompt || 'Answer the question:'}</div>
  `;
  questionContainer.appendChild(questionHeader);
  
  // Create question content based on type
  const contentElement = document.createElement('div');
  contentElement.className = 'question-content';
  
  // Add CSS class based on question status (if answered)
  if (status) {
    contentElement.classList.add(status.correct ? 'correct' : 'incorrect');
  }
  
  // Handle different question types
  switch (question.type) {
    case 'multiple-choice':
      this.renderMultipleChoiceQuestion(contentElement, question, status);
      break;
    case 'fill-blank':
      this.renderFillBlankQuestion(contentElement, question, status);
      break;
    case 'matching':
      this.renderMatchingQuestion(contentElement, question, status);
      break;
    case 'listening':
      this.renderListeningQuestion(contentElement, question, status);
      break;
    default:
      contentElement.innerHTML = '<p class="error">Unknown question type</p>';
  }
  
  // If question has an explanation and was already answered, show it
  if (question.explanation && status) {
    const explanationElement = document.createElement('div');
    explanationElement.className = 'question-explanation';
    explanationElement.innerHTML = `
      <h4>${status.correct ? 'Correct!' : 'Incorrect'}</h4>
      <p>${question.explanation}</p>
    `;
    contentElement.appendChild(explanationElement);
  }
  
  // If question has feedback specific to the chosen answer, show it
  if (status && status.feedback) {
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'question-feedback';
    feedbackElement.innerHTML = `<p>${status.feedback}</p>`;
    contentElement.appendChild(feedbackElement);
  }
  
  questionContainer.appendChild(contentElement);
  
  // Add event listeners for interactive elements
  this.setupQuestionInteractions(question.type, status);
};

QuizUI.prototype.renderMultipleChoiceQuestion = function(container, question, status) {
  if (!question.options || question.options.length === 0) {
    container.innerHTML = '<p class="error">No options available for this question</p>';
    return;
  }
  
  const optionsElement = document.createElement('div');
  optionsElement.className = 'question-options';
  
  // Keep track of the selected option
  const selectedOption = status ? status.userAnswer : null;
  const correctOption = question.answer;
  const isAnswered = status !== null;
  
  // Create list of options
  const optionsList = document.createElement('div');
  optionsList.className = 'options-list';
  
  question.options.forEach((option, index) => {
    const optionElement = document.createElement('div');
    optionElement.className = 'option-item';
    optionElement.setAttribute('data-index', index);
    
    // If question is already answered, show correct/incorrect styling
    if (isAnswered) {
      if (index === correctOption) {
        optionElement.classList.add('correct-option');
      }
      if (index === selectedOption && index !== correctOption) {
        optionElement.classList.add('incorrect-option');
      }
    }
    
    // Set selected state
    if (index === selectedOption) {
      optionElement.classList.add('selected');
    }
    
    // Create option content
    optionElement.innerHTML = `
      <div class="option-marker">${String.fromCharCode(65 + index)}</div>
      <div class="option-text">${option}</div>
    `;
    
    optionsList.appendChild(optionElement);
  });
  
  optionsElement.appendChild(optionsList);
  container.appendChild(optionsElement);
  
  // If question is not answered yet, add submit button
  if (!isAnswered) {
    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-primary submit-answer disabled';
    submitButton.setAttribute('disabled', true);
    submitButton.textContent = 'Submit Answer';
    container.appendChild(submitButton);
    
    // Store reference to submit button for event handling
    this.dom.quiz.submitAnswerBtn = submitButton;
  }
};

QuizUI.prototype.renderFillBlankQuestion = function(container, question, status) {
  if (!question.template) {
    container.innerHTML = '<p class="error">No template provided for this fill-in-the-blank question</p>';
    return;
  }
  
  const contentElement = document.createElement('div');
  contentElement.className = 'fill-blank-content';
  
  // Get user's previous answer if any
  const userAnswer = status ? status.userAnswer : '';
  const correctAnswer = question.answer;
  const isAnswered = status !== null;
  
  // Create input field within template
  let template = question.template;
  
  if (isAnswered) {
    // If already answered, show the answer with styling
    const answerClass = status.correct ? 'correct-answer' : 'incorrect-answer';
    template = template.replace(/\{blank\}/g, `<span class="${answerClass}">${userAnswer}</span>`);
    
    // If incorrect, show correct answer
    if (!status.correct) {
      template += `<div class="correct-answer-display">Correct answer: <strong>${correctAnswer}</strong></div>`;
    }
  } else {
    // If not answered, show input field
    template = template.replace(/\{blank\}/g, '<input type="text" class="fill-blank-input" placeholder="Type your answer">');
  }
  
  contentElement.innerHTML = template;
  container.appendChild(contentElement);
  
  // If question is not answered yet, add submit button
  if (!isAnswered) {
    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-primary submit-answer disabled';
    submitButton.setAttribute('disabled', true);
    submitButton.textContent = 'Submit Answer';
    container.appendChild(submitButton);
    
    // Store reference for event handling
    this.dom.quiz.submitAnswerBtn = submitButton;
    
    // Get reference to input field for event handling
    this.dom.quiz.fillBlankInput = contentElement.querySelector('.fill-blank-input');
  }
};

QuizUI.prototype.renderMatchingQuestion = function(container, question, status) {
  if (!question.pairs || question.pairs.length === 0) {
    container.innerHTML = '<p class="error">No matching pairs available for this question</p>';
    return;
  }
  
  const matchingElement = document.createElement('div');
  matchingElement.className = '