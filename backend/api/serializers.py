from rest_framework import serializers
from api.models import Employee, User, Task, Notification, Reminder, Priority, TaskStatus


class UserBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'employee_id', 'role']


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)
    password = serializers.CharField(max_length=100)
    email = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    employee_id = serializers.IntegerField(required=False, allow_null=True)
    role = serializers.CharField(default='Employee', required=False)


class UserOutSerializer(serializers.ModelSerializer):
    email = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = ['user_id', 'username', 'employee_id', 'role', 'email']


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['employee_id', 'first_name', 'last_name', 'email', 'phone', 'department', 'designation']
        read_only_fields = ['employee_id']


class TaskCreateSerializer(serializers.Serializer):
    task_title = serializers.CharField(max_length=100)
    task_description = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    employee_id = serializers.IntegerField(required=False, allow_null=True)
    priority_id = serializers.IntegerField(required=False, allow_null=True)
    status_id = serializers.IntegerField(required=False, allow_null=True)
    due_date = serializers.DateField(required=False, allow_null=True)
    progress = serializers.IntegerField(default=0, required=False)


class TaskUpdateSerializer(serializers.Serializer):
    task_title = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    task_description = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    employee_id = serializers.IntegerField(required=False, allow_null=True)
    priority_id = serializers.IntegerField(required=False, allow_null=True)
    status_id = serializers.IntegerField(required=False, allow_null=True)
    due_date = serializers.DateField(required=False, allow_null=True)
    progress = serializers.IntegerField(required=False, allow_null=True)


class TaskOutSerializer(serializers.ModelSerializer):
    employee_id = serializers.IntegerField(source='employee.employee_id', read_only=True, allow_null=True)
    priority_id = serializers.IntegerField(source='priority.priority_id', read_only=True, allow_null=True)
    status_id = serializers.IntegerField(source='status.status_id', read_only=True, allow_null=True)

    class Meta:
        model = Task
        fields = [
            'task_id',
            'task_title',
            'task_description',
            'employee_id',
            'priority_id',
            'status_id',
            'due_date',
            'progress'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    employee_id = serializers.IntegerField(source='employee.employee_id', read_only=True)

    class Meta:
        model = Notification
        fields = ['notification_id', 'employee_id', 'message', 'notification_date']


class ReminderSerializer(serializers.ModelSerializer):
    task_id = serializers.IntegerField(source='task.task_id')

    class Meta:
        model = Reminder
        fields = ['reminder_id', 'task_id', 'reminder_date', 'reminder_time']

    def create(self, validated_data):
        task_id = validated_data.pop('task')['task_id']
        task = Task.objects.get(task_id=task_id)
        return Reminder.objects.create(task=task, **validated_data)
