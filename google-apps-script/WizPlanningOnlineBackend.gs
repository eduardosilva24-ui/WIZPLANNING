var SPREADSHEET_ID = "1c8n7A8T54hTC_0dFdB7DgzLApmdVP2xoM6O6ABDefi4";

var SHEETS = {
  USERS: "Users",
  MEDALS: "Medals",
  NOTIFICATIONS: "Notifications",
  LESSON_PLANS: "LessonPlans",
  ACTIVITIES: "Activities",
  ACTIVITY_LIKES: "ActivityLikes",
  REWARDS: "Rewards"
};

var HEADERS = {
  USERS: ["id", "name", "bio", "photo_url", "created_at"],
  MEDALS: ["id", "user_id", "medal_name", "date"],
  NOTIFICATIONS: ["id", "user_id", "message", "read", "timestamp"],
  LESSON_PLANS: ["id", "user_id", "student_name", "book", "lesson", "objectives", "check_time", "notes", "created_at", "updated_at"],
  ACTIVITIES: ["id", "user_id", "title", "description", "category", "file_url", "file_name", "file_type", "likes", "created_at"],
  ACTIVITY_LIKES: ["id", "activity_id", "user_id", "created_at"],
  REWARDS: ["user_id", "points", "last_bonus_date", "updated_at"]
};

var POINTS = {
  LESSON_PLAN: 10,
  ACTIVITY_POST: 20,
  LIKE_RECEIVED: 2,
  DAILY_BONUS: 5
};

function doGet(e) {
  try {
    ensureAllSheets_();
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action;

    switch (action) {
      case "getUsers":
        return success_(getUsers());
      case "getUser":
        return success_(getUser(requireParam_(params, "userId")));
      case "getMedals":
        return success_(getMedals(requireParam_(params, "userId")));
      case "getNotifications":
        return success_(getNotifications(requireParam_(params, "userId")));
      case "getUnreadNotificationsCount":
        return success_(getUnreadNotificationsCount(requireParam_(params, "userId")));
      case "getLessonPlans":
        return success_(getLessonPlans(requireParam_(params, "userId"), params));
      case "getLessonPlan":
        return success_(getLessonPlan(requireParam_(params, "id"), params.userId || ""));
      case "getRewards":
        return success_(getRewards(requireParam_(params, "userId")));
      case "getLeaderboard":
        return success_(getLeaderboard(params));
      case "getActivities":
        return success_(getActivities(params));
      case "getActivitiesByCategory":
        return success_(getActivitiesByCategory(requireParam_(params, "category"), params));
      case "getUserActivities":
        return success_(getUserActivities(requireParam_(params, "targetUserId"), params));
      default:
        throw new Error("Unknown GET action: " + action);
    }
  } catch (err) {
    return failure_(err);
  }
}

function doPost(e) {
  try {
    ensureAllSheets_();
    var params = e && e.parameter ? e.parameter : {};
    var body = parsePostBody_(e);
    var data = mergeObjects_(body, params);
    var action = params.action || data.action;

    switch (action) {
      case "createUser":
        return success_(withLock_(function () { return createUser(data); }));
      case "updateUser":
        return success_(withLock_(function () { return updateUser(data); }));
      case "addMedal":
        return success_(withLock_(function () { return addMedal(data); }));
      case "createNotification":
        return success_(withLock_(function () { return createNotification(data); }));
      case "markNotificationRead":
        return success_(withLock_(function () { return markNotificationRead(data); }));
      case "markAllNotificationsRead":
        return success_(withLock_(function () { return markAllNotificationsRead(data); }));
      case "createLessonPlan":
        return success_(withLock_(function () { return createLessonPlan(data); }));
      case "saveClassPlan":
        return success_(withLock_(function () { return saveClassPlan(data); }));
      case "updateLessonPlan":
        return success_(withLock_(function () { return updateLessonPlan(data); }));
      case "deleteLessonPlan":
        return success_(withLock_(function () { return deleteLessonPlan(data); }));
      case "claimDailyBonus":
        return success_(withLock_(function () { return claimDailyBonus(data); }));
      case "createActivity":
        return success_(withLock_(function () { return createActivity(data); }));
      case "likeActivity":
        return success_(withLock_(function () { return likeActivity(data); }));
      case "unlikeActivity":
        return success_(withLock_(function () { return unlikeActivity(data); }));
      case "deleteActivity":
        return success_(withLock_(function () { return deleteActivity(data); }));
      default:
        throw new Error("Unknown POST action: " + action);
    }
  } catch (err) {
    return failure_(err);
  }
}

