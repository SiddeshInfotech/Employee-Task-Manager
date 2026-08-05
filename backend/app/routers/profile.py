from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas, auth, database, models

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/", response_model=schemas.EmployeeOut)
def get_profile(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if not current_user.employee_id:
        raise HTTPException(status_code=404, detail="Employee profile not associated with this user")
    
    employee = crud.get_employee(db, current_user.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.put("/", response_model=schemas.EmployeeOut)
def update_profile(
    profile_data: schemas.EmployeeUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if not current_user.employee_id:
        raise HTTPException(status_code=404, detail="Employee profile not associated with this user")

    employee = crud.update_employee_profile(
        db=db,
        employee_id=current_user.employee_id,
        update_data=profile_data.model_dump(exclude_unset=True)
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return employee


@router.post("/upload-photo", response_model=schemas.EmployeeOut)
def upload_photo(
    photo_in: schemas.ProfilePhotoUpload,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if not current_user.employee_id:
        raise HTTPException(status_code=404, detail="Employee profile not associated with this user")

    employee = crud.update_employee_profile(
        db=db,
        employee_id=current_user.employee_id,
        update_data={"profile_photo": photo_in.profile_photo}
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return employee
