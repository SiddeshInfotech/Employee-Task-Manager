from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import crud, schemas, auth, database
from app.config import settings


from app.email_utils import send_email

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):

    existing_user = crud.get_user_by_username(
        db,
        username=user.username
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    db_user = crud.create_user(
        db=db,
        user=user
    )
    
    if user.email:
        background_tasks.add_task(
            send_email, 
            user.email, 
            "Welcome to Employee Task Tracker", 
            f"Hello {user.username},\n\nYour account has been successfully registered on Employee Task Tracker.\n\nBest,\nTeam"
        )
        
    return db_user



@router.post(
    "/login",
    response_model=schemas.Token
)
def login_for_access_token(
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):

    user = crud.get_user_by_username(
        db,
        username=form_data.username
    )


    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )


    if not auth.verify_password(
        form_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if user.employee_id:
        from app import models as m
        from datetime import datetime
        employee = db.query(m.Employee).filter_by(employee_id=user.employee_id).first()
        if employee:
            notif = db.query(m.Notification).filter_by(
                employee_id=user.employee_id,
                message="First Login Notification Email Sent"
            ).first()
            
            if not notif:
                new_notif = m.Notification(
                    employee_id=user.employee_id,
                    message="First Login Notification Email Sent",
                    notification_date=datetime.now()
                )
                db.add(new_notif)
                db.commit()
                
                if employee.email:
                    background_tasks.add_task(
                        send_email, 
                        employee.email, 
                        "First Login - Employee Task Tracker",
                        f"Hello {user.username},\n\nYou have successfully logged in to the Employee Task Tracker for the first time.\n\nBest,\nTeam"
                    )



    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )


    access_token = auth.create_access_token(
        data={
            "sub": user.username,
            "id": user.user_id,
            "employee_id": user.employee_id,
            "role": user.role
        },
        expires_delta=access_token_expires
    )


    return {
        "access_token": access_token,
        "token_type": "bearer"
    }