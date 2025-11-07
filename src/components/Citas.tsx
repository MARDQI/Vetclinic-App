import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Search, Filter, X, CheckCircle, XCircle } from 'lucide-react';
import { Cita, AppointmentStatus, Cliente, Mascota, User } from '../types';

export default function Citas() {
  // Estados para la gestión de citas, clientes, mascotas y veterinarios
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mascotasFiltradas, setMascotasFiltradas] = useState<Mascota[]>([]);
  const [veterinarios, setVeterinarios] = useState<User[]>([]);
  
  // Estados para la UI: búsqueda, filtros, modal y selección
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  
  // Estado para el formulario de creación/edición de citas
  const [formData, setFormData] = useState({
    cliente: '',
    clienteNombre: '',
    mascota: '',
    veterinario: '',
    motivo: '',
    fecha_programada: '',
    estado: AppointmentStatus.PENDIENTE,
    notas: ''
  });

  // Estados para la gestión de errores y el autocompletado
  const [formError, setFormError] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [showClientesList, setShowClientesList] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // --- VALIDACIONES ---
  // Valida que la fecha de la cita no sea en el pasado
  const validateFecha = (fecha: string): boolean => {
    if (!fecha) return false;
    const fechaCita = new Date(fecha);
    const ahora = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    ahora.setSeconds(0, 0); // Ignorar segundos para una comparación más precisa
    return fechaCita >= ahora && fechaCita <= maxDate;
  };

  // --- EFECTOS ---
  // Carga inicial de datos al montar el componente
  useEffect(() => {
    fetchCitas();
    fetchClientes();
    fetchVeterinarios();
  }, []);

  // Cierra la lista de autocompletado si se hace clic fuera de ella
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.autocomplete-container') && showClientesList) {
        setShowClientesList(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClientesList]);

  // Estado para errores generales de la página
  const [error, setError] = useState<string>('');

  // --- FUNCIONES DE API ---
  // Obtiene todas las citas del servidor
  const fetchCitas = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments/citas/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error fetching citas:', errorData);
        setError('Error al cargar las citas');
        return;
      }

      const data = await response.json();
      setCitas(data.results);
      setError('');
    } catch (error) {
      console.error('Error fetching citas:', error);
      setError('Error al cargar las citas');
    }
  };

  // Obtiene todos los clientes para el autocompletado
  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/clients/clientes/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      const data = await response.json();
      setClientes(data.results);
    } catch (error) {
      console.error('Error fetching clientes:', error);
    }
  };

  // Obtiene las mascotas de un cliente específico
  const fetchMascotasPorCliente = async (clienteId: string) => {
    if (!clienteId) {
      setMascotasFiltradas([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pets/mascotas/?propietario=${clienteId}`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      const data = await response.json();
      setMascotasFiltradas(data.results);
    } catch (error) {
      console.error('Error fetching mascotas por cliente:', error);
    }
  };

  // Obtiene la lista de usuarios con rol de veterinario
  const fetchVeterinarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/accounts/users/?rol=VETERINARIO`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      const data = await response.json();
      setVeterinarios(data.results);
    } catch (error) {
      console.error('Error fetching veterinarios:', error);
    }
  };

  // Filtra y ordena las citas según el término de búsqueda y el estado seleccionado
  const filteredCitas = citas
    .filter(cita => {
      const matchesSearch =
        (cita.cliente_nombre && cita.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cita.mascota_nombre && cita.mascota_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        cita.motivo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || cita.estado === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.fecha_programada).getTime() - new Date(a.fecha_programada).getTime());

  // --- MANEJO DEL MODAL ---
  // Abre el modal para crear o editar una cita
  const handleOpenModal = async (cita?: Cita) => {
    try {
      if (cita) {
        setSelectedCita(cita);
        
        // Primero obtenemos los detalles de la mascota para saber su propietario
        const token = localStorage.getItem('token');
        const mascotaResponse = await fetch(`${import.meta.env.VITE_API_URL}/pets/mascotas/${cita.mascota}/`, {
          headers: {
            'Authorization': `Token ${token}`,
          },
        });
        
        if (!mascotaResponse.ok) {
          throw new Error('Error al obtener detalles de la mascota');
        }

        const mascotaData = await mascotaResponse.json();
        const clienteId = mascotaData.propietario;
        const cliente = clientes.find(c => c.id === clienteId);

        const fecha = new Date(cita.fecha_programada);
        const localDate = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
        
        setFormData({
          cliente: clienteId,
          clienteNombre: cliente ? cliente.nombre : '',
          mascota: cita.mascota,
          veterinario: cita.veterinario,
          motivo: cita.motivo,
          fecha_programada: localDate.toISOString().slice(0, 16),
          estado: cita.estado,
          notas: cita.notas || ''
        });

        await fetchMascotasPorCliente(clienteId);
      } else {
        setSelectedCita(null);
        setFormData({
          cliente: '',
          clienteNombre: '',
          mascota: '',
          veterinario: '',
          motivo: '',
          fecha_programada: '',
          estado: AppointmentStatus.PENDIENTE,
          notas: ''
        });
        setMascotasFiltradas([]);
      }
      setFormError('');
      setShowModal(true);
    } catch (error) {
      console.error('Error al abrir el modal:', error);
      setError('Error al cargar los datos de la cita');
    }
  };

  // Cierra el modal y resetea el estado de selección
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCita(null);
  };

  // --- MANEJO DEL FORMULARIO ---
  // Envía los datos del formulario para crear o actualizar una cita
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.cliente) {
      setFormError('Debe seleccionar un cliente.');
      return;
    }
    if (!formData.mascota) {
      setFormError('Debe seleccionar una mascota.');
      return;
    }
    if (!formData.veterinario) {
      setFormError('Debe seleccionar un veterinario.');
      return;
    }
    if (!formData.fecha_programada) {
      setFormError('Debe seleccionar una fecha y hora.');
      return;
    }
    if (!validateFecha(formData.fecha_programada)) {
      const fechaCita = new Date(formData.fecha_programada);
      const ahora = new Date();
      ahora.setSeconds(0, 0);
      if (fechaCita < ahora) {
        setFormError('La fecha de la cita no puede ser en el pasado.');
      } else {
        setFormError('La cita no puede ser para dentro de más de un año.');
      }
      return;
    }
    if (!formData.motivo.trim()) {
      setFormError('El motivo de la cita es requerido.');
      return;
    }

    if (selectedCita) {
      const isConfirmed = window.confirm('¿Está seguro de que desea actualizar esta cita?');
      if (!isConfirmed) {
        return;
      }
    }

    const url = selectedCita
      ? `${import.meta.env.VITE_API_URL}/appointments/citas/${selectedCita.id}/`
      : `${import.meta.env.VITE_API_URL}/appointments/citas/`;
    const method = selectedCita ? 'PUT' : 'POST';

    try {
      const token = localStorage.getItem('token');
      const body = {
        mascota: formData.mascota,
        veterinario: formData.veterinario,
        motivo: formData.motivo,
        fecha_programada: new Date(formData.fecha_programada).toISOString(),
        estado: formData.estado,
        notas: formData.notas,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchCitas();
        handleCloseModal();
      } else {
        const errorData = await response.json();
        setFormError(errorData.detail || 'Error al guardar la cita.');
        console.error('Error saving cita:', errorData);
      }
    } catch (error) {
      setFormError('Error de conexión. Inténtelo de nuevo.');
      console.error('Error saving cita:', error);
    }
  };

  // Cambia el estado de una cita (Pendiente, Confirmada, etc.)
  const handleStatusChange = async (cita: Cita, newStatus: AppointmentStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa');
        return;
      }

      console.log('Actualizando estado de cita:', {
        id: cita.id,
        oldStatus: cita.estado,
        newStatus: newStatus
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments/citas/${cita.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ estado: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Estado actualizado correctamente:', data);
        // Actualizamos la cita localmente para una actualización inmediata
        setCitas(prevCitas => prevCitas.map(c => 
          c.id === cita.id ? { ...c, estado: newStatus } : c
        ));
        // Luego actualizamos desde el servidor
        fetchCitas();
        setError('');
      } else {
        console.error('Error updating status:', data);
        setError(data.detail || 'Error al actualizar el estado de la cita');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Error al actualizar el estado de la cita');
    }
  };

  // --- FUNCIONES AUXILIARES ---
  // Devuelve clases de color según el estado de la cita
  const getStatusColor = (status: AppointmentStatus) => {
    const colors = {
      [AppointmentStatus.PENDIENTE]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      [AppointmentStatus.CONFIRMADA]: 'bg-green-100 text-green-700 border-green-200',
      [AppointmentStatus.COMPLETADA]: 'bg-blue-100 text-blue-700 border-blue-200',
      [AppointmentStatus.CANCELADA]: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status];
  };

  // Formatea una cadena de fecha a un formato legible
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Maneja la selección de un cliente en el autocompletado
  const handleClienteChange = (cliente: Cliente) => {
    setFormData({
      ...formData,
      cliente: cliente.id,
      clienteNombre: cliente.nombre,
      mascota: ''
    });
    fetchMascotasPorCliente(cliente.id);
    setShowClientesList(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="p-4 max-w-[2000px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Citas</h2>
          <p className="text-gray-600 mt-1">Gestión de citas veterinarias</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Nueva Cita
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente, mascota o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={18} className="text-gray-400" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {Object.values(AppointmentStatus).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredCitas.map(cita => {
          const dateTime = formatDateTime(cita.fecha_programada);
          return (
            <div
              key={cita.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{cita.mascota_nombre}</h3>
                      <p className="text-sm text-gray-600">{cita.cliente_nombre}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{dateTime.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} className="text-gray-400" />
                      <span>{dateTime.time}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Motivo:</span> {cita.motivo}
                    </p>
                    {cita.notas && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Notas:</span> {cita.notas}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Veterinario: {cita.veterinario_nombre}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2">
                  <button
                    onClick={() => handleOpenModal(cita)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    Editar
                  </button>
                  {cita.estado === AppointmentStatus.PENDIENTE && (
                    <button
                      onClick={() => handleStatusChange(cita, AppointmentStatus.CONFIRMADA)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                      title="Confirmar"
                    >
                      <CheckCircle size={16} />
                      Confirmar
                    </button>
                  )}
                  {cita.estado === AppointmentStatus.CONFIRMADA && (
                    <button
                      onClick={() => handleStatusChange(cita, AppointmentStatus.COMPLETADA)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                      title="Completar"
                    >
                      <CheckCircle size={16} />
                      Completar
                    </button>
                  )}
                  {(cita.estado === AppointmentStatus.PENDIENTE || cita.estado === AppointmentStatus.CONFIRMADA) && (
                    <button
                      onClick={() => handleStatusChange(cita, AppointmentStatus.CANCELADA)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                      title="Cancelar"
                    >
                      <XCircle size={16} />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {filteredCitas.length === 0 && !error && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No se encontraron citas</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedCita ? 'Editar Cita' : 'Nueva Cita'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
                <span className="block sm:inline">{formError}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative autocomplete-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.clienteNombre}
                  onChange={(e) => {
                    const searchTerm = e.target.value;
                    setFormData(prev => ({ ...prev, clienteNombre: searchTerm, cliente: '' }));
                    const filtered = clientes.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
                    setClientesFiltrados(filtered);
                    setShowClientesList(true);
                    setSelectedIndex(-1);
                  }}
                  onFocus={() => {
                    setClientesFiltrados(clientes);
                    setShowClientesList(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowClientesList(false);
                      setSelectedIndex(-1);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedIndex(prev => (prev + 1 >= clientesFiltrados.length ? 0 : prev + 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedIndex(prev => (prev - 1 < 0 ? clientesFiltrados.length - 1 : prev - 1));
                    } else if (e.key === 'Enter' && selectedIndex >= 0) {
                      e.preventDefault();
                      handleClienteChange(clientesFiltrados[selectedIndex]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Buscar cliente..."
                  required
                />
                {showClientesList && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {clientesFiltrados.length > 0 ? (
                      clientesFiltrados.map((cliente, index) => (
                        <div
                          key={cliente.id}
                          className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${selectedIndex === index ? 'bg-gray-100' : ''}`}
                          onClick={() => handleClienteChange(cliente)}
                        >
                          {cliente.nombre}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">No se encontraron clientes</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mascota <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.mascota}
                  onChange={(e) => setFormData({ ...formData, mascota: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                  disabled={!formData.cliente}
                >
                  <option value="">Seleccionar mascota</option>
                  {mascotasFiltradas.map(mascota => (
                    <option key={mascota.id} value={mascota.id}>
                      {mascota.nombre} ({mascota.especie})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Veterinario <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.veterinario}
                  onChange={(e) => setFormData({ ...formData, veterinario: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Seleccionar veterinario</option>
                  {veterinarios.map(vet => (
                    <option key={vet.id} value={vet.id}>
                      {vet.nombre} {vet.especialidad && `- ${vet.especialidad}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y Hora <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.fecha_programada}
                  min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  max={(() => {
                    const maxDate = new Date();
                    maxDate.setFullYear(maxDate.getFullYear() + 1);
                    return new Date(maxDate.getTime() - maxDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                  })()}
                  onChange={(e) => {
                    const fecha = e.target.value;
                    setFormData({ ...formData, fecha_programada: fecha });
                    if (fecha && !validateFecha(fecha)) {
                      const fechaCita = new Date(fecha);
                      const ahora = new Date();
                      ahora.setSeconds(0, 0);
                      if (fechaCita < ahora) {
                        setFormError('La fecha de la cita no puede ser en el pasado.');
                      } else {
                        setFormError('La cita no puede ser para dentro de más de un año.');
                      }
                    } else {
                      setFormError('');
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    formError.includes('fecha') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as AppointmentStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  {Object.values(AppointmentStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  {selectedCita ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
