from .models import AuditLog


def get_client_ip(request):
    """Obtener la IP del cliente desde el request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_audit(usuario, accion, request=None, detalles='', exito=True):
    """
    Función helper para crear logs de auditoría manualmente
    
    Args:
        usuario: Instancia del modelo Usuario
        accion: String con el tipo de acción (LOGIN, LOGOUT, etc.)
        request: HttpRequest object (opcional)
        detalles: String con información adicional
        exito: Boolean indicando si la acción fue exitosa
    """
    log_data = {
        'usuario': usuario,
        'accion': accion,
        'detalles': detalles,
        'exito': exito
    }
    
    if request:
        log_data['ip_address'] = get_client_ip(request)
        log_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')[:500]
        log_data['metodo_http'] = request.method
        log_data['ruta'] = request.path
    
    return AuditLog.objects.create(**log_data)
