from datetime import date, datetime
from django.db.models import Q
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from api.models import Employee, User, Task, Priority, TaskStatus, Notification, Reminder, TaskAssignment
from api.serializers import (
    UserCreateSerializer, UserOutSerializer, EmployeeSerializer,
    TaskCreateSerializer, TaskUpdateSerializer, TaskOutSerializer,
    NotificationSerializer, ReminderSerializer
)
from api.authentication import verify_password, get_password_hash, create_access_token
from api.permissions import IsAuthenticatedUser, IsAdminUserRole
from api.email_utils import send_email


# -------------------------
# AUTHENTICATION VIEWS
# -------------------------

class AuthRegisterView(views.APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        username = data['username']
        password = data['password']
        email = data.get('email')
        requested_emp_id = data.get('employee_id')
        role = data.get('role', 'Employee')

        if User.objects.filter(username=username).exists():
            return Response({"detail": "Username already registered"}, status=status.HTTP_400_BAD_REQUEST)

        formatted_role = role.capitalize() if role else "Employee"
        hashed_password = get_password_hash(password)

        employee_id = None
        if formatted_role == "Admin":
            employee_id = None
        else:
            emp = None
            if requested_emp_id:
                emp = Employee.objects.filter(employee_id=requested_emp_id).first()
            if not emp and email:
                emp = Employee.objects.filter(email=email).first()

            if not emp:
                name_parts = username.split(" ", 1)
                fn = name_parts[0].capitalize()
                ln = name_parts[1].capitalize() if len(name_parts) > 1 else ""
                emp = Employee.objects.create(
                    first_name=fn,
                    last_name=ln,
                    email=email,
                    department="Development",
                    designation="Employee"
                )

            employee_id = emp.employee_id

        user = User.objects.create(
            username=username,
            password=hashed_password,
            employee_id=employee_id,
            role=formatted_role
        )

        if email:
            send_email(
                email,
                "Welcome to Employee Task Tracker",
                f"Hello {username},\n\nYour account has been registered successfully!\n\nUsername: {username}\nRole: {formatted_role}\nEmployee ID: {employee_id or 'N/A (Admin)'}\n\nBest regards,\nTeam"
            )

        resp_data = {
            "user_id": user.user_id,
            "username": user.username,
            "employee_id": user.employee_id,
            "role": user.role,
            "email": email
        }
        return Response(resp_data, status=status.HTTP_201_CREATED)


class AuthLoginView(views.APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get('username') or request.POST.get('username')
        password = request.data.get('password') or request.POST.get('password')

        if not username or not password:
            return Response({"detail": "Incorrect username or password"}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects.filter(username=username).first()

        if not user or not verify_password(password, user.password):
            return Response({"detail": "Incorrect username or password"}, status=status.HTTP_401_UNAUTHORIZED)

        if user.employee_id:
            emp = Employee.objects.filter(employee_id=user.employee_id).first()
            if emp:
                notif = Notification.objects.filter(
                    employee=emp,
                    message="First Login Notification Email Sent"
                ).first()

                if not notif:
                    Notification.objects.create(
                        employee=emp,
                        message="First Login Notification Email Sent",
                        notification_date=datetime.now()
                    )
                    if emp.email:
                        send_email(
                            emp.email,
                            "First Login - Employee Task Tracker",
                            f"Hello {user.username},\n\nYou have successfully logged in to the Employee Task Tracker for the first time.\n\nBest,\nTeam"
                        )

        token_data = {
            "sub": user.username,
            "id": user.user_id,
            "employee_id": user.employee_id,
            "role": user.role
        }
        access_token = create_access_token(token_data)

        return Response({
            "access_token": access_token,
            "token_type": "bearer"
        }, status=status.HTTP_200_OK)


# -------------------------
# EMPLOYEE VIEWS
# -------------------------

class EmployeeListCreateView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        if getattr(request.user, 'role', '') != "Admin":
            if request.user.employee_id:
                emp = Employee.objects.filter(employee_id=request.user.employee_id).first()
                if emp:
                    return Response(EmployeeSerializer([emp], many=True).data)
            return Response([])

        employees = Employee.objects.all()
        return Response(EmployeeSerializer(employees, many=True).data)

    def post(self, request):
        if getattr(request.user, 'role', '') != "Admin":
            return Response({"detail": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)

        serializer = EmployeeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        email = data.get('email')

        existing_emp = None
        if email:
            existing_emp = Employee.objects.filter(email=email).first()

        if existing_emp:
            db_emp = existing_emp
            if data.get('first_name'): db_emp.first_name = data['first_name']
            if data.get('last_name'): db_emp.last_name = data['last_name']
            if data.get('phone'): db_emp.phone = data['phone']
            if data.get('department'): db_emp.department = data['department']
            if data.get('designation'): db_emp.designation = data['designation']
            db_emp.save()
        else:
            db_emp = Employee.objects.create(
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                email=email,
                phone=data.get('phone'),
                department=data.get('department'),
                designation=data.get('designation')
            )

        if db_emp.email:
            base_username = db_emp.email.split("@")[0]
            user = User.objects.filter(username=base_username).first()
            if not user:
                user = User.objects.filter(employee=db_emp).first()

            if not user:
                initial_password = f"{base_username}123"
                hashed_pwd = get_password_hash(initial_password)
                user = User.objects.create(
                    username=base_username,
                    password=hashed_pwd,
                    employee=db_emp,
                    role="Employee"
                )
                send_email(
                    db_emp.email,
                    "Your Employee Task Tracker Account Credentials",
                    f"Hello {db_emp.first_name},\n\nYour employee account has been created!\n\nEmployee ID: {db_emp.employee_id}\nUsername: {base_username}\nPassword: {initial_password}\nRole: Employee\n\nPlease log in to access your task dashboard.\n\nBest regards,\nTeam"
                )
            else:
                if not user.employee:
                    user.employee = db_emp
                    user.save()

        return Response(EmployeeSerializer(db_emp).data, status=status.HTTP_201_CREATED)


class EmployeeDetailView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request, employee_id):
        if getattr(request.user, 'role', '') != "Admin" and request.user.employee_id != employee_id:
            return Response({"detail": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

        emp = Employee.objects.filter(employee_id=employee_id).first()
        if not emp:
            return Response({"detail": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(EmployeeSerializer(emp).data)

    def delete(self, request, employee_id):
        if getattr(request.user, 'role', '') != "Admin":
            return Response({"detail": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)

        emp = Employee.objects.filter(employee_id=employee_id).first()
        if not emp:
            return Response({"detail": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

        User.objects.filter(employee_id=employee_id).delete()
        TaskAssignment.objects.filter(employee_id=employee_id).delete()
        Notification.objects.filter(employee_id=employee_id).delete()
        Task.objects.filter(employee_id=employee_id).update(employee=None)

        emp.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# -------------------------
# TASK VIEWS
# -------------------------

class TaskListCreateView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))

        if getattr(request.user, 'role', '').lower() == "admin":
            tasks_qs = Task.objects.all()[skip:skip + limit]
        else:
            tasks_qs = Task.objects.filter(employee_id=request.user.employee_id)[skip:skip + limit]

        return Response(TaskOutSerializer(tasks_qs, many=True).data)

    def post(self, request):
        serializer = TaskCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        emp_id = data.get('employee_id')
        p_id = data.get('priority_id')
        s_id = data.get('status_id')

        employee = Employee.objects.filter(employee_id=emp_id).first() if emp_id else None
        priority = Priority.objects.filter(priority_id=p_id).first() if p_id else None
        task_status = TaskStatus.objects.filter(status_id=s_id).first() if s_id else None

        task = Task.objects.create(
            task_title=data['task_title'],
            task_description=data.get('task_description'),
            employee=employee,
            priority=priority,
            status=task_status,
            due_date=data.get('due_date'),
            progress=data.get('progress', 0)
        )

        if employee and employee.email:
            send_email(
                employee.email,
                f"New Task Assigned: {task.task_title}",
                f"Hello {employee.first_name},\n\nA new task has been assigned to you:\n\nTitle: {task.task_title}\nDescription: {task.task_description or 'N/A'}\nDue Date: {task.due_date or 'N/A'}\n\nPlease log in to the Employee Task Tracker to view it.\n\nBest,\nTeam"
            )

        return Response(TaskOutSerializer(task).data, status=status.HTTP_201_CREATED)


class TaskDetailView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request, task_id):
        task = Task.objects.filter(task_id=task_id).first()
        if not task:
            return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        if getattr(request.user, 'role', '') != "Admin" and task.employee_id != request.user.employee_id:
            return Response({"detail": "Not enough permissions to access this task"}, status=status.HTTP_403_FORBIDDEN)

        return Response(TaskOutSerializer(task).data)

    def put(self, request, task_id):
        task = Task.objects.filter(task_id=task_id).first()
        if not task:
            return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        if getattr(request.user, 'role', '') != "Admin" and task.employee_id != request.user.employee_id:
            return Response({"detail": "Not enough permissions to modify this task"}, status=status.HTTP_403_FORBIDDEN)

        serializer = TaskUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if 'task_title' in data and data['task_title'] is not None:
            task.task_title = data['task_title']
        if 'task_description' in data:
            task.task_description = data['task_description']
        if 'due_date' in data:
            task.due_date = data['due_date']
        if 'progress' in data and data['progress'] is not None:
            task.progress = data['progress']

        if 'employee_id' in data:
            emp_id = data['employee_id']
            task.employee = Employee.objects.filter(employee_id=emp_id).first() if emp_id else None

        if 'priority_id' in data:
            p_id = data['priority_id']
            task.priority = Priority.objects.filter(priority_id=p_id).first() if p_id else None

        if 'status_id' in data:
            s_id = data['status_id']
            task.status = TaskStatus.objects.filter(status_id=s_id).first() if s_id else None

        task.save()
        return Response(TaskOutSerializer(task).data)

    def delete(self, request, task_id):
        task = Task.objects.filter(task_id=task_id).first()
        if not task:
            return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        if getattr(request.user, 'role', '') != "Admin":
            return Response({"detail": "Only Admin can delete tasks"}, status=status.HTTP_403_FORBIDDEN)

        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# -------------------------
# NOTIFICATION VIEWS
# -------------------------

class NotificationListView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        if getattr(request.user, 'role', '') == "Admin":
            notifs = Notification.objects.all()
        else:
            notifs = Notification.objects.filter(employee_id=request.user.employee_id)
        return Response(NotificationSerializer(notifs, many=True).data)

    def post(self, request):
        emp_id = request.data.get('employee_id') or request.query_params.get('employee_id')
        msg = request.data.get('message') or request.query_params.get('message')

        if not emp_id or not msg:
            return Response({"detail": "employee_id and message required"}, status=status.HTTP_400_BAD_REQUEST)

        emp = Employee.objects.filter(employee_id=emp_id).first()
        if not emp:
            return Response({"detail": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

        notif = Notification.objects.create(
            employee=emp,
            message=msg,
            notification_date=datetime.now()
        )
        return Response(NotificationSerializer(notif).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        if getattr(request.user, 'role', '') == "Admin":
            Notification.objects.all().delete()
        else:
            Notification.objects.filter(employee_id=request.user.employee_id).delete()
        return Response({"message": "All notifications deleted"})


class NotificationDetailView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def delete(self, request, notification_id):
        notif = Notification.objects.filter(notification_id=notification_id).first()
        if notif:
            notif.delete()
            return Response({"message": "Notification deleted"})
        return Response({"detail": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)


# -------------------------
# DASHBOARD VIEWS
# -------------------------

class DashboardSummaryView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        if getattr(request.user, 'role', '') == "Admin":
            qs = Task.objects.all()
        else:
            qs = Task.objects.filter(employee_id=request.user.employee_id)

        total_tasks = qs.count()

        pending_tasks = qs.filter(Q(status__status_name__iexact="pending") | Q(status__status_id=1)).count()
        in_progress_tasks = qs.filter(Q(status__status_name__iexact="in_progress") | Q(status__status_name__iexact="in progress") | Q(status__status_id=2)).count()
        completed_tasks = qs.filter(Q(status__status_name__iexact="completed") | Q(status__status_id=3)).count()

        overdue_tasks = qs.filter(due_date__isnull=False, due_date__lt=date.today()).exclude(Q(status__status_name__iexact="completed") | Q(status__status_id=3)).count()

        unread_notifications = Notification.objects.filter(employee_id=request.user.employee_id).count() if request.user.employee_id else 0

        return Response({
            "total_tasks": total_tasks,
            "pending_tasks": pending_tasks,
            "in_progress_tasks": in_progress_tasks,
            "completed_tasks": completed_tasks,
            "unread_notifications": unread_notifications,
            "overdue_tasks": overdue_tasks
        })


# -------------------------
# REMINDER VIEWS
# -------------------------

class ReminderListCreateView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        reminders = Reminder.objects.all()
        return Response(ReminderSerializer(reminders, many=True).data)

    def post(self, request):
        serializer = ReminderSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReminderDetailView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request, reminder_id):
        reminder = Reminder.objects.filter(reminder_id=reminder_id).first()
        if not reminder:
            return Response({"detail": "Reminder not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ReminderSerializer(reminder).data)

    def delete(self, request, reminder_id):
        reminder = Reminder.objects.filter(reminder_id=reminder_id).first()
        if not reminder:
            return Response({"detail": "Reminder not found"}, status=status.HTTP_404_NOT_FOUND)
        reminder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# -------------------------
# REPORTS VIEW
# -------------------------

class ReportsView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        param_emp_id = request.query_params.get('employee_id')

        if getattr(request.user, 'role', '') != "Admin":
            target_emp_id = request.user.employee_id
        else:
            target_emp_id = int(param_emp_id) if (param_emp_id and str(param_emp_id).isdigit()) else None

        qs = Task.objects.all()
        if target_emp_id:
            qs = qs.filter(employee_id=target_emp_id)

        tasks = list(qs)
        today = date.today()

        total_tasks = len(tasks)
        pending_tasks = sum(1 for t in tasks if not t.status_id or t.status_id == 1)
        in_progress_tasks = sum(1 for t in tasks if t.status_id == 2)
        completed_tasks = sum(1 for t in tasks if t.status_id == 3)
        overdue_tasks = sum(1 for t in tasks if t.due_date and t.due_date < today and t.status_id != 3)

        completion_percentage = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

        high_priority = sum(1 for t in tasks if t.priority_id == 1)
        medium_priority = sum(1 for t in tasks if t.priority_id == 2)
        low_priority = sum(1 for t in tasks if t.priority_id == 3)

        employee_info = None
        if target_emp_id:
            emp = Employee.objects.filter(employee_id=target_emp_id).first()
            if emp:
                employee_info = {
                    "employee_id": emp.employee_id,
                    "first_name": emp.first_name,
                    "last_name": emp.last_name,
                    "email": emp.email,
                    "department": emp.department,
                    "designation": emp.designation
                }

        return Response({
            "employee_info": employee_info,
            "summary": {
                "total_tasks": total_tasks,
                "pending_tasks": pending_tasks,
                "in_progress_tasks": in_progress_tasks,
                "completed_tasks": completed_tasks,
                "overdue_tasks": overdue_tasks,
                "completion_percentage": completion_percentage
            },
            "priority_breakdown": {
                "high": high_priority,
                "medium": medium_priority,
                "low": low_priority
            },
            "tasks": [
                {
                    "task_id": t.task_id,
                    "task_title": t.task_title,
                    "task_description": t.task_description,
                    "priority_id": t.priority_id,
                    "status_id": t.status_id,
                    "due_date": str(t.due_date) if t.due_date else None
                }
                for t in tasks
            ]
        })


# -------------------------
# USER & PROFILE VIEWS
# -------------------------

class UserListView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        users = User.objects.all()
        return Response([
            {
                "id": u.user_id,
                "user_id": u.user_id,
                "username": u.username,
                "role": u.role,
                "employee_id": u.employee_id
            }
            for u in users
        ])


class UserProfileView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        user = request.user
        emp = Employee.objects.filter(employee_id=user.employee_id).first() if user.employee_id else None

        clean_email = emp.email if (emp and emp.email) else f"{user.username.lower().replace(' ', '')}@gmail.com"
        clean_dept = emp.department if (emp and emp.department) else ("Management" if user.role == "Admin" else "Development")
        clean_desig = emp.designation if (emp and emp.designation) else ("Administrator" if user.role == "Admin" else "Employee")
        clean_phone = emp.phone if (emp and emp.phone) else ""

        return Response({
            "user_id": user.user_id,
            "username": user.username,
            "email": clean_email,
            "role": user.role or "Employee",
            "employee_id": user.employee_id,
            "department": clean_dept,
            "designation": clean_desig,
            "phone": clean_phone
        })

    def put(self, request):
        user = request.user
        update_data = request.data

        if "username" in update_data and update_data["username"]:
            user.username = update_data["username"]
            user.save()

        if user.employee_id:
            emp = Employee.objects.filter(employee_id=user.employee_id).first()
            if emp:
                if "email" in update_data and update_data["email"]:
                    emp.email = update_data["email"]
                if "department" in update_data and update_data["department"]:
                    emp.department = update_data["department"]
                if "phone" in update_data and update_data["phone"]:
                    emp.phone = update_data["phone"]
                if "designation" in update_data and update_data["designation"]:
                    emp.designation = update_data["designation"]
                emp.save()

        return self.get(request)


class ProfileView(views.APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        if not request.user.employee_id:
            return Response({"detail": "Employee profile not associated with this user"}, status=status.HTTP_404_NOT_FOUND)

        emp = Employee.objects.filter(employee_id=request.user.employee_id).first()
        if not emp:
            return Response({"detail": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(EmployeeSerializer(emp).data)

    def put(self, request):
        if not request.user.employee_id:
            return Response({"detail": "Employee profile not associated with this user"}, status=status.HTTP_404_NOT_FOUND)

        emp = Employee.objects.filter(employee_id=request.user.employee_id).first()
        if not emp:
            return Response({"detail": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = EmployeeSerializer(emp, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
