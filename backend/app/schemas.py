from datetime import date, time, datetime
from pydantic import BaseModel, ConfigDict


# -----------------
# User Schemas
# -----------------

class UserBase(BaseModel):
    username: str
    employee_id: int | None = None
    role: str


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    username: str
    password: str


# -----------------
# Token Schemas
# -----------------

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None
    user_id: int | None = None
    role: str | None = None


# -----------------
# Employee Schemas
# -----------------

class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: str | None = None
    phone: str | None = None
    department: str | None = None
    designation: str | None = None


class EmployeeOut(EmployeeBase):
    employee_id: int

    model_config = ConfigDict(from_attributes=True)


# -----------------
# Task Schemas
# -----------------

class TaskCreate(BaseModel):
    task_title: str
    task_description: str | None = None
    employee_id: int | None = None
    priority_id: int | None = None
    status_id: int | None = None
    due_date: date | None = None


class TaskUpdate(BaseModel):
    task_title: str | None = None
    task_description: str | None = None
    employee_id: int | None = None
    priority_id: int | None = None
    status_id: int | None = None
    due_date: date | None = None


class TaskOut(TaskCreate):
    task_id: int

    model_config = ConfigDict(from_attributes=True)


# -----------------
# Notification
# -----------------

class NotificationOut(BaseModel):
    notification_id: int
    employee_id: int
    message: str | None = None
    notification_date: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# -----------------
# Reminder
# -----------------

class ReminderOut(BaseModel):
    reminder_id: int
    task_id: int
    reminder_date: date | None = None
    reminder_time: time | None = None

    model_config = ConfigDict(from_attributes=True)


# -----------------
# Dashboard
# -----------------

class DashboardSummary(BaseModel):
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    unread_notifications: int
    overdue_tasks: int