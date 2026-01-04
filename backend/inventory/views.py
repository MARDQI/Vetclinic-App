from rest_framework import viewsets
from accounts.permissions import IsAdministrador
from .models import ArticuloInventario
from .serializers import ArticuloInventarioSerializer

class ArticuloInventarioViewSet(viewsets.ModelViewSet):
    queryset = ArticuloInventario.objects.all()
    serializer_class = ArticuloInventarioSerializer
    permission_classes = [IsAdministrador]
