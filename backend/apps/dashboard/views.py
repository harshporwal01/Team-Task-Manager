from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count
from django.utils import timezone

from apps.tasks.models import Task
from apps.projects.models import Project
from apps.tasks.serializers import TaskSerializer

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # User projects
        user_projects = Project.objects.filter(memberships__user=request.user)
        # Filter tasks
        tasks = Task.objects.filter(project__in=user_projects).distinct()

        total_tasks = tasks.count()

        # Tasks by status
        status_counts = tasks.values('status').annotate(count=Count('id'))
        status_dict = {'To Do': 0, 'In Progress': 0, 'Done': 0}
        for item in status_counts:
            if item['status'] in status_dict:
                status_dict[item['status']] = item['count']

        # Overdue tasks: due_date in past and status != Done
        now = timezone.now()
        overdue_tasks = tasks.filter(due_date__lt=now).exclude(status='Done').count()

        # Tasks per user: grouped by assignee
        user_counts = (
            tasks.exclude(assigned_to=None)
            .values('assigned_to__id', 'assigned_to__name', 'assigned_to__email')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        tasks_per_user = []
        for uc in user_counts:
            tasks_per_user.append({
                'user_id': uc['assigned_to__id'],
                'user_name': uc['assigned_to__name'],
                'user_email': uc['assigned_to__email'],
                'count': uc['count']
            })

        # Recently updated tasks: 5 tasks ordered by -updated_at
        recent_tasks = tasks.select_related('project', 'assigned_to', 'created_by').order_by('-updated_at')[:5]
        recent_tasks_serialized = TaskSerializer(recent_tasks, many=True, context={'request': request}).data

        return Response({
            'total_tasks': total_tasks,
            'tasks_by_status': status_dict,
            'overdue_tasks': overdue_tasks,
            'tasks_per_user': tasks_per_user,
            'recently_updated_tasks': recent_tasks_serialized
        })
