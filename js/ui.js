/* ui.js – version complète générée automatiquement (base simplifiée + compléments) */
// Voir assistant pour détails : inclut showWelcomeScreen, renderThemesSimple, _createQuizElement terminé, etc.


-clock"></i> ${minutes}m ${seconds}s</span>`;
  }

  let statusHTML = '';
  if (statusText || dateCompletedText || timeText) {
    statusHTML = `
      <div class="item-status ${statusClass}">
        ${statusText ? `<span class="status-text">${statusText}</span>` : ''}
        ${dateCompletedText}
        ${timeText}
      </div>
    `;
  }

  quizElement.setAttribute('aria-label', accessibilityLabel);
  quizElement.innerHTML = `
    <div class="item-icon">${icon}</div>
    <div class="item-content">
      <h3>${quiz.name}</h3>
      <p>${quiz.description || 'Testez vos connaissances sur ce thème.'}</p>
      ${statusHTML}
    </div>
    <div class="item-action" aria-hidden="true">
      ${(quiz.progress && !quiz.progress.completed) ? 'Reprendre' : 'Commencer'} <i class="fas fa-arrow-right"></i>
    </div>
  `;

  return quizElement;
};
