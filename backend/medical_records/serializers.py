from rest_framework import serializers
from .models import RegistroMedico, Vacuna

class VacunaSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.CharField(source='mascota.nombre', read_only=True)
    proxima_fecha = serializers.DateField(required=False, allow_null=True)
    notas = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        """
        Validación a nivel de objeto para los campos.
        """
        if not data.get('mascota'):
            raise serializers.ValidationError({
                'mascota': 'Este campo es obligatorio.'
            })
        if not data.get('nombre'):
            raise serializers.ValidationError({
                'nombre': 'Este campo es obligatorio.'
            })
        if not data.get('fecha_administracion'):
            raise serializers.ValidationError({
                'fecha_administracion': 'Este campo es obligatorio.'
            })
        return data

    class Meta:
        model = Vacuna
        fields = ['id', 'mascota', 'mascota_nombre', 'nombre', 'fecha_administracion', 'proxima_fecha', 'notas', 'creado_en']
        read_only_fields = ('mascota_nombre', 'creado_en')

class RegistroMedicoSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.CharField(source='mascota.nombre', read_only=True)
    veterinario_nombre = serializers.CharField(source='veterinario.nombre', read_only=True)
    vacunas = VacunaSerializer(many=True, read_only=True)

    class Meta:
        model = RegistroMedico
        fields = '__all__'
        read_only_fields = ('mascota_nombre', 'veterinario_nombre',)
