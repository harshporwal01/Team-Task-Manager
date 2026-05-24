from django.urls import path
from apps.projects.views import ProjectViewSet, ProjectMemberView

urlpatterns = [
    path('', ProjectViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='project-list'),
    path('<int:pk>/', ProjectViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='project-detail'),
    path('<int:project_id>/members/', ProjectMemberView.as_view(), name='project-members-add'),
    path('<int:project_id>/members/<int:user_id>/', ProjectMemberView.as_view(), name='project-members-remove'),
]
