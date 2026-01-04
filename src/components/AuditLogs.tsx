import { useState, useEffect, useCallback } from 'react';
import { FileText, Filter, User, Activity, ChevronLeft, ChevronRight, X, Info } from 'lucide-react';
import { authenticatedFetch } from '../utils/auth';

type AuditLog = {
  id: number;
  usuario_nombre: string;
  accion: string;
  accion_display: string;
  timestamp: string;
  ip_address: string;
  metodo_http: string;
  ruta: string;
  detalles: string;
  exito: boolean;
  user_agent?: string;
};

type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom' | '';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    accion: '',
    usuario: '',
    fecha_desde: '',
    fecha_hasta: '',
    exito: '',
    busqueda: '' // Nuevo: búsqueda en IP, ruta, detalles
  });

  const [datePreset, setDatePreset] = useState<DateRangePreset>('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(filters.accion && { accion: filters.accion }),
        ...(filters.exito && { exito: filters.exito }),
        ...(filters.fecha_desde && { fecha_desde: filters.fecha_desde }),
        ...(filters.fecha_hasta && { fecha_hasta: filters.fecha_hasta })
      });

      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_URL}/audit/logs/?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        let filteredLogs = data.results || [];
        
        // Filtrado local adicional para búsqueda de texto
        if (filters.busqueda) {
          const searchTerm = filters.busqueda.toLowerCase();
          filteredLogs = filteredLogs.filter((log: AuditLog) =>
            log.ip_address?.toLowerCase().includes(searchTerm) ||
            log.ruta?.toLowerCase().includes(searchTerm) ||
            log.detalles?.toLowerCase().includes(searchTerm) ||
            log.usuario_nombre?.toLowerCase().includes(searchTerm)
          );
        }
        
        setLogs(filteredLogs);
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 50));
      } else {
        setError('Error al cargar los logs de auditoría');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionColor = (accion: string) => {
    switch (accion) {
      case 'LOGIN': return 'bg-green-100 text-green-800';
      case 'LOGOUT': return 'bg-blue-100 text-blue-800';
      case 'LOGIN_FAILED': return 'bg-red-100 text-red-800';
      case 'CREATE': return 'bg-purple-100 text-purple-800';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const setDateRange = (preset: DateRangePreset) => {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    let desde = '';
    let hasta = formatDate(today);

    switch (preset) {
      case 'today': {
        desde = formatDate(today);
        break;
      }
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        desde = formatDate(yesterday);
        hasta = formatDate(yesterday);
        break;
      }
      case 'last7days': {
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        desde = formatDate(last7);
        break;
      }
      case 'last30days': {
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        desde = formatDate(last30);
        break;
      }
      default:
        desde = '';
        hasta = '';
    }

    setFilters(prev => ({
      ...prev,
      fecha_desde: desde,
      fecha_hasta: hasta
    }));
    setDatePreset(preset);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      accion: '',
      usuario: '',
      fecha_desde: '',
      fecha_hasta: '',
      exito: '',
      busqueda: ''
    });
    setDatePreset('');
    setCurrentPage(1);
  };

  const activeFiltersCount = () => {
    return Object.values(filters).filter(v => v !== '').length;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando logs...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="text-teal-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">Logs de Auditoría</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <Filter size={20} />
            <span>Filtros</span>
          </div>
          {activeFiltersCount() > 0 && (
            <span className="text-sm text-gray-500">
              {activeFiltersCount()} filtro(s) activo(s)
            </span>
          )}
        </div>

        {/* Presets de fechas */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              datePreset === 'today'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setDateRange('yesterday')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              datePreset === 'yesterday'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Ayer
          </button>
          <button
            onClick={() => setDateRange('last7days')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              datePreset === 'last7days'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            onClick={() => setDateRange('last30days')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              datePreset === 'last30days'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Últimos 30 días
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.busqueda}
                onChange={(e) => handleFilterChange('busqueda', e.target.value)}
                placeholder="IP, ruta, usuario, detalles..."
                className="w-full p-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
              {filters.busqueda && (
                <button
                  onClick={() => handleFilterChange('busqueda', '')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acción
            </label>
            <select
              value={filters.accion}
              onChange={(e) => handleFilterChange('accion', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Todas</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="LOGIN_FAILED">Login Fallido</option>
              <option value="CREATE">Creación</option>
              <option value="UPDATE">Actualización</option>
              <option value="DELETE">Eliminación</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.exito}
              onChange={(e) => handleFilterChange('exito', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Todos</option>
              <option value="true">Exitoso</option>
              <option value="false">Fallido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={filters.usuario}
              onChange={(e) => handleFilterChange('usuario', e.target.value)}
              placeholder="Nombre de usuario"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No hay logs para mostrar
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-900">{log.usuario_nombre || 'Anónimo'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.accion)}`}>
                        {log.accion_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      <span className="font-mono text-xs">{log.metodo_http}</span> {log.ruta}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.exito ? (
                        <span className="inline-flex items-center text-green-600 text-sm">
                          <Activity size={16} className="mr-1" />
                          Éxito
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600 text-sm">
                          <Activity size={16} className="mr-1" />
                          Fallo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
                      >
                        <Info size={16} />
                        Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{logs.length}</span> de{' '}
                  <span className="font-medium">{totalCount}</span> registros
                  {' - '}Página <span className="font-medium">{currentPage}</span> de{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedLog && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <Info className="text-teal-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-800">Detalles del Log</h2>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Contenido */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Usuario</label>
                    <p className="text-gray-900">{selectedLog.usuario_nombre || 'Anónimo'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Acción</label>
                    <p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(selectedLog.accion)}`}>
                        {selectedLog.accion_display}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Fecha y Hora</label>
                    <p className="text-gray-900">{formatDate(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">IP</label>
                    <p className="text-gray-900 font-mono text-sm">{selectedLog.ip_address || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Método HTTP</label>
                    <p className="text-gray-900 font-mono text-sm">{selectedLog.metodo_http}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Estado</label>
                    <p>
                      {selectedLog.exito ? (
                        <span className="inline-flex items-center text-green-600 text-sm font-medium">
                          <Activity size={16} className="mr-1" />
                          Éxito
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600 text-sm font-medium">
                          <Activity size={16} className="mr-1" />
                          Fallo
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Ruta</label>
                  <p className="text-gray-900 font-mono text-sm break-all bg-gray-50 p-2 rounded">
                    {selectedLog.ruta}
                  </p>
                </div>

                {selectedLog.detalles && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Detalles</label>
                    <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                      {selectedLog.detalles}
                    </p>
                  </div>
                )}

                {selectedLog.user_agent && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">User Agent</label>
                    <p className="text-gray-900 text-xs bg-gray-50 p-2 rounded break-all">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t pt-4 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
