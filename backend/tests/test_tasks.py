import pytest
from fastapi import status

def get_auth_headers(client, username, password):
    response = client.post(
        "/api/auth/login",
        data={"username": username, "password": password}
    )
    assert response.status_code == status.HTTP_200_OK
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_task_lifecycle_and_rbac(client):
    # 1. Register users
    client.post(
        "/api/auth/register",
        json={"username": "admin", "email": "admin@example.com", "password": "adminpassword", "role": "admin"}
    )
    client.post(
        "/api/auth/register",
        json={"username": "employee1", "email": "emp1@example.com", "password": "emppassword", "role": "employee"}
    )
    client.post(
        "/api/auth/register",
        json={"username": "employee2", "email": "emp2@example.com", "password": "emppassword", "role": "employee"}
    )

    admin_headers = get_auth_headers(client, "admin", "adminpassword")
    emp1_headers = get_auth_headers(client, "employee1", "emppassword")
    emp2_headers = get_auth_headers(client, "employee2", "emppassword")

    # Employee 1 creates a task (forced to assign to self)
    response = client.post(
        "/api/tasks/",
        json={"title": "Emp1 Self Task", "description": "Done by employee"},
        headers=emp1_headers
    )
    assert response.status_code == status.HTTP_201_CREATED
    emp1_task = response.json()
    emp1_id = emp1_task["assigned_to_id"]
    assert emp1_id is not None

    # 2. Admin creates a task and assigns it to employee 1
    response = client.post(
        "/api/tasks/",
        json={
            "title": "Admin Assigned Task",
            "description": "Assigned by admin",
            "status": "pending",
            "priority": "high",
            "assigned_to_id": emp1_id
        },
        headers=admin_headers
    )
    assert response.status_code == status.HTTP_201_CREATED
    admin_task = response.json()
    assert admin_task["assigned_to_id"] == emp1_id

    # 3. Read tasks
    # Admin reads all (sees both tasks)
    response = client.get("/api/tasks/", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2

    # Employee 1 reads (sees both tasks assigned to him)
    response = client.get("/api/tasks/", headers=emp1_headers)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2

    # Employee 2 reads (sees zero tasks)
    response = client.get("/api/tasks/", headers=emp2_headers)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 0

    # 4. Updates & RBAC
    # Employee 1 updates status of their task (succeeds)
    response = client.put(
        f"/api/tasks/{admin_task['id']}",
        json={"status": "in_progress"},
        headers=emp1_headers
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "in_progress"

    # Employee 1 tries to update priority of their task (fails with 403)
    response = client.put(
        f"/api/tasks/{admin_task['id']}",
        json={"priority": "low"},
        headers=emp1_headers
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # Employee 2 tries to update status of employee 1's task (fails with 403)
    response = client.put(
        f"/api/tasks/{admin_task['id']}",
        json={"status": "completed"},
        headers=emp2_headers
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # Admin updates priority (succeeds)
    response = client.put(
        f"/api/tasks/{admin_task['id']}",
        json={"priority": "low"},
        headers=admin_headers
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["priority"] == "low"

    # 5. Deletion & RBAC
    # Employee 1 tries to delete task (fails with 403)
    response = client.delete(f"/api/tasks/{emp1_task['id']}", headers=emp1_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # Admin deletes task (succeeds)
    response = client.delete(f"/api/tasks/{emp1_task['id']}", headers=admin_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify task is deleted
    response = client.get(f"/api/tasks/{emp1_task['id']}", headers=admin_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
