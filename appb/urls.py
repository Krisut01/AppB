from django.urls import path
from . import views

urlpatterns = [
    path('', views.home),  # Root URL will render home view
    path('api/auth/register/', views.register),
    path('api/auth/login/', views.login),
    path('messaging/', views.messaging_interface, name='messaging-interface'),
    path('api/messages/send/', views.send_message),  # Add send message route
    path('api/messages/inbox/', views.get_inbox),    # Add inbox route
]
