class Community {
  static isLoading = false;

  static init() {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
      uploadForm.addEventListener('submit', (e) => this.handleUpload(e));
    }
    this.loadActivities();
  }

  static async handleUpload(e) {
    e.preventDefault();

    const title = document.getElementById('activityTitle').value;
    const description = document.getElementById('activityDescription').value;
    const category = document.getElementById('activityCategory').value;
    const fileUrl = document.getElementById('activityFileUrl')?.value.trim() || '';
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!title) {
      window.UI?.showToast('Please fill in the activity title', 'error');
      return;
    }

    try {
      window.UI?.setButtonLoading(submitBtn, true, 'Sharing...');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('file_url', fileUrl);
      formData.append('file_name', fileUrl ? 'Shared material' : '');

      await window.API.uploadActivity(formData);

      window.UI?.showToast('Activity shared successfully (+20 points)', 'success');
      document.getElementById('uploadForm').reset();

      await this.loadActivities();
      if (window.Rewards) await window.Rewards.refreshRewards();
      if (window.Dashboard) await window.Dashboard.loadDashboardData(true);
      await window.Notifications?.refreshUnreadCount?.();
    } catch (error) {
      window.UI?.showToast(`Share failed: ${error.message}`, 'error');
    } finally {
      window.UI?.setButtonLoading(submitBtn, false);
    }
  }

  static async loadActivities() {
    const container = document.getElementById('activitiesList');
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      window.UI?.renderState(container, 'loading', 'Loading community activities...');
      const activities = await window.API.getActivities(20, 0);
      this.displayActivities(activities);
    } catch (error) {
      console.error('Failed to load activities:', error);
      window.UI?.renderState(container, 'error', 'Failed to load activities. Try again.');
    } finally {
      this.isLoading = false;
    }
  }

  static displayActivities(activities) {
    const container = document.getElementById('activitiesList');
    if (!container) return;

    container.replaceChildren();

    if (!activities.length) {
      window.UI?.renderState(container, 'empty', 'No activities shared yet. Be the first to upload one.');
      return;
    }

    activities.forEach(activity => {
      const card = document.createElement('article');
      card.className = 'activity-card card';

      const authorBlock = document.createElement('button');
      authorBlock.type = 'button';
      authorBlock.className = 'activity-author';
      authorBlock.addEventListener('click', () => this.openTeacherProfile(activity.created_by));

      const avatar = document.createElement('span');
      avatar.className = 'activity-avatar';
      if (activity.creator_avatar_url) {
        avatar.style.backgroundImage = `url("${activity.creator_avatar_url}")`;
      } else {
        avatar.textContent = (activity.creator_name || 'T').slice(0, 1).toUpperCase();
      }

      const authorText = document.createElement('span');
      authorText.className = 'activity-author-text';
      authorText.textContent = activity.creator_name || 'Teacher';
      authorBlock.append(avatar, authorText);

      const title = document.createElement('h3');
      title.textContent = activity.title || 'Untitled activity';

      const description = document.createElement('p');
      description.textContent = activity.description || 'No description';

      const category = document.createElement('p');
      category.className = 'activity-category';
      category.textContent = activity.category || 'general';

      card.append(authorBlock, title, description, category);

      if (typeof activity.file_url === 'string' && activity.file_url) {
        const link = document.createElement('a');
        link.className = 'activity-link';
        link.href = activity.file_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Open file';
        card.appendChild(link);
      }

      const meta = document.createElement('div');
      meta.className = 'activity-meta';

      const author = document.createElement('span');
      const date = activity.created_at ? new Date(activity.created_at).toLocaleDateString() : '';
      author.textContent = `${activity.creator_name || 'Teacher'} | ${date}`;

      const likeBtn = document.createElement('button');
      likeBtn.className = `like-btn ${activity.likedByCurrentUser ? 'liked' : ''}`;
      likeBtn.dataset.activityId = String(activity.id);
      likeBtn.dataset.likes = String(activity.likes || 0);
      likeBtn.title = 'Like';
      likeBtn.type = 'button';
      likeBtn.textContent = `${activity.likedByCurrentUser ? 'Liked' : 'Like'} ${activity.likes || 0}`;
      likeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleLike(likeBtn);
      });

      meta.append(author, likeBtn);
      card.appendChild(meta);
      container.appendChild(card);
    });
  }

  static async openTeacherProfile(userId) {
    if (!userId) return;

    try {
      const profile = await window.API.getPublicProfile(userId);
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';

      const content = document.createElement('div');
      content.className = 'modal-content teacher-profile-modal';

      const header = document.createElement('div');
      header.className = 'teacher-profile-header';

      const avatar = document.createElement('span');
      avatar.className = 'teacher-profile-avatar';
      if (profile.avatar_url) {
        avatar.style.backgroundImage = `url("${profile.avatar_url}")`;
      } else {
        avatar.textContent = (profile.name || 'T').slice(0, 1).toUpperCase();
      }

      const titleWrap = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = profile.name || 'Teacher';
      const meta = document.createElement('p');
      meta.textContent = [profile.location, profile.specialties].filter(Boolean).join(' | ') || profile.role || 'Teacher';
      titleWrap.append(title, meta);
      header.append(avatar, titleWrap);

      const bio = document.createElement('p');
      bio.className = 'teacher-profile-bio';
      bio.textContent = profile.bio || 'No bio yet.';

      const actions = document.createElement('div');
      actions.className = 'modal-actions';
      const close = document.createElement('button');
      close.type = 'button';
      close.textContent = 'Close';
      close.addEventListener('click', () => modal.remove());
      actions.appendChild(close);

      content.append(header, bio, actions);
      modal.appendChild(content);
      modal.addEventListener('click', e => {
        if (e.target.classList.contains('modal-overlay')) modal.remove();
      });
      document.body.append(modal);
    } catch (error) {
      window.UI?.showToast(`Could not load profile: ${error.message}`, 'error');
    }
  }

  static async toggleLike(btn) {
    const activityId = btn.dataset.activityId;
    const isLiked = btn.classList.contains('liked');

    try {
      if (isLiked) {
        const result = await window.API.unlikeActivity(activityId);
        if (!result.unliked) return;
      } else {
        const result = await window.API.likeActivity(activityId);
        if (!result.liked) return;
      }

      btn.classList.toggle('liked');
      const currentLikes = parseInt(btn.dataset.likes || '0', 10);
      const nextLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
      btn.dataset.likes = String(nextLikes);
      btn.textContent = `${isLiked ? 'Like' : 'Liked'} ${nextLikes}`;
      await window.Notifications?.refreshUnreadCount?.();
    } catch (error) {
      window.UI?.showToast(`Action failed: ${error.message}`, 'error');
    }
  }
}

window.Community = Community;
