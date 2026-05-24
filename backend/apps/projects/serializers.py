from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.projects.models import Project, ProjectMember

User = get_user_model()

class ProjectMemberDetailSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ProjectMember
        fields = ('id', 'user_id', 'user_name', 'user_email', 'role')
        read_only_fields = ('id',)

class ProjectSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    role = serializers.SerializerMethodField()
    members = ProjectMemberDetailSerializer(source='memberships', many=True, read_only=True)
    members_count = serializers.IntegerField(source='memberships.count', read_only=True)
    tasks_count = serializers.IntegerField(source='tasks.count', read_only=True)

    class Meta:
        model = Project
        fields = (
            'id', 'title', 'description', 'created_by', 
            'created_by_name', 'created_by_email', 'created_at', 
            'role', 'members', 'members_count', 'tasks_count'
        )
        read_only_fields = ('id', 'created_by', 'created_at')

    def get_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        try:
            member = ProjectMember.objects.get(project=obj, user=request.user)
            return member.role
        except ProjectMember.DoesNotExist:
            return None

class ProjectMemberAddSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=ProjectMember.ROLE_CHOICES, default='Member')

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email.")
        return value

    def validate(self, attrs):
        project_id = self.context.get('project_id')
        email = attrs.get('email')
        
        user = User.objects.get(email=email)
        if ProjectMember.objects.filter(project_id=project_id, user=user).exists():
            raise serializers.ValidationError({"email": "This user is already a member of this project."})
        
        attrs['user_obj'] = user
        return attrs
