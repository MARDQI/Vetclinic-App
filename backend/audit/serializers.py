from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    accion_display = serializers.CharField(source='get_accion_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'usuario',
            'usuario_nombre',
            'accion',
            'accion_display',
            'timestamp',
            'ip_address',
            'user_agent',
            'metodo_http',
            'ruta',
            'detalles',
            'exito'
        ]
        read_only_fields = fields