function getUsers() {
  return readRecords_(SHEETS.USERS, HEADERS.USERS);
}

function getUser(userId) {
  var found = findRecordById_(SHEETS.USERS, HEADERS.USERS, userId);
  return found ? found.object : null;
}

function createUser(data) {
  var user = {
    id: generateId_("user"),
    name: requireParam_(data, "name"),
    bio: optionalParam_(data, "bio", ""),
    photo_url: optionalParam_(data, "photo_url", ""),
    created_at: timestamp_()
  };
  appendRecord_(SHEETS.USERS, HEADERS.USERS, user);
  ensureRewardRecord_(user.id);
  createNotification({ userId: user.id, message: "Welcome to WizPlanning.", read: false });
  return user;
}

function updateUser(data) {
  var userId = requireEitherParam_(data, ["userId", "id"]);
  var found = findRecordById_(SHEETS.USERS, HEADERS.USERS, userId);
  if (!found) throw new Error("User not found: " + userId);

  var user = found.object;
  if (hasOwn_(data, "name")) user.name = data.name;
  if (hasOwn_(data, "bio")) user.bio = data.bio;
  if (hasOwn_(data, "photo_url")) user.photo_url = data.photo_url;

  writeRecord_(found.sheet, found.rowIndex, HEADERS.USERS, user);
  return user;
}

function getMedals(userId) {
  return readRecords_(SHEETS.MEDALS, HEADERS.MEDALS).filter(function (medal) {
    return String(medal.user_id) === String(userId);
  });
}

function addMedal(data) {
  var medal = {
    id: generateId_("medal"),
    user_id: requireParam_(data, "userId"),
    medal_name: requireEitherParam_(data, ["medal_name", "medalName"]),
    date: optionalParam_(data, "date", timestamp_())
  };
  appendRecord_(SHEETS.MEDALS, HEADERS.MEDALS, medal);
  return medal;
}

function awardMedalIfMissing_(userId, medalName, message) {
  var exists = getMedals(userId).some(function (medal) {
    return String(medal.medal_name) === String(medalName);
  });
  if (exists) return null;

  var medal = addMedal({ userId: userId, medal_name: medalName, date: timestamp_() });
  if (message) createNotification({ userId: userId, message: message, read: false });
  return medal;
}

function getNotifications(userId) {
  return readRecords_(SHEETS.NOTIFICATIONS, HEADERS.NOTIFICATIONS)
    .filter(function (notification) { return String(notification.user_id) === String(userId); })
    .map(normalizeNotification_)
    .sort(function (a, b) { return String(b.timestamp).localeCompare(String(a.timestamp)); });
}

function getUnreadNotificationsCount(userId) {
  return {
    unreadCount: getNotifications(userId).filter(function (notification) {
      return !notification.read;
    }).length
  };
}

function createNotification(data) {
  var notification = {
    id: generateId_("notification"),
    user_id: requireParam_(data, "userId"),
    message: requireParam_(data, "message"),
    read: hasOwn_(data, "read") ? toBoolean_(data.read) : false,
    timestamp: optionalParam_(data, "timestamp", timestamp_())
  };
  appendRecord_(SHEETS.NOTIFICATIONS, HEADERS.NOTIFICATIONS, notification);
  return normalizeNotification_(notification);
}

function markNotificationRead(data) {
  var notificationId = requireEitherParam_(data, ["notificationId", "id"]);
  var found = findRecordById_(SHEETS.NOTIFICATIONS, HEADERS.NOTIFICATIONS, notificationId);
  if (!found) throw new Error("Notification not found: " + notificationId);
  if (hasOwn_(data, "userId") && String(found.object.user_id) !== String(data.userId)) {
    throw new Error("Notification does not belong to user: " + data.userId);
  }
  found.object.read = true;
  writeRecord_(found.sheet, found.rowIndex, HEADERS.NOTIFICATIONS, found.object);
  return normalizeNotification_(found.object);
}

