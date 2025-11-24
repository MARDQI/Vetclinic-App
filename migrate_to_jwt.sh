#!/bin/bash

# Script para migrar de Django Token a JWT
# Este script instala las dependencias y ejecuta las migraciones necesarias

echo "=========================================="
echo "Migración de Django Token a JWT"
echo "=========================================="
echo ""

# Cambiar al directorio del backend
cd "$(dirname "$0")/backend" || exit

echo "1. Instalando dependencias de Python..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar las dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas correctamente"
echo ""

echo "2. Ejecutando migraciones de Django..."
python manage.py makemigrations

if [ $? -ne 0 ]; then
    echo "❌ Error al crear las migraciones"
    exit 1
fi

python manage.py migrate

if [ $? -ne 0 ]; then
    echo "❌ Error al aplicar las migraciones"
    exit 1
fi

echo "✅ Migraciones ejecutadas correctamente"
echo ""

echo "=========================================="
echo "✅ Migración completada exitosamente"
echo "=========================================="
echo ""
echo "Notas importantes:"
echo "- Los usuarios existentes deberán volver a iniciar sesión"
echo "- Los tokens antiguos ya no son válidos"
echo "- Los access tokens expiran en 1 hora"
echo "- Los refresh tokens expiran en 7 días"
echo "- El refresh se hace automáticamente en el frontend"
echo ""
echo "Para iniciar el servidor:"
echo "  cd backend"
echo "  python manage.py runserver"
echo ""
