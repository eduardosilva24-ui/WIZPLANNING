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
  }

  static renderLeaderboardRow(entry, index) {
    const row = document.createElement('tr');
    [index + 1, entry.name, entry.points, entry.level].forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
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
