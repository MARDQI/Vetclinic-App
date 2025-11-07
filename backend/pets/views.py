from rest_framework import viewsets
from .models import Mascota
from .serializers import MascotaSerializer

class MascotaViewSet(viewsets.ModelViewSet):
    serializer_class = MascotaSerializer
    queryset = Mascota.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        propietario_id = self.request.query_params.get('propietario')
        if propietario_id:
            queryset = queryset.filter(propietario_id=propietario_id)
        return queryset
