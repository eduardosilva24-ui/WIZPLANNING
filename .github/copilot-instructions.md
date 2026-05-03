<!-- Use this file to provide workspace-specific custom instructions to Copilot. -->

## WizPlanning - Local-First Lesson Planning Application

This is a professional full-stack web application built with:
- **Backend:** Node.js + Express.js
- **Frontend:** Vanilla JavaScript + CSS3
- **Database:** SQLite3 (local)
- **Purpose:** Transform raw student data into structured lesson plans with automatic calculations

### Project Overview

The system parses student information (Name | Book | Lesson) and:
1. Maps lessons to learning objectives
2. Calculates check times for each student
3. Manages user authentication and data
4. Provides a community for sharing activities
5. Implements gamification (points, levels, badges)

### Key Files Structure

- **Backend Logic:** `backend/services/` - Core business logic
  - `gasLessonPlanner.js` (emit via `npm run build:gas-node-planner`) - Direct port of Google Apps Script `processarTextoComHorario`
  - `AuthService.js` - User authentication & JWT
  - `LessonPlanService.js` - Database operations for lesson plans
  - `RewardService.js` - Points and gamification
  - `ActivityService.js` - Community activity management

- **API Routes:** `backend/routes/` - REST endpoints
- **Frontend Logic:** `frontend/js/` - UI interactions and API calls
- **Styling:** `frontend/styles/` - CSS for responsive design
- **Database:** `database/database.db` - SQLite (auto-created)

### Available Commands

```bash
npm install      # Install dependencies
npm run init-db  # Initialize database schema
npm start        # Run production server
npm run dev      # Run with auto-reload (development)
```

### Getting Started

1. Open integrated terminal in VS Code
2. Run: `npm install`
3. Run: `npm run init-db`
4. Run: `npm run dev`
5. Open browser to `http://localhost:3000`

### Key Architecture Principles

- **Offline-first:** All data stored locally
- **Modular:** Separate services, controllers, routes
- **No external dependencies:** Core functionality self-contained
- **User-focused:** Clean, intuitive UI
- **Extensible:** Easy to add new features

### Database Tables

- `users` - User accounts with hashed passwords
- `lesson_plans` - Saved lesson plans
- `activities` - Community shared files
- `rewards` - User points and badges
- `activity_likes` - Like relationships

### Frontend Pages

1. **Login** - User authentication
2. **Dashboard** - Overview of activity
3. **Lesson Planner** - Generate plans from raw input
4. **Community** - Upload and share activities
5. **Rewards** - Points, levels, leaderboard

---

**Status:** MVP Complete - Ready for local deployment
