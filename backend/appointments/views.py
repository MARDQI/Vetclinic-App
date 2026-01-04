from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import Q
from datetime import timedelta
from accounts.permissions import CanManageAppointments
from .models import Cita, AppointmentStatus
from .serializers import CitaSerializer

class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.select_related('mascota', 'mascota__propietario', 'veterinario').all()
    serializer_class = CitaSerializer
    permission_classes = [CanManageAppointments]

    def _check_schedule_conflict(self, veterinario_id, fecha_programada, cita_id=None):
        """
        Verifica si hay conflictos de horario con otras citas del veterinario.
        Considera un buffer de 30 minutos antes y después de cada cita.
        """
        # Calcular el rango de tiempo (30 minutos antes y después)
        time_buffer = timedelta(minutes=30)
        start_time = fecha_programada - time_buffer
        end_time = fecha_programada + time_buffer
        
        # Buscar citas conflictivas del mismo veterinario
        conflicting_appointments = Cita.objects.filter(
            veterinario_id=veterinario_id,
            fecha_programada__range=(start_time, end_time)
        ).exclude(
            estado=AppointmentStatus.CANCELADA
        )
        
        # Si estamos editando, excluir la cita actual
        if cita_id:
            conflicting_appointments = conflicting_appointments.exclude(id=cita_id)
        
        return conflicting_appointments.exists()

    def create(self, request, *args, **kwargs):
        """
        Crear una nueva cita verificando conflictos de horario
        """
        veterinario_id = request.data.get('veterinario')
        fecha_programada = request.data.get('fecha_programada')
        
        if veterinario_id and fecha_programada:
            # Convertir string a datetime si es necesario
            from django.utils.dateparse import parse_datetime
            if isinstance(fecha_programada, str):
                fecha_programada = parse_datetime(fecha_programada)
            
            # Verificar conflictos
            if self._check_schedule_conflict(veterinario_id, fecha_programada):
                return Response(
                    {
                        "error": "El veterinario ya tiene una cita programada en ese horario. Por favor, selecciona un horario con al menos 30 minutos de diferencia."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """
        Actualizar una cita verificando conflictos de horario
        """
        instance = self.get_object()
        veterinario_id = request.data.get('veterinario', instance.veterinario_id)
        fecha_programada = request.data.get('fecha_programada', instance.fecha_programada)
        
        if veterinario_id and fecha_programada:
            # Convertir string a datetime si es necesario
            from django.utils.dateparse import parse_datetime
            if isinstance(fecha_programada, str):
                fecha_programada = parse_datetime(fecha_programada)
            
            # Verificar conflictos (excluyendo la cita actual)
            if self._check_schedule_conflict(veterinario_id, fecha_programada, instance.id):
                return Response(
                    {
                        "error": "El veterinario ya tiene una cita programada en ese horario. Por favor, selecciona un horario con al menos 30 minutos de diferencia."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().update(request, *args, **kwargs)

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
