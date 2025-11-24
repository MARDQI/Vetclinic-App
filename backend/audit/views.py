from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer
from accounts.permissions import IsSystemAdmin


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para logs de auditoría.
    Solo accesible por administradores del sistema.
    """
    queryset = AuditLog.objects.select_related('usuario').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por usuario
        usuario_id = self.request.query_params.get('usuario')
        if usuario_id:
            queryset = queryset.filter(usuario_id=usuario_id)
        
        # Filtrar por acción
        accion = self.request.query_params.get('accion')
        if accion:
            queryset = queryset.filter(accion=accion)
        
        # Filtrar por rango de fechas
        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(timestamp__gte=fecha_desde)
        
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(timestamp__lte=fecha_hasta)
        
        return queryset
