from sqlalchemy.orm import Session
from app import models, schemas
from app.auth import get_password_hash


# -------------------------
# USER CRUD
# -------------------------

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(
        models.User.username == username
    ).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)

    db_user = models.User(
        username=user.username,
        employee_id=user.employee_id,
        password=hashed_password,
        role=user.role
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


# -------------------------
# TASK CRUD
# -------------------------

def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(
        models.Task.task_id == task_id
    ).first()


def get_tasks(
    db: Session,
    employee_id: int,
    role: str,
    skip: int = 0,
    limit: int = 100
):
    if role == "Admin":
        return (
            db.query(models.Task)
            .offset(skip)
            .limit(limit)
            .all()
        )

    return (
        db.query(models.Task)
        .filter(models.Task.employee_id == employee_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_task(
    db: Session,
    task_in: schemas.TaskCreate
):
    db_task = models.Task(
        task_title=task_in.task_title,
        task_description=task_in.task_description,
        employee_id=task_in.employee_id,
        priority_id=task_in.priority_id,
        status_id=task_in.status_id,
        due_date=task_in.due_date
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return db_task


def update_task(
    db: Session,
    db_task: models.Task,
    task_update: schemas.TaskUpdate
):
    update_data = task_update.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(db_task, field, value)

    db.commit()
    db.refresh(db_task)

    return db_task


def delete_task(
    db: Session,
    db_task: models.Task
):
    db.delete(db_task)
    db.commit()


# -------------------------
# NOTIFICATION CRUD
# -------------------------

def get_notifications(
    db: Session,
    employee_id: int,
    role: str
):
    # Admin ला सर्व notifications दिसतील
    if role == "Admin":
        return db.query(models.Notification).all()

    # Manager आणि Employee ला फक्त स्वतःच्या notifications दिसतील
    return (
        db.query(models.Notification)
        .filter(
            models.Notification.employee_id == employee_id
        )
        .all()
    )

def create_notification(
    db: Session,
    employee_id: int,
    message: str
):
    notification = models.Notification(
        employee_id=employee_id,
        message=message
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# -------------------------
# REMINDER CRUD
# -------------------------

def get_reminders(db: Session):
    return db.query(models.Reminder).all()


def get_reminder(
    db: Session,
    reminder_id: int
):
    return (
        db.query(models.Reminder)
        .filter(
            models.Reminder.reminder_id == reminder_id
        )
        .first()
    )


def create_reminder(
    db: Session,
    reminder_data: schemas.ReminderOut
):
    reminder = models.Reminder(
        task_id=reminder_data.task_id,
        reminder_date=reminder_data.reminder_date,
        reminder_time=reminder_data.reminder_time
    )

    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    return reminder


def delete_reminder(
    db: Session,
    reminder: models.Reminder
):
    db.delete(reminder)
    db.commit()