from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.projects.models import Project, ProjectMember

User = get_user_model()

class ProjectAPITests(APITestCase):
    def setUp(self):
        # Create test users
        self.admin_user = User.objects.create_user(
            email='admin@example.com', password='password123', name='Admin User'
        )
        self.member_user = User.objects.create_user(
            email='member@example.com', password='password123', name='Member User'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com', password='password123', name='Other User'
        )

        # Setup URLs
        self.project_list_url = reverse('project-list')

    def test_create_project_auto_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        project_data = {
            'title': 'Test Project',
            'description': 'A description of test project'
        }
        response = self.client.post(self.project_list_url, project_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Project')
        
        # Verify ProjectMember record was created as Admin
        project_id = response.data['id']
        member = ProjectMember.objects.get(project_id=project_id, user=self.admin_user)
        self.assertEqual(member.role, 'Admin')

    def test_list_projects_visibility(self):
        # Create Project 1 (Admin is admin_user)
        self.client.force_authenticate(user=self.admin_user)
        p1 = self.client.post(self.project_list_url, {'title': 'Project 1'}).data
        
        # Create Project 2 (Admin is other_user)
        self.client.force_authenticate(user=self.other_user)
        p2 = self.client.post(self.project_list_url, {'title': 'Project 2'}).data

        # Admin user lists projects -> should only see Project 1
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.project_list_url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], p1['id'])

    def test_project_update_and_delete_permissions(self):
        # Create project by admin_user
        self.client.force_authenticate(user=self.admin_user)
        p_id = self.client.post(self.project_list_url, {'title': 'Project 1'}).data['id']
        
        detail_url = reverse('project-detail', args=[p_id])

        # Add member_user as a 'Member'
        ProjectMember.objects.create(project_id=p_id, user=self.member_user, role='Member')

        # member_user tries to update -> Forbidden
        self.client.force_authenticate(user=self.member_user)
        response = self.client.put(detail_url, {'title': 'Updated Title'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # admin_user updates -> Success
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.put(detail_url, {'title': 'Updated Title'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')

        # member_user tries to delete -> Forbidden
        self.client.force_authenticate(user=self.member_user)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # admin_user deletes -> Success
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_add_remove_member_flow(self):
        # Create project
        self.client.force_authenticate(user=self.admin_user)
        p_id = self.client.post(self.project_list_url, {'title': 'Collab Project'}).data['id']

        members_url = reverse('project-members-add', args=[p_id])

        # member_user tries to add other_user -> Forbidden
        self.client.force_authenticate(user=self.member_user)
        response = self.client.post(members_url, {'email': self.other_user.email, 'role': 'Member'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # admin_user adds other_user -> Success
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(members_url, {'email': self.other_user.email, 'role': 'Member'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ProjectMember.objects.filter(project_id=p_id, user=self.other_user).exists())

        # admin_user tries to remove creator -> Bad Request
        remove_url = reverse('project-members-remove', args=[p_id, self.admin_user.id])
        response = self.client.delete(remove_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # admin_user removes other_user -> Success
        remove_url = reverse('project-members-remove', args=[p_id, self.other_user.id])
        response = self.client.delete(remove_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(ProjectMember.objects.filter(project_id=p_id, user=self.other_user).exists())
