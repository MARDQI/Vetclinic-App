from rest_framework import serializers
from .models import Mascota

class MascotaSerializer(serializers.ModelSerializer):
    propietario_nombre = serializers.CharField(source='propietario.nombre', read_only=True)

    class Meta:
        model = Mascota
        fields = '__all__'
        read_only_fields = ('propietario_nombre',)
