from django.contrib import admin
from .models import RegistroMedico, Vacuna

@admin.register(RegistroMedico)
class RegistroMedicoAdmin(admin.ModelAdmin):
    list_display = ('mascota', 'veterinario', 'diagnostico', 'fecha_seguimiento', 'creado_en')
    list_filter = ('veterinario', 'creado_en')
    search_fields = ('mascota__nombre', 'veterinario__email', 'diagnostico', 'tratamiento')
    date_hierarchy = 'creado_en'
    readonly_fields = ('creado_en', 'actualizado_en')

@admin.register(Vacuna)
class VacunaAdmin(admin.ModelAdmin):
    list_display = ('mascota', 'nombre', 'fecha_administracion', 'proxima_fecha')
    list_filter = ('fecha_administracion',)
    search_fields = ('mascota__nombre', 'nombre')
    date_hierarchy = 'fecha_administracion'
    readonly_fields = ('creado_en',)
