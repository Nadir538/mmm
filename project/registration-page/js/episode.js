/**
 * Episode Page - Story + Quiz Integration
 */

import { initTheme, toggleTheme } from './utils/theme.js';
import { QuizCard } from './components/QuizCard.js';
import { saveEpisodeProgress } from './utils/progress.js';
import { showToast } from './utils/animations.js';

class EpisodePage {
  constructor() {
    this.chapterId = null;
    this.episodeNum = null;      // число из URL: 1, 2, 3...
    this.episodeId = null;       // строка из JSON: "episode-1"
    this.storyData = null;
    this.currentEpisode = null;
    this.currentQuestionIndex = 0;
    this.showingStory = true;
    this.answeredQuestions = {};
    this.init();
  }

  async init() {
    try {
      initTheme();
      this.extractParams();
      await this.loadStoryData();
      this.renderHeader();
      this.renderStory();
      this.setupEventListeners();
    } catch (error) {
      console.error('Init error:', error);
      showToast('Ошибка загрузки эпизода', 'error');
    }
  }

  // ─────────────────────────────────────
  // 1. ПАРАМЕТРЫ URL
  // ─────────────────────────────────────
  extractParams() {
    const urlParams = new URLSearchParams(window.location.search);
    this.chapterId = urlParams.get('chapter');

    // Из URL приходит число: ?episode=1
    this.episodeNum = parseInt(urlParams.get('episode'), 10);

    // Формируем строку-id как в JSON: "episode-1"
    this.episodeId = `episode-${this.episodeNum}`;

    console.log('Params:', {
      chapterId: this.chapterId,
      episodeNum: this.episodeNum,
      episodeId: this.episodeId
    });

    if (!this.chapterId || isNaN(this.episodeNum)) {
      showToast('Ошибка: неверные параметры URL', 'error');
      setTimeout(() => window.location.href = 'dashboard.html', 2000);
      throw new Error('Invalid URL params');
    }
  }

  // ─────────────────────────────────────
  // 2. ЗАГРУЗКА ДАННЫХ
  // ─────────────────────────────────────
  async loadStoryData() {
    const url = `./js/config/${this.chapterId}-story.json`;
    console.log('Loading from:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: не найден файл ${url}`);
    }

    this.storyData = await response.json();

    // ✅ Ищем по строке "episode-1", "episode-2" и т.д.
    this.currentEpisode = this.storyData.episodes.find(
      ep => ep.id === this.episodeId
    );

    console.log('Found episode:', this.currentEpisode);

    if (!this.currentEpisode) {
      throw new Error(
        `Эпизод "${this.episodeId}" не найден. ` +
        `Доступные: ${this.storyData.episodes.map(e => e.id).join(', ')}`
      );
    }
  }

  // ─────────────────────────────────────
  // 3. РЕНДЕР ХЕДЕРА
  // ─────────────────────────────────────
  renderHeader() {
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value ?? '';
    };

    set('chapter-title', this.storyData.title);
    set('episode-title', this.currentEpisode.title);
    set('episode-progress',
      `Эпизод ${this.currentEpisode.number} из ${this.storyData.totalEpisodes}`
    );

