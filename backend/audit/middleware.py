import json
from .models import AuditLog


def get_client_ip(request):
    """Obtener la IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def extract_relevant_data(request):
    """Extraer datos relevantes del body del request"""
    try:
        if not request.body:
            return ""
        
        body = json.loads(request.body)
        details = []
        
        # Campos comunes a extraer
        relevant_fields = ['nombre', 'email', 'username', 'telefono', 'especie', 'raza']
        
        for field in relevant_fields:
            if field in body and body[field]:
                details.append(f"{field}: {body[field]}")
        
        # Para mascotas, incluir el nombre del dueño si viene
        if 'dueno' in body:
            details.append(f"dueño_id: {body['dueno']}")
        
        # Para citas, incluir información relevante
        if 'fecha_hora' in body:
            details.append(f"fecha: {body['fecha_hora']}")
        if 'veterinario' in body:
            details.append(f"vet_id: {body['veterinario']}")
        if 'mascota' in body:
            details.append(f"mascota_id: {body['mascota']}")
        
        return " | ".join(details) if details else ""
    except:
        return ""


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
            excluded_paths = [
                '/api/accounts/users/login/',
                '/api/accounts/users/logout/',
                'accounts/users/login/',
                'accounts/users/logout/'
            ]
            
            # Verificar si la ruta contiene alguno de los paths excluidos
            should_exclude = any(excluded in request.path for excluded in excluded_paths)
            
            if not should_exclude:
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
            
            # Extraer datos relevantes del body
            body_details = extract_relevant_data(request)
            detalles = f"Status: {response.status_code}"
            if body_details:
                detalles += f" | {body_details}"
            
            # Solo registrar si el usuario está autenticado
            if request.user and request.user.is_authenticated:
                AuditLog.objects.create(
                    usuario=request.user,
                    accion=accion,
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                    metodo_http=request.method,
                    ruta=request.path,
                    detalles=detalles,
                    exito=exito
                )
        except Exception as e:
            # No fallar si hay error en el logging
            print(f"Error en AuditMiddleware: {e}")
