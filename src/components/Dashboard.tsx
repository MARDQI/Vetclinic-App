import { useState, useEffect } from 'react';
import { Calendar, Users, PawPrint, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { AppointmentStatus, Cita, Cliente, Mascota, ArticuloInventario } from '../types';

export default function Dashboard() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [inventario, setInventario] = useState<ArticuloInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No hay sesión activa');
          return;
        }

        const headers = {
          'Authorization': `Token ${token}`
        };

        const [citasRes, clientesRes, mascotasRes, inventarioRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/appointments/citas/`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/clients/clientes/`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/pets/mascotas/`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/inventory/articulos-inventario/`, { headers })
        ]);

        // Verificar si alguna respuesta no es exitosa
        const responses = [
          { res: citasRes, name: 'citas' },
          { res: clientesRes, name: 'clientes' },
          { res: mascotasRes, name: 'mascotas' },
          { res: inventarioRes, name: 'inventario' }
        ];

        for (const { res, name } of responses) {
          if (!res.ok) {
            throw new Error(`Error al cargar ${name}: ${res.status} ${res.statusText}`);
          }
        }

        // Procesar las respuestas
        const [citasData, clientesData, mascotasData, inventarioData] = await Promise.all([
          citasRes.json(),
          clientesRes.json(),
          mascotasRes.json(),
          inventarioRes.json()
        ]);

        setCitas(citasData.results);
        setClientes(clientesData.results);
        setMascotas(mascotasData.results);
        setInventario(inventarioData.results);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const citasHoy = citas.filter(cita => {
    const today = new Date();
    const citaDate = new Date(cita.fecha_programada);
    return citaDate.toDateString() === today.toDateString();
  }).length;

  const citasPendientes = citas.filter(cita => cita.estado === AppointmentStatus.PENDIENTE).length;
  const itemsBajoStock = inventario.filter(item => item.cantidad <= item.nivel_reorden).length;

  const proximasCitas = citas
    .filter(cita => cita.estado !== AppointmentStatus.CANCELADA && cita.estado !== AppointmentStatus.COMPLETADA)
    .sort((a, b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime())
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = [
    {
      label: 'Citas Hoy',
      value: citasHoy,
      icon: Calendar,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Total Clientes',
      value: clientes.length,
      icon: Users,
      color: 'bg-teal-500',
      textColor: 'text-teal-700',
      bgColor: 'bg-teal-50'
    },
    {
      label: 'Total Mascotas',
      value: mascotas.length,
      icon: PawPrint,
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'Citas Pendientes',
      value: citasPendientes,
      icon: Clock,
      color: 'bg-purple-500',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="p-4 max-w-[2000px] mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-600 mt-1">Resumen general de la clínica veterinaria</p>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className={`p-6 rounded-xl border border-gray-200 bg-white`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={stat.textColor} size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {itemsBajoStock > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-800">Alerta de Inventario</h3>
                <p className="text-red-700 text-sm mt-1">
                  Hay {itemsBajoStock} artículo{itemsBajoStock > 1 ? 's' : ''} con stock bajo que requiere{itemsBajoStock > 1 ? 'n' : ''} reabastecimiento.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Próximas Citas</h3>
            <Calendar className="text-gray-400" size={20} />
          </div>
          <div className="space-y-3">
            {proximasCitas.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-3">No hay citas programadas</p>
            ) : (
              proximasCitas.map(cita => (
                <div key={cita.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{cita.mascota_nombre}</p>
                    <p className="text-sm text-gray-600">{cita.cliente_nombre}</p>
                    <p className="text-xs text-gray-500 mt-1">{cita.motivo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{formatDate(cita.fecha_programada)}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                      cita.estado === AppointmentStatus.CONFIRMADA
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {cita.estado}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Estadísticas del Mes</h3>
            <TrendingUp className="text-gray-400" size={20} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-700">Citas Completadas</span>
              <span className="text-lg font-bold text-blue-700">
                {citas.filter(c => c.estado === AppointmentStatus.COMPLETADA).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
              <span className="text-sm text-gray-700">Nuevos Clientes</span>
              <span className="text-xl font-bold text-teal-700">
                {clientes.filter(c => {
                  const created = new Date(c.creado_en);
                  const today = new Date();
                  return created.getMonth() === today.getMonth();
                }).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <span className="text-sm text-gray-700">Especies Registradas</span>
              <span className="text-xl font-bold text-amber-700">
                {new Set(mascotas.map(m => m.especie)).size}
              </span>
            </div>
          </div>
        </div>
          </div>
        </>
      )}
    </div>
  );
}