    // Заголовок вкладки
    document.title =
      `${this.currentEpisode.title} | Петербургский кодекс`;
  }

  // ─────────────────────────────────────
  // 4. РЕНДЕР ИСТОРИИ
  // ─────────────────────────────────────
  renderStory() {
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value ?? '—';
    };

    set('story-icon',        this.currentEpisode.icon       || '📜');
    set('story-title',       this.currentEpisode.title);
    set('story-text',        this.currentEpisode.story);
    set('story-character',   this.currentEpisode.character  || '—');
    set('story-period',      this.currentEpisode.timeperiod || '—');
    set('story-atmosphere',  this.currentEpisode.atmosphere || '—');

    // Изображение
    const img = document.getElementById('story-image');
    if (img) {
      if (this.currentEpisode.storyImage) {
        img.src = this.currentEpisode.storyImage;
        img.alt = this.currentEpisode.title;
        img.style.display = '';
      } else {
        img.style.display = 'none';
      }
    }
  }

  // ─────────────────────────────────────
  // 5. СОБЫТИЯ
  // ─────────────────────────────────────
  setupEventListeners() {
    document.getElementById('back-btn')
      ?.addEventListener('click', () => {
        window.location.href =
          `chapter-path.html?chapter=${this.chapterId}`;
      });

    document.getElementById('theme-toggle')
      ?.addEventListener('click', () => toggleTheme());

    document.getElementById('start-questions-btn')
      ?.addEventListener('click', () => this.showQuestions());

    document.getElementById('prev-question-btn')
      ?.addEventListener('click', () => this.prevQuestion());

    document.getElementById('next-question-btn')
      ?.addEventListener('click', () => this.goNextQuestion());
  }

  // ─────────────────────────────────────
  // 6. ПОКАЗ ВОПРОСОВ
  // ─────────────────────────────────────
  showQuestions() {
    this.showingStory = false;

    document.getElementById('story-section').style.display    = 'none';
    document.getElementById('questions-section').style.display = 'block';
    document.getElementById('episode-nav').style.display      = 'none';

    this.renderQuestion();
  }

  renderQuestion() {
    const questions = this.currentEpisode.questions;
    const question  = questions[this.currentQuestionIndex];
    const container = document.getElementById('quiz-container');

    if (!question || !container) return;

    const answered = this.answeredQuestions[this.currentQuestionIndex];
    container.innerHTML = QuizCard.render(question, answered);

    this.updateQuestionNav();
  }

  updateQuestionNav() {
    const total   = this.currentEpisode.questions.length;
    const isFirst = this.currentQuestionIndex === 0;
    const isLast  = this.currentQuestionIndex === total - 1;
    const answered = !!this.answeredQuestions[this.currentQuestionIndex];

    const prevBtn = document.getElementById('prev-question-btn');
    const nextBtn = document.getElementById('next-question-btn');

    if (prevBtn) prevBtn.disabled = isFirst;

    if (nextBtn) {
      // Кнопка "Далее" активна только после ответа
      nextBtn.disabled = !answered;

      nextBtn.textContent = isLast
        ? 'Завершить эпизод'
        : 'Далее →';
    }
  }

  goNextQuestion() {
    const total  = this.currentEpisode.questions.length;
    const isLast = this.currentQuestionIndex === total - 1;

    if (isLast) {
      this.finishEpisode();
    } else {
      this.currentQuestionIndex++;
      this.renderQuestion();
    }
  }

  prevQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.renderQuestion();
    }
  }

  // ─────────────────────────────────────
  // 7. ОТВЕТ НА ВОПРОС
  // ─────────────────────────────────────
  handleAnswer(answerId) {
    // Повторный клик — игнорируем
    if (this.answeredQuestions[this.currentQuestionIndex]) return;

    const question  = this.currentEpisode.questions[this.currentQuestionIndex];
    const isCorrect = answerId === question.correctAnswer;

    // Сохраняем ответ
    this.answeredQuestions[this.currentQuestionIndex] = {
      answerId,
      isCorrect
    };

    // Подсветка
    this.highlightAnswers(answerId, question.correctAnswer);

    // Toast
    showToast(
      isCorrect ? '✅ Правильно!' : `❌ Неверно! Правильный ответ: ${question.correctAnswer}`,
      isCorrect ? 'success' : 'error',
      2500
    );

    // Разблокируем "Далее"
    setTimeout(() => this.updateQuestionNav(), 300);
  }

  highlightAnswers(selectedId, correctId) {
    document.querySelectorAll('.quiz-answer-btn').forEach(btn => {
      const btnId = btn.dataset.answerId;

      if (btnId === correctId) {
        btn.classList.add('correct');          // зелёный
      } else if (btnId === selectedId) {
        btn.classList.add('incorrect');        // красный
      }

      btn.disabled = true;
    });
  }

  // ─────────────────────────────────────
  // 8. ЗАВЕРШЕНИЕ ЭПИЗОДА
  // ─────────────────────────────────────
  finishEpisode() {
    const questions     = this.currentEpisode.questions;
    const correctCount  = Object.values(this.answeredQuestions)
                            .filter(a => a.isCorrect).length;
    const totalQuestions = questions.length;
    const maxScore      = questions.reduce((s, q) => s + (q.points || 10), 0);
    const earnedScore   = Math.round((correctCount / totalQuestions) * maxScore);

    // Сохраняем прогресс (передаём число!)
    saveEpisodeProgress(this.chapterId, this.episodeNum, earnedScore);

    showToast(
      `🏆 Эпизод завершён! ${correctCount}/${totalQuestions} верных. +${earnedScore} баллов`,
      'success',
      3000
    );

    setTimeout(() => {
      const nextNum     = this.episodeNum + 1;
      const hasNext     = nextNum <= this.storyData.totalEpisodes;

      if (hasNext) {
        window.location.href =
          `episode.html?chapter=${this.chapterId}&episode=${nextNum}`;
      } else {
        window.location.href =
          `chapter-path.html?chapter=${this.chapterId}`;
      }
    }, 2500);
  }
}

// ─────────────────────────────────────
// EVENT DELEGATION — клики по ответам
// ─────────────────────────────────────
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.quiz-answer-btn');
  if (!btn) return;

  const ep = window.episodePageInstance;
  if (ep && !ep.showingStory) {
    ep.handleAnswer(btn.dataset.answerId);
  }
});

// ─────────────────────────────────────
// СТАРТ
// ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.episodePageInstance = new EpisodePage();
});