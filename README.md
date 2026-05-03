<<<<<<< HEAD
# WizPlanning - Local-First Lesson Planning Application

A professional, modern lesson planning application that runs entirely locally without external dependencies. Transform raw student data into structured lesson plans with automatic time calculations.

## Features

✨ **Core Features:**
- ✓ Local-first architecture (works completely offline)
- ✓ Modern, app-like web interface
- ✓ Parse student data (Name | Book | Lesson)
- ✓ Automatic learning objectives mapping
- ✓ Smart check time calculation
- ✓ Local SQLite database
- ✓ User authentication (JWT-based)
- ✓ Community activity sharing
- ✓ Gamification (points, levels, badges)
- ✓ Leaderboard system

## Project Structure

```
WIZPLANNING/
├── backend/
│   ├── server.js              # Main Express server
│   ├── routes/                # API route handlers
│   ├── controllers/           # Business logic controllers
│   ├── services/              # Core services
│   ├── middleware/            # Auth & error handling
│   ├── utils/                 # Utility functions
│   └── scripts/               # Database initialization
├── frontend/
│   ├── index.html             # Main HTML file
│   ├── js/                    # Frontend JavaScript
│   │   ├── api.js            # API client
│   │   ├── auth.js           # Authentication
│   │   ├── dashboard.js      # Dashboard page
│   │   ├── lessonPlanner.js  # Lesson planner logic
│   │   ├── community.js      # Community features
│   │   └── rewards.js        # Rewards & leaderboard
│   └── styles/               # CSS stylesheets
├── database/
│   └── database.db           # SQLite database (created on first run)
├── uploads/                  # Community activity files
├── shared/
│   └── learningObjectives.json # Course data mapping
└── package.json              # Dependencies
```

## Technology Stack

**Backend:**
- Node.js + Express.js (REST API)
- SQLite3 (local database)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)

**Frontend:**
- Vanilla JavaScript (no heavy frameworks)
- CSS3 with responsive design
- Modern browser features (Fetch API)

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Git (optional, for version control)

### Installation

