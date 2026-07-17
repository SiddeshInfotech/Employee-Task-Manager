import pytest
from fastapi import status

def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "secretpassword", "role": "employee"}
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert data["role"] == "employee"

def test_register_user_duplicate_username(client):
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "email": "test1@example.com", "password": "secretpassword"}
    )
    response = client.post(
        "/api/auth/register",
        json={"username": "testuser", "email": "test2@example.com", "password": "anotherpassword"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Username already registered" in response.json()["detail"]

def test_login_user(client):
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "secretpassword"}
    )
    response = client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "secretpassword"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_user_invalid_credentials(client):
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "secretpassword"}
    )
    response = client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "wrongpassword"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    