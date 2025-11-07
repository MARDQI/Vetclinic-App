from django.contrib import admin
from .models import Cita

@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ('mascota', 'veterinario', 'fecha_programada', 'motivo', 'estado')
    list_filter = ('estado', 'fecha_programada', 'veterinario')
    search_fields = ('mascota__nombre', 'veterinario__email', 'motivo')
    date_hierarchy = 'fecha_programada'
    ordering = ('-fecha_programada',)
    readonly_fields = ('creado_en', 'actualizado_en')
