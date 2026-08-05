from sqlalchemy.orm import Session
from app import models, schemas
from app.auth import get_password_hash


# -------------------------
# EMPLOYEE CRUD
# -------------------------

from app.email_utils import send_email


def get_employee(db: Session, employee_id: int):
    return db.query(models.Employee).filter(
        models.Employee.employee_id == employee_id
    ).first()


def get_all_employees(db: Session):
    return db.query(models.Employee).all()


def create_employee(db: Session, employee_in: schemas.EmployeeCreate):
    existing_emp = None
    if employee_in.email:
        existing_emp = db.query(models.Employee).filter(
            models.Employee.email == employee_in.email
        ).first()

    if existing_emp:
        db_emp = existing_emp
        if employee_in.first_name: db_emp.first_name = employee_in.first_name
        if employee_in.last_name: db_emp.last_name = employee_in.last_name
        if employee_in.phone: db_emp.phone = employee_in.phone
        if employee_in.department: db_emp.department = employee_in.department
        if employee_in.designation: db_emp.designation = employee_in.designation
        db.commit()
        db.refresh(db_emp)
    else:
        db_emp = models.Employee(
            first_name=employee_in.first_name,
            last_name=employee_in.last_name,
            email=employee_in.email,
            phone=employee_in.phone,
            department=employee_in.department,
            designation=employee_in.designation
        )
        db.add(db_emp)
        db.commit()
        db.refresh(db_emp)

    if db_emp.email:
        base_username = db_emp.email.split("@")[0]
        user = db.query(models.User).filter(
            models.User.username == base_username
        ).first()
        if not user:
            user = db.query(models.User).filter(
                models.User.employee_id == db_emp.employee_id
            ).first()

        if not user:
            initial_password = f"{base_username}123"
            hashed_pwd = get_password_hash(initial_password)
            user = models.User(
                username=base_username,
                password=hashed_pwd,
                employee_id=db_emp.employee_id,
                role="Employee"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            send_email(
                db_emp.email,
                "Your Employee Task Tracker Account Credentials",
                f"Hello {db_emp.first_name},\n\nYour employee account has been created!\n\nEmployee ID: {db_emp.employee_id}\nUsername: {base_username}\nPassword: {initial_password}\nRole: Employee\n\nPlease log in to access your task dashboard.\n\nBest regards,\nTeam"
            )
        else:
            if not user.employee_id:
                user.employee_id = db_emp.employee_id
                db.commit()

    return db_emp


# -------------------------
# USER CRUD
# -------------------------

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(
        models.User.username == username
    ).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    formatted_role = user.role.capitalize() if user.role else "Employee"

    employee_id = None
    if formatted_role == "Admin":
        employee_id = None
    else:
        emp = None
        if user.employee_id:
            emp = db.query(models.Employee).filter(
                models.Employee.employee_id == user.employee_id
            ).first()
        
        if not emp and user.email:
            emp = db.query(models.Employee).filter(
                models.Employee.email == user.email
            ).first()

        if not emp:
            name_parts = user.username.split(" ", 1)
            fn = name_parts[0].capitalize()
            ln = name_parts[1].capitalize() if len(name_parts) > 1 else ""
            emp = models.Employee(
                first_name=fn,
                last_name=ln,
                email=user.email,
                department="Development",
                designation="Employee"
            )
            db.add(emp)
            db.commit()
            db.refresh(emp)

        employee_id = emp.employee_id

    db_user = models.User(
        username=user.username,
        employee_id=employee_id,
        password=hashed_password,
        role=formatted_role
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    db_user.email = user.email

    if user.email:
        send_email(
            user.email,
            "Welcome to Employee Task Tracker",
            f"Hello {user.username},\n\nYour account has been registered successfully!\n\nUsername: {user.username}\nRole: {formatted_role}\nEmployee ID: {employee_id or 'N/A (Admin)'}\n\nBest regards,\nTeam"
        )

    return db_user


# -------------------------
# TASK CRUD
# -------------------------

def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(
        models.Task.task_id == task_id
    ).first()


def get_tasks(
    db: Session,
    employee_id: int,
    role: str,
    skip: int = 0,
    limit: int = 100
):
    if role and role.lower() == "admin":
        return (
            db.query(models.Task)
            .offset(skip)
            .limit(limit)
            .all()
        )

    return (
        db.query(models.Task)
        .filter(models.Task.employee_id == employee_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_task(
    db: Session,
    task_in: schemas.TaskCreate
):
    db_task = models.Task(
        task_title=task_in.task_title,
        task_description=task_in.task_description,
        employee_id=task_in.employee_id,
        priority_id=task_in.priority_id,
        status_id=task_in.status_id,
        due_date=task_in.due_date
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return db_task


def update_task(
    db: Session,
    db_task: models.Task,
    task_update: schemas.TaskUpdate
):
    update_data = task_update.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(db_task, field, value)

    db.commit()
    db.refresh(db_task)

    return db_task


def delete_task(
    db: Session,
    db_task: models.Task
):
    db.delete(db_task)
    db.commit()


# -------------------------
# NOTIFICATION CRUD
# -------------------------

def get_notifications(
    db: Session,
    employee_id: int,
    role: str
):
    # Admin ला सर्व notifications दिसतील
    if role == "Admin":
        return db.query(models.Notification).all()

    # Manager आणि Employee ला फक्त स्वतःच्या notifications दिसतील
    return (
        db.query(models.Notification)
        .filter(
            models.Notification.employee_id == employee_id
        )
        .all()
    )

def create_notification(
    db: Session,
    employee_id: int,
    message: str
):
    notification = models.Notification(
        employee_id=employee_id,
        message=message
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


def delete_notification(
    db: Session,
    notification_id: int
):
    notif = db.query(models.Notification).filter(models.Notification.notification_id == notification_id).first()
    if notif:
        db.delete(notif)
        db.commit()
        return True
    return False


def delete_all_notifications(
    db: Session,
    employee_id: int,
    role: str
):
    if role == "Admin":
        db.query(models.Notification).delete()
    else:
        db.query(models.Notification).filter(models.Notification.employee_id == employee_id).delete()
    db.commit()
    return True



# -------------------------
# REMINDER CRUD
# -------------------------

def get_reminders(db: Session):
    return db.query(models.Reminder).all()


def get_reminder(
    db: Session,
    reminder_id: int
):
    return (
        db.query(models.Reminder)
        .filter(
            models.Reminder.reminder_id == reminder_id
        )
        .first()
    )


def create_reminder(
    db: Session,
    reminder_data: schemas.ReminderOut
):
    reminder = models.Reminder(
        task_id=reminder_data.task_id,
        reminder_date=reminder_data.reminder_date,
        reminder_time=reminder_data.reminder_time
    )

    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    return reminder


def delete_reminder(
    db: Session,
    reminder: models.Reminder
):
    db.delete(reminder)
    db.commit()