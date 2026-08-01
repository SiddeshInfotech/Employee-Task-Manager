from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, auth, database, models


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.get(
    "/",
    response_model=List[schemas.NotificationOut]
)
def read_notifications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):

    print("\n========== CURRENT USER ==========")
    print("USER ID =", current_user.user_id)
    print("EMPLOYEE ID =", current_user.employee_id)
    print("ROLE =", current_user.role)
    print("=================================\n")

    return crud.get_notifications(
        db=db,
        employee_id=current_user.employee_id,
        role=current_user.role
    )

@router.post("/")
def create_notification(
    employee_id: int,
    message: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):

    return crud.create_notification(
        db=db,
        employee_id=employee_id,
        message=message
    )


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    crud.delete_notification(db, notification_id)
    return {"message": "Notification deleted"}


@router.delete("/")
def delete_all_notifications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    crud.delete_all_notifications(db, current_user.employee_id, current_user.role)
    return {"message": "All notifications deleted"}