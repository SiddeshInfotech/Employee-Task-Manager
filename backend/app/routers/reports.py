from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import Dict, Any, List
from app import crud, schemas, auth, database, models

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/")
def get_reports_data(
    employee_id: int | None = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    target_emp_id = None

    if current_user.role != "Admin":
        target_emp_id = current_user.employee_id
    else:
        target_emp_id = employee_id

    query = db.query(models.Task)
    if target_emp_id:
        query = query.filter(models.Task.employee_id == target_emp_id)

    tasks = query.all()
    today = date.today()

    total_tasks = len(tasks)
    pending_tasks = sum(1 for t in tasks if t.status_id == 1 or t.status_id is None)
    in_progress_tasks = sum(1 for t in tasks if t.status_id == 2)
    completed_tasks = sum(1 for t in tasks if t.status_id == 3)
    overdue_tasks = sum(1 for t in tasks if t.due_date and t.due_date < today and t.status_id != 3)

    completion_percentage = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    high_priority = sum(1 for t in tasks if t.priority_id == 1)
    medium_priority = sum(1 for t in tasks if t.priority_id == 2)
    low_priority = sum(1 for t in tasks if t.priority_id == 3)

    employee_info = None
    if target_emp_id:
        emp = crud.get_employee(db, target_emp_id)
        if emp:
            employee_info = {
                "employee_id": emp.employee_id,
                "first_name": emp.first_name,
                "last_name": emp.last_name,
                "email": emp.email,
                "department": emp.department,
                "designation": emp.designation
            }

    return {
        "employee_info": employee_info,
        "summary": {
            "total_tasks": total_tasks,
            "pending_tasks": pending_tasks,
            "in_progress_tasks": in_progress_tasks,
            "completed_tasks": completed_tasks,
            "overdue_tasks": overdue_tasks,
            "completion_percentage": completion_percentage
        },
        "priority_breakdown": {
            "high": high_priority,
            "medium": medium_priority,
            "low": low_priority
        },
        "tasks": [
            {
                "task_id": t.task_id,
                "task_title": t.task_title,
                "task_description": t.task_description,
                "priority_id": t.priority_id,
                "status_id": t.status_id,
                "due_date": str(t.due_date) if t.due_date else None
            }
            for t in tasks
        ]
    }
