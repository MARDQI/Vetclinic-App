from django.db import models
from django.utils import timezone
from pets.models import Mascota
from accounts.models import Usuario

class RegistroMedico(models.Model):
    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name='registros_medicos')
    veterinario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='registros_creados')
    sintomas = models.TextField(default='')
    diagnostico = models.TextField()
    tratamiento = models.TextField()
    medicamentos = models.TextField(blank=True, null=True)
    fecha_seguimiento = models.DateField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-creado_en']

    def __str__(self):
        return f'Registro para {self.mascota.nombre} el {self.creado_en}'

class Vacuna(models.Model):
    mascota = models.ForeignKey(
        Mascota, 
        on_delete=models.CASCADE, 
        related_name='vacunas',
        to_field='id'  # Aseguramos que se relaciona con el campo id
    )
    nombre = models.CharField(max_length=100)
    fecha_administracion = models.DateField()
    proxima_fecha = models.DateField(blank=True, null=True)
    notas = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-fecha_administracion']

    def __str__(self):
        return f'{self.nombre} - {self.mascota.nombre}'
