from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(read_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'nombre', 'first_name', 'last_name', 'email', 'rol', 'telefono', 'especialidad', 'password']

    def validate_password(self, value):
        """
        Valida la contraseña usando los validadores de Django
        """
        if value:
            try:
                validate_password(value)
            except ValidationError as e:
                # Devolver solo el primer mensaje de error de forma limpia
                raise serializers.ValidationError(e.messages[0])
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = Usuario(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance
