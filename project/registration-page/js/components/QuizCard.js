/**
 * Quiz Card Component
 * Компонент отображения квиза
 */

export const QuizCard = {
    /**
     * Рендер карточки квиза
     * @param {Object} quiz - Данные квиза
     * @returns {string} HTML строка
     */
    render(quiz = {}) {
      const normalizedQuiz = this.normalizeQuiz(quiz);
  
      return `
        <div class="quiz-card" data-correct-index="${normalizedQuiz.correctIndex}">
          ${this.renderHeader(normalizedQuiz.title, normalizedQuiz.subtitle)}
          ${this.renderQuestion(normalizedQuiz.question)}
          ${this.renderOptions(normalizedQuiz.options)}
          ${this.renderActions()}
          ${this.renderFeedback()}
        </div>
      `;
    },
  
    /**
     * Рендер заголовка квиза
     * @param {string} title - Заголовок
     * @param {string} subtitle - Подзаголовок
     * @returns {string} HTML
     */
    renderHeader(title, subtitle) {
      return `
        <div class="quiz-header">
          <h3 class="quiz-title">${this.escapeHtml(title)}</h3>
          ${subtitle ? `<p class="quiz-subtitle">${this.escapeHtml(subtitle)}</p>` : ''}
        </div>
      `;
    },
  
    /**
     * Рендер вопроса
     * @param {string} question - Текст вопроса
     * @returns {string} HTML
     */
    renderQuestion(question) {
      return `
        <p class="quiz-question">${this.escapeHtml(question)}</p>
      `;
    },
  
    /**
     * Рендер вариантов ответа
     * @param {Array} options - Список вариантов
     * @returns {string} HTML
     */
    renderOptions(options = []) {
      if (!options.length) {
        return `<p class="quiz-empty">Варианты ответа пока не добавлены</p>`;
      }
  
      return `
        <div class="quiz-options" role="radiogroup" aria-label="Варианты ответа">
          ${options
            .map(
              (option, index) => `
            <label class="quiz-option">
              <input
                type="radio"
                name="quiz-option"
                value="${index}"
                class="quiz-option-input"
              />
              <span class="quiz-option-text">${this.escapeHtml(option)}</span>
            </label>
          `
            )
            .join('')}
        </div>
      `;
    },
  
    /**
     * Рендер кнопки проверки
     * @returns {string} HTML
     */
    renderActions() {
      return `
        <div class="quiz-actions">
          <button type="button" class="quiz-submit-btn">Проверить</button>
        </div>
      `;
    },
  
    /**
     * Блок под результат
     * @returns {string} HTML
     */
    renderFeedback() {
      return `
        <div class="quiz-feedback" aria-live="polite"></div>
      `;
    },
  
    /**
     * Инициализация интерактива внутри контейнера
     * @param {HTMLElement} container - Контейнер с quiz-card
     * @param {Function} onAnswer - Колбэк результата (опционально)
     */
    bindEvents(container, onAnswer = null) {
      if (!container) return;
  
      const card = container.querySelector('.quiz-card');
      if (!card) return;
  
      const submitBtn = card.querySelector('.quiz-submit-btn');
      const feedback = card.querySelector('.quiz-feedback');
      const correctIndex = Number(card.dataset.correctIndex);
  
      if (!submitBtn || !feedback) return;
  
      submitBtn.addEventListener('click', () => {
        const selected = card.querySelector('input[name="quiz-option"]:checked');
  
        if (!selected) {
          feedback.textContent = 'Выберите вариант ответа.';
          feedback.className = 'quiz-feedback quiz-feedback-warning';
          return;
        }
  
        const selectedIndex = Number(selected.value);
        const isCorrect = selectedIndex === correctIndex;
  
        feedback.textContent = isCorrect ? 'Верно!' : 'Неверно, попробуйте еще раз.';
        feedback.className = `quiz-feedback ${isCorrect ? 'quiz-feedback-success' : 'quiz-feedback-error'}`;
  
        if (typeof onAnswer === 'function') {
          onAnswer({
            isCorrect,
            selectedIndex,
            correctIndex
          });
        }
      });
    },
  
    /**
     * Нормализация данных квиза
     * @param {Object} quiz - Данные квиза
     * @returns {Object} Нормализованные данные
     */
    normalizeQuiz(quiz = {}) {
      const options = Array.isArray(quiz.options) ? quiz.options : [];
      const fallbackCorrectIndex = 0;
      const hasValidCorrectIndex =
        Number.isInteger(quiz.correctIndex) &&
        quiz.correctIndex >= 0 &&
        quiz.correctIndex < options.length;
  
      return {
        title: quiz.title || 'Квиз',
        subtitle: quiz.subtitle || '',
        question: quiz.question || 'Вопрос не задан',
        options,
        correctIndex: hasValidCorrectIndex ? quiz.correctIndex : fallbackCorrectIndex
      };
    },
  
    /**
     * Экранирование HTML
     * @param {string} text - Текст для экранирования
     * @returns {string} Экранированный текст
     */
    escapeHtml(text) {
      if (!text) return '';
  
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };
  
  export default QuizCard;