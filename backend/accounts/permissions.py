from rest_framework.permissions import BasePermission

class IsSystemAdmin(BasePermission):
    """
    Permite el acceso solo a usuarios con el rol de SYSTEM_ADMIN.
    """
    def has_permission(self, request, view):
        # Asegurarse de que el usuario esté autenticado y tenga el rol correcto
        return request.user and request.user.is_authenticated and request.user.rol == 'SYSTEM_ADMIN'


class IsAdministrador(BasePermission):
    """
    Permite el acceso solo a usuarios con rol ADMINISTRADOR o superior.
    """
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                request.user.rol in ['SYSTEM_ADMIN', 'ADMINISTRADOR'])


class IsVeterinario(BasePermission):
    """
    Permite el acceso solo a usuarios con rol VETERINARIO o superior.
    """
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                request.user.rol in ['SYSTEM_ADMIN', 'ADMINISTRADOR', 'VETERINARIO'])


class IsRecepcionista(BasePermission):
    """
    Permite el acceso solo a usuarios con rol RECEPCIONISTA o superior.
    """
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                request.user.rol in ['SYSTEM_ADMIN', 'ADMINISTRADOR', 'VETERINARIO', 'RECEPCIONISTA'])


class CanManageMedicalRecords(BasePermission):
    """
    Permite crear/editar registros médicos solo a veterinarios.
    Todos pueden ver (GET).
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # GET es permitido para todos los autenticados
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # POST, PUT, PATCH, DELETE solo para veterinarios
        return request.user.rol in ['SYSTEM_ADMIN', 'VETERINARIO']


class CanManageAppointments(BasePermission):
    """
    Recepcionistas pueden crear/editar citas.
    Veterinarios y administradores solo pueden ver.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # GET es permitido para todos los autenticados
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # POST, PUT, PATCH, DELETE solo para recepcionistas y admins
        return request.user.rol in ['SYSTEM_ADMIN', 'ADMINISTRADOR', 'RECEPCIONISTA']