function markAllNotificationsRead(data) {
  var userId = requireParam_(data, "userId");
  var sheet = getSheet_(SHEETS.NOTIFICATIONS, HEADERS.NOTIFICATIONS);
  var values = getDataRows_(sheet, HEADERS.NOTIFICATIONS);
  var updated = 0;

  for (var i = 0; i < values.length; i++) {
    var object = rowToObject_(HEADERS.NOTIFICATIONS, values[i]);
    if (String(object.user_id) === String(userId) && !toBoolean_(object.read)) {
      object.read = true;
      writeRecord_(sheet, i + 2, HEADERS.NOTIFICATIONS, object);
      updated++;
    }
  }
  return { updated: updated };
}

function createLessonPlan(data) {
  var userId = requireParam_(data, "userId");
  var plan = {
    id: generateId_("lesson"),
    user_id: userId,
    student_name: requireEitherParam_(data, ["student_name", "studentName"]),
    book: optionalParam_(data, "book", ""),
    lesson: optionalParam_(data, "lesson", ""),
    objectives: stringifyMaybe_(optionalParam_(data, "objectives", "")),
    check_time: optionalParam_(data, "check_time", optionalParam_(data, "checkTime", "")),
    notes: optionalParam_(data, "notes", ""),
    created_at: timestamp_(),
    updated_at: timestamp_()
  };
  appendRecord_(SHEETS.LESSON_PLANS, HEADERS.LESSON_PLANS, plan);
  addPoints_(userId, POINTS.LESSON_PLAN);
  awardMedalIfMissing_(userId, "first_lesson", "Badge unlocked: first class planned.");
  createNotification({ userId: userId, message: "Lesson plan saved: " + plan.student_name, read: false });
  return plan;
}

function saveClassPlan(data) {
  var title = optionalParam_(data, "title", "Class Plan");
  return createLessonPlan({
    userId: requireParam_(data, "userId"),
    student_name: title,
    book: "Turma",
    lesson: "",
    objectives: optionalParam_(data, "alunos_json", ""),
    check_time: "Turma",
    notes: requireParam_(data, "output")
  });
}

function getLessonPlans(userId, params) {
  var limit = parseInt(optionalParam_(params, "limit", "50"), 10) || 50;
  var offset = parseInt(optionalParam_(params, "offset", "0"), 10) || 0;
  return readRecords_(SHEETS.LESSON_PLANS, HEADERS.LESSON_PLANS)
    .filter(function (plan) { return String(plan.user_id) === String(userId); })
    .sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); })
    .slice(offset, offset + limit);
}

function getLessonPlan(id, userId) {
  var found = findRecordById_(SHEETS.LESSON_PLANS, HEADERS.LESSON_PLANS, id);
  if (!found) return null;
  if (userId && String(found.object.user_id) !== String(userId)) return null;
  return found.object;
}

function updateLessonPlan(data) {
  var id = requireParam_(data, "id");
  var userId = requireParam_(data, "userId");
  var found = findRecordById_(SHEETS.LESSON_PLANS, HEADERS.LESSON_PLANS, id);
  if (!found || String(found.object.user_id) !== String(userId)) {
    throw new Error("Lesson plan not found: " + id);
  }

  var plan = found.object;
  if (hasOwn_(data, "student_name") || hasOwn_(data, "studentName")) plan.student_name = data.student_name || data.studentName;
  if (hasOwn_(data, "book")) plan.book = data.book;
  if (hasOwn_(data, "lesson")) plan.lesson = data.lesson;
  if (hasOwn_(data, "objectives")) plan.objectives = stringifyMaybe_(data.objectives);
  if (hasOwn_(data, "check_time") || hasOwn_(data, "checkTime")) plan.check_time = data.check_time || data.checkTime;
  if (hasOwn_(data, "notes")) plan.notes = data.notes;
  plan.updated_at = timestamp_();

  writeRecord_(found.sheet, found.rowIndex, HEADERS.LESSON_PLANS, plan);
  return plan;
}

