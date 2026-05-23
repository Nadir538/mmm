/**
 * Authentication Utility
 * Локальная система авторизации
 */

const USERS_STORAGE_KEY = 'spb_users';
const CURRENT_USER_KEY = 'spb_current_user';

/**
 * Получить пользователей
 */
export function getUsers() {
  const users = localStorage.getItem(USERS_STORAGE_KEY);
  if (!users) return [];

  try {
    const parsed = JSON.parse(users);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Invalid users data in localStorage, reset to empty array.', error);
    return [];
  }
}

/**
 * Сохранить пользователей
 */
function saveUsers(users) {
  localStorage.setItem(
    USERS_STORAGE_KEY,
    JSON.stringify(users)
  );
}

/**
 * Проверка уникальности username
 */
export function isUsernameUnique(username) {
  const users = getUsers();

  return !users.some(
    user =>
      user.username.toLowerCase() ===
      username.toLowerCase()
  );
}

/**
 * Регистрация пользователя
 */
export function registerUser(username, password) {
  if (!isUsernameUnique(username)) {
    return {
      success: false,
      message: 'Имя пользователя уже занято'
    };
  }

  const users = getUsers();

  const newUser = {
    id: Date.now(),
    username,
    password,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  saveUsers(users);

  return {
    success: true,
    user: newUser
  };
}

/**
 * Авторизация
 */
export function loginUser(username, password) {
  const users = getUsers();

  const user = users.find(
    u =>
      u.username === username &&
      u.password === password
  );

  if (!user) {
    return {
      success: false,
      message: 'Неверное имя пользователя или пароль'
    };
  }

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(user)
  );

  return {
    success: true,
    user
  };
}

/**
 * Текущий пользователь
 */
export function getCurrentUser() {
  const user = localStorage.getItem(CURRENT_USER_KEY);

  return user ? JSON.parse(user) : null;
}

/**
 * Выход
 */
export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}