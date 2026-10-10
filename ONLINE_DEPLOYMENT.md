# WizPlanning Online Deployment

## Backend

The Apps Script project is intentionally a single-file project. The complete
planner, its HTML interface, the Google Sheets API, and the Gemini review
endpoint are all in `google-apps-script/Code.gs`.

The published Google Apps Script Web App:

```text
https://script.google.com/macros/s/AKfycbxwobTuDMafuitKSFXKzN6B95QRvdMRR00GrHMfC73C4n-8ks94atyTYbCeHdt7qGd3/exec
```

The frontend reads this URL from `frontend/js/config.js`.

In the Apps Script editor, keep only `Code.gs` and replace its contents with
the full file from:

```text
google-apps-script/Code.gs
```

The same `doGet` serves the planner interface when there is no `action` query
parameter and serves JSON API requests when an `action` is provided. `doPost`
handles writes and the AI review. After pasting the file, deploy a new Web App
version in Apps Script.

### Gemini AI review

The planner's AI review is proxied by Apps Script, so the Gemini API key is
never sent to GitHub Pages or stored in the repository. In the Apps Script
project, add these entries under **Project Settings → Script Properties**:

| Property | Value |
| --- | --- |
| `GEMINI_API_KEY` | The Gemini API key |
| `GEMINI_MODEL` | Optional; defaults to `gemini-flash-latest` |
| `GEMINI_DAILY_REVIEW_LIMIT` | Optional global daily limit; defaults to `100` reviews |

After saving the properties, authorize external requests as the Apps Script
owner if Google prompts, then deploy a **new version** of the Web App. The daily
limit is shared by all visitors to this Web App deployment; it helps cap usage,
but it is not per-user authentication. Do not put the API key in frontend files,
GitHub, or a public issue. Rotate the key if it has been exposed publicly.

## What Is Online In Google Sheets

- Users
- Profile name and bio
- Lesson plans
- Community activities
- Community likes
- Points and leaderboard
- Medals and badges
- Notifications and unread/read status

The Apps Script backend creates these extra sheets automatically if they do not exist:

```text
LessonPlans
Activities
ActivityLikes
Rewards
```

## Frontend Hosting

This project can be hosted as a static site. No build step is required.

Recommended quick path:

1. Open Netlify.
2. Create a new site.
3. Drag and drop the entire `WIZPLANNING` folder.
4. Open the generated public URL.
5. Create an account in the app.

GitHub Pages also works if this folder is pushed to a GitHub repository and Pages is configured to serve from the repository root.

## Apps Script Login Note

The published Google Sheets backend does not store passwords or emails. In Apps Script mode:

- Create Account creates a row in the `Users` sheet.
- Login uses the exact user name or user ID from Google Sheets.
- Password fields are hidden in the frontend.

## Community Materials

Community posts accept a public material URL, such as a Google Drive share link. Binary file upload is intentionally not used on GitHub Pages.
