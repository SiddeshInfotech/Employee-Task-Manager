import pytest
from fastapi import status
from tests.test_tasks import get_auth_headers

def test_notifications_generation_and_reading(client):
    # 1. Register admin and employee
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

    # Employee creates self task (generates 1 notification)
    response = client.post(
        "/api/tasks/",
        json={"title": "Self Task"},
        headers=emp_headers
    )
    emp_id = response.json()["assigned_to_id"]

    response = client.get("/api/notifications/", headers=emp_headers)
    assert len(response.json()) == 1
    
    # Admin assigns task to employee (generates another notification)
    client.post(
        "/api/tasks/",
        json={
            "title": "New Assignment",
            "assigned_to_id": emp_id
        },
        headers=admin_headers
    )

    # 2. Get notifications for employee
    response = client.get("/api/notifications/", headers=emp_headers)
    assert response.status_code == status.HTTP_200_OK
    notifications = response.json()
    assert len(notifications) == 2
    assert "New Assignment" in notifications[0]["message"]
    
    unread_notif = notifications[0]
    assert unread_notif["is_read"] is False

    # 3. Mark notification as read
    response = client.patch(f"/api/notifications/{unread_notif['id']}/read", headers=emp_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_read"] is True

    # 4. Check filtered notifications (unread only)
    response = client.get("/api/notifications/?is_read=false", headers=emp_headers)
    assert len(response.json()) == 1

    # Mark all as read
    response = client.patch("/api/notifications/read-all", headers=emp_headers)
    assert response.status_code == status.HTTP_200_OK
    
    # Check that there are no unread notifications left
    response = client.get("/api/notifications/?is_read=false", headers=emp_headers)
    assert len(response.json()) == 0
