from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .models import Usuario
from .serializers import UsuarioSerializer
from .permissions import IsSystemAdmin

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

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        identifier = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')

        if not identifier or not password:
            return Response(
                {'error': 'Se requiere identificador y contraseña'}, 
                status=status.HTTP_400_BAD_REQUEST
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
            token, created = Token.objects.get_or_create(user=user)
            serializer = self.get_serializer(user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'nombre': f"{user.first_name} {user.last_name}".strip(),
                    'rol': user.rol
                }
            })
        else:
            return Response(
                {'error': 'Credenciales inválidas'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
