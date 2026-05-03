class Profile {
  static currentProfile = null;

  static init() {
    document.getElementById('profileForm')?.addEventListener('submit', (e) => this.handleProfileSave(e));
    this.loadProfile();
  }

  static async loadProfile() {
    try {
      const profile = await window.API.getProfile();
      this.currentProfile = profile;
      this.populateForm(profile);
      this.renderPreview(profile);
    } catch (error) {
      console.warn('Profile load failed', error);
    }
  }

  static populateForm(profile) {
    const fields = {
      profileName: profile.name || '',
      profileBio: profile.bio || '',
      profileLocation: profile.location || '',
      profilePhone: profile.phone || '',
      profileSpecialties: profile.specialties || ''
    };

    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    });
  }

  static renderPreview(profile) {
    const name = document.getElementById('profilePreviewName');
    const bio = document.getElementById('profilePreviewBio');
    const meta = document.getElementById('profilePreviewMeta');

    if (name) name.textContent = profile.name || 'Teacher';
    if (bio) bio.textContent = profile.bio || 'No bio yet.';
    if (meta) {
      meta.textContent = [profile.location, profile.specialties].filter(Boolean).join(' | ');
    }
  }

  static async handleProfileSave(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const payload = {
      name: document.getElementById('profileName')?.value || '',
      bio: document.getElementById('profileBio')?.value || '',
      location: document.getElementById('profileLocation')?.value || '',
      phone: document.getElementById('profilePhone')?.value || '',
      specialties: document.getElementById('profileSpecialties')?.value || ''
    };

    try {
      window.UI?.setButtonLoading(btn, true, 'Saving...');
      const profile = await window.API.updateProfile(payload);
      this.currentProfile = profile;
      localStorage.setItem('user', JSON.stringify(profile));
      this.renderPreview(profile);
      await window.Auth?.loadUserProfile?.();
      await window.Rewards?.refreshRewards?.(true);
      await window.Notifications?.refreshUnreadCount?.();
      window.UI?.showToast('Profile updated', 'success');
    } catch (error) {
      window.UI?.showToast(`Profile update failed: ${error.message}`, 'error');
    } finally {
      window.UI?.setButtonLoading(btn, false);
    }
  }

}

window.Profile = Profile;
