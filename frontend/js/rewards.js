class Rewards {
  static init() {
    document.getElementById('dailyBonusBtn')?.addEventListener('click', () => this.claimDailyBonus());
  }

  static async claimDailyBonus() {
    const btn = document.getElementById('dailyBonusBtn');
    try {
      window.UI?.setButtonLoading(btn, true, 'Claiming...');
      const result = await window.API.getDailyBonus();
      if (result.bonusAwarded) {
        window.UI.showToast(`+${result.points} points!`, 'success');
      } else {
        window.UI.showToast(result.message || 'Already claimed', 'info');
      }
      await this.refreshRewards(true);
      await window.Notifications?.refreshUnreadCount?.();
    } catch (e) {
      window.UI.showToast(e.message, 'error');
    } finally {
      window.UI.setButtonLoading(btn, false);
    }
  }

  static async refreshRewards(force = false) {
    try {
      const rewards = await window.API.getRewards();
      this.#updateElements(rewards);
      window.userRewards = rewards;
    } catch (e) {
      console.warn('Rewards fallback', e);
      this.#updateElements({ points: 0, level: 'Beginner', badges: [] });
      window.UI?.showToast('Rewards demo', 'warning');
    }
  }

  static #updateElements(rewards) {
    const els = {
      dashboardPoints: document.getElementById('dashboardPoints'),
      userPoints: document.getElementById('userPoints'),
      dashboardLevel: document.getElementById('dashboardLevel'),
      userLevel: document.getElementById('userLevel'),
      badgeCount: document.getElementById('badgeCount')
    };

    if (els.dashboardPoints) els.dashboardPoints.textContent = rewards.points;
    if (els.userPoints) els.userPoints.textContent = rewards.points;
    if (els.dashboardLevel) els.dashboardLevel.textContent = rewards.level;
    if (els.userLevel) els.userLevel.textContent = rewards.level;
    if (els.badgeCount) els.badgeCount.textContent = (rewards.badges?.length || 0).toString();
    this.renderBadges(rewards.badges || []);
  }

  static renderBadges(badges) {
    const container = document.getElementById('badgesList');
    if (!container) return;

    container.replaceChildren();
    if (!badges.length) {
      window.UI?.renderState(container, 'empty', 'No badges yet.');
      return;
    }

    badges.forEach(badge => {
      const item = document.createElement('article');
      item.className = 'badge-card';

      const icon = document.createElement('span');
      icon.className = 'badge-icon';
      icon.textContent = badge.icon || 'Badge';

      const text = document.createElement('div');
      const title = document.createElement('h4');
      title.textContent = badge.name || badge.id || 'Badge';

      const description = document.createElement('p');
      description.textContent = badge.description || 'Achievement unlocked.';

      text.append(title, description);
      item.append(icon, text);
      container.appendChild(item);
    });
  }

  static renderLeaderboardRow(entry, index) {
    const row = document.createElement('tr');

    const rank = document.createElement('td');
    rank.textContent = index + 1;

    const teacher = document.createElement('td');
    const teacherButton = document.createElement('button');
    teacherButton.type = 'button';
    teacherButton.className = 'teacher-link';
    teacherButton.textContent = entry.name;
    teacherButton.addEventListener('click', () => window.Community?.openTeacherProfile?.(entry.id));
    teacher.appendChild(teacherButton);

    const points = document.createElement('td');
    points.textContent = entry.points;

    const level = document.createElement('td');
    level.textContent = entry.level;

    row.append(rank, teacher, points, level);
    return row;
  }

  static async loadLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;

    tbody.replaceChildren();
    const loadingRow = document.createElement('tr');
    const loadingCell = document.createElement('td');
    loadingCell.colSpan = 4;
    loadingCell.textContent = 'Loading...';
    loadingRow.appendChild(loadingCell);
    tbody.appendChild(loadingRow);

    try {
      const { leaderboard } = await window.API.getLeaderboard(10);
      tbody.replaceChildren(...leaderboard.map((entry, index) => this.renderLeaderboardRow(entry, index)));
    } catch {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.textContent = 'No data';
      row.appendChild(cell);
      tbody.replaceChildren(row);
    }
  }
}

window.Rewards = Rewards;
window.refreshRewards = Rewards.refreshRewards.bind(Rewards);
