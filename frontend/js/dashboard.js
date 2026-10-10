class Dashboard {
  static lastLoadTime = 0;
  static recentLessonPlans = [];
  static recentPlansExpanded = false;
  static recentPlansPreviewCount = 4;

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

    document.querySelectorAll('[data-page-target]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        this.switchPage(button.dataset.pageTarget);
      });
    });
  }

  static switchPage(pageName) {
    const pageIdMap = {
      dashboard: 'dashboardPage',
      'lesson-planner': 'lessonPlannerPage',
      community: 'communityPage',
      rewards: 'rewardsPage',
      notifications: 'notificationsPage',
      profile: 'profilePage'
    };
    const pageLabels = {
      dashboard: 'Visão geral',
      'lesson-planner': 'Planejador de aula',
      community: 'Comunidade',
      rewards: 'Conquistas',
      notifications: 'Notificações',
      profile: 'Meu perfil'
    };

    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageIdMap[pageName]);
    if (!targetPage) return;
    targetPage.classList.add('active');
    targetPage.querySelector('h1')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const currentPageLabel = document.getElementById('currentPageLabel');
    if (currentPageLabel) currentPageLabel.textContent = pageLabels[pageName] || 'WizPlanning';

    document
      .querySelectorAll('.nav-item')
      .forEach(item => {
        const isCurrent = item.dataset.page === pageName;
        item.classList.toggle('active', isCurrent);
        if (isCurrent) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
      });

    if (window.innerWidth <= 768) {
      document.getElementById('mainApp')?.classList.remove('sidebar-collapsed');
      document.getElementById('sidebarToggle')?.setAttribute('aria-expanded', 'false');
    }

    setTimeout(() => {
      if (pageName === 'dashboard') this.loadDashboardData();
      else if (pageName === 'community') window.Community?.loadActivities?.();
      else if (pageName === 'rewards') {
        window.Rewards?.refreshRewards?.();
        window.Rewards?.loadLeaderboard?.();
      } else if (pageName === 'notifications') {
        window.Notifications?.loadNotifications?.();
      } else if (pageName === 'profile') {
        window.Profile?.loadProfile?.();
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
      window.UI?.showToast('Exibindo dados indisponíveis como “N/A”.', 'warning');
    });
  }

  static ensureRefreshButton(container) {
    const title = container.parentElement?.querySelector('h2');
    if (!title || title.querySelector('.refresh')) return;

    const btn = document.createElement('button');
      btn.textContent = 'Atualizar';
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
    this.recentLessonPlans = Array.isArray(plans) ? plans : [];

    if (!this.recentLessonPlans.length) {
      this.recentPlansExpanded = false;
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Ainda não há planos. ';

      const createLink = document.createElement('button');
      createLink.type = 'button';
      createLink.className = 'inline-action';
      createLink.textContent = 'Criar plano';
      createLink.addEventListener('click', () => Dashboard.switchPage('lesson-planner'));

      empty.appendChild(createLink);
      cont.appendChild(empty);
      return;
    }

    const visiblePlans = this.recentPlansExpanded
      ? this.recentLessonPlans
      : this.recentLessonPlans.slice(0, this.recentPlansPreviewCount);

    visiblePlans.forEach(plan => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'lesson-item';
      item.dataset.id = String(plan.id);

      const title = document.createElement('h4');
      const suffix = plan.book === 'Turma' ? ' (Turma)' : plan.lesson ? ` (L${plan.lesson})` : '';
      title.textContent = `${plan.student_name || 'Plano de aula'}${suffix}`;

      const meta = document.createElement('p');
      const createdAt = plan.created_at ? new Date(plan.created_at).toLocaleDateString('pt-BR') : '';
      meta.textContent = `${plan.check_time || ''} · ${createdAt}`.trim();

      item.append(title, meta);
      item.addEventListener('click', () => this.viewLesson(plan.id));
      cont.appendChild(item);
    });

    if (this.recentLessonPlans.length > this.recentPlansPreviewCount) {
      const remainingCount = this.recentLessonPlans.length - this.recentPlansPreviewCount;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'recent-plans-toggle';
      toggle.setAttribute('aria-expanded', String(this.recentPlansExpanded));
      toggle.textContent = this.recentPlansExpanded
        ? 'Mostrar menos aulas ↑'
        : `Ver mais ${remainingCount} ${remainingCount === 1 ? 'aula' : 'aulas'} ↓`;
      toggle.addEventListener('click', () => {
        this.recentPlansExpanded = !this.recentPlansExpanded;
        this.displayRecentLessonPlans(this.recentLessonPlans);
      });
      cont.appendChild(toggle);
    }
  }

  static viewLesson(id) {
    window.API.getLessonPlan(id).then(plan => {
      const notes = plan.notes || '';
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';

      const content = document.createElement('div');
      content.className = 'modal-content';

      const title = document.createElement('h3');
      title.textContent = plan.student_name || 'Plano de aula';

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
    }).catch(() => window.UI?.showToast('Não foi possível abrir este plano.', 'error'));
  }

  static setupSidebarToggle() {
    const app = document.getElementById('mainApp');
    const toggle = document.getElementById('sidebarToggle');
    const scrim = document.getElementById('sidebarScrim');
    const setOpen = (isOpen) => {
      app?.classList.toggle('sidebar-collapsed', isOpen);
      toggle?.setAttribute('aria-expanded', String(isOpen));
    };

    toggle?.addEventListener('click', () => {
      setOpen(!app?.classList.contains('sidebar-collapsed'));
    });
    scrim?.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && app?.classList.contains('sidebar-collapsed')) setOpen(false);
    });
  }
}

window.Dashboard = Dashboard;
