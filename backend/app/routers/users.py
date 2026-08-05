from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import database, models, auth

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_current_user_profile(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    emp = None
    if current_user.employee_id:
        emp = db.query(models.Employee).filter(
            models.Employee.employee_id == current_user.employee_id
        ).first()

    clean_email = (
        emp.email if (emp and emp.email)
        else f"{current_user.username.lower().replace(' ', '')}@gmail.com"
    )
    clean_dept = (
        emp.department if (emp and emp.department)
        else ("Management" if current_user.role == "Admin" else "Development")
    )
    clean_desig = (
        emp.designation if (emp and emp.designation)
        else ("Administrator" if current_user.role == "Admin" else "Employee")
    )
    clean_phone = emp.phone if (emp and emp.phone) else ""

    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "email": clean_email,
        "role": current_user.role or "Employee",
        "employee_id": current_user.employee_id,
        "department": clean_dept,
        "designation": clean_desig,
        "phone": clean_phone
    }


@router.put("/me")
def update_current_user_profile(
    update_data: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if "username" in update_data and update_data["username"]:
        current_user.username = update_data["username"]

    if current_user.employee_id:
        emp = db.query(models.Employee).filter(
            models.Employee.employee_id == current_user.employee_id
        ).first()
        if emp:
            if "email" in update_data and update_data["email"]:
                emp.email = update_data["email"]
            if "department" in update_data and update_data["department"]:
                emp.department = update_data["department"]
            if "phone" in update_data and update_data["phone"]:
                emp.phone = update_data["phone"]
            if "designation" in update_data and update_data["designation"]:
                emp.designation = update_data["designation"]

    db.commit()
    db.refresh(current_user)

    return get_current_user_profile(db=db, current_user=current_user)
