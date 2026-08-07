from django.db import models


class Employee(models.Model):
    employee_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=50, null=True, blank=True)
    last_name = models.CharField(max_length=50, null=True, blank=True)
    email = models.CharField(max_length=100, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=15, null=True, blank=True)
    department = models.CharField(max_length=50, null=True, blank=True)
    designation = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'employees'
        managed = False

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class User(models.Model):
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Manager', 'Manager'),
        ('Employee', 'Employee'),
    ]

    user_id = models.AutoField(primary_key=True)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        db_column='employee_id',
        null=True,
        blank=True,
        related_name='users'
    )
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Employee', null=True, blank=True)

    class Meta:
        db_table = 'users'
        managed = False

    def __str__(self):
        return self.username


class Priority(models.Model):
    priority_id = models.IntegerField(primary_key=True)
    priority_name = models.CharField(max_length=20)

    class Meta:
        db_table = 'priority'
        managed = False

    def __str__(self):
        return self.priority_name


class TaskStatus(models.Model):
    status_id = models.IntegerField(primary_key=True)
    status_name = models.CharField(max_length=20)

    class Meta:
        db_table = 'task_status'
        managed = False

    def __str__(self):
        return self.status_name


class Task(models.Model):
    task_id = models.AutoField(primary_key=True)
    task_title = models.CharField(max_length=100)
    task_description = models.TextField(null=True, blank=True)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        db_column='employee_id',
        null=True,
        blank=True,
        related_name='tasks'
    )
    priority = models.ForeignKey(
        Priority,
        on_delete=models.SET_NULL,
        db_column='priority_id',
        null=True,
        blank=True,
        related_name='tasks'
    )
    status = models.ForeignKey(
        TaskStatus,
        on_delete=models.SET_NULL,
        db_column='status_id',
        null=True,
        blank=True,
        related_name='tasks'
    )
    due_date = models.DateField(null=True, blank=True)
    progress = models.IntegerField(default=0)

    class Meta:
        db_table = 'task'
        managed = False

    def __str__(self):
        return self.task_title


class TaskAssignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        db_column='task_id',
        null=True,
        blank=True,
        related_name='assignments'
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        db_column='employee_id',
        null=True,
        blank=True,
        related_name='assignments'
    )
    assigned_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='assigned_by',
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    assigned_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'task_assignments'
        managed = False


class Notification(models.Model):
    notification_id = models.AutoField(primary_key=True)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        db_column='employee_id',
        null=True,
        blank=True,
        related_name='notifications'
    )
    message = models.CharField(max_length=255, null=True, blank=True)
    notification_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'notifications'
        managed = False


class Reminder(models.Model):
    reminder_id = models.AutoField(primary_key=True)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        db_column='task_id',
        null=True,
        blank=True,
        related_name='reminders'
    )
    reminder_date = models.DateField(null=True, blank=True)
    reminder_time = models.TimeField(null=True, blank=True)

    class Meta:
        db_table = 'reminders'
        managed = False
