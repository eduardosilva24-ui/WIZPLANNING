// API Helper Functions
const API_BASE = window.APP_CONFIG?.API_BASE || '/api';

class API {
  static getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  /** Used by auth/session recovery so callers can distinguish 401 from offline errors */
  static _makeHttpError(status, body) {
    const message =
      (body && body.error) || (body && body.message) || `Request failed (${status})`;
    const err = new Error(message);
    err.status = status;
    err.body = body;
    return err;
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {})
        }
      });
    } catch (e) {
      const err = new Error(
        `Cannot reach API at ${API_BASE.replace(/\/api$/, '')}. Is the server running? (${e.message || 'network error'})`
      );
      err.status = 0;
      err.cause = e;
      throw err;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const err = API._makeHttpError(response.status, body);
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/') window.location.href = '/';
      }
      throw err;
    }

    const text = await response.text();
    if (!text.trim()) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  // Auth endpoints
  static register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  }

  static login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  static getProfile() {
    return this.request('/auth/profile');
  }

  // Lesson plan endpoints
  /** Google Apps Script port: linhas tabs; envia texto + rawInput (alias) por compatibilidade com APIs antigas */
  static generateLessonPlan(rawInputOrTexto, horarioStr = '', objectivesVisible = true) {
    const textPayload = typeof rawInputOrTexto === 'string' ? rawInputOrTexto : '';
    return this.request('/lesson-plans/generate', {
      method: 'POST',
      body: JSON.stringify({
        texto: textPayload,
        rawInput: textPayload,
        horarioStr: horarioStr != null ? String(horarioStr) : '',
        objectivesVisible
      })
    });
  }

  static createLessonPlan(studentName, book, lesson, objectives, checkTime, notes) {
    return this.request('/lesson-plans', {
      method: 'POST',
      body: JSON.stringify({ studentName, book, lesson, objectives, checkTime, notes })
    });
  }

  static getLessonPlans(limit = 50, offset = 0) {
    return this.request(`/lesson-plans?limit=${limit}&offset=${offset}`);
  }

  static getLessonPlan(id) {
    return this.request(`/lesson-plans/${id}`);
  }

  static updateLessonPlan(id, updates) {
    return this.request(`/lesson-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  static deleteLessonPlan(id) {
    return this.request(`/lesson-plans/${id}`, {
      method: 'DELETE'
    });
  }

  static getBooks() {
    return this.request('/lesson-plans/metadata/books');
  }

  static getLessons(book) {
    return this.request(`/lesson-plans/metadata/lessons/${book}`);
  }

  // Reward endpoints
  static getRewards() {
    return this.request('/rewards');
  }

  static getDailyBonus() {
    return this.request('/rewards/daily-bonus', {
      method: 'POST'
    });
  }

  static getLeaderboard(limit = 10) {
    return this.request(`/rewards/leaderboard?limit=${limit}`);
  }

  // Activity endpoints
  static getActivities(limit = 20, offset = 0) {
    return this.request(`/activities?limit=${limit}&offset=${offset}`);
  }

  static getActivitiesByCategory(category, limit = 20, offset = 0) {
    return this.request(`/activities/category/${category}?limit=${limit}&offset=${offset}`);
  }

  static getUserActivities(userId, limit = 20, offset = 0) {
    return this.request(`/activities/user/${userId}?limit=${limit}&offset=${offset}`);
  }

  static uploadActivity(formData) {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE}/activities/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw API._makeHttpError(res.status, body);
      }
      return res.json();
    });
  }

  static likeActivity(activityId) {
    return this.request(`/activities/${activityId}/like`, {
      method: 'POST'
    });
  }

  static unlikeActivity(activityId) {
    return this.request(`/activities/${activityId}/unlike`, {
      method: 'POST'
    });
  }

  static deleteActivity(activityId) {
    return this.request(`/activities/${activityId}`, {
      method: 'DELETE'
    });
  }

  static saveClassPlan(title, alunos_json, output) {
    return this.request('/lesson-plans/save-class', {
      method: 'POST',
      body: JSON.stringify({ title, alunos_json, output })
    });
  }
}

// Export API helper
window.API = API;
