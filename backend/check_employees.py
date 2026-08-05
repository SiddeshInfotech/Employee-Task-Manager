from app.database import SessionLocal
from app.models import Employee

db = SessionLocal()

employees = db.query(Employee).order_by(Employee.employee_id.desc()).all()

for e in employees:
    print(
        e.employee_id,
        f"{e.first_name or ''} {e.last_name or ''}".strip(),
        e.email,
        e.phone,
        e.department
    )

db.close()