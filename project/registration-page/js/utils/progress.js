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
    try {
      return JSON.parse(progress);
    } catch (e) {
      console.warn('Corrupted progress data, resetting...');
      return {};
    }
  }

  return {};
}

/**
 * Сохранить прогресс (старая логика — для совместимости)
 */
export function saveProgress(chapterId, completedQuestions) {
  const progress = getUserProgress();

  // Сохраняем количество ответов, но НЕ перезаписываем completedEpisodes
  if (!progress[chapterId]) {
    progress[chapterId] = {};
  }

  progress[chapterId].completedQuestions = completedQuestions;
  progress[chapterId].lastUpdated = new Date().toISOString();

  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

/**
 * Получить прогресс главы
 */
export function getChapterProgress(chapterId) {
  const progress = getUserProgress();
  return progress[chapterId] || {
    completedQuestions: 0,
    completedEpisodes: [],
    totalScore: 0
  };
}

/**
 * Сохранить прогресс эпизода
 *
 * @param {string} chapterId  - идентификатор главы (например, 'hermitage')
 * @param {string} episodeId  - идентификатор эпизода (например, 'episode-1')
 * @param {number} score      - количество баллов, полученных за эпизод
 */
export function saveEpisodeProgress(chapterId, episodeId, score) {
  const progress = getUserProgress();

  // Инициализация структуры главы, если она ещё не создана
  if (!progress[chapterId]) {
    progress[chapterId] = {
      completedEpisodes: [],
      totalScore: 0,
      completedQuestions: 0
    };
  }

  // Подстраховка: если структура уже была, но без нужных полей — добавим их
  if (!Array.isArray(progress[chapterId].completedEpisodes)) {
    progress[chapterId].completedEpisodes = [];
  }
  if (typeof progress[chapterId].totalScore !== 'number') {
    progress[chapterId].totalScore = 0;
  }

  // Добавляем эпизод, только если он ещё не пройден
  // (избегаем дубликатов и накрутки очков)
  if (!progress[chapterId].completedEpisodes.includes(episodeId)) {
    progress[chapterId].completedEpisodes.push(episodeId);
    progress[chapterId].totalScore += (Number(score) || 0);
  }

  progress[chapterId].lastUpdated = new Date().toISOString();

  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

/**
 * Проверить, пройден ли эпизод
 */
export function isEpisodeCompleted(chapterId, episodeId) {
  const chapterProgress = getChapterProgress(chapterId);
  const list = chapterProgress.completedEpisodes || [];
  return list.includes(episodeId);
}

/**
 * Получить количество пройденных эпизодов в главе
 */
export function getCompletedEpisodesCount(chapterId) {
  const chapterProgress = getChapterProgress(chapterId);
  return (chapterProgress.completedEpisodes || []).length;
}

/**
 * Сбросить весь прогресс
 */
export function resetAllProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}

/**
 * Сбросить прогресс конкретной главы
 */
export function resetChapterProgress(chapterId) {
  const progress = getUserProgress();
  if (progress[chapterId]) {
    delete progress[chapterId];
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }
}

/**
 * Вычислить процент завершения
 */
export function calculateProgress(completed, total) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
