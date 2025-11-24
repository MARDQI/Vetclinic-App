from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario
from .serializers import UsuarioSerializer
from .permissions import IsSystemAdmin
from audit.utils import log_audit, get_client_ip


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'login':
            permission_classes = [AllowAny]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsSystemAdmin]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Optionally restricts the returned users,
        by filtering against a `rol` query parameter in the URL.
        """
        queryset = Usuario.objects.all()
        rol = self.request.query_params.get('rol')
        if rol is not None:
            queryset = queryset.filter(rol=rol)
        return queryset

    def _get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def _check_login_attempts(self, identifier):
        """Verifica si el usuario está bloqueado por intentos fallidos"""
        cache_key = f'login_attempts_{identifier}'
        lock_key = f'login_locked_{identifier}'
        
        # Verificar si está bloqueado
        locked_until = cache.get(lock_key)
        if locked_until:
            remaining_seconds = int((locked_until - timezone.now()).total_seconds())
            if remaining_seconds > 0:
                return False, remaining_seconds
            else:
                # El bloqueo expiró, limpiar
                cache.delete(lock_key)
                cache.delete(cache_key)
        
        return True, 0

    def _register_failed_attempt(self, identifier):
        """Registra un intento fallido de login"""
        cache_key = f'login_attempts_{identifier}'
        lock_key = f'login_locked_{identifier}'
        
        # Incrementar contador de intentos
        attempts = cache.get(cache_key, 0) + 1
        cache.set(cache_key, attempts, 300)  # Expira en 5 minutos
        
        # Si llegó a 3 intentos, bloquear por 10 segundos
        if attempts >= 3:
            locked_until = timezone.now() + timedelta(seconds=10)
            cache.set(lock_key, locked_until, 10)
            cache.delete(cache_key)  # Limpiar contador
            return True, 10
        
        return False, 0

    def _clear_login_attempts(self, identifier):
        """Limpia los intentos fallidos tras login exitoso"""
        cache_key = f'login_attempts_{identifier}'
        lock_key = f'login_locked_{identifier}'
        cache.delete(cache_key)
        cache.delete(lock_key)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        identifier = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')

        if not identifier or not password:
            return Response(
                {'error': 'Se requiere identificador y contraseña'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar si está bloqueado
        allowed, remaining_seconds = self._check_login_attempts(identifier)
        if not allowed:
            return Response(
                {
                    'error': 'Demasiados intentos fallidos. Intenta nuevamente en unos segundos.',
                    'locked': True,
                    'remaining_seconds': remaining_seconds
                }, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Primero intentamos con email
        user = authenticate(username=identifier, password=password)
        
        # Si no funciona, intentamos buscar por username
        if not user and '@' not in identifier:
            try:
                usuario = Usuario.objects.get(username=identifier)
                user = authenticate(username=usuario.email, password=password)
            except Usuario.DoesNotExist:
                pass

        if user:
            # Login exitoso - limpiar intentos fallidos
            self._clear_login_attempts(identifier)
            
            # Registrar login exitoso en auditoría
            log_audit(
                usuario=user,
                accion='LOGIN',
                request=request,
                detalles=f'Login exitoso desde {get_client_ip(request)}',
                exito=True
            )
            
            # Generar tokens JWT
            refresh = RefreshToken.for_user(user)
            
            # Agregar claims personalizados al token
            refresh['rol'] = user.rol
            refresh['email'] = user.email
            refresh['nombre'] = f"{user.first_name} {user.last_name}".strip()
            
            serializer = self.get_serializer(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'nombre': f"{user.first_name} {user.last_name}".strip(),
                    'rol': user.rol
                }
            })
        else:
            # Login fallido - registrar intento
            is_locked, remaining = self._register_failed_attempt(identifier)
            
            # Registrar intento fallido en auditoría
            try:
                # Intentar encontrar el usuario para el log
                usuario = Usuario.objects.filter(email=identifier).first() or \
                         Usuario.objects.filter(username=identifier).first()
                if usuario:
                    log_audit(
                        usuario=usuario,
                        accion='LOGIN_FAILED',
                        request=request,
                        detalles=f'Intento de login fallido desde {get_client_ip(request)}',
                        exito=False
                    )
            except:
                pass
            
            if is_locked:
                return Response(
                    {
                        'error': 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente.',
                        'locked': True,
                        'remaining_seconds': remaining
                    }, 
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            else:
                return Response(
                    {'error': 'Credenciales inválidas'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )

    @action(detail=False, methods=['post'])
    def logout(self, request):
        """
        Endpoint para cerrar sesión
        """
        try:
            # Registrar logout en auditoría
            log_audit(
                usuario=request.user,
                accion='LOGOUT',
                request=request,
                detalles=f'Logout desde {get_client_ip(request)}',
                exito=True
            )
            
            return Response({'message': 'Sesión cerrada exitosamente'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

