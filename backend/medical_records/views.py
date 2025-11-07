from rest_framework import viewsets, serializers, status
from rest_framework.response import Response
from .models import RegistroMedico, Vacuna
from .serializers import RegistroMedicoSerializer, VacunaSerializer

class RegistroMedicoViewSet(viewsets.ModelViewSet):
    queryset = RegistroMedico.objects.all()
    serializer_class = RegistroMedicoSerializer

class VacunaViewSet(viewsets.ModelViewSet):
    queryset = Vacuna.objects.all()
    serializer_class = VacunaSerializer

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