1. **Clone or open the project folder in VS Code:**
   ```bash
   cd c:\Users\eduar\Downloads\WIZPLANNING
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize the database:**
   ```bash
   npm run init-db
   ```

4. **Create .env file** (optional, uses defaults if omitted):
   ```bash
   cp .env.example .env
   ```

### Running the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The application will start at: **http://localhost:3000**

## Usage

### 1. Authentication

- **First time:** Create an account with email/password
- **Login:** Use your credentials to access the dashboard
- **No external providers needed** - everything is local

### 2. Create Lesson Plans

**Format for student input:**
```
Name | Book | Lesson
```

**Example:**
```
Alice | NW2 | 2
Bob | PT | 3
Carol | NW4 | 1
```

**Books available:**
- NW2, PT, NW4, AW1

**Lessons:** 1-5 for each book

### 3. Generated Information

The system automatically provides:
- ✓ Learning objectives for each lesson
- ✓ Check times for each student
- ✓ Time-based class schedule
- ✓ Validation of book/lesson combinations

### 4. Share Activities

Upload teaching materials (PDFs, images) to the community:
- Choose category (Grammar, Vocabulary, Speaking, Writing, Reading)
- Add title and description
- Other teachers can see and like your activities

### 5. Earn Rewards

- **+10 points** for creating a lesson plan
- **+20 points** for uploading an activity
- **+5 points** daily bonus
- **Levels:** Beginner → Intermediate → Advanced → Expert → Master

## API Documentation

### Authentication

**POST /api/auth/register**
```json
{
  "name": "Teacher Name",
  "email": "teacher@example.com",
  "password": "securepassword"
}
```

**POST /api/auth/login**
```json
{
  "email": "teacher@example.com",
  "password": "securepassword"
}
```

### Lesson Plans

**POST /api/lesson-plans/generate**
Generate a lesson plan from raw input
```json
{
  "rawInput": "Alice | NW2 | 2\nBob | PT | 3",
  "classTime": 60
}
```

**GET /api/lesson-plans**
Get all user's lesson plans (paginated)

**POST /api/lesson-plans**
Save a lesson plan to database

**GET /api/lesson-plans/metadata/books**
Get available books

**GET /api/lesson-plans/metadata/lessons/:book**
Get available lessons for a book

### Rewards

**GET /api/rewards**
Get user's current rewards

**POST /api/rewards/daily-bonus**
Claim daily 5-point bonus

**GET /api/rewards/leaderboard**
Get top teachers leaderboard

### Activities

**GET /api/activities**
Get community activities feed

**POST /api/activities/upload**
Upload a new activity (multipart/form-data)

**POST /api/activities/:activityId/like**
Like an activity

**DELETE /api/activities/:activityId**
Delete own activity

## Database Schema

### users
- id (INTEGER, primary key)
- name (TEXT)
- email (TEXT, unique)
- password_hash (TEXT)
- role (TEXT: 'teacher' or 'admin')
- created_at (TIMESTAMP)

### lesson_plans
- id, user_id, student_name, book, lesson, objectives, check_time, notes, created_at, updated_at

### activities
- id, title, description, file_path, file_type, created_by, category, likes, created_at

### rewards
- id, user_id, points, badges, last_bonus_date, created_at

## Learning Objectives

The system includes pre-defined learning objectives for:

**NW2 (5 lessons):**
- Identify and describe people
- Describe daily routines
- Talk about family
- Describe places and locations
- Talk about likes and dislikes

**PT (5 lessons):**
- Past simple
- Past continuous
- Present perfect
- Cause and effect
- First conditional

**NW4 (5 lessons):**
- Relative clauses
- Reported speech
- Passive voice
- Modals of ability
- Modals of obligation

**AW1 (5 lessons):**
- Simple emails
- Short essays
- Advantages/disadvantages
- Narrative texts
- Opinion essays

*(See `shared/learningObjectives.json` for complete list)*

## Offline Capability

The application works completely offline once initialized:
- ✓ All data stored locally in SQLite
- ✓ No internet required after initial setup
- ✓ All computations done on your machine
- ✓ Secure local authentication

## Extending the Application

### Add New Books/Lessons

Edit `shared/learningObjectives.json`:
```json
{
  "YOUR_BOOK": {
    "1": ["Objective 1", "Objective 2"],
    "2": ["Objective 3", "Objective 4"]
  }
}
```

### Add New Features

1. Create a new service in `backend/services/`
2. Create a controller in `backend/controllers/`
3. Add routes in `backend/routes/`
4. Mount routes in `backend/server.js`
5. Add frontend pages to `frontend/index.html`
6. Add JavaScript logic in `frontend/js/`

## Troubleshooting

**Port already in use:**
```bash
# Change port in .env file
PORT=3001
```

**Database errors:**
```bash
# Reinitialize database
npm run init-db
```

**Front-end not loading:**
- Clear browser cache (Ctrl+Shift+Delete)
- Check that server is running on correct port
- Check browser console for errors (F12)

## Performance

- Lightweight codebase (~15KB minified frontend)
- Fast SQLite queries
- No heavy dependencies
- Works on older machines

## Security Considerations

- ✓ Passwords hashed with bcryptjs
- ✓ JWT tokens for session management
- ✓ CORS enabled for local development
- ✓ Input validation on backend
- ⚠️ For production: Change JWT_SECRET in .env

## Future Enhancements

- [ ] Google Drive integration for backup
- [ ] Dark mode UI theme
- [ ] Export lesson plans as PDF
- [ ] Advanced analytics dashboard
- [ ] Multiple class management
- [ ] Collaborative lesson planning
- [ ] Mobile responsive improvements
- [ ] Offline sync when internet returns

## License

MIT License - Free to use and modify

## Support

For issues or feature requests, refer to the documentation or check the API endpoints in `backend/routes/`.

---

**Built with ❤️ for teachers, by developers**
=======
# WIZPLANNING
>>>>>>> 29565c645fa33e63480047ea0c548ef27cd60b1c
