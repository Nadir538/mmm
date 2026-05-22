/**
 * Episode Page Main Script
 *
 * Логика страницы эпизода истории:
 * 1. Загружает JSON-историю главы из ./js/config/{chapter}-story.json
 * 2. Показывает текст эпизода (story-section)
 * 3. По кнопке "Перейти к вопросам" — открывает викторину
 * 4. Проверяет ответы, показывает explanation и funFact
 * 5. По завершении эпизода — сохраняет прогресс и предлагает следующий
 *
 * URL параметры:
 *   ?chapter=hermitage&episode=episode-1
 */

import { initTheme, toggleTheme } from './utils/theme.js';
import { saveEpisodeProgress, getUserProgress } from './utils/progress.js';
import { showToast } from './utils/animations.js';

/**
 * Маппинг chapterId (из chapters-config.json) -> имя JSON-файла истории.
 * В разных файлах используются разные имена, поэтому централизованный маппинг.
 */
const CHAPTER_TO_STORY_FILE = {
  'hermitage': 'hermitage-story.json',
  'isaac-cathedral': 'isaac-story.json',
  'savior-on-blood': 'savior-story.json',
  'peterhof': 'peterhof-story.json'
};

/**
 * Главный класс страницы эпизода
 */
class EpisodePage {
  constructor() {
    this.chapterId = null;        // ID главы из URL (например, 'hermitage')
    this.episodeId = null;        // ID эпизода из URL (например, 'episode-1')
    this.storyData = null;        // Полные данные истории (JSON)
    this.currentEpisode = null;   // Текущий эпизод
    this.episodeIndex = -1;       // Индекс эпизода в массиве
    this.questions = [];          // Массив вопросов текущего эпизода
    this.currentQuestionIndex = 0;
    this.correctAnswersCount = 0;
    this.episodeScore = 0;
    this.userAnswers = [];        // История ответов пользователя
    this.showingStory = true;     // Показываем историю или вопросы
  }

  /**
   * Инициализация
   */
  async init() {
    // 1. Тема
    initTheme();

    // 2. Получить параметры URL
    if (!this.parseUrlParams()) {
      this.showError('Некорректные параметры URL. Возврат на главную...');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
      return;
    }

    // 3. Загрузить данные
    try {
      await this.loadStoryData();
    } catch (error) {
      console.error('Failed to load story:', error);
      this.showError('Не удалось загрузить историю. Попробуйте позже.');
      return;
    }

    // 4. Найти эпизод
    if (!this.findCurrentEpisode()) {
      this.showError('Эпизод не найден');
      return;
    }

    // 5. Рендер шапки и истории
    this.renderHeader();
    this.renderStory();

    // 6. События
    this.setupEventListeners();
  }

  /**
   * Парсит ?chapter=... &episode=... из URL
   */
  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    this.chapterId = params.get('chapter');
    this.episodeId = params.get('episode');

    if (!this.chapterId || !this.episodeId) {
      return false;
    }

    if (!CHAPTER_TO_STORY_FILE[this.chapterId]) {
      console.warn('Unknown chapterId:', this.chapterId);
      return false;
    }

