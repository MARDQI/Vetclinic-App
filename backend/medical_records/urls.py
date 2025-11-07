from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegistroMedicoViewSet, VacunaViewSet

router = DefaultRouter()
router.register(r'registros-medicos', RegistroMedicoViewSet)
router.register(r'vacunas', VacunaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
