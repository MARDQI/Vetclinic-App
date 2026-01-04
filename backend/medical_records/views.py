from rest_framework import viewsets, serializers, status
from rest_framework.response import Response
from accounts.permissions import CanManageMedicalRecords
from .models import RegistroMedico, Vacuna
from .serializers import RegistroMedicoSerializer, VacunaSerializer

class RegistroMedicoViewSet(viewsets.ModelViewSet):
    queryset = RegistroMedico.objects.all()
    serializer_class = RegistroMedicoSerializer
    permission_classes = [CanManageMedicalRecords]

    def get_queryset(self):
        """
        Filtra los registros médicos por el parámetro 'mascota' en la URL.
        """
        queryset = RegistroMedico.objects.select_related('mascota', 'veterinario').all()
        mascota_id = self.request.query_params.get('mascota')
        if mascota_id:
            queryset = queryset.filter(mascota__id=mascota_id)
        return queryset

class VacunaViewSet(viewsets.ModelViewSet):
    queryset = Vacuna.objects.select_related('mascota').all()
    serializer_class = VacunaSerializer
    permission_classes = [CanManageMedicalRecords]

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {"error": "Error de validación", "detalles": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )
        except Exception as e:
            import traceback
            return Response(
                {
                    "error": "Error al crear la vacuna",
                    "mensaje": str(e),
                    "traceback": traceback.format_exc()
                },
                status=status.HTTP_400_BAD_REQUEST
            )
