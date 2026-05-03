// API Helper Functions
const API_BASE = window.APP_CONFIG?.API_BASE || '/api';
const APPS_SCRIPT_API_BASE = window.APP_CONFIG?.APPS_SCRIPT_API_BASE || '';

class API {
  static staticKeys = {
    users: 'wizplanning:static:users:v1',
    lessonPlans: 'wizplanning:static:lessonPlans:v1',
    activities: 'wizplanning:static:activities:v1',
    rewards: 'wizplanning:static:rewards:v1',
    notifications: 'wizplanning:static:notifications:v1'
  };

  static staticBadgeDefinitions = {
    first_lesson: { id: 'first_lesson', name: 'First Class Planned', description: 'Prepared the first class plan.', icon: 'Lesson' },
    first_post: { id: 'first_post', name: 'Community Starter', description: 'Shared the first activity with other teachers.', icon: 'Post' },
    first_like_given: { id: 'first_like_given', name: 'Peer Supporter', description: 'Liked another teacher activity for the first time.', icon: 'Like' },
    first_like_received: { id: 'first_like_received', name: 'Peer Approved', description: 'Received the first like on a shared activity.', icon: 'Star' },
    profile_complete: { id: 'profile_complete', name: 'Introduced', description: 'Completed the teacher profile with photo and bio.', icon: 'Profile' },
    daily_bonus: { id: 'daily_bonus', name: 'Daily Check-in', description: 'Claimed the first daily bonus.', icon: 'Daily' },
    points_50: { id: 'points_50', name: '50 Point Spark', description: 'Reached 50 reward points.', icon: '50' },
    points_150: { id: 'points_150', name: '150 Point Builder', description: 'Reached 150 reward points.', icon: '150' },
    points_300: { id: 'points_300', name: '300 Point Pro', description: 'Reached 300 reward points.', icon: '300' },
    points_500: { id: 'points_500', name: '500 Point Master', description: 'Reached 500 reward points.', icon: '500' },
    top_teacher: { id: 'top_teacher', name: 'Leaderboard Leader', description: 'Reached first place on the leaderboard.', icon: 'Top' }
  };

  static staticPlannerDataPromise = null;

  static get isStaticMode() {
    return Boolean(window.APP_CONFIG?.STATIC_MODE);
  }

  static get isAppsScriptMode() {
    return Boolean(window.APP_CONFIG?.APPS_SCRIPT_MODE && APPS_SCRIPT_API_BASE);
  }

