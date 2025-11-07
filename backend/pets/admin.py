from django.contrib import admin
from .models import Mascota

@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'propietario', 'especie', 'raza', 'fecha_nacimiento', 'sexo')
    list_filter = ('especie', 'sexo')
    search_fields = ('nombre', 'propietario__nombre', 'especie', 'raza')
    date_hierarchy = 'fecha_nacimiento'
    ordering = ('nombre',)
    readonly_fields = ('creado_en', 'actualizado_en')
