/**
 * Chapter Path Script
 * Страница выбора эпизода внутри главы
 */

import { initTheme } from './utils/theme.js';
import { getUserProgress } from './utils/progress.js';
import { showToast } from './utils/animations.js';

const TOTAL_EPISODES = 6;

class ChapterPath {
  constructor() {
    this.chapter = null;
    this.chapterId = null;
    this.progress = null;
    this.init();
  }

  init() {
    initTheme();
    this.loadChapterData();
    this.attachEvents();
  }

  /**
   * Загружаем данные главы из URL + localStorage
   */
  loadChapterData() {
    // Получаем ID из URL: chapter-path.html?chapter=hermitage
    const params = new URLSearchParams(window.location.search);
    this.chapterId = params.get('chapter');

    if (!this.chapterId) {
      showToast('Глава не найдена', 'error');
      setTimeout(() => window.location.href = 'dashboard.html', 1500);
      return;
    }

    // Получаем данные главы из localStorage (сохранили в dashboard.js)
    const saved = localStorage.getItem('currentChapter');
    if (saved) {
      this.chapter = JSON.parse(saved);
    }

    // Получаем прогресс
    const userProgress = getUserProgress();
    this.progress = userProgress[this.chapterId] || { completedEpisodes: [] };

    // Рендерим страницу
    this.renderPage();
  }

  /**
   * Рендер всей страницы
   */
  renderPage() {
    if (this.chapter) {
      // Название и описание
      document.getElementById('chapter-name').textContent = this.chapter.title;
      document.getElementById('chapter-desc').textContent = 
        this.chapter.description || '';

      // Hero изображение
      const heroImg = document.getElementById('chapter-hero-img');
      heroImg.src = this.chapter.image;
      heroImg.alt = this.chapter.title;

      // Заголовок страницы
      document.title = `${this.chapter.title} | Петербургский кодекс`;
    }

    // Статистика
    this.renderStats();

    // Эпизоды
    this.renderEpisodes();
  }

  /**
   * Рендер статистики
   */
  renderStats() {
    const completed = (this.progress.completedEpisodes || []).length;
    const percent = Math.round((completed / TOTAL_EPISODES) * 100);

    document.getElementById('completed-count').textContent = completed;
    document.getElementById('total-count').textContent = TOTAL_EPISODES;
    document.getElementById('progress-percent').textContent = `${percent}%`;
  }

  /**
   * Рендер эпизодов
   */
  renderEpisodes() {
    const container = document.getElementById('episodes-path');
    const completedEpisodes = this.progress.completedEpisodes || [];

    let html = '';

    for (let i = 1; i <= TOTAL_EPISODES; i++) {
      const isCompleted = completedEpisodes.includes(i);
      // Эпизод доступен если: первый, или предыдущий пройден
      const isAvailable = i === 1 || completedEpisodes.includes(i - 1);
      const isLocked = !isAvailable;

      html += this.createEpisodeNode(i, isCompleted, isLocked);
    }

    container.innerHTML = html;

    // Вешаем клики
    container.querySelectorAll('.episode-node:not(.locked)').forEach(node => {
      node.addEventListener('click', () => {
        const episodeNum = parseInt(node.dataset.episode);
        this.openEpisode(episodeNum);
      });
    });
  }

  /**
   * Создать узел эпизода
   */
  createEpisodeNode(num, isCompleted, isLocked) {
    const stateClass = isCompleted ? 'completed' : isLocked ? 'locked' : 'available';

    const icon = isCompleted
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
           <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
         </svg>`
      : isLocked
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
           <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 
                    .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 
                    2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 
                    2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 
                    1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
         </svg>`
      : `<span class="episode-num">${num}</span>`;

    return `
      <div class="episode-node ${stateClass}" 
           data-episode="${num}"
           role="button"
           tabindex="${isLocked ? -1 : 0}"
           aria-label="Эпизод ${num}${isCompleted ? ' (пройден)' : isLocked ? ' (заблокирован)' : ''}">
        
        <div class="node-connector ${num === 1 ? 'first' : ''}"></div>
        
        <div class="node-circle">
          ${icon}
        </div>
        
        <div class="node-info">
          <span class="node-title">Эпизод ${num}</span>
          <span class="node-status">
            ${isCompleted ? '✓ Пройден' : isLocked ? '🔒 Заблокирован' : '▶ Начать'}
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Переход на эпизод
   */
  openEpisode(episodeNum) {
    showToast(`Загрузка эпизода ${episodeNum}...`, 'info', 800);
    
    setTimeout(() => {
      window.location.href = 
        `episode.html?chapter=${this.chapterId}&episode=${episodeNum}`;
    }, 500);
  }

  /**
   * События
   */
  attachEvents() {
    // Кнопка "Назад"
    document.getElementById('back-btn')?.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ChapterPath();
});

export default ChapterPath;