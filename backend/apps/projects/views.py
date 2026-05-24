from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.projects.models import Project, ProjectMember
from apps.projects.serializers import ProjectSerializer, ProjectMemberAddSerializer
from apps.projects.permissions import IsProjectMember, IsProjectAdmin

User = get_user_model()

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only view projects they are a member of
        return Project.objects.filter(memberships__user=self.request.user).distinct().order_by('-created_at')

    def get_permissions(self):
        # For update and destroy, user must be a Project Admin
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsProjectAdmin()]
        # For retrieve, user must be a Project Member
        elif self.action == 'retrieve':
            return [permissions.IsAuthenticated(), IsProjectMember()]
        return super().get_permissions()

    def perform_create(self, serializer):
        # Automatically make creator the Project Admin
        with transaction.atomic():
            project = serializer.save(created_by=self.request.user)
            ProjectMember.objects.create(
                user=self.request.user,
                project=project,
                role='Admin'
            )

class ProjectMemberView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_project_and_check_admin(self, project_id, user):
        project = get_object_or_404(Project, id=project_id)
        # Check if the requesting user is an Admin of the project
        is_admin = ProjectMember.objects.filter(
            project=project, user=user, role='Admin'
        ).exists()
        if not is_admin:
            return None, False
        return project, True

    def post(self, request, project_id):
        project, is_admin = self.get_project_and_check_admin(project_id, request.user)
        if not is_admin:
            return Response(
                {"detail": "You do not have permission to manage members in this project."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ProjectMemberAddSerializer(
            data=request.data, 
            context={'project_id': project_id}
        )
        serializer.is_valid(raise_exception=True)
        
        user_to_add = serializer.validated_data['user_obj']
        role = serializer.validated_data['role']

        member = ProjectMember.objects.create(
            project=project,
            user=user_to_add,
            role=role
        )
        
        return Response({
            "message": "Member added successfully.",
            "member": {
                "id": member.id,
                "user_id": user_to_add.id,
                "user_name": user_to_add.name,
                "user_email": user_to_add.email,
                "role": member.role
            }
        }, status=status.HTTP_201_CREATED)

    def delete(self, request, project_id, user_id):
        project, is_admin = self.get_project_and_check_admin(project_id, request.user)
        if not is_admin:
            return Response(
                {"detail": "You do not have permission to manage members in this project."},
                status=status.HTTP_403_FORBIDDEN
            )

        user_to_remove = get_object_or_404(User, id=user_id)
        
        # Find the membership
        membership = get_object_or_404(ProjectMember, project=project, user=user_to_remove)

        # Enforce business logic: Cannot remove the creator of the project
        if project.created_by == user_to_remove:
            return Response(
                {"detail": "Cannot remove the project creator from the project."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Enforce business logic: Cannot remove yourself if you are the only Admin
        if user_to_remove == request.user and membership.role == 'Admin':
            admin_count = ProjectMember.objects.filter(project=project, role='Admin').count()
            if admin_count <= 1:
                return Response(
                    {"detail": "Cannot remove yourself as you are the only Admin remaining."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        membership.delete()
        return Response({"message": "Member removed successfully."}, status=status.HTTP_200_OK)
