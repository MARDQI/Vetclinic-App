from rest_framework import serializers
from .models import Cita

class CitaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    mascota_nombre = serializers.CharField(source='mascota.nombre', read_only=True)
    veterinario_nombre = serializers.CharField(source='veterinario.nombre', read_only=True)

    class Meta:
        model = Cita
        fields = '__all__'
        read_only_fields = ('cliente_nombre', 'mascota_nombre', 'veterinario_nombre',)
