from .models import AuditLog


def get_client_ip(request):
    """Obtener la IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class AuditMiddleware:
    """
    Middleware para registrar automáticamente operaciones importantes
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Solo registrar ciertos métodos y rutas
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # Excluir rutas que ya tienen logging manual
            excluded_paths = ['/accounts/users/login/', '/accounts/users/logout/']
            
            if not any(request.path.startswith(path) for path in excluded_paths):
                self._log_request(request, response)
        
        return response

    def _log_request(self, request, response):
        """Registrar la petición en el log de auditoría"""
        try:
            # Determinar la acción basada en el método HTTP
            action_map = {
                'POST': 'CREATE',
                'PUT': 'UPDATE',
                'PATCH': 'UPDATE',
                'DELETE': 'DELETE',
            }
            
            accion = action_map.get(request.method, 'VIEW')
            exito = 200 <= response.status_code < 300
            
            # Solo registrar si el usuario está autenticado
            if request.user and request.user.is_authenticated:
                AuditLog.objects.create(
                    usuario=request.user,
                    accion=accion,
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                    metodo_http=request.method,
                    ruta=request.path,
                    detalles=f"Status: {response.status_code}",
                    exito=exito
                )
        except Exception as e:
            # No fallar si hay error en el logging
            print(f"Error en AuditMiddleware: {e}")
