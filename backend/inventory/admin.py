from django.contrib import admin
from .models import ArticuloInventario

@admin.register(ArticuloInventario)
class ArticuloInventarioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'cantidad', 'nivel_reorden', 'precio', 'stock_bajo')
    list_filter = ('creado_en',)
    search_fields = ('nombre', 'descripcion')
    ordering = ('nombre',)
    readonly_fields = ('creado_en', 'actualizado_en')

    def stock_bajo(self, obj):
        return obj.cantidad <= obj.nivel_reorden
    stock_bajo.boolean = True
    stock_bajo.short_description = 'Stock Bajo'
