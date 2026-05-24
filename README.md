# TaskManager - Premium Team Task Management Application

TaskManager is a full-stack, responsive team task management web application designed for real-time project collaboration, task tracking, and work distribution. Operating similarly to Trello or Asana, TaskManager allows project admins to invite team members, assign responsibilities, manage tasks through an interactive Kanban board, and monitor productivity through an analytics dashboard.

---

## Technical Stack

### Backend
* **Python Django & Django REST Framework (DRF)**: High-performance backend API layer.
* **SimpleJWT**: Secure JWT authentication and token rotation.
* **MySQL / SQLite**: Robust relational databases with optimized indexing and relational mapping.
* **Django CORS Headers**: Configured cross-origin resource sharing.
* **Role-Based Access Control (RBAC)**: Secure access restrictions differentiating Admin and Member capabilities.

### Frontend
* **React.js (Vite)**: Clean, modular component architecture.
* **Tailwind CSS**: High-fidelity custom aesthetics with smooth UI state animations.
* **Axios**: Advanced client with interceptors supporting auto JWT token-refreshing.
* **React Router DOM**: Client-side protected routing.
* **Lucide React**: Clean, modern iconography.

---

## Folder Structure

```
task-manager/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/              # Django core configuration (settings, urls, wsgi/asgi)
│   └── apps/                # Django modular apps
│       ├── users/           # User authentication & custom models
│       ├── projects/        # Project boards & member roles
│       ├── tasks/           # Tasks, assignments & permissions
│       └── dashboard/       # Dashboard metrics & aggregation queries
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── components/      # Reusable UI components (Sidebar shell, cards)
│       ├── context/         # AuthContext state provider
│       ├── pages/           # Login, Signup, Dashboard, Project details, Profile
│       ├── routes/          # Protected and Public route layouts
│       └── services/        # Axios API client setup
└── README.md
```

---

## Core Features

1. **Secure JWT Authentication**:
   - Register, login, and fetch user profiles.
   - Access token storage with automatic background refresh via interceptors to keep users signed in seamlessly.
2. **Project Collaboration & RBAC**:
   - Project creators automatically become **Admins**.
   - Admins can edit/delete projects, add team members (via email lookup), remove members, and manage all project tasks.
   - **Members** can view the boards they belong to and update the status of tasks assigned directly to them.
3. **Interactive Kanban Board**:
   - Visual Columns: `To Do`, `In Progress`, `Done`.
   - Native HTML5 **Drag & Drop** task status updates.
   - Filtering tasks by priority, assigned developer, and title query.
4. **Analytics Dashboard**:
   - Total task count, status division, and overdue items metrics.
   - SVG completed task percentage indicator.
   - Assignee task load distribution stats.
   - Table of recently updated tasks for easy overview.
5. **My Profile Hub**:
   - Summary of personal task loads (Total, In Progress, Overdue).
   - Fast status updates directly inside the profile task list.

---

## API Documentation

### Authentication
* `POST /api/auth/register/` - Create a new user account.
* `POST /api/auth/login/` - Login and get JWT token pairs.
* `POST /api/auth/refresh/` - Refresh expired access token.
* `GET /api/auth/profile/` - Retrieve authenticated user profile.

### Projects
* `GET /api/projects/` - List all projects the user belongs to.
* `POST /api/projects/` - Create a new project (creator becomes Admin).
* `GET /api/projects/{id}/` - Retrieve project details.
* `PUT /api/projects/{id}/` - Update project details (Admin only).
* `DELETE /api/projects/{id}/` - Delete project (Admin only).

### Member Management
* `POST /api/projects/{id}/members/` - Add a member to a project by email (Admin only).
* `DELETE /api/projects/{id}/members/{userId}/` - Remove a member from a project (Admin only).

### Tasks
* `GET /api/tasks/` - List tasks. (Supports query filters: `?project=ID`, `?assigned_to=ID`, `?status=STATUS`, `?priority=PRIORITY`).
* `POST /api/tasks/` - Create task inside a project (Admin only).
* `PUT /api/tasks/{id}/` - Edit task details (Admin only).
* `DELETE /api/tasks/{id}/` - Delete task (Admin only).
* `PATCH /api/tasks/{id}/status/` - Update task status (Admin, or assigned Member).

### Dashboard
* `GET /api/dashboard/` - Retrieve aggregated workspace statistics.

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
JWT_SECRET=your-jwt-signing-secret
# Connection string for MySQL. If empty, Django defaults to local SQLite.
DATABASE_URL=mysql://root:password@127.0.0.1:3306/task_manager_db
```

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory (or configure Vite variables):
```env
VITE_API_URL=http://127.0.0.1:8000/api
```

---

## Installation & Setup

### Prerequisites
* Python 3.11+
* Node.js & npm (v20+ recommended)
* MySQL database server (Optional, defaults to SQLite if omitted)

### 1. Backend Setup
1. Open terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Generate the database tables:
   ```bash
   python manage.py makemigrations users projects tasks dashboard
   python manage.py migrate
   ```
5. Run the django unit tests to verify:
   ```bash
   python manage.py test apps.users apps.projects apps.tasks apps.dashboard
   ```
6. Start the local API server:
   ```bash
   python manage.py runserver
   ```
   The backend API will be available at `http://127.0.0.1:8000/`.

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000/`.

---

## Production Deployment

### Backend Deployment (Railway)
1. Initialize a Git repository at the root of the project.
2. Link the repository to your Railway project.
3. Provision a **MySQL database** service inside Railway.
4. Copy the MySQL connection URI and add it as the `DATABASE_URL` environment variable for your Django app service in Railway.
5. Set variables:
   - `SECRET_KEY` (Generate a secure key)
   - `DEBUG` = `False`
   - `ALLOWED_HOSTS` = `${RAILWAY_STATIC_URL}` (or specific domain)
   - `JWT_SECRET` (Generate a secure key)
6. Railway will run the start command automatically using the Python buildpack.

### Frontend Deployment (Vercel or Railway)
1. Add Vercel setup or deploy via Railway.
2. Configure Environment Variable:
   - `VITE_API_URL` = (Your deployed backend API URL, e.g. `https://your-backend-railway.app/api`)
3. Deploy the build output.
