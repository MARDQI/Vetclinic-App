from django.urls import path
from .views import GenerarReportePDF

urlpatterns = [
    path('generar-reporte-pdf/', GenerarReportePDF.as_view(), name='generar_reporte_pdf'),
]
