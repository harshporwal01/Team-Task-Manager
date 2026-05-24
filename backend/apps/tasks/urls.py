from django.urls import path
from apps.tasks.views import TaskViewSet

urlpatterns = [
    path('', TaskViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='task-list'),
    path('<int:pk>/', TaskViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='task-detail'),
    path('<int:pk>/status/', TaskViewSet.as_view({
        'patch': 'update_status'
    }), name='task-status'),
]
