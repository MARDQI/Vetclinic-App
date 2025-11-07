from rest_framework.permissions import BasePermission

class IsSystemAdmin(BasePermission):
    """
    Permite el acceso solo a usuarios con el rol de SYSTEM_ADMIN.
    """
    def has_permission(self, request, view):
        # Asegurarse de que el usuario esté autenticado y tenga el rol correcto
        return request.user and request.user.is_authenticated and request.user.rol == 'SYSTEM_ADMIN'
