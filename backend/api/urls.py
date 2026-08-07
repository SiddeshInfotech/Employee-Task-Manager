from django.urls import path
from api import views

urlpatterns = [
    # Auth
    path('auth/register', views.AuthRegisterView.as_view(), name='auth-register'),
    path('auth/register/', views.AuthRegisterView.as_view(), name='auth-register-slash'),
    path('auth/login', views.AuthLoginView.as_view(), name='auth-login'),
    path('auth/login/', views.AuthLoginView.as_view(), name='auth-login-slash'),

    # Employees
    path('employees', views.EmployeeListCreateView.as_view(), name='employee-list-create-noslash'),
    path('employees/', views.EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/<int:employee_id>', views.EmployeeDetailView.as_view(), name='employee-detail-noslash'),
    path('employees/<int:employee_id>/', views.EmployeeDetailView.as_view(), name='employee-detail'),

    # Tasks
    path('tasks', views.TaskListCreateView.as_view(), name='task-list-create-noslash'),
    path('tasks/', views.TaskListCreateView.as_view(), name='task-list-create'),
    path('tasks/<int:task_id>', views.TaskDetailView.as_view(), name='task-detail-noslash'),
    path('tasks/<int:task_id>/', views.TaskDetailView.as_view(), name='task-detail'),

    # Notifications
    path('notifications', views.NotificationListView.as_view(), name='notification-list-noslash'),
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:notification_id>', views.NotificationDetailView.as_view(), name='notification-detail-noslash'),
    path('notifications/<int:notification_id>/', views.NotificationDetailView.as_view(), name='notification-detail'),

    # Dashboard
    path('dashboard/summary', views.DashboardSummaryView.as_view(), name='dashboard-summary-noslash'),
    path('dashboard/summary/', views.DashboardSummaryView.as_view(), name='dashboard-summary'),

    # Reminders
    path('reminders', views.ReminderListCreateView.as_view(), name='reminder-list-create-noslash'),
    path('reminders/', views.ReminderListCreateView.as_view(), name='reminder-list-create'),
    path('reminders/<int:reminder_id>', views.ReminderDetailView.as_view(), name='reminder-detail-noslash'),
    path('reminders/<int:reminder_id>/', views.ReminderDetailView.as_view(), name='reminder-detail'),

    # Reports
    path('reports', views.ReportsView.as_view(), name='reports-noslash'),
    path('reports/', views.ReportsView.as_view(), name='reports'),

    # Users & Profile
    path('users', views.UserListView.as_view(), name='user-list-noslash'),
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/me', views.UserProfileView.as_view(), name='user-me-noslash'),
    path('users/me/', views.UserProfileView.as_view(), name='user-me'),
    path('profile', views.ProfileView.as_view(), name='profile-noslash'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
]
