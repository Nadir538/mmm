/**
 * Dashboard Main Script
 */

import { getCurrentUser } from './utils/auth.js';
import { initTheme, toggleTheme } from './utils/theme.js';
import { getUserProgress, calculateProgress } from './utils/progress.js';
import { showToast } from './utils/animations.js';

class Dashboard {
  constructor() {
    this.chapters = [];
    this.currentUser = null;
    this.init();
  }

  async init() {
    // Проверка авторизации
    this.checkAuth();
    
    // Инициализация темы
    initTheme();
    
    // Загрузка данных
    await this.loadChapters();
    
    // Рендер компонентов
    this.renderChapters();
    
    // Подключение событий
    this.attachEvents();
    
    // Приветствие
    this.showWelcome();
  }

  /**
   * Проверка авторизации
   */
  checkAuth() {
    this.currentUser = getCurrentUser();
    
    if (!this.currentUser) {
      showToast('Необходима авторизация', 'error');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    }
  }

  /**
   * Загрузка глав
   */
  async loadChapters() {
    try {
      const response = await fetch('./js/config/chapters-config.json');
      const data = await response.json();
      this.chapters = data.chapters;
      
      // Обновить прогресс из localStorage
      const userProgress = getUserProgress();
      this.chapters.forEach(chapter => {
        const progress = userProgress[chapter.id];
        if (progress) {
          chapter.completedQuestions = progress.completedQuestions;
        }
      });
    } catch (error) {
      console.error('Failed to load chapters:', error);
      showToast('Ошибка загрузки данных', 'error');
    }
  }

  /**
   * Рендер карточек глав
   */
  renderChapters() {
    const container = document.getElementById('chapters-grid');
    
    if (!container) return;
    
    container.innerHTML = this.chapters
      .map(chapter => this.createChapterCard(chapter))
      .join('');
  }

  /**
   * Создать карточку главы
   */
  createChapterCard(chapter) {
    const progressPercent = calculateProgress(
      chapter.completedQuestions,
      chapter.totalQuestions
    );
    
    const isCompleted = chapter.completedQuestions === chapter.totalQuestions;
    const lockedClass = chapter.locked ? 'locked' : '';
    
    return `
      <article 
        class="chapter-card ${lockedClass}" 
        data-chapter-id="${chapter.id}"
        tabindex="0"
        role="button"
        aria-label="${chapter.title}"
      >
        <!-- Background Image -->
        <img 
          src="${chapter.image}" 
          alt="${chapter.title}"
          class="card-image"
          loading="lazy"
        />
        
        <!-- Gradient Overlay -->
        <div class="card-overlay"></div>
        
        <!-- Completed Badge -->
        ${isCompleted ? `
          <div class="card-completed-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>Завершено</span>
          </div>
        ` : ''}
        
        <!-- Lock Badge -->
        ${chapter.locked ? `
          <div class="card-lock-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
        ` : ''}
        
        <!-- Content -->
        <div class="card-content">
          <h3 class="card-title">${chapter.title}</h3>
          
          <div class="card-progress">
            <svg class="progress-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>Отвечено на вопросы: ${chapter.completedQuestions}/${chapter.totalQuestions}</span>
          </div>
          
          <!-- Progress Bar -->
          <div class="progress-bar-container">
            <div 
              class="progress-bar-fill" 
              style="width: ${progressPercent}%"
              aria-valuenow="${progressPercent}"
              aria-valuemin="0"
              aria-valuemax="100"
              role="progressbar"
            ></div>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Подключение событий
   */
  attachEvents() {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const newTheme = toggleTheme();
        showToast(
          `Тема изменена на ${newTheme === 'dark' ? 'темную' : 'светлую'}`,
          'info',
          1500
        );
      });
    }

    // Settings Button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        showToast('Настройки (в разработке)', 'info');
      });
    }

    // Chapter Cards
    const chapterCards = document.querySelectorAll('.chapter-card');
    chapterCards.forEach(card => {
      card.addEventListener('click', this.handleChapterClick.bind(this));
      card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleChapterClick(e);
        }
      });
    });

    // Dock Navigation
    const dockItems = document.querySelectorAll('.dock-item');
    dockItems.forEach(item => {
      item.addEventListener('click', this.handleDockNavigation.bind(this));
    });
  }

  /**
   * Обработчик клика по главе
   */
  handleChapterClick(event) {
    const card = event.currentTarget;
    const chapterId = card.dataset.chapterId;
    const chapter = this.chapters.find(c => c.id === chapterId);

    if (!chapter) return;

    if (chapter.locked) {
      showToast('Эта глава пока заблокирована', 'warning');
      return;
    }

    showToast(`Переход к главе: ${chapter.title}`, 'info');
    
    // TODO: Навигация к странице главы
    console.log('Opening chapter:', chapter);
  }

  /**
   * Обработчик навигации Dock
   */
  handleDockNavigation(event) {
    const button = event.currentTarget;
    const page = button.dataset.page;

    // Убрать активное состояние со всех
    document.querySelectorAll('.dock-item').forEach(item => {
      item.classList.remove('active');
      item.removeAttribute('aria-current');
    });

    // Установить активное состояние
    button.classList.add('active');
    button.setAttribute('aria-current', 'page');

    // Навигация
    switch (page) {
      case 'chapters':
        // Уже на странице глав
        break;
      case 'map':
        showToast('Карта (в разработке)', 'info');
        break;
      case 'feed':
        showToast('Лента новостей (в разработке)', 'info');
        break;
      case 'profile':
        showToast('Профиль (в разработке)', 'info');
        break;
    }
  }

  /**
   * Приветствие пользователя
   */
  showWelcome() {
    if (this.currentUser) {
      setTimeout(() => {
        showToast(
          `Добро пожаловать, ${this.currentUser.username}!`,
          'success',
          2500
        );
      }, 500);
    }
  }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});