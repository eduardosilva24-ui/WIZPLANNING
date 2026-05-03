class Dashboard {
  static lastLoadTime = 0;

  static init() {
    this.setupNavigation();
    this.setupSidebarToggle();
    this.initLoadingState();
    this.loadDashboardData();
  }

  static initLoadingState() {
    const stats = document.querySelectorAll('.stat-card .stat-number');
    stats.forEach(stat => {
      if (stat.textContent === '0' || stat.textContent === 'Beginner') {
        stat.style.opacity = '0.5';
      }
    });
  }

  static setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        this.switchPage(item.dataset.page);
      });
    });

    document.querySelectorAll('.sidebar-tab').forEach(tab => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        const tabName = this.getAttribute('data-tab');

        document.querySelectorAll('.page').forEach(page => {
          page.style.display = 'none';
        });

        document.querySelectorAll('.sidebar-tab').forEach(t => {
          t.classList.remove('active');
        });

        const selectedPage = document.getElementById(tabName);
        if (selectedPage) selectedPage.style.display = 'block';

        this.classList.add('active');
      });
    });
  }

  static switchPage(pageName) {
    const pageIdMap = {
      dashboard: 'dashboardPage',
      'lesson-planner': 'lessonPlannerPage',
      community: 'communityPage',
      rewards: 'rewardsPage'
    };

    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageIdMap[pageName]);
    if (targetPage) targetPage.classList.add('active');

    document
      .querySelectorAll('.nav-item')
      .forEach(item => item.classList.toggle('active', item.dataset.page === pageName));

    if (window.innerWidth <= 768) {
      document.getElementById('mainApp')?.classList.remove('sidebar-collapsed');
    }

    setTimeout(() => {
      if (pageName === 'dashboard') this.loadDashboardData();
      else if (pageName === 'community') window.Community?.loadActivities?.();
      else if (pageName === 'rewards') {
        window.Rewards?.refreshRewards?.();
        window.Rewards?.loadLeaderboard?.();
      }
    }, 50);
  }

  static setStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  static loadDashboardData(force = false) {
    if (!force && Date.now() - this.lastLoadTime < 1000) return;
    this.lastLoadTime = Date.now();

    const statsToLoad = ['lessonPlanCount', 'userPoints', 'userLevel', 'activityCount'];
    statsToLoad.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.opacity = '0.5';
    });

    Promise.all([
      window.API?.getLessonPlans?.(999, 0) ?? [],
      window.API?.getRewards?.() ?? { points: 0, level: 'Beginner' },
      window.API?.getActivities?.(999, 0) ?? []
    ]).then(([plans, rewards, acts]) => {
      this.setStat('lessonPlanCount', plans.length);
      this.setStat('userPoints', rewards.points || 0);
      this.setStat('userLevel', rewards.level || 'Beginner');
      this.setStat('activityCount', acts.length);

      statsToLoad.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = '1';
      });

      this.displayRecentLessonPlans(plans);
    }).catch(() => {
      this.displayRecentLessonPlans([]);
      statsToLoad.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = 'N/A';
          el.style.opacity = '1';
        }
      });
      window.UI?.showToast('Demo mode');
    });
  }

  static ensureRefreshButton(container) {
    const title = container.parentElement?.querySelector('h2');
    if (!title || title.querySelector('.refresh')) return;

    const btn = document.createElement('button');
    btn.textContent = 'Refresh';
    btn.className = 'btn btn-outline refresh';
    btn.type = 'button';
    btn.addEventListener('click', () => this.loadDashboardData(true));
    title.appendChild(btn);
  }

  static displayRecentLessonPlans(plans) {
    const cont = document.getElementById('recentLessonPlans');
    if (!cont) return;

    this.ensureRefreshButton(cont);
    cont.replaceChildren();

    if (!plans.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No plans. ';

      const createLink = document.createElement('button');
      createLink.type = 'button';
      createLink.className = 'inline-action';
      createLink.textContent = 'Create';
      createLink.addEventListener('click', () => Dashboard.switchPage('lesson-planner'));

      empty.appendChild(createLink);
      cont.appendChild(empty);
      return;
    }

    plans.forEach(plan => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'lesson-item';
      item.dataset.id = String(plan.id);

      const title = document.createElement('h4');
      const suffix = plan.book === 'Turma' ? ' (Turma)' : plan.lesson ? ` (L${plan.lesson})` : '';
      title.textContent = `${plan.student_name || 'Lesson plan'}${suffix}`;

      const meta = document.createElement('p');
      const createdAt = plan.created_at ? new Date(plan.created_at).toLocaleDateString('pt-BR') : '';
      meta.textContent = `${plan.check_time || ''} · ${createdAt}`.trim();

      item.append(title, meta);
      item.addEventListener('click', () => this.viewLesson(plan.id));
      cont.appendChild(item);
    });
  }

  static viewLesson(id) {
    window.API.getLessonPlan(id).then(plan => {
      const notes = plan.notes || '';
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';

      const content = document.createElement('div');
      content.className = 'modal-content';

      const title = document.createElement('h3');
      title.textContent = plan.student_name || 'Lesson plan';

      const textarea = document.createElement('textarea');
      textarea.readOnly = true;
      textarea.value = notes;

      const actions = document.createElement('div');
      actions.className = 'modal-actions';

      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.textContent = 'Copiar';
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(notes).then(() => alert('Copiado!'));
      });

      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.textContent = 'Fechar';
      closeButton.addEventListener('click', () => modal.remove());

      actions.append(copyButton, closeButton);
      content.append(title, textarea, actions);
      modal.appendChild(content);

      modal.addEventListener('click', e => {
        if (e.target.classList.contains('modal-overlay')) modal.remove();
      });

      document.body.append(modal);
    }).catch(() => window.UI?.showToast('Erro'));
  }

  static setupSidebarToggle() {
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
      document.getElementById('mainApp')?.classList.toggle('sidebar-collapsed');
    });
  }
}

window.Dashboard = Dashboard;
