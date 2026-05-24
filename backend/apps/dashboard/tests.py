from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APITestCase
from apps.projects.models import Project, ProjectMember
from apps.tasks.models import Task

User = get_user_model()

class DashboardAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(
            email='user@example.com', password='password123', name='User A'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com', password='password123', name='User B'
        )

        # Create Project
        self.project = Project.objects.create(title='Stats Project', created_by=self.user)
        ProjectMember.objects.create(project=self.project, user=self.user, role='Admin')
        ProjectMember.objects.create(project=self.project, user=self.other_user, role='Member')

        # Setup URLs
        self.dashboard_url = reverse('dashboard-stats')

        # Create Tasks
        # 1. To Do (not overdue)
        Task.objects.create(
            project=self.project, title='Task 1', status='To Do',
            assigned_to=self.user, created_by=self.user
        )
        # 2. In Progress (overdue)
        Task.objects.create(
            project=self.project, title='Task 2', status='In Progress',
            assigned_to=self.other_user, created_by=self.user,
            due_date=timezone.now() - timedelta(days=1)
        )
        # 3. Done (due date in past but status is Done, so not overdue)
        Task.objects.create(
            project=self.project, title='Task 3', status='Done',
            assigned_to=self.user, created_by=self.user,
            due_date=timezone.now() - timedelta(days=2)
        )

    def test_dashboard_stats_aggregation(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.dashboard_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify stats
        data = response.data
        self.assertEqual(data['total_tasks'], 3)
        self.assertEqual(data['tasks_by_status']['To Do'], 1)
        self.assertEqual(data['tasks_by_status']['In Progress'], 1)
        self.assertEqual(data['tasks_by_status']['Done'], 1)
        
        # Verify overdue: only Task 2 is overdue (Task 3 is Done)
        self.assertEqual(data['overdue_tasks'], 1)
        
        # Verify tasks per user
        user_tasks = {item['user_email']: item['count'] for item in data['tasks_per_user']}
        self.assertEqual(user_tasks.get(self.user.email), 2)
        self.assertEqual(user_tasks.get(self.other_user.email), 1)

    def test_dashboard_unauthenticated(self):
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
