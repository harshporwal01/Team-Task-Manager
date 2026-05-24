from rest_framework import permissions
from apps.projects.models import ProjectMember

class IsProjectMember(permissions.BasePermission):
    """
    Allows access only to project members.
    Assumes the view has a way to identify the project (either from get_object or route).
    """
    def has_object_permission(self, request, view, obj):
        # For Project object
        return ProjectMember.objects.filter(project=obj, user=request.user).exists()

class IsProjectAdmin(permissions.BasePermission):
    """
    Allows access only to project admins.
    """
    def has_object_permission(self, request, view, obj):
        return ProjectMember.objects.filter(
            project=obj, user=request.user, role='Admin'
        ).exists()