    return true;
  }

  /**
   * Загружает JSON истории из соответствующего файла
   */
  async loadStoryData() {
    const fileName = CHAPTER_TO_STORY_FILE[this.chapterId];
    const url = `./js/config/${fileName}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} loading ${url}`);
    }

    this.storyData = await response.json();
  }

  /**
   * Ищет текущий эпизод в загруженных данных
   */
  findCurrentEpisode() {
    if (!this.storyData?.episodes) return false;

    this.episodeIndex = this.storyData.episodes.findIndex(
      ep => ep.id === this.episodeId
    );

    if (this.episodeIndex === -1) return false;

    this.currentEpisode = this.storyData.episodes[this.episodeIndex];
    this.questions = this.currentEpisode.questions || [];
    return true;
  }

  /**
   * Рендер заголовка страницы
   */
  renderHeader() {
    const chapterTitleEl = document.getElementById('chapter-title');
    const progressTextEl = document.getElementById('episode-progress-text');

    if (chapterTitleEl) {
      chapterTitleEl.textContent = this.storyData.title;
    }

    if (progressTextEl) {
      const total = this.storyData.totalEpisodes || this.storyData.episodes.length;
      progressTextEl.textContent = `Эпизод ${this.currentEpisode.number} из ${total}`;
    }

    // Прогресс бар - оцениваем как % от пройденного эпизода
    this.updateProgressBar(0);

    // Title документа
    document.title = `${this.currentEpisode.title} | Петербургский кодекс`;
  }

  /**
   * Обновляет полосу прогресса в шапке
   * @param {number} percentInEpisode — 0..100 — процент внутри эпизода
   */
  updateProgressBar(percentInEpisode) {
    const bar = document.getElementById('progress-bar-fill');
    if (!bar) return;

    const totalEp = this.storyData.totalEpisodes || this.storyData.episodes.length;
    // Базовый прогресс — сколько эпизодов уже пройдено
    const baseProgress = (this.episodeIndex / totalEp) * 100;
    // Доп. процент за прогресс внутри текущего эпизода
    const inEpisode = (percentInEpisode / 100) * (100 / totalEp);
    const total = Math.min(100, baseProgress + inEpisode);
    bar.style.width = total + '%';
  }

  /**
   * Рендер секции "История эпизода"
   */
  renderStory() {
    const storyCard = document.getElementById('story-card');
    if (!storyCard) return;

    const ep = this.currentEpisode;

    // Разбиваем длинный текст на абзацы (по пустым строкам или по точкам)
    const paragraphs = this.formatStoryText(ep.story);

    // Подготовим изображение
    const imageHtml = ep.storyImage
      ? `
        <div class="story-image-wrapper">
          <img src="${this.escapeHtml(ep.storyImage)}" alt="${this.escapeHtml(ep.title)}" class="story-image" loading="lazy"/>
          <div class="story-image-overlay"></div>
        </div>
      `
      : '';

    // Метаданные
    const metaTags = [];
    if (ep.character) {
      metaTags.push(`
        <span class="meta-tag">
          <span class="meta-tag-icon">👤</span>
          <span>${this.escapeHtml(ep.character)}</span>
        </span>
      `);
    }
    if (ep.timeperiod) {
      metaTags.push(`
        <span class="meta-tag">
          <span class="meta-tag-icon">📅</span>
          <span>${this.escapeHtml(ep.timeperiod)}</span>
        </span>
      `);
    }
    if (ep.duration) {
      metaTags.push(`
        <span class="meta-tag">
          <span class="meta-tag-icon">⏱️</span>
          <span>${this.escapeHtml(ep.duration)}</span>
        </span>
      `);
    }
    if (ep.difficulty) {
      const diffLabel = this.getDifficultyLabel(ep.difficulty);
      metaTags.push(`
        <span class="meta-tag">
          <span class="meta-tag-icon">⚡</span>
          <span>${diffLabel}</span>
        </span>
      `);
    }

    storyCard.innerHTML = `
      ${imageHtml}
      <div class="story-content">
        <header class="story-header">
          <div class="story-icon">${ep.icon || '📖'}</div>
          <span class="story-episode-number">Эпизод ${ep.number}</span>
          <h2 class="story-title">${this.escapeHtml(ep.title)}</h2>
          ${ep.subtitle ? `<p class="story-subtitle">${this.escapeHtml(ep.subtitle)}</p>` : ''}
          ${metaTags.length ? `<div class="story-meta">${metaTags.join('')}</div>` : ''}
        </header>

        <div class="story-text">
          ${paragraphs.map(p => `<p>${this.escapeHtml(p)}</p>`).join('')}
        </div>
      </div>
    `;

    // Показать кнопку "Перейти к вопросам"
    const startBtn = document.getElementById('start-quiz-btn');
    if (startBtn) {
      startBtn.style.display = 'inline-flex';
    }

    this.showingStory = true;
  }

  /**
   * Разбивает story-текст на смысловые абзацы.
   * Поскольку в JSON текст обычно одной строкой — режем по двойным переносам
   * или, если их нет, — по предложениям, склеивая по 3-4.
   */
  formatStoryText(text) {
    if (!text) return [];

    // 1) Если есть двойные переносы — используем их
    if (text.includes('\n\n')) {
      return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    }

    // 2) Если есть одиночные \n — каждый параграф
    if (text.includes('\n')) {
      return text.split(/\n+/).map(p => p.trim()).filter(Boolean);
    }

    // 3) Иначе бьём по предложениям и группируем по 3
    const sentences = text.match(/[^.!?]+[.!?]+["»]?(\s|$)/g);
    if (!sentences || sentences.length < 4) {
      return [text];
    }

    const paragraphs = [];
    const groupSize = Math.ceil(sentences.length / Math.min(4, Math.max(2, Math.floor(sentences.length / 3))));

    for (let i = 0; i < sentences.length; i += groupSize) {
      paragraphs.push(sentences.slice(i, i + groupSize).join('').trim());
    }

    return paragraphs;
  }

  /**
   * Перевод difficulty в человекочитаемый текст
   */
  getDifficultyLabel(diff) {
    const map = {
      'easy': 'Лёгкий',
      'medium': 'Средний',
      'hard': 'Сложный'
    };
    return map[diff] || diff;
  }

  /**
   * Переключение story-section -> questions-section
   */
  showQuestions() {
    const storySection = document.getElementById('story-section');
    const questionsSection = document.getElementById('questions-section');
    const startBtn = document.getElementById('start-quiz-btn');
    const navFooter = document.querySelector('.episode-nav');

    if (storySection) storySection.style.display = 'none';
    if (questionsSection) questionsSection.style.display = 'block';
    if (startBtn) startBtn.style.display = 'none';
    if (navFooter) navFooter.classList.add('hidden');

    this.showingStory = false;

    // Прокрутить наверх
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Рендер первого вопроса
    this.currentQuestionIndex = 0;
    this.correctAnswersCount = 0;
    this.episodeScore = 0;
    this.userAnswers = [];
    this.renderCurrentQuestion();
  }

  /**
   * Рендер текущего вопроса (заменяет QuizCard, который не существует в проекте)
   */
  renderCurrentQuestion() {
    const question = this.questions[this.currentQuestionIndex];
    if (!question) {
      this.finishEpisode();
      return;
    }

    // Счётчик
    const counterCurrent = document.querySelector('.counter-current');
    const counterTotal = document.querySelector('.counter-total');
    if (counterCurrent) counterCurrent.textContent = this.currentQuestionIndex + 1;
    if (counterTotal) counterTotal.textContent = this.questions.length;

    // Прогресс
    const progressInEpisode = ((this.currentQuestionIndex) / this.questions.length) * 100;
    this.updateProgressBar(progressInEpisode);

    // Контейнер вопроса
    const quizCard = document.getElementById('quiz-card');
    if (!quizCard) return;

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    quizCard.innerHTML = `
      <h2 class="quiz-question">${this.escapeHtml(question.question)}</h2>
      ${question.hint ? `
        <div class="quiz-hint">
          <span>💡</span>
          <span>${this.escapeHtml(question.hint)}</span>
        </div>
      ` : ''}
      <div class="quiz-answers" role="radiogroup" aria-label="Варианты ответа">
        ${question.answers.map((answer, idx) => `
          <button
            class="quiz-answer-btn"
            data-answer-id="${this.escapeHtml(answer.id)}"
            role="radio"
            aria-checked="false"
          >
            <span class="answer-letter">${letters[idx] || (idx + 1)}</span>
            <span class="answer-text">${this.escapeHtml(answer.text)}</span>
          </button>
        `).join('')}
      </div>
    `;

    // Скрыть feedback и next button
    const feedbackArea = document.getElementById('feedback-area');
    const nextBtn = document.getElementById('next-question-btn');
    if (feedbackArea) {
      feedbackArea.style.display = 'none';
      feedbackArea.innerHTML = '';
    }
    if (nextBtn) nextBtn.style.display = 'none';

    // Слушатели на ответы
    quizCard.querySelectorAll('.quiz-answer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const answerId = e.currentTarget.dataset.answerId;
        this.handleAnswer(answerId);
      });
    });
  }

  /**
   * Обработка ответа пользователя
   */
  handleAnswer(answerId) {
    const question = this.questions[this.currentQuestionIndex];
    if (!question) return;

    const isCorrect = answerId === question.correctAnswer;

    // Сохранить ответ
    this.userAnswers.push({
      questionId: question.id,
      selected: answerId,
      isCorrect: isCorrect
    });

    if (isCorrect) {
      this.correctAnswersCount += 1;
      this.episodeScore += (question.points || 10);
    }

    // Обновить визуальное состояние кнопок
    const allBtns = document.querySelectorAll('.quiz-answer-btn');
    allBtns.forEach(btn => {
      btn.disabled = true;
      const btnId = btn.dataset.answerId;

      if (btnId === answerId) {
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
      }

      // Если ответ неверен — подсветить правильный
      if (!isCorrect && btnId === question.correctAnswer) {
        btn.classList.add('highlight-correct');
      }
    });

    // Показать feedback
    this.showFeedback(question, isCorrect);

    // Показать кнопку "Следующий"
    const nextBtn = document.getElementById('next-question-btn');
    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      // Текст для последнего вопроса
      if (this.currentQuestionIndex === this.questions.length - 1) {
        nextBtn.innerHTML = `
          Завершить эпизод
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        `;
      }
    }

    // Toast уведомление
    if (isCorrect) {
      showToast(`Правильно! +${question.points || 10} баллов`, 'success', 2000);
    } else {
      showToast('Неверно. Изучите объяснение ниже.', 'error', 2500);
    }
  }

  /**
   * Показывает блок с пояснением и интересным фактом
   */
  showFeedback(question, isCorrect) {
    const feedbackArea = document.getElementById('feedback-area');
    if (!feedbackArea) return;

    const className = isCorrect ? 'feedback-correct' : 'feedback-wrong';
    const icon = isCorrect ? '✓' : '✕';
    const title = isCorrect ? 'Верно!' : 'Не совсем';

    feedbackArea.className = `feedback-area ${className}`;
    feedbackArea.innerHTML = `
      <div class="feedback-header">
        <div class="feedback-icon">${icon}</div>
        <h3 class="feedback-title">${title}</h3>
      </div>
      <p class="feedback-explanation">${this.escapeHtml(question.explanation || '')}</p>
      ${question.funFact ? `
        <div class="feedback-funfact">
          <span class="feedback-funfact-label">💡 Интересный факт</span>
          <div>${this.escapeHtml(question.funFact)}</div>
        </div>
      ` : ''}
    `;
    feedbackArea.style.display = 'block';

    // Прокрутка к feedback
    setTimeout(() => {
      feedbackArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  /**
   * Перейти к следующему вопросу
   */
  nextQuestion() {
    this.currentQuestionIndex += 1;
    if (this.currentQuestionIndex >= this.questions.length) {
      this.finishEpisode();
    } else {
      this.renderCurrentQuestion();
      // Прокрутить наверх
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Завершение эпизода: результаты, сохранение прогресса, навигация
   */
  finishEpisode() {
    // Сохранить прогресс
    saveEpisodeProgress(this.chapterId, this.episodeId, this.episodeScore);

    // Полный прогресс эпизода = 100%
    this.updateProgressBar(100);

    // Скрыть вопросы, показать результаты
    const questionsSection = document.getElementById('questions-section');
    const resultsSection = document.getElementById('results-section');

    if (questionsSection) questionsSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'block';

    // Заполнить статистику
    const totalQuestions = this.questions.length;
    const accuracy = totalQuestions
      ? Math.round((this.correctAnswersCount / totalQuestions) * 100)
      : 0;

    document.getElementById('stat-correct').textContent = `${this.correctAnswersCount}/${totalQuestions}`;
    document.getElementById('stat-score').textContent = this.episodeScore;
    document.getElementById('stat-accuracy').textContent = accuracy + '%';

    // Подзаголовок в зависимости от результата
    const subtitle = document.getElementById('results-subtitle');
    if (subtitle) {
      if (accuracy === 100) {
        subtitle.textContent = 'Безупречно! Вы — настоящий знаток.';
      } else if (accuracy >= 75) {
        subtitle.textContent = 'Отличный результат! Продолжайте в том же духе.';
      } else if (accuracy >= 50) {
        subtitle.textContent = 'Хороший результат. Перечитайте материал для закрепления.';
      } else {
        subtitle.textContent = 'Не расстраивайтесь. Знания приходят с опытом!';
      }
    }

    // Если это последний эпизод — показать эпилог
    const isLastEpisode = this.episodeIndex === this.storyData.episodes.length - 1;
    if (isLastEpisode && this.storyData.epilogue) {
      this.renderEpilogue();
    }

    // Настроить кнопку "Следующий эпизод"
    const nextEpisodeBtn = document.getElementById('next-episode-btn');
    const nextLabel = document.getElementById('next-episode-label');

    if (isLastEpisode) {
      // Финал — кнопка для возврата на карту
      if (nextLabel) nextLabel.textContent = 'Завершить главу';
      if (nextEpisodeBtn) {
        nextEpisodeBtn.onclick = () => this.goToChapterPath();
      }
    } else {
      const nextEpisode = this.storyData.episodes[this.episodeIndex + 1];
      if (nextLabel) nextLabel.textContent = 'Следующий эпизод';
      if (nextEpisodeBtn) {
        nextEpisodeBtn.onclick = () => this.goToNextEpisode(nextEpisode.id);
      }
    }

    // Прокрутить наверх
    window.scrollTo({ top: 0, behavior: 'smooth' });

    showToast(`Эпизод пройден! +${this.episodeScore} баллов`, 'success', 3000);
  }

  /**
   * Рендер эпилога главы (для последнего эпизода)
   */
  renderEpilogue() {
    const epilogue = this.storyData.epilogue;
    const block = document.getElementById('epilogue-block');
    if (!block) return;

    document.getElementById('epilogue-title').textContent = epilogue.title || '';
    document.getElementById('epilogue-text').textContent = epilogue.story || '';
    document.getElementById('epilogue-badge').textContent = epilogue.badge || '🏆';

    const rewardEl = document.getElementById('epilogue-reward');
    if (rewardEl) {
      rewardEl.textContent = epilogue.reward
        ? `🎉 Награда: ${epilogue.reward}`
        : '';
    }

    block.style.display = 'block';
  }

  /**
   * Переход к следующему эпизоду
   */
  goToNextEpisode(nextEpisodeId) {
    const url = `episode.html?chapter=${encodeURIComponent(this.chapterId)}&episode=${encodeURIComponent(nextEpisodeId)}`;
    window.location.href = url;
  }

  /**
   * Возврат к карте пути главы (или dashboard, если chapter-path.html ещё нет)
   */
  goToChapterPath() {
    // Используем chapter-path.html если есть, иначе dashboard
    const url = `chapter-path.html?chapter=${encodeURIComponent(this.chapterId)}`;
    window.location.href = url;
  }

  /**
   * Возврат назад (кнопка в шапке)
   */
  goBack() {
    // Если на странице результаты — возвращаемся к истории
    const resultsSection = document.getElementById('results-section');
    if (resultsSection && resultsSection.style.display !== 'none') {
      this.goToChapterPath();
      return;
    }

    // Если показывается викторина — спросим подтверждение
    if (!this.showingStory) {
      if (confirm('Вы уверены, что хотите выйти? Прогресс эпизода не будет сохранён.')) {
        this.goToChapterPath();
      }
      return;
    }

    // Иначе — просто к карте
    this.goToChapterPath();
  }

  /**
   * Подключение всех обработчиков событий
   */
  setupEventListeners() {
    // Кнопка "Назад"
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.goBack());
    }

    // Toggle темы
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const newTheme = toggleTheme();
        showToast(
          `Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}`,
          'info',
          1500
        );
      });
    }

    // Кнопка "Перейти к вопросам"
    const startBtn = document.getElementById('start-quiz-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.showQuestions());
    }

    // Кнопка "Следующий вопрос"
    const nextBtn = document.getElementById('next-question-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }

    // Кнопка "К карте главы" в результатах
    const backToPathBtn = document.getElementById('back-to-path-btn');
    if (backToPathBtn) {
      backToPathBtn.addEventListener('click', () => this.goToChapterPath());
    }

    // Клавиатурные shortcuts
    document.addEventListener('keydown', (e) => {
      // Esc — назад
      if (e.key === 'Escape') {
        this.goBack();
      }
      // Enter — следующий вопрос (когда видна кнопка)
      if (e.key === 'Enter') {
        const visibleNext = document.getElementById('next-question-btn');
        if (visibleNext && visibleNext.style.display !== 'none') {
          this.nextQuestion();
        }
      }
    });
  }

  /**
   * Показывает ошибку и возвращает на dashboard
   */
  showError(message) {
    const storyCard = document.getElementById('story-card');
    if (storyCard) {
      storyCard.innerHTML = `
        <div class="story-loading">
          <p style="color: rgb(239, 68, 68); font-size: 16px;">⚠️ ${this.escapeHtml(message)}</p>
        </div>
      `;
    }
    showToast(message, 'error', 3000);
  }

  /**
   * Утилита экранирования HTML
   */
  escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }
}

// ============================================
// Инициализация при загрузке DOM
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const page = new EpisodePage();
  page.init();
});
