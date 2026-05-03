class UI {
  static escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  static showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('visible');
    }, 20);

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 200);
    }, 2600);
  }

  static setButtonLoading(button, isLoading, label = 'Loading...') {
    if (!button) return;
    if (isLoading) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = label;
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
      delete button.dataset.originalText;
    }
  }

  static renderState(container, state, message) {
    if (!container) return;
    container.replaceChildren();
    const stateEl = document.createElement('p');
    stateEl.className = `${state}-state`;
    stateEl.textContent = message;
    container.appendChild(stateEl);
  }
}

window.UI = UI;
