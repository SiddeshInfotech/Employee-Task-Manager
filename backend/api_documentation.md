# API Documentation: Employee Task Tracker

This document describes all available endpoints in the Employee Task Tracker backend API.

## Base URL
- Local: `http://127.0.0.1:8000/api`
- Interactive API Swagger UI: `http://127.0.0.1:8000/docs`
- Interactive API ReDoc: `http://127.0.0.1:8000/redoc`

---

## 1. Authentication API

### Register User
* **Endpoint**: `/auth/register`
* **Method**: `POST`
* **Description**: Register a new user account (admin or employee).
* **Authentication**: None required.
* **Request Body (JSON)**:
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "strongpassword123",
    "role": "employee"
  }
  ```
  *Note: `role` must be either `"admin"` or `"employee"` (defaults to `"employee"`).*
* **Response (201 Created)**:
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "id": 1,
    "role": "employee",
    "is_active": true
  }
  ```

---

### Login (Obtain Token)
* **Endpoint**: `/auth/login`
* **Method**: `POST`
* **Description**: Authenticate with username and password to get a JWT access token.
* **Authentication**: None required.
* **Request Body (Form Data)**:
  - `username`: `john_doe`
  - `password`: `strongpassword123`
* **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```

---

## 2. Task API

### List Tasks
* **Endpoint**: `/tasks/`
* **Method**: `GET`
* **Description**: Retrieve a list of tasks. Admins see all tasks. Employees see only tasks assigned to them.
* **Authentication**: JWT Bearer Token required.
* **Query Parameters**:
  - `skip` (int, default: 0): Pagination offset.
  - `limit` (int, default: 100): Pagination limit.
* **Response (200 OK)**:
  ```json
  [
    {
      "title": "Fix Database Timeout",
      "description": "Investigate why the connection to MySQL fails",
      "status": "pending",
      "priority": "high",
      "due_date": "2026-07-20T12:00:00Z",
      "assigned_to_id": 2,
      "id": 5,
      "created_at": "2026-07-16T14:10:00Z",
      "updated_at": "2026-07-16T14:10:00Z"
    }
  ]
  ```

---

### Create Task
* **Endpoint**: `/tasks/`
* **Method**: `POST`
* **Description**: Create a new task. Admins can assign tasks to any employee. Employees are forced to assign created tasks to themselves.
* **Authentication**: JWT Bearer Token required.
* **Request Body (JSON)**:
  ```json
  {
    "title": "Design Login Screen",
    "description": "Create wireframes and HTML code",
    "status": "pending",
    "priority": "medium",
    "due_date": "2026-07-25T18:00:00Z",
    "assigned_to_id": 2
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "title": "Design Login Screen",
    "description": "Create wireframes and HTML code",
    "status": "pending",
    "priority": "medium",
    "due_date": "2026-07-25T18:00:00Z",
    "assigned_to_id": 2,
    "id": 6,
    "created_at": "2026-07-16T14:15:00Z",
    "updated_at": "2026-07-16T14:15:00Z"
  }
  ```

---

### Get Task Details
* **Endpoint**: `/tasks/{task_id}`
* **Method**: `GET`
* **Description**: Retrieve details of a specific task. Admins can view any task. Employees can only view tasks assigned to them.
* **Authentication**: JWT Bearer Token required.
* **Response (200 OK)**:
  ```json
  {
    "title": "Design Login Screen",
    "description": "Create wireframes and HTML code",
    "status": "pending",
    "priority": "medium",
    "due_date": "2026-07-25T18:00:00Z",
    "assigned_to_id": 2,
    "id": 6,
    "created_at": "2026-07-16T14:15:00Z",
    "updated_at": "2026-07-16T14:15:00Z"
  }
  ```

---

### Update Task
* **Endpoint**: `/tasks/{task_id}`
* **Method**: `PUT`
* **Description**: Update a task. Admins can modify all task fields. Employees can *only* update the `status` of their assigned tasks.
* **Authentication**: JWT Bearer Token required.
* **Request Body (JSON)**:
  ```json
  {
    "status": "in_progress"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "title": "Design Login Screen",
    "description": "Create wireframes and HTML code",
    "status": "in_progress",
    "priority": "medium",
    "due_date": "2026-07-25T18:00:00Z",
    "assigned_to_id": 2,
    "id": 6,
    "created_at": "2026-07-16T14:15:00Z",
    "updated_at": "2026-07-16T14:20:00Z"
  }
  ```

---

### Delete Task
* **Endpoint**: `/tasks/{task_id}`
* **Method**: `DELETE`
* **Description**: Delete a task.
* **Authentication**: JWT Bearer Token required (Admin role only).
* **Response (204 No Content)**: (Empty body)

---

## 3. Notification API

### Get Notifications
* **Endpoint**: `/notifications/`
* **Method**: `GET`
* **Description**: Get notifications for the logged-in user.
* **Authentication**: JWT Bearer Token required.
* **Query Parameters**:
  - `is_read` (bool, optional): Filter by read (`true`) or unread (`false`).
  - `skip` (int, default: 0): Pagination offset.
  - `limit` (int, default: 100): Pagination limit.
* **Response (200 OK)**:
  ```json
  [
    {
      "id": 10,
      "recipient_id": 2,
      "message": "You have been assigned the task: 'Design Login Screen'",
      "is_read": false,
      "created_at": "2026-07-16T14:15:00Z"
    }
  ]
  ```

---

### Mark Notification as Read
* **Endpoint**: `/notifications/{notification_id}/read`
* **Method**: `PATCH`
* **Description**: Mark a single notification as read.
* **Authentication**: JWT Bearer Token required.
* **Response (200 OK)**:
  ```json
  {
    "id": 10,
    "recipient_id": 2,
    "message": "You have been assigned the task: 'Design Login Screen'",
    "is_read": true,
    "created_at": "2026-07-16T14:15:00Z"
  }
  ```

---

### Mark All Notifications as Read
* **Endpoint**: `/notifications/read-all`
* **Method**: `PATCH`
* **Description**: Mark all of the user's notifications as read.
* **Authentication**: JWT Bearer Token required.
* **Response (200 OK)**:
  ```json
  {
    "message": "Successfully marked 3 notifications as read"
  }
  ```

---

## 4. Dashboard API

### Get Summary Statistics
* **Endpoint**: `/dashboard/summary`
* **Method**: `GET`
* **Description**: Get summary metrics (assigned tasks, unread notifications count, completed tasks count, and overdue tasks count).
  - Admin receives counts aggregated globally across all users.
  - Employee receives counts aggregated only for their assigned tasks.
* **Authentication**: JWT Bearer Token required.
* **Response (200 OK)**:
  ```json
  {
    "total_tasks": 12,
    "pending_tasks": 5,
    "in_progress_tasks": 4,
    "completed_tasks": 3,
    "unread_notifications": 2,
    "overdue_tasks": 1
  }
  ```
