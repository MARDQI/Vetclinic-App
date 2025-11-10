import { useState, useEffect } from 'react';
import { BarChart3, Calendar, PawPrint, TrendingUp, Download } from 'lucide-react';
import { Cita, Mascota, Vacuna, AppointmentStatus } from '../types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const fetchAllPages = async <T,>(url: string, token: string): Promise<T[]> => {
  let results: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response: Response = await fetch(nextUrl, {
      headers: { 'Authorization': `Token ${token}` }
    });

    if (!response.ok) {
      console.error(`Error fetching ${nextUrl}:`, await response.text());
      break;
    }

    const data: PaginatedResponse<T> = await response.json();
    results = results.concat(data.results || []);
    nextUrl = data.next;
  }
  return results;
};

export default function Reportes() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No hay token disponible');
          return;
        }

        const [citasData, mascotasData, vacunasData] = await Promise.all([
          fetchAllPages<Cita>(`${import.meta.env.VITE_API_URL}/appointments/citas/`, token),
          fetchAllPages<Mascota>(`${import.meta.env.VITE_API_URL}/pets/mascotas/`, token),
          fetchAllPages<Vacuna>(`${import.meta.env.VITE_API_URL}/medical-records/vacunas/`, token),
        ]);

        setCitas(citasData);
        setMascotas(mascotasData);
        setVacunas(vacunasData);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setCitas([]);
        setMascotas([]);
        setVacunas([]);
      }
    };

    fetchData();
  }, []);

  const citasPorEstado = {
    pendientes: citas.filter(c => c.estado === AppointmentStatus.PENDIENTE).length,
    confirmadas: citas.filter(c => c.estado === AppointmentStatus.CONFIRMADA).length,
    completadas: citas.filter(c => c.estado === AppointmentStatus.COMPLETADA).length,
    canceladas: citas.filter(c => c.estado === AppointmentStatus.CANCELADA).length
  };

  const especiesCount: Record<string, number> = {};
  mascotas.forEach(mascota => {
    especiesCount[mascota.especie] = (especiesCount[mascota.especie] || 0) + 1;
  });

  const especiesData = Object.entries(especiesCount).map(([especie, count]) => ({
    especie,
    count,
    percentage: mascotas.length > 0 ? (count / mascotas.length) * 100 : 0
  }));

  const vacunasPorMes: Record<string, number> = {};
  vacunas.forEach(vacuna => {
    const mes = new Date(vacuna.fecha_administracion).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    vacunasPorMes[mes] = (vacunasPorMes[mes] || 0) + 1;
  });

  const citasPorMes: Record<string, number> = {};
  citas.forEach(cita => {
    const mes = new Date(cita.fecha_programada).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    citasPorMes[mes] = (citasPorMes[mes] || 0) + 1;
  });

  const getEspecieColor = (especie: string) => {
    const colors: Record<string, string> = {
      'Perro': 'bg-blue-500',
      'Gato': 'bg-amber-500',
      'Ave': 'bg-green-500',
      'Conejo': 'bg-purple-500',
      'Otro': 'bg-gray-500'
    };
    return colors[especie] || 'bg-gray-500';
  };

  const maxCitas = Math.max(...Object.values(citasPorMes), 1);

  const handleExportReport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token disponible');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/generar-reporte-pdf/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar el reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_veterinaria.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error al exportar el reporte:', error);
    }
  };

  return (
    <div className="p-4 max-w-[2000px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reportes</h2>
          <p className="text-gray-600 mt-1">Análisis y estadísticas</p>
        </div>
        <button 
          onClick={handleExportReport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
          <Download size={20} />
          Exportar Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="text-teal-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-800">Citas por Estado</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Pendientes</span>
                <span className="text-sm font-bold text-yellow-700">{citasPorEstado.pendientes}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${citas.length > 0 ? (citasPorEstado.pendientes / citas.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Confirmadas</span>
                <span className="text-sm font-bold text-green-700">{citasPorEstado.confirmadas}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${citas.length > 0 ? (citasPorEstado.confirmadas / citas.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Completadas</span>
                <span className="text-sm font-bold text-blue-700">{citasPorEstado.completadas}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${citas.length > 0 ? (citasPorEstado.completadas / citas.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Canceladas</span>
                <span className="text-sm font-bold text-red-700">{citasPorEstado.canceladas}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${citas.length > 0 ? (citasPorEstado.canceladas / citas.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total de Citas</span>
              <span className="text-2xl font-bold text-gray-800">{citas.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <PawPrint className="text-teal-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-800">Mascotas por Especie</h3>
            </div>
          </div>

          <div className="space-y-4">
            {especiesData
              .sort((a, b) => b.count - a.count)
              .map(({ especie, count, percentage }) => (
                <div key={especie}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{especie}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-700">{count}</span>
                      <span className="text-xs text-gray-500">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getEspecieColor(especie)} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total de Mascotas</span>
              <span className="text-2xl font-bold text-gray-800">{mascotas.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-teal-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Citas por Mes</h3>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(citasPorMes)
            .sort(([a], [b]) => {
              const dateA = new Date(a);
              const dateB = new Date(b);
              return dateB.getTime() - dateA.getTime();
            })
            .map(([mes, count]) => (
              <div key={mes} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-24">{mes}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-end pr-3 transition-all"
                    style={{ width: `${(count / maxCitas) * 100}%` }}
                  >
                    <span className="text-white font-semibold text-sm">{count}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-teal-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Vacunas Administradas</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(vacunasPorMes).map(([mes, count]) => (
            <div key={mes} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-700 font-medium">{mes}</p>
              <p className="text-2xl font-bold text-purple-800 mt-2">{count}</p>
              <p className="text-xs text-purple-600 mt-1">vacunas</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total de Vacunas</span>
            <span className="text-2xl font-bold text-gray-800">{vacunas.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Tasa de Completado</p>
              <p className="text-3xl font-bold mt-2">
                {citas.length > 0 ? ((citasPorEstado.completadas / citas.length) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-blue-100 text-xs mt-1">De todas las citas</p>
            </div>
            <Calendar size={40} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm">Promedio por Cliente</p>
              <p className="text-3xl font-bold mt-2">
                {(() => {
                  // Obtener clientes únicos de las mascotas
                  const clientesUnicos = new Set(mascotas.map(m => m.propietario));
                  return clientesUnicos.size > 0 ? Math.round(mascotas.length / clientesUnicos.size) : 0;
                })()}
              </p>
              <p className="text-teal-100 text-xs mt-1">Mascotas por cliente</p>
            </div>
            <PawPrint size={40} className="text-teal-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Cobertura Vacunas</p>
              <p className="text-3xl font-bold mt-2">
                {mascotas.length > 0 ? ((vacunas.length / mascotas.length) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-purple-100 text-xs mt-1">Mascotas vacunadas</p>
            </div>
            <TrendingUp size={40} className="text-purple-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
