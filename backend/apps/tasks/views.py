from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404

from apps.tasks.models import Task
from apps.projects.models import Project, ProjectMember
from apps.tasks.serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'status', 'priority', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'priority', 'created_at', 'updated_at']

    def get_queryset(self):
        # A user can only see tasks of projects they are members of
        user_projects = Project.objects.filter(memberships__user=self.request.user)
        return Task.objects.filter(project__in=user_projects).select_related('project', 'assigned_to', 'created_by').distinct()

    def check_project_role(self, project, user):
        """Helper to return role of user in project, or None if not member"""
        try:
            membership = ProjectMember.objects.get(project=project, user=user)
            return membership.role
        except ProjectMember.DoesNotExist:
            return None

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        role = self.check_project_role(project, self.request.user)
        
        # Only Project Admins can create tasks
        if role != 'Admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only project Admins can create tasks in this project.")
            
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.get('partial', False)
        instance = self.get_object()
        project = instance.project
        role = self.check_project_role(project, request.user)

        if role is None:
            return Response({"detail": "Not a member of this project."}, status=status.HTTP_403_FORBIDDEN)

        if role == 'Admin':
            # Project Admin has full permissions
            return super().update(request, *args, **kwargs)
        else:
            # Member role
            # Members can only update tasks assigned to them
            if instance.assigned_to != request.user:
                return Response(
                    {"detail": "Members can only update tasks assigned to themselves."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Members can only update the 'status' field!
            # If they try to update anything else, reject or discard those changes.
            allowed_fields = {'status'}
            input_fields = set(request.data.keys())
            
            # If it's a PUT (not PATCH), we must ensure other fields match existing values
            # It's cleaner to handle this by patching only status.
            if not partial:
                # PUT request: reject if fields are modified
                for field, val in request.data.items():
                    if field not in allowed_fields:
                        # Check if it matches existing value
                        existing_val = getattr(instance, field, None)
                        # Normalize foreign key checks
                        if field == 'project' and isinstance(val, int) and val == instance.project.id:
                            continue
                        if field == 'assigned_to' and isinstance(val, int) and instance.assigned_to and val == instance.assigned_to.id:
                            continue
                        if str(existing_val) != str(val):
                            return Response(
                                {"detail": "Members can only modify the task status."},
                                status=status.HTTP_403_FORBIDDEN
                            )
            
            # If they attempt to modify fields other than status in PATCH, return 403
            if partial:
                for field in input_fields:
                    if field not in allowed_fields:
                        return Response(
                            {"detail": f"Members cannot modify field '{field}'. Only status can be modified."},
                            status=status.HTTP_403_FORBIDDEN
                        )

            return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        project = instance.project
        role = self.check_project_role(project, request.user)

        # Only Admins can delete tasks
        if role != 'Admin':
            return Response(
                {"detail": "Only project Admins can delete tasks."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @decorators.action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """
        Explicit endpoint to patch only the status.
        PATCH /api/tasks/{id}/status/
        """
        task = self.get_object()
        project = task.project
        role = self.check_project_role(project, request.user)

        if role is None:
            return Response({"detail": "Not a member of this project."}, status=status.HTTP_403_FORBIDDEN)

        if role != 'Admin' and task.assigned_to != request.user:
            return Response(
                {"detail": "You can only update the status of tasks assigned to you."},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')
        if not new_status or new_status not in dict(Task.STATUS_CHOICES):
            return Response(
                {"status": f"Must be one of: {list(dict(Task.STATUS_CHOICES).keys())}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        task.status = new_status
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)
