from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session
from typing import List

from app import (
    crud,
    schemas,
    database,
    auth,
    models
)

router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"]
)


# GET ALL REMINDERS
@router.get(
    "/",
    response_model=List[schemas.ReminderOut]
)
def read_reminders(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(
        auth.get_current_active_user
    )
):
    return crud.get_reminders(db)


# GET REMINDER BY ID
@router.get(
    "/{reminder_id}",
    response_model=schemas.ReminderOut
)
def read_reminder(
    reminder_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(
        auth.get_current_active_user
    )
):
    reminder = crud.get_reminder(
        db=db,
        reminder_id=reminder_id
    )

    if reminder is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    return reminder


# CREATE REMINDER
@router.post(
    "/",
    response_model=schemas.ReminderOut
)
def create_reminder(
    reminder: schemas.ReminderOut,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(
        auth.get_current_active_user
    )
):
    return crud.create_reminder(
        db=db,
        reminder_data=reminder
    )


# DELETE REMINDER
@router.delete(
    "/{reminder_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(
        auth.get_current_active_user
    )
):
    reminder = crud.get_reminder(
        db=db,
        reminder_id=reminder_id
    )

    if reminder is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    crud.delete_reminder(
        db=db,
        reminder=reminder
    )

    return None