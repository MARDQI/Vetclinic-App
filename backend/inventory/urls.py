from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticuloInventarioViewSet

router = DefaultRouter()
router.register(r'articulos-inventario', ArticuloInventarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
