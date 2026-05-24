from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "name": "TaskManager API",
        "status": "Running",
        "version": "1.0",
        "endpoints": {
            "auth": "/api/auth/",
            "projects": "/api/projects/",
            "tasks": "/api/tasks/",
            "dashboard": "/api/dashboard/"
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
]