  static getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  static async appsScriptAction(action, params = {}, options = {}) {
    if (!APPS_SCRIPT_API_BASE) {
      throw new Error('Google Apps Script API URL is not configured.');
    }

    const method = String(options.method || 'GET').toUpperCase();
    const query = new URLSearchParams({ action });
    const fetchOptions = { method };

    if (method === 'GET') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query.set(key, value);
      });
    } else {
      fetchOptions.body = new URLSearchParams(
        Object.entries(params).reduce((payload, [key, value]) => {
          if (value !== undefined && value !== null) payload[key] = value;
          return payload;
        }, {})
      );
    }

    const response = await fetch(`${APPS_SCRIPT_API_BASE}?${query.toString()}`, fetchOptions);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.success === false) {
      throw API._makeHttpError(response.status || 500, payload);
    }

    return payload.data;
  }

  static appsScriptGetUsers() {
    return this.appsScriptAction('getUsers');
  }

  static appsScriptGetUser(userId) {
    return this.appsScriptAction('getUser', { userId });
  }

  static appsScriptCreateUser(user) {
    return this.appsScriptAction('createUser', {
      name: user?.name || '',
      bio: user?.bio || '',
      photo_url: user?.photo_url || ''
    }, { method: 'POST' });
  }

  static appsScriptUpdateUser(user) {
    return this.appsScriptAction('updateUser', {
      userId: user?.userId || user?.id,
      name: user?.name,
      bio: user?.bio,
      photo_url: user?.photo_url
    }, { method: 'POST' });
  }

  static appsScriptGetMedals(userId) {
    return this.appsScriptAction('getMedals', { userId });
  }

  static appsScriptAddMedal(medal) {
    return this.appsScriptAction('addMedal', {
      userId: medal?.userId || medal?.user_id,
      medal_name: medal?.medal_name || medal?.medalName,
      date: medal?.date
    }, { method: 'POST' });
  }

  static appsScriptGetNotifications(userId) {
    return this.appsScriptAction('getNotifications', { userId });
  }

  static appsScriptCreateNotification(notification) {
    return this.appsScriptAction('createNotification', {
      userId: notification?.userId || notification?.user_id,
      message: notification?.message,
      read: notification?.read
    }, { method: 'POST' });
  }

  static appsScriptMarkNotificationRead(notification) {
    return this.appsScriptAction('markNotificationRead', {
      notificationId: notification?.notificationId || notification?.id,
      userId: notification?.userId || notification?.user_id
    }, { method: 'POST' });
  }

  static appsScriptMarkAllNotificationsRead(userId) {
    return this.appsScriptAction('markAllNotificationsRead', { userId }, { method: 'POST' });
  }

  static appsScriptGetLessonPlans(userId, limit = 50, offset = 0) {
    return this.appsScriptAction('getLessonPlans', { userId, limit, offset });
  }

  static appsScriptGetLessonPlan(userId, id) {
    return this.appsScriptAction('getLessonPlan', { userId, id });
  }

  static appsScriptCreateLessonPlan(plan) {
    return this.appsScriptAction('createLessonPlan', plan, { method: 'POST' });
  }

  static appsScriptSaveClassPlan(plan) {
    return this.appsScriptAction('saveClassPlan', plan, { method: 'POST' });
  }

  static appsScriptUpdateLessonPlan(plan) {
    return this.appsScriptAction('updateLessonPlan', plan, { method: 'POST' });
  }

  static appsScriptDeleteLessonPlan(userId, id) {
    return this.appsScriptAction('deleteLessonPlan', { userId, id }, { method: 'POST' });
  }

  static appsScriptGetRewards(userId) {
    return this.appsScriptAction('getRewards', { userId });
  }

  static appsScriptClaimDailyBonus(userId) {
    return this.appsScriptAction('claimDailyBonus', { userId }, { method: 'POST' });
  }

  static appsScriptGetLeaderboard(limit = 10) {
    return this.appsScriptAction('getLeaderboard', { limit });
  }

  static appsScriptGetActivities(userId, limit = 20, offset = 0) {
    return this.appsScriptAction('getActivities', { userId, limit, offset });
  }

  static appsScriptGetActivitiesByCategory(userId, category, limit = 20, offset = 0) {
    return this.appsScriptAction('getActivitiesByCategory', { userId, category, limit, offset });
  }

  static appsScriptGetUserActivities(currentUserId, targetUserId, limit = 20, offset = 0) {
    return this.appsScriptAction('getUserActivities', { userId: currentUserId, targetUserId, limit, offset });
  }

  static appsScriptCreateActivity(activity) {
    return this.appsScriptAction('createActivity', activity, { method: 'POST' });
  }

  static appsScriptLikeActivity(userId, activityId) {
    return this.appsScriptAction('likeActivity', { userId, activityId }, { method: 'POST' });
  }

  static appsScriptUnlikeActivity(userId, activityId) {
    return this.appsScriptAction('unlikeActivity', { userId, activityId }, { method: 'POST' });
  }

  static appsScriptDeleteActivity(userId, activityId) {
    return this.appsScriptAction('deleteActivity', { userId, activityId }, { method: 'POST' });
  }

  static normalizeAppsScriptUser(user = {}) {
    return this.publicUser({
      ...user,
      role: user.role || 'teacher',
      avatar_url: user.avatar_url || user.photo_url || '',
      photo_url: user.photo_url || user.avatar_url || ''
    });
  }

  static getStoredAppsScriptUser() {
    return this.readStaticStore('user', null);
  }

  static requireAppsScriptUser() {
    const user = this.getStoredAppsScriptUser();
    if (!user?.id) throw API._makeHttpError(401, { error: 'Create an account first.' });
    return user;
  }

  static async appsScriptRewardsForUser(userId) {
    const rewards = await this.appsScriptGetRewards(userId);
    const badges = (rewards.badges || []).map(badge => {
      const id = String(badge.id || badge.medal_name || badge.name || 'medal');
      const defined = this.staticBadgeDefinitions[id];
      return defined
        ? { ...defined, date: badge.date || badge.created_at || '' }
        : {
            id,
            name: badge.name || id,
            description: badge.description || 'Achievement unlocked.',
            icon: badge.icon || 'Badge',
            date: badge.date || ''
          };
    });
    const points = Number(rewards.points || 0);
    return {
      userId,
      points,
      badges,
      badgeIds: badges.map(badge => badge.id),
      level: rewards.level || this.calculateLevel(points)
    };
  }

  static async appsScriptRequest(endpoint, options = {}) {
    const { path, query } = this.parseEndpoint(endpoint);
    const method = String(options.method || 'GET').toUpperCase();
    const body = this.parseRequestBody(options);

    if (path === '/auth/register' && method === 'POST') {
      const name = String(body.name || '').trim();
      if (!name) throw API._makeHttpError(400, { error: 'Name is required' });
      const created = await this.appsScriptCreateUser({
        name,
        bio: '',
        photo_url: body.photo_url || ''
      });
      const user = this.normalizeAppsScriptUser({ ...created, email: body.email || '' });
      return {
        token: `apps-script-${user.id}-${Date.now()}`,
        user
      };
    }

    if (path === '/auth/login' && method === 'POST') {
      const identifier = String(body.email || body.name || body.userId || '').trim().toLowerCase();
      const users = await this.appsScriptGetUsers();
      const user = (users || []).find(item => {
        const name = String(item.name || '').trim().toLowerCase();
        const id = String(item.id || '').trim().toLowerCase();
        return identifier && (name === identifier || id === identifier);
      });

      if (!user) {
        throw API._makeHttpError(404, {
          error: 'User not found in Google Sheets. Use Create Account first, or log in with the exact name or user ID.'
        });
      }

      return {
        token: `apps-script-${user.id}-${Date.now()}`,
        user: this.normalizeAppsScriptUser({ ...user, email: body.email || '' })
      };
    }

    if (path === '/auth/profile' && method === 'GET') {
      const stored = this.requireAppsScriptUser();
      const latest = await this.appsScriptGetUser(stored.id);
      return this.normalizeAppsScriptUser({ ...stored, ...(latest || {}) });
    }

    if (path === '/auth/profile' && method === 'PUT') {
      const stored = this.requireAppsScriptUser();
      const updated = await this.appsScriptUpdateUser({
        userId: stored.id,
        name: body.name ?? stored.name,
        bio: body.bio ?? stored.bio ?? '',
        photo_url: ''
      });
      return this.normalizeAppsScriptUser({ ...stored, ...body, ...updated });
    }

    const publicProfileMatch = path.match(/^\/users\/([^/]+)\/profile$/);
    if (publicProfileMatch && method === 'GET') {
      const user = await this.appsScriptGetUser(decodeURIComponent(publicProfileMatch[1]));
      if (!user) throw API._makeHttpError(404, { error: 'User not found' });
      return this.normalizeAppsScriptUser(user);
    }

    if (path === '/rewards' && method === 'GET') {
      return this.appsScriptRewardsForUser(this.requireAppsScriptUser().id);
    }

    if (path === '/rewards/daily-bonus' && method === 'POST') {
      return this.appsScriptClaimDailyBonus(this.requireAppsScriptUser().id);
    }

    if (path === '/rewards/leaderboard' && method === 'GET') {
      const limit = parseInt(query.get('limit'), 10) || 10;
      const leaderboard = await this.appsScriptGetLeaderboard(limit);
      return { leaderboard };
    }

    if (path === '/notifications' && method === 'GET') {
      const user = this.requireAppsScriptUser();
      const limit = parseInt(query.get('limit'), 10) || 30;
      const offset = parseInt(query.get('offset'), 10) || 0;
      const allNotifications = (await this.appsScriptGetNotifications(user.id) || [])
        .map(item => ({
          ...item,
          title: item.title || 'Notification',
          type: item.type || 'info',
          created_at: item.created_at || item.timestamp,
          read: Boolean(item.read)
        }));
      return {
        notifications: allNotifications.slice(offset, offset + limit),
        unreadCount: allNotifications.filter(item => !item.read).length
      };
    }

    if (path === '/notifications/unread-count' && method === 'GET') {
      const { unreadCount } = await this.appsScriptRequest('/notifications');
      return { unreadCount };
    }

    if (path === '/notifications/mark-all-read' && method === 'POST') {
      const user = this.requireAppsScriptUser();
      return this.appsScriptMarkAllNotificationsRead(user.id);
    }

    const notificationReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
    if (notificationReadMatch && method === 'POST') {
      const user = this.requireAppsScriptUser();
      await this.appsScriptMarkNotificationRead({
        id: decodeURIComponent(notificationReadMatch[1]),
        userId: user.id
      });
      return { updated: true };
    }

    if (path === '/lesson-plans/metadata/books' && method === 'GET') {
      return this.staticRequest(endpoint, options);
    }

    const lessonMetadataMatch = path.match(/^\/lesson-plans\/metadata\/lessons\/([^/]+)$/);
    if (lessonMetadataMatch && method === 'GET') {
      return this.staticRequest(endpoint, options);
    }

    if (path === '/lesson-plans/generate' && method === 'POST') {
      const user = this.requireAppsScriptUser();
      const result = await this.staticRequest(endpoint, options);
      if (result?.output) {
        const saved = await this.appsScriptSaveClassPlan({
          userId: user.id,
          title: `Aula Turma ${new Date().toLocaleDateString('pt-BR')}`,
          alunos_json: JSON.stringify({ alunos: this.extractStaticStudents(body.texto || body.rawInput || '') }),
          output: result.output
        });
        return { ...result, saved: true, id: saved.id };
      }
      return result;
    }

    if (path === '/lesson-plans/save-class' && method === 'POST') {
      const user = this.getStoredAppsScriptUser();
      return this.appsScriptSaveClassPlan({
        userId: user.id,
        title: body.title,
        alunos_json: body.alunos_json,
        output: body.output
      });
    }

    if (path === '/lesson-plans' && method === 'GET') {
      const user = this.requireAppsScriptUser();
      const limit = parseInt(query.get('limit'), 10) || 50;
      const offset = parseInt(query.get('offset'), 10) || 0;
      return this.appsScriptGetLessonPlans(user.id, limit, offset);
    }

    if (path === '/lesson-plans' && method === 'POST') {
      const user = this.requireAppsScriptUser();
      return this.appsScriptCreateLessonPlan({
        userId: user.id,
        studentName: body.studentName,
        book: body.book,
        lesson: body.lesson,
        objectives: JSON.stringify(body.objectives || []),
        checkTime: body.checkTime,
        notes: body.notes
      });
    }

    const lessonPlanMatch = path.match(/^\/lesson-plans\/([^/]+)$/);
    if (lessonPlanMatch) {
      const user = this.requireAppsScriptUser();
      const id = decodeURIComponent(lessonPlanMatch[1]);
      if (method === 'GET') return this.appsScriptGetLessonPlan(user.id, id);
      if (method === 'DELETE') return this.appsScriptDeleteLessonPlan(user.id, id);
      if (method === 'PUT') {
        return this.appsScriptUpdateLessonPlan({
          userId: user.id,
          id,
          studentName: body.studentName,
          book: body.book,
          lesson: body.lesson,
          objectives: JSON.stringify(body.objectives || []),
          checkTime: body.checkTime,
          notes: body.notes
        });
      }
    }

    if (path === '/activities' && method === 'GET') {
      const user = this.requireAppsScriptUser();
      const limit = parseInt(query.get('limit'), 10) || 20;
      const offset = parseInt(query.get('offset'), 10) || 0;
      return this.appsScriptGetActivities(user.id, limit, offset);
    }

    const activitiesCategoryMatch = path.match(/^\/activities\/category\/([^/]+)$/);
    if (activitiesCategoryMatch && method === 'GET') {
      const user = this.requireAppsScriptUser();
      const category = decodeURIComponent(activitiesCategoryMatch[1]);
      const limit = parseInt(query.get('limit'), 10) || 20;
      const offset = parseInt(query.get('offset'), 10) || 0;
      return this.appsScriptGetActivitiesByCategory(user.id, category, limit, offset);
    }

    const activitiesUserMatch = path.match(/^\/activities\/user\/([^/]+)$/);
    if (activitiesUserMatch && method === 'GET') {
      const user = this.requireAppsScriptUser();
      const targetUserId = decodeURIComponent(activitiesUserMatch[1]);
      const limit = parseInt(query.get('limit'), 10) || 20;
      const offset = parseInt(query.get('offset'), 10) || 0;
      return this.appsScriptGetUserActivities(user.id, targetUserId, limit, offset);
    }

    const activityLikeMatch = path.match(/^\/activities\/([^/]+)\/(like|unlike)$/);
    if (activityLikeMatch && method === 'POST') {
      const user = this.requireAppsScriptUser();
      const activityId = decodeURIComponent(activityLikeMatch[1]);
      return activityLikeMatch[2] === 'like'
        ? this.appsScriptLikeActivity(user.id, activityId)
        : this.appsScriptUnlikeActivity(user.id, activityId);
    }

    const activityMatch = path.match(/^\/activities\/([^/]+)$/);
    if (activityMatch && method === 'DELETE') {
      const user = this.requireAppsScriptUser();
      return this.appsScriptDeleteActivity(user.id, decodeURIComponent(activityMatch[1]));
    }

    return this.staticRequest(endpoint, options);
  }

  static readStaticStore(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  static writeStaticStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  static nextStaticId(items) {
    return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  }

  static publicUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'teacher',
      bio: user.bio || '',
      location: user.location || '',
      phone: user.phone || '',
      specialties: user.specialties || '',
      avatar_url: user.avatar_url || user.photo_url || '',
      photo_url: user.photo_url || user.avatar_url || ''
    };
  }

  static ensureStaticSeed() {
    const demoEmail = 'eduardomoretti@wizard.com';
    let users = this.readStaticStore(this.staticKeys.users, []);
    const hasDemo = users.some(user => String(user.email || '').toLowerCase() === demoEmail);

    if (!hasDemo) {
      users.unshift({
        id: this.nextStaticId(users),
        name: 'Eduardo Moretti',
        email: demoEmail,
        password: '123456789',
        role: 'teacher',
        bio: '',
        location: '',
        phone: '',
        specialties: '',
        avatar_url: '',
        created_at: new Date().toISOString()
      });
      this.writeStaticStore(this.staticKeys.users, users);
    }

    const rewards = this.readStaticStore(this.staticKeys.rewards, {});
    let changed = false;
    users.forEach(user => {
      if (!rewards[user.id]) {
        rewards[user.id] = {
          userId: user.id,
          points: 0,
          badges: [],
          last_bonus_date: ''
        };
        changed = true;
      }
    });
    if (changed) this.writeStaticStore(this.staticKeys.rewards, rewards);
  }

  static parseRequestBody(options) {
    if (!options.body) return {};
    if (typeof options.body !== 'string') return options.body;
    try {
      return JSON.parse(options.body);
    } catch {
      return {};
    }
  }

  static parseEndpoint(endpoint) {
    const [path, queryString = ''] = String(endpoint).split('?');
    return { path, query: new URLSearchParams(queryString) };
  }

  static getStaticCurrentUser() {
    this.ensureStaticSeed();
    const token = localStorage.getItem('token');
    if (!token) return null;

    const storedUser = this.readStaticStore('user', null);
    let users = this.readStaticStore(this.staticKeys.users, []);
    let current = users.find(user =>
      (storedUser?.id != null && String(user.id) === String(storedUser.id)) ||
      (storedUser?.email && String(user.email).toLowerCase() === String(storedUser.email).toLowerCase())
    );

    if (!current && this.isAppsScriptMode && storedUser?.id != null) {
      current = {
        id: storedUser.id,
        name: storedUser.name || 'Teacher',
        email: storedUser.email || '',
        role: storedUser.role || 'teacher',
        bio: storedUser.bio || '',
        avatar_url: storedUser.avatar_url || storedUser.photo_url || '',
        created_at: storedUser.created_at || new Date().toISOString()
      };
      users.push(current);
      this.writeStaticStore(this.staticKeys.users, users);
    }

    return current || null;
  }

  static requireStaticUser() {
    const user = this.getStaticCurrentUser();
    if (!user) throw API._makeHttpError(401, { error: 'Unauthorized' });
    return user;
  }

  static calculateLevel(points) {
    if (points < 50) return 'Beginner';
    if (points < 150) return 'Intermediate';
    if (points < 300) return 'Advanced';
    if (points < 500) return 'Expert';
    return 'Master';
  }

  static getStaticRewards(userId) {
    const rewards = this.readStaticStore(this.staticKeys.rewards, {});
    if (!rewards[userId]) {
      rewards[userId] = { userId, points: 0, badges: [], last_bonus_date: '' };
      this.writeStaticStore(this.staticKeys.rewards, rewards);
    }
    return rewards[userId];
  }

  static decorateStaticBadges(badges) {
    return (badges || []).map(badge => {
      const id = typeof badge === 'string' ? badge : badge.id;
      return this.staticBadgeDefinitions[id] || { id, name: id, description: 'Custom achievement.', icon: 'Badge' };
    });
  }

  static createStaticNotification(userId, type, title, message, metadata = {}) {
    const notifications = this.readStaticStore(this.staticKeys.notifications, []);
    notifications.unshift({
      id: this.nextStaticId(notifications),
      user_id: userId,
      type,
      title,
      message,
      metadata,
      read_at: '',
      created_at: new Date().toISOString()
    });
    this.writeStaticStore(this.staticKeys.notifications, notifications);
  }

  static addStaticBadge(userId, badgeId) {
    const rewards = this.readStaticStore(this.staticKeys.rewards, {});
    const current = rewards[userId] || { userId, points: 0, badges: [], last_bonus_date: '' };
    const ids = current.badges.map(badge => typeof badge === 'string' ? badge : badge.id).filter(Boolean);
    if (!ids.includes(badgeId)) {
      current.badges = [...ids, badgeId];
      rewards[userId] = current;
      this.writeStaticStore(this.staticKeys.rewards, rewards);
      const badge = this.staticBadgeDefinitions[badgeId] || { name: badgeId, description: 'New badge unlocked.' };
      this.createStaticNotification(userId, 'badge', `New badge: ${badge.name}`, badge.description, { badgeId });
    }
  }

  static evaluateStaticBadges(userId, reason = '') {
    const user = this.readStaticStore(this.staticKeys.users, []).find(item => String(item.id) === String(userId));
    const reward = this.getStaticRewards(userId);
    const points = Number(reward.points || 0);
    if (reason === 'first_lesson') this.addStaticBadge(userId, 'first_lesson');
    if (reason === 'first_post') this.addStaticBadge(userId, 'first_post');
    if (reason === 'first_like_given') this.addStaticBadge(userId, 'first_like_given');
    if (reason === 'first_like_received') this.addStaticBadge(userId, 'first_like_received');
    if (reason === 'daily_bonus') this.addStaticBadge(userId, 'daily_bonus');
    if (user?.bio && user?.avatar_url) this.addStaticBadge(userId, 'profile_complete');
    if (points >= 50) this.addStaticBadge(userId, 'points_50');
    if (points >= 150) this.addStaticBadge(userId, 'points_150');
    if (points >= 300) this.addStaticBadge(userId, 'points_300');
    if (points >= 500) this.addStaticBadge(userId, 'points_500');
  }

  static awardStaticPoints(userId, points) {
    const rewards = this.readStaticStore(this.staticKeys.rewards, {});
    const current = rewards[userId] || { userId, points: 0, badges: [], last_bonus_date: '' };
    current.points = Number(current.points || 0) + points;
    rewards[userId] = current;
    this.writeStaticStore(this.staticKeys.rewards, rewards);
    this.evaluateStaticBadges(userId);
    return { awarded: true, points };
  }

  static async loadStaticPlannerData() {
    if (!this.staticPlannerDataPromise) {
      const baseUrl = new URL('.', window.location.href);
      this.staticPlannerDataPromise = Promise.all([
        fetch(new URL('shared/learningObjectives.json', baseUrl)).then(res => res.json()),
        fetch(new URL('shared/Lessons.json', baseUrl)).then(res => res.json())
      ]).then(([learningObjectives, lessons]) => ({ learningObjectives, lessons }));
    }
    return this.staticPlannerDataPromise;
  }

  static extractStaticStudents(texto) {
    return String(texto || '')
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [nome, livro, numeroRaw] = line.split(/\t| {2,}/);
        return {
          nome: nome ? nome.trim() : '',
          livro: livro ? livro.trim().toUpperCase() : '',
          numeroRaw: numeroRaw ? numeroRaw.trim() : ''
        };
      })
      .filter(student => student.nome && student.livro && student.numeroRaw);
  }

  static addMinutes(hourString, minutes) {
    const [hours, mins] = hourString.split(':').map(Number);
    const total = hours * 60 + mins + minutes;
    const nextHours = ((Math.floor(total / 60) % 24) + 24) % 24;
    const nextMins = (total % 60 + 60) % 60;
    return `${nextHours < 10 ? '0' : ''}${nextHours}:${nextMins < 10 ? '0' : ''}${nextMins}`;
  }

  static normalizeStaticReview(input) {
    const value = String(input || '').trim().toUpperCase();
    if (value === 'WL' || value === 'UL') return '1000';
    if (value === 'PP') return '1001';
    if (value === 'WE') return '1002';
    if (value === 'CP') return '1005';

    const match = value.match(/^R(EVIEW)?\s*(\d+)$/i) || value.match(/^R(X|EVIEW)?\s*(\d+)$/i);
    if (match) {
      const num = match[2];
      return num === '10' ? '1010' : num.repeat(4);
    }

    if (/^(\d)\1{3}$/.test(value)) return value;
    return value;
  }

  static staticReviewCodeToRx(code) {
    if (code === '1010') return 'R10';
    const match = code.match(/^(\d)\1{3}$/);
    return match ? `R${match[1]}` : code;
  }

  static staticPlanCategory(item) {
    const value = item.proximaLicao;
    if (['UL', 'WL', 'PP', 'WE', 'CP'].includes(value)) return 5;
    if (value === 'Finished the Book/EC') return 4;
    if (/^R\d+$/.test(value)) return 3;
    return parseInt(value, 10) % 2 === 0 ? 1 : 2;
  }

  static staticPlanSortValue(item) {
    const value = item.proximaLicao;
    const category = this.staticPlanCategory(item);
    if (category === 3) return parseInt(value.slice(1), 10);
    if (category === 1 || category === 2) return parseInt(value, 10);
    return Infinity;
  }

  static async processStaticLessonPlannerText(texto, horarioStr) {
    const students = this.extractStaticStudents(texto);
    const { learningObjectives, lessons } = await this.loadStaticPlannerData();
    const reviewCodes = ['1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1010'];
    const ulBooks = ['NG', 'NK2', 'NT2', 'NW2'];

    const result = students.map(student => {
      const sequence = lessons[student.livro];
      if (!sequence) return null;

      const normalizedSequence = sequence.map(item => this.normalizeStaticReview(item));
      const currentCode = this.normalizeStaticReview(student.numeroRaw);
      const currentIndex = normalizedSequence.indexOf(currentCode);
      if (currentIndex === -1) return null;

      const nextRaw = sequence[currentIndex + 1];
      if (!nextRaw || nextRaw === '000') {
        return {
          nome: student.nome,
          livro: student.livro,
          proximaLicao: 'Finished the Book/EC',
          objetivos: 'Livro Concluido. Prova Final/End of Course (EC).'
        };
      }

      const nextCode = this.normalizeStaticReview(nextRaw);
      let nextFormatted;
      if (reviewCodes.includes(nextCode)) nextFormatted = this.staticReviewCodeToRx(nextCode);
      else if (nextCode === '1000') nextFormatted = ulBooks.includes(student.livro) ? 'UL' : 'WL';
      else if (nextCode === '1001') nextFormatted = 'PP';
      else if (nextCode === '1002') nextFormatted = 'WE';
      else if (nextCode === '1005') nextFormatted = 'CP';
      else nextFormatted = nextCode;

      const bookObjectives = learningObjectives[student.livro];
      let objectiveKey = nextFormatted;
      const nextLessonNumber = parseInt(nextFormatted, 10);

      if (!Number.isNaN(nextLessonNumber)) {
        objectiveKey = nextLessonNumber % 2 === 0 ? String(nextLessonNumber - 1) : nextFormatted;
      }
      if (nextFormatted === 'WL' || nextFormatted === 'UL') objectiveKey = '1000';
      if (nextFormatted === 'PP') objectiveKey = '1001';
      if (nextFormatted === 'WE') objectiveKey = '1002';
      if (nextFormatted === 'CP') objectiveKey = '1005';
      if (nextFormatted === 'R10') objectiveKey = '1010';

      let objetivos = bookObjectives
        ? bookObjectives[objectiveKey] || bookObjectives[nextFormatted] || `Objetivo nao especificado para ${nextFormatted} (Licao complementar ou nao mapeada).`
        : `Objetivos nao mapeados para o livro ${student.livro}.`;

      if (nextFormatted.startsWith('R') && !objetivos.includes('Objetivo nao especificado') && objetivos.length < 50) {
        objetivos = `Licao de Revisao (${nextFormatted}).`;
      }
      if ((nextFormatted === 'WL' || nextFormatted === 'UL') && !objetivos.includes('Objetivo nao especificado') && objetivos.length < 50) {
        objetivos = 'Licao de Boas-Vindas/Nivelamento (WL/UL).';
      }

      return {
        nome: student.nome,
        livro: student.livro,
        proximaLicao: nextFormatted,
        objetivos
      };
    }).filter(Boolean);

    result.sort((a, b) => {
      const categoryA = this.staticPlanCategory(a);
      const categoryB = this.staticPlanCategory(b);
      if (categoryA !== categoryB) return categoryA - categoryB;
      return this.staticPlanSortValue(a) - this.staticPlanSortValue(b);
    });

    const checks = [];
    if (horarioStr) {
      const classEnd = this.addMinutes(horarioStr, 60);
      for (let i = 0; i < result.length; i++) {
        checks[i] = this.addMinutes(classEnd, -5 * (result.length - i));
      }
    }

    return result.map((item, index) => {
      let line = `${item.nome}\t${item.livro}\t${item.proximaLicao}`;
      if (horarioStr) line += `\t${checks[index]}`;
      line += `\t${item.objetivos}`;
      return line;
    }).join('\n');
  }

  static saveStaticClassPlan(userId, title, alunosJson, output) {
    const plans = this.readStaticStore(this.staticKeys.lessonPlans, []);
    const plan = {
      id: this.nextStaticId(plans),
      user_id: userId,
      student_name: title || `Plano Turma ${new Date().toLocaleDateString()}`,
      book: 'Turma',
      lesson: 0,
      objectives: alunosJson,
      notes: output,
      check_time: 'Turma',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    plans.unshift(plan);
    this.writeStaticStore(this.staticKeys.lessonPlans, plans);
    this.awardStaticPoints(userId, 20);
    this.evaluateStaticBadges(userId, 'first_lesson');
    return { id: plan.id, title: plan.student_name, type: 'class' };
  }

  static getStaticLessonPlansForUser(userId, limit = 50, offset = 0) {
    return this.readStaticStore(this.staticKeys.lessonPlans, [])
      .filter(plan => String(plan.user_id) === String(userId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit);
  }

  static toStaticActivityResponse(activity, currentUserId) {
    const users = this.readStaticStore(this.staticKeys.users, []);
    const creator = users.find(user => String(user.id) === String(activity.created_by));
    const likedBy = Array.isArray(activity.likedBy) ? activity.likedBy : [];
    return {
      ...activity,
      creator_name: creator?.name || 'Teacher',
      creator_bio: creator?.bio || '',
      creator_location: creator?.location || '',
      creator_specialties: creator?.specialties || '',
      creator_avatar_url: creator?.avatar_url || '',
      likedByCurrentUser: likedBy.some(id => String(id) === String(currentUserId))
    };
  }

  static async staticRequest(endpoint, options = {}) {
    this.ensureStaticSeed();

    const { path, query } = this.parseEndpoint(endpoint);
    const method = String(options.method || 'GET').toUpperCase();
    const body = this.parseRequestBody(options);

    if (path === '/auth/register' && method === 'POST') {
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!name || !email || !password) {
        throw API._makeHttpError(400, { error: 'Missing required fields' });
      }

      const users = this.readStaticStore(this.staticKeys.users, []);
      if (users.some(user => String(user.email || '').toLowerCase() === email)) {
        throw API._makeHttpError(409, { error: 'Email already registered' });
      }

      const user = {
        id: this.nextStaticId(users),
        name,
        email,
        password,
        role: 'teacher',
        created_at: new Date().toISOString()
      };
      users.push(user);
      this.writeStaticStore(this.staticKeys.users, users);
      this.getStaticRewards(user.id);
      return this.publicUser(user);
    }

    if (path === '/auth/login' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const users = this.readStaticStore(this.staticKeys.users, []);
      const user = users.find(item => String(item.email || '').toLowerCase() === email);
      if (!user) throw API._makeHttpError(404, { error: 'User not found' });
      if (String(user.password || '') !== password) throw API._makeHttpError(401, { error: 'Invalid password' });

      return {
        token: `static-${user.id}-${Date.now()}`,
        user: this.publicUser(user)
      };
    }

    if (path === '/auth/profile' && method === 'GET') {
      return this.publicUser(this.requireStaticUser());
    }

    if (path === '/auth/profile' && method === 'PUT') {
      const current = this.requireStaticUser();
      const users = this.readStaticStore(this.staticKeys.users, []);
      const index = users.findIndex(user => String(user.id) === String(current.id));
      users[index] = {
        ...users[index],
        name: String(body.name || current.name || '').trim(),
        bio: String(body.bio || '').trim(),
        location: String(body.location || '').trim(),
        phone: String(body.phone || '').trim(),
        specialties: String(body.specialties || '').trim()
      };
      this.writeStaticStore(this.staticKeys.users, users);
      this.evaluateStaticBadges(current.id, 'profile_update');
      return this.publicUser(users[index]);
    }

    const publicProfileMatch = path.match(/^\/users\/([^/]+)\/profile$/);
    if (publicProfileMatch && method === 'GET') {
      this.requireStaticUser();
      const users = this.readStaticStore(this.staticKeys.users, []);
      const user = users.find(item => String(item.id) === decodeURIComponent(publicProfileMatch[1]));
      if (!user) throw API._makeHttpError(404, { error: 'User not found' });
      const { email, password, phone, ...publicUser } = user;
      return publicUser;
    }

    if (path === '/lesson-plans/metadata/books' && method === 'GET') {
      const { lessons } = await this.loadStaticPlannerData();
      return { books: Object.keys(lessons).sort() };
    }

    const lessonMetadataMatch = path.match(/^\/lesson-plans\/metadata\/lessons\/([^/]+)$/);
    if (lessonMetadataMatch && method === 'GET') {
      const book = decodeURIComponent(lessonMetadataMatch[1]).toUpperCase();
      const { lessons } = await this.loadStaticPlannerData();
      if (!lessons[book]) throw API._makeHttpError(404, { error: 'Unknown book' });
      return { book, lessons: lessons[book] };
    }

    if (path === '/lesson-plans/generate' && method === 'POST') {
      const user = this.requireStaticUser();
      const texto = typeof body.texto === 'string'
        ? body.texto
        : typeof body.rawInput === 'string'
          ? body.rawInput
          : typeof body.input === 'string'
            ? body.input
            : '';
      const horario = typeof body.horarioStr === 'string'
        ? body.horarioStr
        : typeof body.horario === 'string'
          ? body.horario
          : '';

      if (!texto.trim()) {
        throw API._makeHttpError(400, { error: 'No input text. Paste tab-separated: Name\tBook\tLesson (Excel copy).' });
      }

      const output = await this.processStaticLessonPlannerText(texto, horario);
      if (!output.trim()) {
        throw API._makeHttpError(400, { error: 'No valid plans generated. Check the book, lesson, and tab-separated input.' });
      }

      this.awardStaticPoints(user.id, 10);
      const recentPlans = this.getStaticLessonPlansForUser(user.id, 1, 0);
      let saved = false;
      if (!recentPlans.length || recentPlans[0].notes !== output) {
        const alunosData = { alunos: this.extractStaticStudents(texto) };
        this.saveStaticClassPlan(user.id, `Aula Turma ${new Date().toLocaleDateString()}`, JSON.stringify(alunosData), output);
        saved = true;
      }
      return { output, saved };
    }

    if (path === '/lesson-plans/save-class' && method === 'POST') {
      const user = this.requireStaticUser();
      if (!body.alunos_json || !body.output) {
        throw API._makeHttpError(400, { error: 'alunos_json and output required' });
      }
      return this.saveStaticClassPlan(user.id, body.title, body.alunos_json, body.output);
    }

    if (path === '/lesson-plans' && method === 'GET') {
      const user = this.requireStaticUser();
      const limit = parseInt(query.get('limit'), 10) || 50;
      const offset = parseInt(query.get('offset'), 10) || 0;
      return this.getStaticLessonPlansForUser(user.id, limit, offset);
    }

    if (path === '/lesson-plans' && method === 'POST') {
      const user = this.requireStaticUser();
      const studentName = String(body.studentName || '').trim();
      const book = String(body.book || '').trim();
      const lesson = parseInt(String(body.lesson || '').trim(), 10);
      if (!studentName || !book || !Number.isFinite(lesson)) {
        throw API._makeHttpError(400, { error: 'Missing required fields (studentName, book, lesson)' });
      }

      const plans = this.readStaticStore(this.staticKeys.lessonPlans, []);
      const plan = {
        id: this.nextStaticId(plans),
        user_id: user.id,
        student_name: studentName,
        book,
        lesson,
        objectives: body.objectives || [],
        check_time: typeof body.checkTime === 'string' ? body.checkTime : String(body.checkTime || ''),
        notes: body.notes != null ? String(body.notes) : '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      plans.unshift(plan);
      this.writeStaticStore(this.staticKeys.lessonPlans, plans);
      this.awardStaticPoints(user.id, 10);
      return { id: plan.id, userId: user.id, studentName, book, lesson };
    }

    const lessonPlanMatch = path.match(/^\/lesson-plans\/(\d+)$/);
    if (lessonPlanMatch) {
      const user = this.requireStaticUser();
      const planId = Number(lessonPlanMatch[1]);
      const plans = this.readStaticStore(this.staticKeys.lessonPlans, []);
      const index = plans.findIndex(plan => Number(plan.id) === planId && String(plan.user_id) === String(user.id));
      if (index === -1) throw API._makeHttpError(404, { error: 'Lesson plan not found' });

      if (method === 'GET') return plans[index];
      if (method === 'DELETE') {
        plans.splice(index, 1);
        this.writeStaticStore(this.staticKeys.lessonPlans, plans);
        return { message: 'Lesson plan deleted' };
      }
      if (method === 'PUT') {
        const updates = {
          student_name: body.studentName ?? plans[index].student_name,
          book: body.book ?? plans[index].book,
          lesson: body.lesson ?? plans[index].lesson,
          objectives: body.objectives ?? plans[index].objectives,
          check_time: body.checkTime ?? plans[index].check_time,
          notes: body.notes ?? plans[index].notes,
          updated_at: new Date().toISOString()
        };
        plans[index] = { ...plans[index], ...updates };
        this.writeStaticStore(this.staticKeys.lessonPlans, plans);
        return { message: 'Lesson plan updated', id: planId, updated: true };
      }
    }

    if (path === '/rewards' && method === 'GET') {
      const user = this.requireStaticUser();
      const rewards = this.getStaticRewards(user.id);
      return {
        userId: user.id,
        points: Number(rewards.points || 0),
        badges: this.decorateStaticBadges(Array.isArray(rewards.badges) ? rewards.badges : []),
        badgeIds: Array.isArray(rewards.badges) ? rewards.badges.map(badge => typeof badge === 'string' ? badge : badge.id) : [],
        level: this.calculateLevel(Number(rewards.points || 0))
      };
    }

    if (path === '/rewards/daily-bonus' && method === 'POST') {
      const user = this.requireStaticUser();
      const rewards = this.readStaticStore(this.staticKeys.rewards, {});
      const current = rewards[user.id] || { userId: user.id, points: 0, badges: [], last_bonus_date: '' };
      const today = new Date().toISOString().split('T')[0];
      if (current.last_bonus_date === today) {
        return { bonusAwarded: false, message: 'Bonus already claimed today' };
      }
      current.points = Number(current.points || 0) + 5;
      current.last_bonus_date = today;
      rewards[user.id] = current;
      this.writeStaticStore(this.staticKeys.rewards, rewards);
      this.evaluateStaticBadges(user.id, 'daily_bonus');
      return { bonusAwarded: true, points: 5 };
    }

    if (path === '/notifications' && method === 'GET') {
      const user = this.requireStaticUser();
      const limit = parseInt(query.get('limit'), 10) || 30;
      const offset = parseInt(query.get('offset'), 10) || 0;
      const allNotifications = this.readStaticStore(this.staticKeys.notifications, [])
        .filter(item => String(item.user_id) === String(user.id));
      return {
        notifications: allNotifications.slice(offset, offset + limit).map(item => ({ ...item, read: Boolean(item.read_at) })),
        unreadCount: allNotifications.filter(item => !item.read_at).length
      };
    }

    if (path === '/notifications/unread-count' && method === 'GET') {
      const user = this.requireStaticUser();
      const unreadCount = this.readStaticStore(this.staticKeys.notifications, [])
        .filter(item => String(item.user_id) === String(user.id) && !item.read_at).length;
      return { unreadCount };
    }

    if (path === '/notifications/mark-all-read' && method === 'POST') {
      const user = this.requireStaticUser();
      const notifications = this.readStaticStore(this.staticKeys.notifications, []);
      notifications.forEach(item => {
        if (String(item.user_id) === String(user.id) && !item.read_at) item.read_at = new Date().toISOString();
      });
      this.writeStaticStore(this.staticKeys.notifications, notifications);
      return { updated: true };
    }

    const notificationReadMatch = path.match(/^\/notifications\/(\d+)\/read$/);
    if (notificationReadMatch && method === 'POST') {
      const user = this.requireStaticUser();
      const notifications = this.readStaticStore(this.staticKeys.notifications, []);
      const notification = notifications.find(item =>
        Number(item.id) === Number(notificationReadMatch[1]) && String(item.user_id) === String(user.id)
      );
      if (notification) notification.read_at = new Date().toISOString();
      this.writeStaticStore(this.staticKeys.notifications, notifications);
      return { updated: Boolean(notification) };
    }

    if (path === '/rewards/leaderboard' && method === 'GET') {
      this.requireStaticUser();
      const limit = parseInt(query.get('limit'), 10) || 10;
      const users = this.readStaticStore(this.staticKeys.users, []);
      const rewards = this.readStaticStore(this.staticKeys.rewards, {});
      const leaderboard = users.map(user => {
        const reward = rewards[user.id] || {};
        const points = Number(reward.points || 0);
        return {
          id: user.id,
          name: user.name,
          bio: user.bio || '',
          location: user.location || '',
          specialties: user.specialties || '',
          points,
          level: this.calculateLevel(points),
          badges: this.decorateStaticBadges(reward.badges || [])
        };
      }).sort((a, b) => b.points - a.points).slice(0, limit).map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));
      return { leaderboard };
    }

    if (path === '/activities' && method === 'GET') {
      const user = this.requireStaticUser();
      const limit = parseInt(query.get('limit'), 10) || 20;
      const offset = parseInt(query.get('offset'), 10) || 0;
      return this.readStaticStore(this.staticKeys.activities, [])
        .slice(offset, offset + limit)
        .map(activity => this.toStaticActivityResponse(activity, user.id));
    }

    const activitiesCategoryMatch = path.match(/^\/activities\/category\/([^/]+)$/);
    if (activitiesCategoryMatch && method === 'GET') {
      const user = this.requireStaticUser();
      const category = decodeURIComponent(activitiesCategoryMatch[1]);
      const limit = parseInt(query.get('limit'), 10) || 20;
      const offset = parseInt(query.get('offset'), 10) || 0;
      return this.readStaticStore(this.staticKeys.activities, [])
        .filter(activity => activity.category === category)
        .slice(offset, offset + limit)
        .map(activity => this.toStaticActivityResponse(activity, user.id));
    }

    const activitiesUserMatch = path.match(/^\/activities\/user\/([^/]+)$/);
    if (activitiesUserMatch && method === 'GET') {
      const user = this.requireStaticUser();
      const targetUserId = decodeURIComponent(activitiesUserMatch[1]);
      const limit = parseInt(query.get('limit'), 10) || 20;
      const offset = parseInt(query.get('offset'), 10) || 0;
      return this.readStaticStore(this.staticKeys.activities, [])
        .filter(activity => String(activity.created_by) === String(targetUserId))
        .slice(offset, offset + limit)
        .map(activity => this.toStaticActivityResponse(activity, user.id));
    }

    const activityLikeMatch = path.match(/^\/activities\/(\d+)\/(like|unlike)$/);
    if (activityLikeMatch && method === 'POST') {
      const user = this.requireStaticUser();
      const activityId = Number(activityLikeMatch[1]);
      const action = activityLikeMatch[2];
      const activities = this.readStaticStore(this.staticKeys.activities, []);
      const activity = activities.find(item => Number(item.id) === activityId);
      if (!activity) throw API._makeHttpError(404, { error: 'Activity not found' });

      activity.likedBy = Array.isArray(activity.likedBy) ? activity.likedBy : [];
      const alreadyLiked = activity.likedBy.some(id => String(id) === String(user.id));
      if (action === 'like' && !alreadyLiked) activity.likedBy.push(user.id);
      if (action === 'unlike' && alreadyLiked) {
        activity.likedBy = activity.likedBy.filter(id => String(id) !== String(user.id));
      }
      activity.likes = activity.likedBy.length;
      this.writeStaticStore(this.staticKeys.activities, activities);
      if (action === 'like' && !alreadyLiked && String(activity.created_by) !== String(user.id)) {
        const likerName = user.name || 'A teacher';
        this.createStaticNotification(
          activity.created_by,
          'like',
          'New like on your activity',
          `${likerName} liked "${activity.title}".`,
          { activityId: activity.id, likerId: user.id }
        );
        this.evaluateStaticBadges(activity.created_by, 'first_like_received');
        this.evaluateStaticBadges(user.id, 'first_like_given');
      }
      return action === 'like' ? { liked: !alreadyLiked } : { unliked: alreadyLiked };
    }

    const activityMatch = path.match(/^\/activities\/(\d+)$/);
    if (activityMatch && method === 'DELETE') {
      const user = this.requireStaticUser();
      const activityId = Number(activityMatch[1]);
      const activities = this.readStaticStore(this.staticKeys.activities, []);
      const index = activities.findIndex(activity =>
        Number(activity.id) === activityId && String(activity.created_by) === String(user.id)
      );
      if (index === -1) throw API._makeHttpError(404, { error: 'Activity not found' });
      activities.splice(index, 1);
      this.writeStaticStore(this.staticKeys.activities, activities);
      return { message: 'Activity deleted' };
    }

    throw API._makeHttpError(404, { error: 'API endpoint not found' });
  }

  static async staticUploadActivity(formData) {
    this.ensureStaticSeed();
    const user = this.requireStaticUser();
    const activities = this.readStaticStore(this.staticKeys.activities, []);
    const file = formData.get('file');
    const activity = {
      id: this.nextStaticId(activities),
      title: String(formData.get('title') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      category: String(formData.get('category') || 'general'),
      file_path: file?.name || '',
      file_type: file?.type || '',
      file_url: '',
      created_by: user.id,
      likes: 0,
      likedBy: [],
      created_at: new Date().toISOString()
    };

    if (!activity.title || !activity.file_path) {
      throw API._makeHttpError(400, { error: 'Please fill in title and select a file' });
    }

    activities.unshift(activity);
    this.writeStaticStore(this.staticKeys.activities, activities);
    this.awardStaticPoints(user.id, 20);
    this.evaluateStaticBadges(user.id, 'first_post');
    return this.toStaticActivityResponse(activity, user.id);
  }

  static async staticUploadProfileAvatar(formData) {
    const user = this.requireStaticUser();
    const file = formData.get('avatar');
    if (!file) throw API._makeHttpError(400, { error: 'No image provided' });

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${btoa(binary)}`;

    const users = this.readStaticStore(this.staticKeys.users, []);
    const index = users.findIndex(item => String(item.id) === String(user.id));
    users[index] = { ...users[index], avatar_url: dataUrl };
    this.writeStaticStore(this.staticKeys.users, users);
    this.evaluateStaticBadges(user.id, 'profile_update');
    return this.publicUser(users[index]);
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
    if (this.isAppsScriptMode) {
      try {
        return await this.appsScriptRequest(endpoint, options);
      } catch (err) {
        if (err.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        throw err;
      }
    }

    if (this.isStaticMode) {
      try {
        return await this.staticRequest(endpoint, options);
      } catch (err) {
        if (err.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        throw err;
      }
    }

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
        window.location.href = new URL('./', window.location.href).href;
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

  static updateProfile(profile) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
  }

  static uploadProfileAvatar(formData) {
    if (this.isAppsScriptMode) {
      throw new Error('Paste the public Google Drive image URL in Profile photo URL and save the profile.');
    }

    if (this.isStaticMode) {
      return this.staticUploadProfileAvatar(formData);
    }

    const token = localStorage.getItem('token');
    return fetch(`${API_BASE}/auth/profile/avatar`, {
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

  static getPublicProfile(userId) {
    return this.request(`/users/${userId}/profile`);
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

  // Notification endpoints
  static getNotifications(limit = 30, offset = 0) {
    return this.request(`/notifications?limit=${limit}&offset=${offset}`);
  }

  static getUnreadNotificationsCount() {
    return this.request('/notifications/unread-count');
  }

  static markNotificationRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST'
    });
  }

  static markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'POST'
    });
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
    if (this.isAppsScriptMode) {
      const user = this.requireAppsScriptUser();
      return this.appsScriptCreateActivity({
        userId: user.id,
        title: String(formData.get('title') || '').trim(),
        description: String(formData.get('description') || '').trim(),
        category: String(formData.get('category') || 'general'),
        file_url: String(formData.get('file_url') || '').trim(),
        file_name: String(formData.get('file_name') || '').trim(),
        file_type: String(formData.get('file_type') || '').trim()
      });
    }

    if (this.isStaticMode) {
      return this.staticUploadActivity(formData);
    }

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
