from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import auth, database, models, schemas


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/summary",
    response_model=schemas.DashboardSummary
)
def get_dashboard_summary(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):

    # Admin सर्व tasks पाहू शकतो
    if current_user.role == "Admin":

        task_query = db.query(models.Task)

    else:

        task_query = db.query(models.Task).filter(
            models.Task.employee_id == current_user.employee_id
        )


    total_tasks = task_query.count()


    pending_tasks = task_query.join(
        models.TaskStatus
    ).filter(
        models.TaskStatus.status_name == "pending"
    ).count()


    in_progress_tasks = task_query.join(
        models.TaskStatus
    ).filter(
        models.TaskStatus.status_name == "in_progress"
    ).count()


    completed_tasks = task_query.join(
        models.TaskStatus
    ).filter(
        models.TaskStatus.status_name == "completed"
    ).count()



    overdue_tasks = task_query.filter(
        models.Task.due_date.isnot(None),
        models.Task.due_date < date.today()
    ).count()



    unread_notifications = db.query(
        models.Notification
    ).filter(
        models.Notification.employee_id == current_user.employee_id
    ).count()



    return {
        "total_tasks": total_tasks,
        "pending_tasks": pending_tasks,
        "in_progress_tasks": in_progress_tasks,
        "completed_tasks": completed_tasks,
        "unread_notifications": unread_notifications,
        "overdue_tasks": overdue_tasks
    }