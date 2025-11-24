from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'usuario', 'accion', 'ip_address', 'metodo_http', 'exito']
    list_filter = ['accion', 'exito', 'timestamp']
    search_fields = ['usuario__username', 'ip_address', 'ruta', 'detalles']
    readonly_fields = ['timestamp', 'usuario', 'accion', 'ip_address', 'user_agent', 
                       'metodo_http', 'ruta', 'detalles', 'exito']
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
