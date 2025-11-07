from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    ROL_CHOICES = (
        ('SYSTEM_ADMIN', 'Administrador de sistema'),
        ('ADMINISTRADOR', 'Administrador'),
        ('VETERINARIO', 'Veterinario'),
        ('RECEPCIONISTA', 'Recepcionista'),
    )
    email = models.EmailField(unique=True)
    rol = models.CharField(max_length=20, choices=ROL_CHOICES)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    especialidad = models.CharField(max_length=100, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    @property
    def nombre(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return self.email
