from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from datetime import datetime
from appointments.models import Cita
from pets.models import Mascota
from medical_records.models import Vacuna

class GenerarReportePDF(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_veterinaria.pdf"'

        p = canvas.Canvas(response, pagesize=letter)
        width, height = letter

        # Título
        p.setFont("Helvetica-Bold", 16)
        p.drawString(inch, height - inch, "Reporte General de la Veterinaria")

        y_position = height - 1.5 * inch

        # --- Sección de Citas ---
        p.setFont("Helvetica-Bold", 12)
        p.drawString(inch, y_position, "Resumen de Citas")
        y_position -= 0.25 * inch
        
        citas_por_estado = Cita.objects.values('estado').annotate(count=Count('estado'))
        total_citas = Cita.objects.count()
        
        p.setFont("Helvetica", 10)
        for item in citas_por_estado:
            line = f"- {item['estado'].capitalize()}: {item['count']}"
            p.drawString(1.2 * inch, y_position, line)
            y_position -= 0.25 * inch
        
        p.setFont("Helvetica-Bold", 10)
        p.drawString(1.2 * inch, y_position, f"Total de Citas: {total_citas}")
        y_position -= 0.5 * inch

        # --- Sección de Mascotas ---
        p.setFont("Helvetica-Bold", 12)
        p.drawString(inch, y_position, "Distribución de Mascotas por Especie")
        y_position -= 0.25 * inch

        mascotas_por_especie = Mascota.objects.values('especie').annotate(count=Count('especie'))
        total_mascotas = Mascota.objects.count()

        p.setFont("Helvetica", 10)
        for item in mascotas_por_especie:
            line = f"- {item['especie']}: {item['count']}"
            p.drawString(1.2 * inch, y_position, line)
            y_position -= 0.25 * inch

        p.setFont("Helvetica-Bold", 10)
        p.drawString(1.2 * inch, y_position, f"Total de Mascotas: {total_mascotas}")
        y_position -= 0.5 * inch

        # --- Sección de Vacunas ---
        p.setFont("Helvetica-Bold", 12)
        p.drawString(inch, y_position, "Vacunas Administradas")
        y_position -= 0.25 * inch

        total_vacunas = Vacuna.objects.count()
        p.setFont("Helvetica", 10)
        p.drawString(1.2 * inch, y_position, f"Total de vacunas registradas: {total_vacunas}")
        y_position -= 0.5 * inch

        # --- Pie de página ---
        p.setFont("Helvetica-Oblique", 8)
        p.drawString(inch, inch, f"Reporte generado el {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")

        p.showPage()
        p.save()

        return response
