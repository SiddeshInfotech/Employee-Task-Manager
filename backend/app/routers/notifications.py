from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, auth, database, models

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[schemas.NotificationOut])
def read_notifications(
    is_read: bool | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return crud.get_notifications(
        db=db, user_id=current_user.id, is_read=is_read, skip=skip, limit=limit
    )

@router.patch("/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_notif = crud.mark_notification_as_read(db=db, notification_id=notification_id, user_id=current_user.id)
    if not db_notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied"
        )
    return db_notif

@router.patch("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    count = crud.mark_all_notifications_as_read(db=db, user_id=current_user.id)
    return {"message": f"Successfully marked {count} notifications as read"}