function deleteLessonPlan(data) {
  var id = requireParam_(data, "id");
  var userId = requireParam_(data, "userId");
  var found = findRecordById_(SHEETS.LESSON_PLANS, HEADERS.LESSON_PLANS, id);
  if (!found || String(found.object.user_id) !== String(userId)) {
    throw new Error("Lesson plan not found: " + id);
  }
  found.sheet.deleteRow(found.rowIndex);
  return { deleted: true, id: id };
}

function getRewards(userId) {
  var reward = ensureRewardRecord_(userId);
  var medals = getMedals(userId);
  var points = Number(reward.points || 0);
  return {
    userId: userId,
    points: points,
    level: calculateLevel_(points),
    badges: medals.map(function (medal) {
      return {
        id: medal.medal_name,
        name: medal.medal_name,
        description: "Unlocked on " + medal.date,
        icon: "Badge",
        date: medal.date
      };
    }),
    badgeIds: medals.map(function (medal) { return medal.medal_name; }),
    last_bonus_date: reward.last_bonus_date || ""
  };
}

function claimDailyBonus(data) {
  var userId = requireParam_(data, "userId");
  var reward = ensureRewardRecord_(userId);
  var today = timestamp_().slice(0, 10);
  if (String(reward.last_bonus_date || "") === today) {
    return { bonusAwarded: false, message: "Bonus already claimed today" };
  }

  reward.points = Number(reward.points || 0) + POINTS.DAILY_BONUS;
  reward.last_bonus_date = today;
  reward.updated_at = timestamp_();
  writeRewardRecord_(reward);
  awardMedalIfMissing_(userId, "daily_bonus", "Badge unlocked: daily bonus.");
  createNotification({ userId: userId, message: "Daily bonus: +" + POINTS.DAILY_BONUS + " points.", read: false });
  return { bonusAwarded: true, points: POINTS.DAILY_BONUS };
}

function getLeaderboard(params) {
  var limit = parseInt(optionalParam_(params, "limit", "10"), 10) || 10;
  var users = getUsers();
  return users.map(function (user) {
    var rewards = getRewards(user.id);
    return {
      id: user.id,
      name: user.name,
      bio: user.bio || "",
      points: rewards.points,
      level: rewards.level,
      badges: rewards.badges
    };
  }).sort(function (a, b) {
    return b.points - a.points;
  }).slice(0, limit).map(function (entry, index) {
    entry.rank = index + 1;
    return entry;
  });
}

function createActivity(data) {
  var userId = requireParam_(data, "userId");
  var activity = {
    id: generateId_("activity"),
    user_id: userId,
    title: requireParam_(data, "title"),
    description: optionalParam_(data, "description", ""),
    category: optionalParam_(data, "category", "general"),
    file_url: optionalParam_(data, "file_url", optionalParam_(data, "fileUrl", "")),
    file_name: optionalParam_(data, "file_name", optionalParam_(data, "fileName", "")),
    file_type: optionalParam_(data, "file_type", optionalParam_(data, "fileType", "")),
    likes: 0,
    created_at: timestamp_()
  };
  appendRecord_(SHEETS.ACTIVITIES, HEADERS.ACTIVITIES, activity);
  addPoints_(userId, POINTS.ACTIVITY_POST);
  awardMedalIfMissing_(userId, "first_post", "Badge unlocked: first community post.");
  createNotification({ userId: userId, message: "Community activity posted: " + activity.title, read: false });
  return decorateActivity_(activity, userId);
}

function getActivities(params) {
  var currentUserId = optionalParam_(params, "userId", "");
  var limit = parseInt(optionalParam_(params, "limit", "20"), 10) || 20;
  var offset = parseInt(optionalParam_(params, "offset", "0"), 10) || 0;
  return readRecords_(SHEETS.ACTIVITIES, HEADERS.ACTIVITIES)
    .sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); })
    .slice(offset, offset + limit)
    .map(function (activity) { return decorateActivity_(activity, currentUserId); });
}

