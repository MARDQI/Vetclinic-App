from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Cita, AppointmentStatus
from .serializers import CitaSerializer

class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer

    def partial_update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            new_status = request.data.get('estado')
            
            if new_status is None:
                return super().partial_update(request, *args, **kwargs)

            # Validar que el estado sea válido
            if new_status not in [choice[0] for choice in AppointmentStatus.choices]:
                return Response(
                    {"detail": "Estado no válido"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar transiciones de estado
            if instance.estado == AppointmentStatus.CANCELADA and new_status != AppointmentStatus.CANCELADA:
                return Response(
                    {"detail": "No se puede cambiar el estado de una cita cancelada"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if instance.estado == AppointmentStatus.COMPLETADA and new_status != AppointmentStatus.COMPLETADA:
                return Response(
                    {"detail": "No se puede cambiar el estado de una cita completada"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Actualizar el estado
            instance.estado = new_status
            instance.save()
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
