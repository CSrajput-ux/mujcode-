# MujCode Backend

This backend is built for the existing frontend in `../frontend`. It exposes the API already hardcoded in the UI at `http://localhost:5000/api`.

## Run

```powershell
cd backend
npm start
```

For live reload while editing:

```powershell
npm run dev
```

No dependency installation is required. The server uses Node.js built-ins and persists demo data in `src/data/db.json`.

## Local Demo Accounts

Demo accounts are generated only in non-production environments.

Do not use demo credentials in production.
Run the local seed command to create development accounts:

```powershell
npm run seed
```

## API Areas

- Auth and password updates
- Admin dashboard, students, faculty, companies, placements, system health
- Student courses, profiles, analytics, problems, badges, heatmap, restrictions
- Faculty profiles, teaching map, analytics, questions, communities
- Tests, test builder questions, submissions, compile/evaluate helpers
- Assignments and grading
- Placements and applications
- Content hub uploads and downloads
- Mock tests
