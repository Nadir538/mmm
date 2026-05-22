/**
 * Register Page Script
 */

import FormTitle from './components/FormTitle.js';
import InputField from './components/InputField.js';
import SubmitButton from './components/SubmitButton.js';
import GalleryTitle from './components/GalleryTitle.js';
import PhotoGallery from './components/PhotoGallery.js';

import { showToast } from './utils/animations.js';
import {
  registerUser,
  isUsernameUnique
} from './utils/auth.js';

class RegisterPage {
  constructor() {
    this.galleryData = null;
    this.init();
  }

  async init() {
    await this.loadGalleryData();
    this.renderComponents();
    this.attachEvents();
  }

  /**
   * Загрузить данные галереи
   */
  async loadGalleryData() {
    try {
      const response = await fetch('./js/config/gallery-data.json');
      this.galleryData = await response.json();
    } catch (error) {
      console.error('Failed to load gallery data:', error);
      this.galleryData = [];
    }
  }

  /**
   * Рендер всех компонентов
   */
  renderComponents() {
    // Form Title
    const titleContainer = document.getElementById(
      'form-title-container'
    );

    titleContainer.innerHTML = FormTitle.render({
      title: 'Создать аккаунт',
      subtitle: 'Присоединяйтесь к нашему сообществу'
    });

    // Form Fields
    const fieldsContainer = document.getElementById(
      'form-fields-container'
    );

    fieldsContainer.innerHTML = `
      ${InputField.render({
        name: 'username',
        type: 'text',
        label: 'Имя пользователя',
        placeholder: 'Уникальное имя пользователя',
        icon: 'user',
        required: true,
        autocomplete: 'username'
      })}

      ${InputField.render({
        name: 'password',
        type: 'password',
        label: 'Пароль',
        placeholder: 'Минимум 8 символов',
        icon: 'lock',
        required: true,
        autocomplete: 'new-password'
      })}

      ${InputField.render({
        name: 'password_confirm',
        type: 'password',
        label: 'Подтверждение пароля',
        placeholder: 'Повторите пароль',
        icon: 'lock',
        required: true,
        autocomplete: 'new-password'
      })}
    `;

    // Submit Button
    const buttonContainer = document.getElementById(
      'submit-button-container'
    );

    buttonContainer.innerHTML = SubmitButton.render({
      text: 'Зарегистрироваться',
      type: 'submit'
    });

    // Gallery Title
    const galleryTitleContainer = document.getElementById(
      'gallery-title-container'
    );

    if (galleryTitleContainer) {
      galleryTitleContainer.innerHTML = GalleryTitle.render({
        title: 'Добро пожаловать в Санкт-Петербург'
      });
    }

    // Photo Gallery
    const galleryContainer = document.getElementById(
      'photo-gallery-container'
    );

    if (galleryContainer && this.galleryData) {
      galleryContainer.innerHTML = PhotoGallery.render(
        this.galleryData
      );
    }

    // Setup password toggles
    this.setupPasswordToggles();
  }

  /**
   * Настройка переключателей видимости пароля
   */
  setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');

    passwordToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const button = e.currentTarget;
        const wrapper = button.closest('.input-wrapper');
        const input = wrapper.querySelector('.input-field');
        const icon = button.querySelector('svg use');

        if (input.type === 'password') {
          input.type = 'text';
          icon.setAttribute('href', '#icon-eye-off');
          button.setAttribute('aria-label', 'Скрыть пароль');
        } else {
          input.type = 'password';
          icon.setAttribute('href', '#icon-eye');
          button.setAttribute('aria-label', 'Показать пароль');
        }
      });
    });
  }

  /**
   * Подключение событий
   */
  attachEvents() {
    const form = document.getElementById('registration-form');

    form.addEventListener(
      'submit',
      this.handleSubmit.bind(this)
    );

    // Real-time validation for username
    const usernameInput = document.querySelector('[name="username"]');
    if (usernameInput) {
      usernameInput.addEventListener('blur', this.validateUsername.bind(this));
    }

    // Real-time validation for password confirmation
    const passwordConfirmInput = document.querySelector('[name="password_confirm"]');
    if (passwordConfirmInput) {
      passwordConfirmInput.addEventListener('input', this.validatePasswordMatch.bind(this));
    }
  }

  /**
   * Валидация имени пользователя
   */
  validateUsername(event) {
    const input = event.target;
    const username = input.value.trim();
    const inputGroup = input.closest('.input-group');

    // Clear previous errors
    inputGroup.classList.remove('error', 'success');
    const errorMsg = inputGroup.querySelector('.input-error-message');
    if (errorMsg) errorMsg.remove();

    if (!username) return;

    if (username.length < 3) {
      this.showFieldError(input, 'Минимум 3 символа');
      return;
    }

    if (!isUsernameUnique(username)) {
      this.showFieldError(input, 'Это имя уже занято');
      return;
    }

    inputGroup.classList.add('success');
  }

  /**
   * Валидация совпадения паролей
   */
  validatePasswordMatch(event) {
    const confirmInput = event.target;
    const passwordInput = document.querySelector('[name="password"]');
    const inputGroup = confirmInput.closest('.input-group');

    // Clear previous errors
    inputGroup.classList.remove('error', 'success');
    const errorMsg = inputGroup.querySelector('.input-error-message');
    if (errorMsg) errorMsg.remove();

    if (!confirmInput.value) return;

    if (confirmInput.value !== passwordInput.value) {
      this.showFieldError(confirmInput, 'Пароли не совпадают');
      return;
    }

    inputGroup.classList.add('success');
  }

  /**
   * Показать ошибку поля
   */
  showFieldError(input, message) {
    const inputGroup = input.closest('.input-group');
    inputGroup.classList.add('error');

    let errorElement = inputGroup.querySelector('.input-error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'input-error-message';
      inputGroup.appendChild(errorElement);
    }

    errorElement.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  /**
   * Обработка отправки формы
   */
  handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    const username = formData.get('username').trim();
    const password = formData.get('password');
    const passwordConfirm = formData.get('password_confirm');

    // Validation
    if (username.length < 3) {
      showToast(
        'Имя пользователя должно быть минимум 3 символа',
        'error'
      );
      return;
    }

    if (password.length < 8) {
      showToast(
        'Пароль должен быть минимум 8 символов',
        'error'
      );
      return;
    }

    if (password !== passwordConfirm) {
      showToast(
        'Пароли не совпадают',
        'error'
      );
      return;
    }

    if (!isUsernameUnique(username)) {
      showToast(
        'Это имя пользователя уже занято',
        'error'
      );
      return;
    }

    // Register user
    const result = registerUser(username, password);

    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    // Success
    const submitButton = document.querySelector('.btn-primary');
    submitButton.classList.add('btn-loading');
    submitButton.disabled = true;

    setTimeout(() => {
      submitButton.classList.remove('btn-loading');
      submitButton.classList.add('btn-success');
      
      showToast(
        '✓ Регистрация успешна!',
        'success'
      );

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    }, 800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RegisterPage();
});