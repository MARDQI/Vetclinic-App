from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """
    Modelo para registrar eventos de auditoría del sistema
    """
    ACTION_CHOICES = [
        ('LOGIN', 'Inicio de sesión'),
        ('LOGOUT', 'Cierre de sesión'),
        ('LOGIN_FAILED', 'Intento de login fallido'),
        ('CREATE', 'Creación'),
        ('UPDATE', 'Actualización'),
        ('DELETE', 'Eliminación'),
        ('VIEW', 'Visualización'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    accion = models.CharField(max_length=20, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    metodo_http = models.CharField(max_length=10, blank=True)
    ruta = models.CharField(max_length=255, blank=True)
    detalles = models.TextField(blank=True)
    exito = models.BooleanField(default=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Log de Auditoría'
        verbose_name_plural = 'Logs de Auditoría'
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['usuario', '-timestamp']),
            models.Index(fields=['accion', '-timestamp']),
        ]

    def __str__(self):
        usuario_str = self.usuario.username if self.usuario else 'Anónimo'
        return f"{usuario_str} - {self.get_accion_display()} - {self.timestamp}"
