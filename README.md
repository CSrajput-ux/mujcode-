# MujCode 🚀

MujCode is a comprehensive, full-stack educational and Applicant Tracking System (ATS) platform tailored for universities. It bridges the gap between students, faculty, and hiring companies in a single, high-performance platform.

![MujCode Banner](./logo.png) <!-- Update with actual banner if you have one -->

## ✨ Key Features

### 🎓 For Students
- **Assignments & Case Studies:** View and submit code, videos, and written assignments.
- **Online Compiler:** Built-in code editor (Monaco) with a secure execution queue.
- **Placement ATS:** View active placement drives, apply to jobs, and track application status.
- **Real-time Notifications:** Get instantly notified about grades, new assignments, and placement updates.

### 👨‍🏫 For Faculty
- **Course Management:** Manage sections, branches, and student lists.
- **Grading & Submissions:** Review student submissions, grade them, and provide detailed feedback.
- **Live Classroom:** Real-time engagement with students.

### 🏢 For Companies (ATS)
- **Drive Management:** Create and manage placement drives with eligibility criteria (CGPA, backlogs).
- **Candidate Tracking:** View applicants, shortlist candidates, and process hiring workflows.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Radix UI, Monaco Editor.
- **Backend:** Node.js (ESM), Custom High-Concurrency Router, Socket.IO.
- **Database:**
  - **JSON File DB (Primary):** Blazing fast, in-memory DB with atomic disk flushing.
  - **MongoDB (Optional):** Used for advanced ATS & Company Drive management.
  - **Redis (Optional):** Manages the distributed code compiler queue.
- **Infrastructure:** Docker, Docker Compose, GitHub Actions, AWS (ECR/EKS), Helm.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v20+)
- Docker & Docker Compose (optional but recommended)

### 1. Using Docker (Recommended)
The easiest way to get the entire stack (Frontend, Backend, Redis, MongoDB) running locally.

```bash
# 1. Clone the repository
git clone https://github.com/CSrajput-ux/mujcode-.git
cd mujcode-

# 2. Setup Environment Variables
cp backend/.env.example backend/.env
# Edit backend/.env and set a secure TOKEN_SECRET

# 3. Start the core services (Frontend + Backend)
docker compose up --build -d

# 4. (Optional) Start with ATS features (starts MongoDB)
docker compose --profile ats up --build -d
```

- **Frontend:** http://localhost
- **Backend API:** http://localhost:5000

### 2. Manual Setup (Without Docker)

**Backend Setup:**
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🏗️ Architecture & Deployment

MujCode is designed for **High Concurrency** and is 100% production-ready.

- **Multi-Stage Docker Builds:** Optimized images for fast pulling and minimal footprint.
- **CI/CD Pipeline:** Fully automated via GitHub Actions.
  - Runs Type Checks & Builds on PRs.
  - Pushes images to AWS ECR.
  - Deploys automatically to AWS EKS via Helm (`deploy-staging` & `deploy-production`).
- **Resilience:** Unhandled exceptions and rejections are gracefully caught, flushing in-memory data to disk before shutdown to prevent data loss.

---

## 📂 Project Structure

```text
mujcode/
├── backend/               # Node.js Backend Server
│   ├── src/
│   │   ├── data/          # JSON Database Storage
│   │   ├── modules/       # ATS and Domain Modules
│   │   ├── routes/        # API Endpoints
│   │   └── lib/           # Core Engine (Router, Storage, Auth)
│   └── compiler/          # Code Execution Engine
├── frontend/              # React/Vite Frontend App
│   ├── src/
│   │   ├── app/pages/     # Dashboards (Student, Faculty, Company)
│   │   └── components/    # Reusable UI Components
├── helm/                  # Kubernetes Helm Charts
├── terraform/             # IaC for AWS Infrastructure
└── .github/workflows/     # CI/CD Pipelines
```

---

## 🤝 Contributing
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.
