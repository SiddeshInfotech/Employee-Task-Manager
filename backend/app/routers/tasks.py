from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, auth, database, models

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("/", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: schemas.TaskCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # If the user is not an admin, force assigning to themselves
    if current_user.role != "admin":
        task_in.assigned_to_id = current_user.id
    
    # Verify assignee exists if specified
    if task_in.assigned_to_id:
        assignee = db.query(models.User).filter(models.User.id == task_in.assigned_to_id).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assignee user with ID {task_in.assigned_to_id} not found"
            )
            
    return crud.create_task(db=db, task_in=task_in, creator_id=current_user.id)

@router.get("/", response_model=List[schemas.TaskOut])
def read_tasks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return crud.get_tasks(db=db, user_id=current_user.id, role=current_user.role, skip=skip, limit=limit)

@router.get("/{task_id}", response_model=schemas.TaskOut)
def read_task(
    task_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_task = crud.get_task(db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # If not admin, verify ownership
    if current_user.role != "admin" and db_task.assigned_to_id != current_user.id:
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # If not admin, restrict modifications
    if current_user.role != "admin":
        if db_task.assigned_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to modify this task"
            )
        
        # Employees can only update status
        update_data = task_update.model_dump(exclude_unset=True)
        if any(key != "status" for key in update_data.keys()):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only update the status of their assigned tasks"
            )

    # Verify assignee if updating assignment
    if task_update.assigned_to_id:
        assignee = db.query(models.User).filter(models.User.id == task_update.assigned_to_id).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assignee user with ID {task_update.assigned_to_id} not found"
            )

    return crud.update_task(db=db, db_task=db_task, task_update=task_update)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_admin_role)
):
    db_task = crud.get_task(db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    crud.delete_task(db=db, db_task=db_task)
    return None
