/**
 * Login Page Script
 */

import FormTitle from './components/FormTitle.js';
import InputField from './components/InputField.js';
import SubmitButton from './components/SubmitButton.js';

import { showToast } from './utils/animations.js';
import { loginUser } from './utils/auth.js';

class LoginPage {
  constructor() {
    this.init();
  }

  init() {
    this.renderComponents();
    this.attachEvents();
  }

  renderComponents() {
    const titleContainer = document.getElementById(
      'form-title-container'
    );

    titleContainer.innerHTML = FormTitle.render({
      title: 'Вход',
      subtitle: 'Добро пожаловать обратно'
    });

    const fieldsContainer = document.getElementById(
      'form-fields-container'
    );

    fieldsContainer.innerHTML = `
      ${InputField.render({
        name: 'username',
        type: 'text',
        label: 'Имя пользователя',
        placeholder: 'Введите имя пользователя',
        icon: 'user',
        required: true
      })}

      ${InputField.render({
        name: 'password',
        type: 'password',
        label: 'Пароль',
        placeholder: 'Введите пароль',
        icon: 'lock',
        required: true
      })}
    `;

    const buttonContainer = document.getElementById(
      'submit-button-container'
    );

    buttonContainer.innerHTML = SubmitButton.render({
      text: 'Войти',
      type: 'submit'
    });
  }

  attachEvents() {
    const form = document.getElementById('login-form');

    form.addEventListener(
      'submit',
      this.handleSubmit.bind(this)
    );
  }

  handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    const username = formData.get('username').trim();
    const password = formData.get('password');

    const result = loginUser(username, password);

    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    showToast(
      `Добро пожаловать, ${username}!`,
      'success'
    );

    setTimeout(() => {
        window.location.href = 'dashboard.html'
    }, 1200);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LoginPage();
});