/**
 * Progress Management Utility
 * Управление прогрессом пользователя
 */

const PROGRESS_KEY = 'spb_progress';

/**
 * Получить прогресс пользователя
 */
export function getUserProgress() {
  const progress = localStorage.getItem(PROGRESS_KEY);
  
  if (progress) {
    return JSON.parse(progress);
  }
  
  return {};
}

/**
 * Сохранить прогресс
 */
export function saveProgress(chapterId, completedQuestions) {
  const progress = getUserProgress();
  
  progress[chapterId] = {
    completedQuestions,
    lastUpdated: new Date().toISOString()
  };
  
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

/**
 * Получить прогресс главы
 */
export function getChapterProgress(chapterId) {
  const progress = getUserProgress();
  return progress[chapterId] || { completedQuestions: 0 };
}

/**
 * Сбросить весь прогресс
 */
export function resetAllProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}

/**
 * Вычислить процент завершения
 */
export function calculateProgress(completed, total) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}