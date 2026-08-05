from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, auth, database, models
from app.email_utils import send_email

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "/",
    response_model=schemas.TaskOut,
    status_code=status.HTTP_201_CREATED
)
def create_task(
    task_in: schemas.TaskCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):

    db_task = crud.create_task(
        db=db,
        task_in=task_in
    )

    # Send task assignment email to the assigned employee
    if task_in.employee_id:
        employee = db.query(models.Employee).filter(
            models.Employee.employee_id == task_in.employee_id
        ).first()
        if employee and employee.email:
            background_tasks.add_task(
                send_email,
                employee.email,
                f"New Task Assigned: {task_in.task_title}",
                f"Hello {employee.first_name},\n\nA new task has been assigned to you:\n\nTitle: {task_in.task_title}\nDescription: {task_in.task_description or 'N/A'}\nDue Date: {task_in.due_date or 'N/A'}\n\nPlease log in to the Employee Task Tracker to view it.\n\nBest,\nTeam"
            )

    return db_task


@router.get("/", response_model=List[schemas.TaskOut])
def read_tasks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return crud.get_tasks(
        db=db,
        employee_id=current_user.employee_id,
        role=current_user.role,
        skip=skip,
        limit=limit
    )


@router.get("/{task_id}", response_model=schemas.TaskOut)
def read_task(
    task_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_task = crud.get_task(db, task_id=task_id)

    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if (
        current_user.role != "Admin"
        and db_task.employee_id != current_user.employee_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this task"
        )

    return db_task


@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_task = crud.get_task(db, task_id=task_id)

    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if (
        current_user.role != "Admin"
        and db_task.employee_id != current_user.employee_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to modify this task"
        )

    return crud.update_task(
        db=db,
        db_task=db_task,
        task_update=task_update
    )


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_task(
    task_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_task = crud.get_task(db, task_id=task_id)

    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can delete tasks"
        )

    crud.delete_task(
        db=db,
        db_task=db_task
    )

    return None