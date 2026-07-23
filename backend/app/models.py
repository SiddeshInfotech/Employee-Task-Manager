from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Time, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True, index=True)

    first_name = Column(String(50))
    last_name = Column(String(50))
    email = Column(String(100), unique=True)
    phone = Column(String(15))
    department = Column(String(50))
    designation = Column(String(50))

    users = relationship("User", back_populates="employee")
    tasks = relationship("Task", back_populates="employee")
    notifications = relationship("Notification", back_populates="employee")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(
        Integer,
        ForeignKey("employees.employee_id"),
        nullable=True
    )

    username = Column(String(50), unique=True)
    password = Column(String(100))
    
    role = Column(
        Enum("Admin", "Manager", "Employee"),
        nullable=True
    )

    employee = relationship(
        "Employee",
        back_populates="users"
    )

    assigned_tasks = relationship(
        "TaskAssignment",
        foreign_keys="TaskAssignment.assigned_by",
        back_populates="assigned_user"
    )


class Priority(Base):
    __tablename__ = "priority"

    priority_id = Column(
        Integer,
        primary_key=True
    )

    priority_name = Column(
        String(20),
        nullable=False
    )

    tasks = relationship(
        "Task",
        back_populates="priority"
    )


class TaskStatus(Base):
    __tablename__ = "task_status"

    status_id = Column(
        Integer,
        primary_key=True
    )

    status_name = Column(
        String(20),
        nullable=False
    )

    tasks = relationship(
        "Task",
        back_populates="status"
    )


class Task(Base):
    __tablename__ = "task"

    task_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    task_title = Column(
        String(100),
        nullable=False
    )

    task_description = Column(
        Text,
        nullable=True
    )

    employee_id = Column(
        Integer,
        ForeignKey("employees.employee_id"),
        nullable=True
    )

    priority_id = Column(
        Integer,
        ForeignKey("priority.priority_id"),
        nullable=True
    )

    status_id = Column(
        Integer,
        ForeignKey("task_status.status_id"),
        nullable=True
    )

    due_date = Column(
        Date,
        nullable=True
    )


    employee = relationship(
        "Employee",
        back_populates="tasks"
    )

    priority = relationship(
        "Priority",
        back_populates="tasks"
    )

    status = relationship(
        "TaskStatus",
        back_populates="tasks"
    )

    reminders = relationship(
        "Reminder",
        back_populates="task"
    )

    assignments = relationship(
        "TaskAssignment",
        back_populates="task"
    )


class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    assignment_id = Column(
        Integer,
        primary_key=True
    )

    task_id = Column(
        Integer,
        ForeignKey("task.task_id")
    )

    employee_id = Column(
        Integer,
        ForeignKey("employees.employee_id")
    )

    assigned_by = Column(
        Integer,
        ForeignKey("users.user_id")
    )

    assigned_date = Column(
        Date
    )


    task = relationship(
        "Task",
        back_populates="assignments"
    )


    assigned_user = relationship(
        "User",
        back_populates="assigned_tasks",
        foreign_keys=[assigned_by]
    )


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(
        Integer,
        primary_key=True
    )

    employee_id = Column(
        Integer,
        ForeignKey("employees.employee_id")
    )

    message = Column(
        String(255)
    )

    notification_date = Column(
        DateTime
    )


    employee = relationship(
        "Employee",
        back_populates="notifications"
    )


class Reminder(Base):
    __tablename__ = "reminders"

    reminder_id = Column(
        Integer,
        primary_key=True
    )

    task_id = Column(
        Integer,
        ForeignKey("task.task_id")
    )

    reminder_date = Column(
        Date
    )

    reminder_time = Column(
        Time
    )


    task = relationship(
        "Task",
        back_populates="reminders"
    )