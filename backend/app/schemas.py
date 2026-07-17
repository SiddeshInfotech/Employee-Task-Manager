from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str
    role: str = "employee"  # "admin" or "employee"

class UserOut(UserBase):
    id: int
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    username: str
    password: str

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None
    user_id: int | None = None
    role: str | None = None

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: str | None = None
    status: str = "pending"  # "pending", "in_progress", "completed"
    priority: str = "medium"  # "low", "medium", "high"
    due_date: datetime | None = None
    assigned_to_id: int | None = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: datetime | None = None
    assigned_to_id: int | None = None

class TaskOut(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    recipient_id: int
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Dashboard Schema
class DashboardSummary(BaseModel):
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    unread_notifications: int
    overdue_tasks: int
