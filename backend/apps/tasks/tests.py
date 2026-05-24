from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.projects.models import Project, ProjectMember
from apps.tasks.models import Task

User = get_user_model()

class TaskAPITests(APITestCase):
    def setUp(self):
        # Create test users
        self.admin_user = User.objects.create_user(
            email='admin@example.com', password='password123', name='Admin User'
        )
        self.member_user = User.objects.create_user(
            email='member@example.com', password='password123', name='Member User'
        )
        self.other_member = User.objects.create_user(
            email='other@example.com', password='password123', name='Other Member'
        )
        self.unrelated_user = User.objects.create_user(
            email='unrelated@example.com', password='password123', name='Unrelated User'
        )

        # Create Project
        self.project = Project.objects.create(title='Collab Project', created_by=self.admin_user)
        # Create Project memberships
        ProjectMember.objects.create(project=self.project, user=self.admin_user, role='Admin')
        ProjectMember.objects.create(project=self.project, user=self.member_user, role='Member')
        ProjectMember.objects.create(project=self.project, user=self.other_member, role='Member')

        # Setup URLs
        self.task_list_url = reverse('task-list')

    def test_create_task_admin_only(self):
        # Member tries to create task -> Forbidden
        self.client.force_authenticate(user=self.member_user)
        task_data = {
            'project': self.project.id,
            'title': 'New Task',
            'priority': 'Medium',
            'status': 'To Do'
        }
        response = self.client.post(self.task_list_url, task_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin creates task -> Success
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.task_list_url, task_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Task')

    def test_assign_user_membership_validation(self):
        self.client.force_authenticate(user=self.admin_user)
        
        # Assign to unrelated_user (not a project member) -> Bad Request
        task_data = {
            'project': self.project.id,
            'title': 'New Task',
            'assigned_to': self.unrelated_user.id
        }
        response = self.client.post(self.task_list_url, task_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('assigned_to', response.data)

        # Assign to member_user (project member) -> Success
        task_data['assigned_to'] = self.member_user.id
        response = self.client.post(self.task_list_url, task_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['assigned_to'], self.member_user.id)

    def test_member_updates_own_assigned_task_status_only(self):
        # Create task assigned to member_user
        task = Task.objects.create(
            project=self.project,
            title='Task A',
            assigned_to=self.member_user,
            created_by=self.admin_user,
            status='To Do'
        )
        detail_url = reverse('task-detail', args=[task.id])

        # other_member tries to update status -> Forbidden
        self.client.force_authenticate(user=self.other_member)
        response = self.client.patch(detail_url, {'status': 'In Progress'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # member_user patches status -> Success
        self.client.force_authenticate(user=self.member_user)
        response = self.client.patch(detail_url, {'status': 'In Progress'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'In Progress')

        # member_user tries to patch title -> Forbidden
        response = self.client.patch(detail_url, {'title': 'Hacked Title'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_status_endpoint(self):
        task = Task.objects.create(
            project=self.project,
            title='Task B',
            assigned_to=self.member_user,
            created_by=self.admin_user,
            status='To Do'
        )
        status_url = reverse('task-status', args=[task.id])

        # member_user updates status -> Success
        self.client.force_authenticate(user=self.member_user)
        response = self.client.patch(status_url, {'status': 'Done'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Done')

        # other_member tries to update status -> Forbidden
        self.client.force_authenticate(user=self.other_member)
        response = self.client.patch(status_url, {'status': 'To Do'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_task_permissions(self):
        task = Task.objects.create(
            project=self.project,
            title='Task C',
            created_by=self.admin_user
        )
        detail_url = reverse('task-detail', args=[task.id])

        # member_user tries to delete -> Forbidden
        self.client.force_authenticate(user=self.member_user)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # admin_user deletes -> Success
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task.id).exists())
