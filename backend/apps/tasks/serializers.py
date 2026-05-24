from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.tasks.models import Task
from apps.projects.models import Project, ProjectMember

User = get_user_model()

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    assigned_to_email = serializers.CharField(source='assigned_to.email', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = Task
        fields = (
            'id', 'project', 'project_title', 'title', 'description', 
            'due_date', 'priority', 'status', 'assigned_to', 
            'assigned_to_name', 'assigned_to_email', 'created_by', 
            'created_by_name', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def validate_assigned_to(self, value):
        if value is None:
            return value
        
        # Check if the user is a member of the project.
        # Note: We need the project from the initial data or the instance.
        project_id = self.initial_data.get('project')
        if not project_id and self.instance:
            project_id = self.instance.project.id
            
        if project_id:
            if not ProjectMember.objects.filter(project_id=project_id, user=value).exists():
                raise serializers.ValidationError("The assigned user must be a member of the project.")
        return value

    def validate(self, attrs):
        # Additional validations if needed
        return attrs
