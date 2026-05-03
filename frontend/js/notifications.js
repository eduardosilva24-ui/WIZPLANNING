class Notifications {
  static init() {
    document
      .getElementById('markAllNotificationsReadBtn')
      ?.addEventListener('click', () => this.markAllRead());
    this.refreshUnreadCount();
  }

  static async refreshUnreadCount() {
    try {
      const { unreadCount } = await window.API.getUnreadNotificationsCount();
      this.updateBadge(unreadCount);
    } catch (error) {
      this.updateBadge(0);
    }
  }

  static updateBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    badge.textContent = String(count);
    badge.classList.toggle('hidden', !count);
  }

  static async loadNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;

    try {
      window.UI?.renderState(container, 'loading', 'Loading notifications...');
      const { notifications, unreadCount } = await window.API.getNotifications(30, 0);
      this.updateBadge(unreadCount);
      this.renderNotifications(notifications);
    } catch (error) {
      window.UI?.renderState(container, 'error', 'Failed to load notifications.');
    }
  }

  static renderNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    container.replaceChildren();

    if (!notifications.length) {
      window.UI?.renderState(container, 'empty', 'No notifications yet.');
      return;
    }

    notifications.forEach(notification => {
      const item = document.createElement('article');
      item.className = `notification-item ${notification.read ? '' : 'unread'}`;

      const marker = document.createElement('span');
      marker.className = `notification-type notification-${notification.type || 'info'}`;
      marker.textContent = notification.type === 'badge' ? 'Badge' : notification.type === 'like' ? 'Like' : 'Update';

      const content = document.createElement('div');
      content.className = 'notification-content';

      const title = document.createElement('h3');
      title.textContent = notification.title || 'Notification';

      const message = document.createElement('p');
      message.textContent = notification.message || '';

      const date = document.createElement('small');
      date.textContent = notification.created_at
        ? new Date(notification.created_at).toLocaleString()
        : '';

      content.append(title, message, date);
      item.append(marker, content);

      if (!notification.read) {
        const readBtn = document.createElement('button');
        readBtn.type = 'button';
        readBtn.className = 'btn btn-outline notification-read-btn';
        readBtn.textContent = 'Read';
        readBtn.addEventListener('click', async () => {
          await window.API.markNotificationRead(notification.id);
          await this.loadNotifications();
        });
        item.appendChild(readBtn);
      }

      container.appendChild(item);
    });
  }

  static async markAllRead() {
    try {
      await window.API.markAllNotificationsRead();
      await this.loadNotifications();
      this.updateBadge(0);
    } catch (error) {
      window.UI?.showToast(`Could not mark notifications read: ${error.message}`, 'error');
    }
  }
}

window.Notifications = Notifications;
