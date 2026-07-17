from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app import models, schemas
from app.auth import get_password_hash

# --- User CRUD ---
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Task CRUD ---
def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()

def get_tasks(db: Session, user_id: int, role: str, skip: int = 0, limit: int = 100):
    if role == "admin":
        return db.query(models.Task).offset(skip).limit(limit).all()
    return db.query(models.Task).filter(models.Task.assigned_to_id == user_id).offset(skip).limit(limit).all()

def create_task(db: Session, task_in: schemas.TaskCreate, creator_id: int):
    db_task = models.Task(**task_in.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # Notify assignee if assigned
    if db_task.assigned_to_id:
        create_notification(
            db,
            recipient_id=db_task.assigned_to_id,
            message=f"You have been assigned a new task: '{db_task.title}'"
        )
    return db_task

def update_task(db: Session, db_task: models.Task, task_update: schemas.TaskUpdate):
    update_data = task_update.model_dump(exclude_unset=True)
    
    old_assignee_id = db_task.assigned_to_id
    old_status = db_task.status
    
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db_task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_task)

    # Trigger notifications based on updates
    # 1. Assignment change
    if "assigned_to_id" in update_data and db_task.assigned_to_id != old_assignee_id:
        if db_task.assigned_to_id:
            create_notification(
                db,
                recipient_id=db_task.assigned_to_id,
                message=f"You have been assigned the task: '{db_task.title}'"
            )
        if old_assignee_id:
            create_notification(
                db,
                recipient_id=old_assignee_id,
                message=f"You have been unassigned from the task: '{db_task.title}'"
            )

    # 2. Status change
    if "status" in update_data and db_task.status != old_status:
        if db_task.assigned_to_id:
            create_notification(
                db,
                recipient_id=db_task.assigned_to_id,
                message=f"Status of your task '{db_task.title}' has changed from '{old_status}' to '{db_task.status}'"
            )
        # Notify admins if task is completed
        if db_task.status == "completed":
            admins = db.query(models.User).filter(models.User.role == "admin").all()
            for admin in admins:
                create_notification(
                    db,
                    recipient_id=admin.id,
                    message=f"Task '{db_task.title}' has been completed by employee (User ID: {db_task.assigned_to_id})"
                )

    return db_task

def delete_task(db: Session, db_task: models.Task):
    db.delete(db_task)
    db.commit()

# --- Notification CRUD ---
def get_notifications(db: Session, user_id: int, is_read: bool | None = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Notification).filter(models.Notification.recipient_id == user_id)
    if is_read is not None:
        query = query.filter(models.Notification.is_read == is_read)
    return query.order_by(models.Notification.created_at.desc()).offset(skip).limit(limit).all()

def create_notification(db: Session, recipient_id: int, message: str):
    db_notif = models.Notification(
        recipient_id=recipient_id,
        message=message
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

def mark_notification_as_read(db: Session, notification_id: int, user_id: int):
    db_notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_id == user_id
    ).first()
    if db_notif:
        db_notif.is_read = True
        db.commit()
        db.refresh(db_notif)
    return db_notif

def mark_all_notifications_as_read(db: Session, user_id: int):
    unread_notifs = db.query(models.Notification).filter(
        models.Notification.recipient_id == user_id,
        models.Notification.is_read == False
    ).all()
    for notif in unread_notifs:
        notif.is_read = True
    db.commit()
    return len(unread_notifs)
