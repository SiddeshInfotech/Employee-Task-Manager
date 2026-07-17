from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import auth, database, models, schemas

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    now = datetime.now(timezone.utc)
    
    if current_user.role == "admin":
        task_query = db.query(models.Task)
    else:
        task_query = db.query(models.Task).filter(models.Task.assigned_to_id == current_user.id)
    
    total_tasks = task_query.count()
    pending_tasks = task_query.filter(models.Task.status == "pending").count()
    in_progress_tasks = task_query.filter(models.Task.status == "in_progress").count()
    completed_tasks = task_query.filter(models.Task.status == "completed").count()
    
    # Overdue tasks are non-completed tasks with a due date in the past
    overdue_tasks = task_query.filter(
        models.Task.status != "completed",
        models.Task.due_date.is_not(None),
        models.Task.due_date < now
    ).count()
    
    # Unread notifications are always user-specific
    unread_notifications = db.query(models.Notification).filter(
        models.Notification.recipient_id == current_user.id,
        models.Notification.is_read == False
    ).count()
    
    return {
        "total_tasks": total_tasks,
        "pending_tasks": pending_tasks,
        "in_progress_tasks": in_progress_tasks,
        "completed_tasks": completed_tasks,
        "unread_notifications": unread_notifications,
        "overdue_tasks": overdue_tasks
    }
