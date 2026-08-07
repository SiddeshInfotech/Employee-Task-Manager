from rest_framework import permissions


class IsAuthenticatedUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'is_authenticated', False))


class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            getattr(request.user, 'is_authenticated', False) and
            getattr(request.user, 'role', '') == 'Admin'
        )