function getActivitiesByCategory(category, params) {
  return getActivities({ userId: params.userId || "", limit: 9999, offset: 0 })
    .filter(function (activity) { return String(activity.category) === String(category); })
    .slice(Number(params.offset || 0), Number(params.offset || 0) + (Number(params.limit || 20)));
}

function getUserActivities(targetUserId, params) {
  return getActivities({ userId: params.userId || "", limit: 9999, offset: 0 })
    .filter(function (activity) { return String(activity.user_id) === String(targetUserId); })
    .slice(Number(params.offset || 0), Number(params.offset || 0) + (Number(params.limit || 20)));
}

function likeActivity(data) {
  var userId = requireParam_(data, "userId");
  var activityId = requireEitherParam_(data, ["activityId", "id"]);
  var activityFound = findRecordById_(SHEETS.ACTIVITIES, HEADERS.ACTIVITIES, activityId);
  if (!activityFound) throw new Error("Activity not found: " + activityId);

  var existing = findActivityLike_(activityId, userId);
  if (existing) return { liked: false, alreadyLiked: true };

  appendRecord_(SHEETS.ACTIVITY_LIKES, HEADERS.ACTIVITY_LIKES, {
    id: generateId_("like"),
    activity_id: activityId,
    user_id: userId,
    created_at: timestamp_()
  });

  activityFound.object.likes = Number(activityFound.object.likes || 0) + 1;
  writeRecord_(activityFound.sheet, activityFound.rowIndex, HEADERS.ACTIVITIES, activityFound.object);

  if (String(activityFound.object.user_id) !== String(userId)) {
    addPoints_(activityFound.object.user_id, POINTS.LIKE_RECEIVED);
    awardMedalIfMissing_(userId, "first_like_given", "Badge unlocked: first like given.");
    awardMedalIfMissing_(activityFound.object.user_id, "first_like_received", "Badge unlocked: first like received.");
    var liker = getUser(userId);
    createNotification({
      userId: activityFound.object.user_id,
      message: (liker && liker.name ? liker.name : "A teacher") + " liked your activity: " + activityFound.object.title,
      read: false
    });
  }
  return { liked: true };
}

function unlikeActivity(data) {
  var userId = requireParam_(data, "userId");
  var activityId = requireEitherParam_(data, ["activityId", "id"]);
  var likeFound = findActivityLike_(activityId, userId);
  if (!likeFound) return { unliked: false };

  likeFound.sheet.deleteRow(likeFound.rowIndex);
  var activityFound = findRecordById_(SHEETS.ACTIVITIES, HEADERS.ACTIVITIES, activityId);
  if (activityFound) {
    activityFound.object.likes = Math.max(0, Number(activityFound.object.likes || 0) - 1);
    writeRecord_(activityFound.sheet, activityFound.rowIndex, HEADERS.ACTIVITIES, activityFound.object);
  }
  return { unliked: true };
}

function deleteActivity(data) {
  var userId = requireParam_(data, "userId");
  var activityId = requireEitherParam_(data, ["activityId", "id"]);
  var found = findRecordById_(SHEETS.ACTIVITIES, HEADERS.ACTIVITIES, activityId);
  if (!found || String(found.object.user_id) !== String(userId)) {
    throw new Error("Activity not found: " + activityId);
  }
  found.sheet.deleteRow(found.rowIndex);
  deleteLikesForActivity_(activityId);
  return { deleted: true, id: activityId };
}

function decorateActivity_(activity, currentUserId) {
  var user = getUser(activity.user_id) || {};
  return {
    id: activity.id,
    user_id: activity.user_id,
    created_by: activity.user_id,
    title: activity.title,
    description: activity.description,
    category: activity.category,
    file_url: activity.file_url,
    file_name: activity.file_name,
    file_type: activity.file_type,
    likes: Number(activity.likes || 0),
    created_at: activity.created_at,
    creator_name: user.name || "Teacher",
    creator_bio: user.bio || "",
    creator_avatar_url: "",
    likedByCurrentUser: currentUserId ? Boolean(findActivityLike_(activity.id, currentUserId)) : false
  };
}

