# Frontend Integration Guide: Employee Task Tracker

This guide helps the frontend team integrate with the Employee Task Tracker backend APIs.

---

## 1. Authentication Flow & State Management

### A. Obtaining the Token
To log in, submit the credentials to `POST /api/auth/login` as **Form Data** (do *not* send as JSON).

**Example Javascript/Axios request:**
```javascript
const formData = new FormData();
formData.append('username', 'john_doe');
formData.append('password', 'strongpassword123');

axios.post('http://127.0.0.1:8000/api/auth/login', formData)
  .then(response => {
    const { access_token } = response.json();
    // Save to localStorage or context state
    localStorage.setItem('token', access_token);
  });
```

### B. Making Authenticated Requests
All APIs (except `/auth/register` and `/auth/login`) require the JWT Bearer Token in the `Authorization` header:

```javascript
const token = localStorage.getItem('token');

axios.get('http://127.0.0.1:8000/api/tasks/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 2. Implementing Role-Based Access Control (RBAC) in the UI

The backend returns user roles when logging in or validating tokens. The two roles are `"admin"` and `"employee"`.

To prevent permission errors (HTTP 403 Forbidden), implement the following UI guards:

### A. Task Creation
- **Admin**: Can assign a task to any user by sending `assigned_to_id` in the request body.
- **Employee**: Forced to assign tasks to themselves. You can hide the "Assign To" select dropdown for employees.

### B. Task Updating
- **Admin**: Can edit all fields (Title, Description, Due Date, Status, Priority, Assignee).
- **Employee**: Can *only* update the `status` dropdown (e.g., transition from `"pending"` to `"in_progress"` or `"completed"`).
  - *Integration Action*: Disable or hide all task fields except for the "Status" select field on the Edit Task view if `user.role === 'employee'`.

### C. Task Deletion
- **Admin**: Full deletion privileges. Show the "Delete" button.
- **Employee**: Cannot delete tasks.
  - *Integration Action*: Hide the "Delete" button from the list and detail pages if `user.role === 'employee'`.

---

## 3. Real-Time Notifications

Notifications are triggered automatically on the backend whenever tasks are assigned, statuses change, or when tasks are completed.

To show notifications in the UI:
1. **Poll Notification Endpoint**: Periodically poll `GET /api/notifications/?is_read=false` (e.g., every 30 seconds) to fetch unread alerts.
2. **Mark as Read**: When a user clicks/views a notification, send a `PATCH /api/notifications/{notification_id}/read` to clear it.
3. **Clear All**: Provide a "Mark all as read" button calling `PATCH /api/notifications/read-all`.

---

## 4. Dashboard Refresh Cycle

The `GET /api/dashboard/summary` endpoint returns counts of pending, completed, in-progress, unread notifications, and overdue tasks.
- Call this endpoint when the user lands on the Home/Dashboard screen.
- Re-fetch this summary data whenever a user completes a task or marks notifications as read to ensure the counts are synchronized.

---

## 5. Standard Error Handling

The backend returns errors in a standard FastAPI format:
- **validation error (422 Unprocessable Entity)**:
  ```json
  {
    "detail": [
      {
        "loc": ["body", "title"],
        "msg": "field required",
        "type": "value_error.missing"
      }
    ]
  }
  ```
- **Operational Error (400, 401, 403, 404)**:
  ```json
  {
    "detail": "Incorrect username or password"
  }
  ```
Always check `error.response.data.detail` to display user-friendly error messages.
