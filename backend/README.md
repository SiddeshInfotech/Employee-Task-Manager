# Employee Task Manager - Django REST Framework Backend

This is the official backend for the Employee Task Manager application, built with **Django 5.2** and **Django REST Framework (DRF)**.

## Features

- **Authentication**: JWT authentication (matching FastAPI spec) with role-based permissions (`Admin`, `Employee`)
- **Task Management**: Real-time status tracking (`Pending`, `In Progress`, `Completed`), due dates, progress percentage, reassignment & due date extensions
- **Employee Management**: Create, view, update, and permanently delete employee records
- **Dashboard & Reports**: Real-time summary statistics, overdue task tracking, priority filtering, and individual employee progress reports
- **Notifications & Reminders**: Employee notification logs and task reminders

---

## Technical Stack

- **Framework**: Django 5.2 + Django REST Framework 3.14+
- **Database**: MySQL (Aiven Cloud / standard MySQL) via PyMySQL driver (`managed = False` ORM mapping)
- **Authentication**: JWT (`PyJWT` + `bcrypt`)
- **CORS**: `django-cors-headers`

---

## Getting Started

### 1. Prerequisites
- Python 3.10+
- Installed dependencies:
```bash
pip install -r requirements.txt
```

### 2. Environment Configuration
Ensure `.env` contains your MySQL database connection credentials and JWT settings:
```env
PROJECT_NAME="Employee Task Tracker"
API_V1_STR="/api"
SECRET_KEY="YOUR_JWT_SECRET_KEY"

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=defaultdb
```

### 3. Run Development Server

Double click `start_server.bat` or run:
```bash
python manage.py runserver 8002
```

The API will be live at `http://127.0.0.1:8002/api/`.

---

## Running Automated API Tests

To test all 22 API endpoints end-to-end:
```bash
python test_django_api.py
```

---

## Primary API Endpoints

| Resource | Endpoint | Method | Role | Description |
|----------|----------|--------|------|-------------|
| Auth | `/api/auth/login` | POST | Public | Authenticate user & get JWT token |
| Auth | `/api/auth/register` | POST | Public | Register new user account |
| Users | `/api/users/me` | GET | Auth | Get current logged-in user info |
| Employees | `/api/employees` | GET, POST | Auth/Admin | List or create employees |
| Employees | `/api/employees/<id>` | GET, DELETE | Auth/Admin | View or permanently delete employee |
| Tasks | `/api/tasks` | GET, POST | Auth | List tasks (Employee sees only assigned, Admin sees all) or create task |
| Tasks | `/api/tasks/<id>` | GET, PUT, DELETE | Auth | View, update status/progress/due date, or delete task |
| Dashboard | `/api/dashboard/summary` | GET | Auth | Dashboard count summary |
| Reports | `/api/reports` | GET | Auth | Performance report & priority breakdown |
| Notifications | `/api/notifications` | GET, DELETE | Auth | Employee notification history |