from rest_framework import serializers
from .models import ArticuloInventario

class ArticuloInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticuloInventario
        fields = '__all__'