function addPoints_(userId, points) {
  var reward = ensureRewardRecord_(userId);
  reward.points = Number(reward.points || 0) + Number(points || 0);
  reward.updated_at = timestamp_();
  writeRewardRecord_(reward);
  awardPointBadges_(userId, reward.points);
  return reward;
}

function awardPointBadges_(userId, points) {
  if (points >= 50) awardMedalIfMissing_(userId, "points_50", "Badge unlocked: 50 points.");
  if (points >= 150) awardMedalIfMissing_(userId, "points_150", "Badge unlocked: 150 points.");
  if (points >= 300) awardMedalIfMissing_(userId, "points_300", "Badge unlocked: 300 points.");
  if (points >= 500) awardMedalIfMissing_(userId, "points_500", "Badge unlocked: 500 points.");
}

function calculateLevel_(points) {
  points = Number(points || 0);
  if (points < 50) return "Beginner";
  if (points < 150) return "Intermediate";
  if (points < 300) return "Advanced";
  if (points < 500) return "Expert";
  return "Master";
}

function ensureRewardRecord_(userId) {
  var found = findRewardRecord_(userId);
  if (found) return found.object;

  var reward = {
    user_id: userId,
    points: 0,
    last_bonus_date: "",
    updated_at: timestamp_()
  };
  appendRecord_(SHEETS.REWARDS, HEADERS.REWARDS, reward);
  return reward;
}

function findRewardRecord_(userId) {
  var sheet = getSheet_(SHEETS.REWARDS, HEADERS.REWARDS);
  var rows = getDataRows_(sheet, HEADERS.REWARDS);
  for (var i = 0; i < rows.length; i++) {
    var object = rowToObject_(HEADERS.REWARDS, rows[i]);
    if (String(object.user_id) === String(userId)) {
      return { sheet: sheet, rowIndex: i + 2, object: object };
    }
  }
  return null;
}

function writeRewardRecord_(reward) {
  var found = findRewardRecord_(reward.user_id);
  if (!found) appendRecord_(SHEETS.REWARDS, HEADERS.REWARDS, reward);
  else writeRecord_(found.sheet, found.rowIndex, HEADERS.REWARDS, reward);
}

function findActivityLike_(activityId, userId) {
  var sheet = getSheet_(SHEETS.ACTIVITY_LIKES, HEADERS.ACTIVITY_LIKES);
  var rows = getDataRows_(sheet, HEADERS.ACTIVITY_LIKES);
  for (var i = 0; i < rows.length; i++) {
    var object = rowToObject_(HEADERS.ACTIVITY_LIKES, rows[i]);
    if (String(object.activity_id) === String(activityId) && String(object.user_id) === String(userId)) {
      return { sheet: sheet, rowIndex: i + 2, object: object };
    }
  }
  return null;
}

function deleteLikesForActivity_(activityId) {
  var sheet = getSheet_(SHEETS.ACTIVITY_LIKES, HEADERS.ACTIVITY_LIKES);
  var rows = getDataRows_(sheet, HEADERS.ACTIVITY_LIKES);
  for (var i = rows.length - 1; i >= 0; i--) {
    var object = rowToObject_(HEADERS.ACTIVITY_LIKES, rows[i]);
    if (String(object.activity_id) === String(activityId)) sheet.deleteRow(i + 2);
  }
}

function ensureAllSheets_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    Object.keys(SHEETS).forEach(function (key) {
      ensureSheet_(SHEETS[key], HEADERS[key]);
    });
  } finally {
    lock.releaseLock();
  }
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function ensureSheet_(sheetName, headers) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    var allSheets = ss.getSheets();
    for (var i = 0; i < allSheets.length; i++) {
      if (String(allSheets[i].getName()).trim() === sheetName) {
        sheet = allSheets[i];
        break;
      }
    }
  }
  if (!sheet) {
    try {
      sheet = ss.insertSheet(sheetName);
    } catch (err) {
      sheet = ss.getSheetByName(sheetName);
      if (!sheet) throw err;
    }
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }
  var existing = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  var isEmpty = existing.every(function (value) { return String(value || "").trim() === ""; });
  if (isEmpty) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function getSheet_(sheetName, headers) {
  var sheet = ensureSheet_(sheetName, headers);
  assertHeaders_(sheet, headers);
  return sheet;
}

