// Authentication Module
class Auth {
  static init() {
    const token = localStorage.getItem('token');
    const loadingScreen = document.getElementById('loadingScreen');
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('mainApp');

    if (token) {
      // User is logged in, show main app
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        Auth.bootstrapAuthenticatedSession();
      }, 1000);
    } else {
      // User is not logged in, show login page
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        loginPage.classList.remove('hidden');
        this.setupAuthForms();
      }, 1000);
    }
  }

  static invalidateSessionAndReload(reason) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    const err = new Error(reason);
    err.haltBootstrap = true;
    throw err;
  }

  static async bootstrapAuthenticatedSession() {
    try {
      await Auth.loadUserProfile();
    } catch (e) {
      if (e && e.haltBootstrap) {
        return;
      }
      if (e && e.status === 401) {
        return;
      }
      console.error('Bootstrap session:', e);
    }
    window.App?.startAuthenticatedApp();
  }

  static setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    registerForm.addEventListener('submit', (e) => this.handleRegister(e));
  }

  static async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    try {
      const result = await window.API.login(email, password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Reload page to show main app
      window.location.reload();
    } catch (error) {
      window.UI?.showToast(`Login failed: ${error.message}`, 'error');
    }
  }

  static async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;

    try {
      await window.API.register(name, email, password);
      window.UI?.showToast('Registration successful! Please login.', 'success');
      document.getElementById('registerForm').reset();
    } catch (error) {
      window.UI?.showToast(`Registration failed: ${error.message}`, 'error');
    }
  }

  static async loadUserProfile() {
    try {
      const user = await window.API.getProfile();
      if (!user || user.id == null) {
        Auth.invalidateSessionAndReload('Invalid profile response');
      }
      const userName = document.getElementById('userName');
      const userRole = document.getElementById('userRole');

      if (userName) userName.textContent = user.name;
      if (userRole) userRole.textContent = user.role;

      // Store user in window for global access
      window.currentUser = user;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      if (error && error.haltBootstrap) {
        throw error;
      }
      console.error('Failed to load user profile:', error);

      const st = error && error.status;
      if (st === 401) {
        Auth.invalidateSessionAndReload('Unauthorized');
      }

      window.UI?.showToast(
        error && error.message
          ? `Failed to load user profile: ${error.message}`
          : 'Failed to load user profile',
        'error'
      );
      throw error;
    }
  }

  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();

  // Setup logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => Auth.logout());
  }
});

// Export Auth class
window.Auth = Auth;
