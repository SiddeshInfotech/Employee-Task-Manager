import pytest
from datetime import datetime, timedelta, timezone
from fastapi import status
from tests.test_tasks import get_auth_headers

def test_dashboard_summary(client):
    # 1. Register users
    client.post(
        "/api/auth/register",
        json={"username": "admin", "email": "admin@example.com", "password": "adminpassword", "role": "admin"}
    )
    client.post(
        "/api/auth/register",
        json={"username": "employee", "email": "emp@example.com", "password": "emppassword", "role": "employee"}
    )

    admin_headers = get_auth_headers(client, "admin", "adminpassword")
    emp_headers = get_auth_headers(client, "employee", "emppassword")

    # Employee creates self task
    response = client.post(
        "/api/tasks/",
        json={"title": "Self Task"},
        headers=emp_headers
    )
    emp_id = response.json()["assigned_to_id"]

    # Admin creates completed task for employee
    client.post(
        "/api/tasks/",
        json={
            "title": "Completed Task",
            "status": "completed",
            "assigned_to_id": emp_id
        },
        headers=admin_headers
    )

    # Admin creates overdue task for employee
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    client.post(
        "/api/tasks/",
        json={
            "title": "Overdue Task",
            "status": "pending",
            "due_date": yesterday,
            "assigned_to_id": emp_id
        },
        headers=admin_headers
    )

    # 2. Check employee dashboard
    response = client.get("/api/dashboard/summary", headers=emp_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["total_tasks"] == 3
    assert data["pending_tasks"] == 2      # "Self Task" and "Overdue Task"
    assert data["in_progress_tasks"] == 0
    assert data["completed_tasks"] == 1    # "Completed Task"
    assert data["overdue_tasks"] == 1      # "Overdue Task"
    assert data["unread_notifications"] == 3

    # 3. Check admin dashboard
    response = client.get("/api/dashboard/summary", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    admin_data = response.json()
    assert admin_data["total_tasks"] == 3
    assert admin_data["unread_notifications"] == 0