function assertHeaders_(sheet, expectedHeaders) {
  var actualHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getDisplayValues()[0];
  for (var i = 0; i < expectedHeaders.length; i++) {
    if (String(actualHeaders[i]).trim() !== expectedHeaders[i]) {
      throw new Error("Invalid headers for sheet '" + sheet.getName() + "'. Expected: " + expectedHeaders.join(" | "));
    }
  }
}

function getDataRows_(sheet, headers) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
}

function readRecords_(sheetName, headers) {
  var sheet = getSheet_(sheetName, headers);
  return getDataRows_(sheet, headers)
    .filter(function (row) { return !isBlankRow_(row); })
    .map(function (row) { return rowToObject_(headers, row); });
}

function appendRecord_(sheetName, headers, record) {
  var sheet = getSheet_(sheetName, headers);
  sheet.appendRow(objectToRow_(headers, record));
}

function findRecordById_(sheetName, headers, id) {
  var sheet = getSheet_(sheetName, headers);
  var values = getDataRows_(sheet, headers);
  for (var i = 0; i < values.length; i++) {
    var object = rowToObject_(headers, values[i]);
    if (String(object.id) === String(id)) {
      return { sheet: sheet, rowIndex: i + 2, object: object };
    }
  }
  return null;
}

function writeRecord_(sheet, rowIndex, headers, record) {
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([objectToRow_(headers, record)]);
}

function rowToObject_(headers, row) {
  var object = {};
  for (var i = 0; i < headers.length; i++) object[headers[i]] = normalizeCell_(row[i]);
  return object;
}

function objectToRow_(headers, object) {
  return headers.map(function (header) {
    return hasOwn_(object, header) ? object[header] : "";
  });
}

function normalizeCell_(value) {
  if (value instanceof Date) return value.toISOString();
  if (value === null || typeof value === "undefined") return "";
  return value;
}

function normalizeNotification_(notification) {
  notification.read = toBoolean_(notification.read);
  notification.created_at = notification.timestamp;
  notification.title = "Notification";
  notification.type = "info";
  return notification;
}

function parsePostBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  var type = String(e.postData.type || "").toLowerCase();
  if (type.indexOf("application/json") === -1) return {};
  return JSON.parse(e.postData.contents);
}

function mergeObjects_(first, second) {
  var result = {};
  var key;
  for (key in first) if (hasOwn_(first, key)) result[key] = first[key];
  for (key in second) if (hasOwn_(second, key)) result[key] = second[key];
  return result;
}

function requireParam_(data, key) {
  if (!hasOwn_(data, key) || data[key] === "") throw new Error("Missing required parameter: " + key);
  return data[key];
}

function requireEitherParam_(data, keys) {
  for (var i = 0; i < keys.length; i++) {
    if (hasOwn_(data, keys[i]) && data[keys[i]] !== "") return data[keys[i]];
  }
  throw new Error("Missing required parameter. Expected one of: " + keys.join(", "));
}

function optionalParam_(data, key, fallback) {
  return hasOwn_(data, key) ? data[key] : fallback;
}

function hasOwn_(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function isBlankRow_(row) {
  for (var i = 0; i < row.length; i++) {
    if (row[i] !== "" && row[i] !== null) return false;
  }
  return true;
}

function stringifyMaybe_(value) {
  if (typeof value === "string") return value;
  return JSON.stringify(value || "");
}

function generateId_(prefix) {
  return prefix + "_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000000);
}

function timestamp_() {
  return new Date().toISOString();
}

function toBoolean_(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "number") return value !== 0;
  var normalized = String(value).toLowerCase().trim();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function withLock_(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function success_(data) {
  return json_({ success: true, data: data });
}

function failure_(err) {
  return json_({ success: false, error: err && err.message ? err.message : String(err) });
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
