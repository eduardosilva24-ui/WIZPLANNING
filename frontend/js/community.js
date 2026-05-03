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
    const fileInput = document.getElementById('activityFile');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!title || !fileInput.files.length) {
      window.UI?.showToast('Please fill in title and select a file', 'error');
      return;
    }

    try {
      window.UI?.setButtonLoading(submitBtn, true, 'Uploading...');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('file', fileInput.files[0]);

      await window.API.uploadActivity(formData);

      window.UI?.showToast('Activity uploaded successfully (+20 points)', 'success');
      document.getElementById('uploadForm').reset();

      await this.loadActivities();
      if (window.Rewards) await window.Rewards.refreshRewards();
      if (window.Dashboard) await window.Dashboard.loadDashboardData(true);
    } catch (error) {
      window.UI?.showToast(`Upload failed: ${error.message}`, 'error');
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

      const title = document.createElement('h3');
      title.textContent = activity.title || 'Untitled activity';

      const description = document.createElement('p');
      description.textContent = activity.description || 'No description';

      const category = document.createElement('p');
      category.className = 'activity-category';
      category.textContent = activity.category || 'general';

      card.append(title, description, category);

      if (typeof activity.file_url === 'string' && activity.file_url.startsWith('/uploads/')) {
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
      author.textContent = `${activity.creator_name || 'Teacher'} · ${date}`;

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
    } catch (error) {
      window.UI?.showToast(`Action failed: ${error.message}`, 'error');
    }
  }
}

window.Community = Community;
