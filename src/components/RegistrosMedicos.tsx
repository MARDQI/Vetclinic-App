import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Calendar, X, Syringe } from 'lucide-react';
import { RegistroMedico, Vacuna, Mascota, User } from '../types';

export default function RegistrosMedicos() {
  const [registros, setRegistros] = useState<RegistroMedico[]>([]);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [veterinarios, setVeterinarios] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'registros' | 'vacunas'>('registros');
  const [showModal, setShowModal] = useState(false);
  const [showVacunaModal, setShowVacunaModal] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroMedico | null>(null);
  const [selectedVacuna, setSelectedVacuna] = useState<Vacuna | null>(null);
  
  // Estados para el autocompletado de mascotas en registros médicos
  const [formData, setFormData] = useState({
    mascota: '',
    mascotaNombre: '',
    veterinario: '',
    veterinarioNombre: '',
    sintomas: '',
    diagnostico: '',
    tratamiento: '',
    medicamentos: '',
    fecha_seguimiento: ''
  });
  const [mascotasFiltradas, setMascotasFiltradas] = useState<Mascota[]>([]);
  const [showMascotasList, setShowMascotasList] = useState(false);
  const [selectedMascotaIndex, setSelectedMascotaIndex] = useState(-1);
  
  // Estados para el autocompletado de mascotas en vacunas
  const [vacunaData, setVacunaData] = useState({
    mascota: '',
    mascotaNombre: '',
    nombre: '',
    fecha_administracion: '',
    proxima_fecha: '',
    notas: ''
  });
  const [mascotasVacunasFiltradas, setMascotasVacunasFiltradas] = useState<Mascota[]>([]);
  const [showMascotasVacunasList, setShowMascotasVacunasList] = useState(false);
  const [selectedMascotaVacunaIndex, setSelectedMascotaVacunaIndex] = useState(-1);

  const [error, setError] = useState<string>('');
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    fetchRegistros();
    fetchVacunas();
    fetchMascotas();
    fetchVeterinarios();
  }, []);

  // Efecto para manejar clics fuera del autocompletado de mascotas en registros
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.autocomplete-mascota') && showMascotasList) {
        setShowMascotasList(false);
        setSelectedMascotaIndex(-1);
      }
      if (!target.closest('.autocomplete-mascota-vacuna') && showMascotasVacunasList) {
        setShowMascotasVacunasList(false);
        setSelectedMascotaVacunaIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMascotasList, showMascotasVacunasList]);

  const fetchRegistros = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/medical-records/registros-medicos/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      const data = await response.json();
      if (data && Array.isArray(data.results)) {
        setRegistros(data.results.filter((r: RegistroMedico) => r));
      }
    } catch (error) {
      console.error('Error fetching registros:', error);
    }
  };

  const fetchVacunas = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token disponible');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/medical-records/vacunas/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error fetching vacunas:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        return;
      }

      const data = await response.json();
      if (data && Array.isArray(data.results)) {
        setVacunas(data.results.filter((v: Vacuna) => v));
      }
    } catch (error) {
      console.error('Error fetching vacunas:', error);
    }
  };

  const fetchMascotas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pets/mascotas/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      const data = await response.json();
      if (data && Array.isArray(data.results)) {
        setMascotas(data.results.filter((m: Mascota) => m && m.nombre));
      }
    } catch (error) {
      console.error('Error fetching mascotas:', error);
    }
  };

  const fetchVeterinarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/accounts/users/?rol=VETERINARIO`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      const data = await response.json();
      if (data && Array.isArray(data.results)) {
        setVeterinarios(data.results);
      }
    } catch (error) {
      console.error('Error fetching veterinarios:', error);
    }
  };

  const filteredRegistros = registros.filter(registro =>
    (registro.mascota_nombre && registro.mascota_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (registro.diagnostico || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVacunas = vacunas.filter(vacuna =>
    (vacuna.mascota_nombre && vacuna.mascota_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vacuna.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (registro?: RegistroMedico) => {
    if (registro) {
      setSelectedRegistro(registro);
      const mascota = mascotas.find(m => m.id === registro.mascota);
      const veterinario = veterinarios.find(v => v.id === registro.veterinario);
      setFormData({
        mascota: registro.mascota,
        mascotaNombre: mascota ? mascota.nombre : '',
        veterinario: registro.veterinario,
        veterinarioNombre: veterinario ? veterinario.nombre : '',
        sintomas: registro.sintomas,
        diagnostico: registro.diagnostico,
        tratamiento: registro.tratamiento,
        medicamentos: registro.medicamentos || '',
        fecha_seguimiento: registro.fecha_seguimiento || ''
      });
    } else {
      setSelectedRegistro(null);
      setFormData({
        mascota: '',
        mascotaNombre: '',
        veterinario: '',
        veterinarioNombre: '',
        sintomas: '',
        diagnostico: '',
        tratamiento: '',
        medicamentos: '',
        fecha_seguimiento: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRegistro) {
      if (!window.confirm('¿Estás seguro de que deseas actualizar este registro?')) {
        return;
      }
    }
    
    if (!formData.mascota) {
      setError('Debe seleccionar una mascota.');
      return;
    }
    if (!formData.veterinario) {
      setError('Debe seleccionar un veterinario.');
      return;
    }

    const url = selectedRegistro
      ? `${import.meta.env.VITE_API_URL}/medical-records/registros-medicos/${selectedRegistro.id}/`
      : `${import.meta.env.VITE_API_URL}/medical-records/registros-medicos/`;
    const method = selectedRegistro ? 'PUT' : 'POST';

    try {
      const token = localStorage.getItem('token');
      const body = {
        mascota: formData.mascota,
        veterinario: formData.veterinario,
        sintomas: formData.sintomas,
        diagnostico: formData.diagnostico,
        tratamiento: formData.tratamiento,
        medicamentos: formData.medicamentos || '',
        fecha_seguimiento: formData.fecha_seguimiento || ''
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
        fetchRegistros();
        setShowModal(false);
      } else {
        console.error('Error saving registro:', await response.json());
      }
    } catch (error) {
      console.error('Error saving registro:', error);
    }
  };

  const handleOpenVacunaModal = (vacuna?: Vacuna) => {
    if (vacuna) {
      setSelectedVacuna(vacuna);
      const mascota = mascotas.find(m => m.id === vacuna.mascota);
      setVacunaData({
        mascota: vacuna.mascota,
        mascotaNombre: mascota ? mascota.nombre : '',
        nombre: vacuna.nombre,
        fecha_administracion: vacuna.fecha_administracion,
        proxima_fecha: vacuna.proxima_fecha || '',
        notas: vacuna.notas || ''
      });
    } else {
      setSelectedVacuna(null);
      setVacunaData({
        mascota: '',
        mascotaNombre: '',
        nombre: '',
        fecha_administracion: '',
        proxima_fecha: '',
        notas: ''
      });
    }
    setShowVacunaModal(true);
  };

  const handleVacunaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedVacuna) {
      if (!window.confirm('¿Estás seguro de que deseas actualizar esta vacuna?')) {
        return;
      }
    }

    // Validaciones del lado del cliente
    if (!vacunaData.mascota) {
      setError('Debe seleccionar una mascota.');
      return;
    }
    if (!vacunaData.nombre) {
      setError('Debe ingresar el nombre de la vacuna.');
      return;
    }
    if (!vacunaData.fecha_administracion) {
      setError('Debe ingresar la fecha de administración.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa. Por favor, inicie sesión nuevamente.');
        return;
      }

      const body = {
        mascota: vacunaData.mascota,
        nombre: vacunaData.nombre,
        fecha_administracion: vacunaData.fecha_administracion,
        proxima_fecha: vacunaData.proxima_fecha || '',
        notas: vacunaData.notas || ''
      };

      const url = selectedVacuna
        ? `${import.meta.env.VITE_API_URL}/medical-records/vacunas/${selectedVacuna.id}/`
        : `${import.meta.env.VITE_API_URL}/medical-records/vacunas/`;
      const method = selectedVacuna ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        fetchVacunas();
        setShowVacunaModal(false);
        setVacunaData({
          mascota: '',
          mascotaNombre: '',
          nombre: '',
          fecha_administracion: '',
          proxima_fecha: '',
          notas: ''
        });
      } else {
        console.error('Error saving vacuna:', data);
        if (data.detalles) {
          // Si hay error de validación específicos
          const errores = Object.entries(data.detalles)
            .map(([campo, mensajes]) => {
              const campoNombre = {
                mascota: 'Mascota',
                nombre: 'Nombre de la vacuna',
                fecha_administracion: 'Fecha de administración',
                proxima_fecha: 'Próxima fecha',
                notas: 'Notas'
              }[campo] || campo;
              return `${campoNombre}: ${Array.isArray(mensajes) ? mensajes.join(', ') : mensajes}`;
            })
            .join('\n');
          setError(errores);
        } else if (data.mensaje) {
          // Si hay un mensaje de error general
          setError(data.mensaje);
        } else {
          setError('Error al guardar la vacuna. Por favor, inténtelo de nuevo.');
        }
      }
    } catch (error) {
      console.error('Error saving vacuna:', error);
      setError('Error de conexión. Por favor, verifique su conexión a internet e inténtelo de nuevo.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 max-w-[2000px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Registros Médicos</h2>
          <p className="text-gray-600 mt-1">Historial médico y vacunas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenVacunaModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Syringe size={20} />
            Nueva Vacuna
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Nuevo Registro
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('registros')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'registros'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Registros Médicos ({registros.length})
          </button>
          <button
            onClick={() => setActiveTab('vacunas')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'vacunas'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Vacunas ({vacunas.length})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por mascota, diagnóstico o propietario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {activeTab === 'registros' ? (
        <div className="space-y-3">
          {filteredRegistros.map(registro => (
            <div
              key={registro.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{registro.mascota_nombre}</h3>
                      <p className="text-sm text-gray-600">
                        Veterinario: {registro.veterinario_nombre}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <Calendar size={12} className="inline mr-1" />
                        {formatDate(registro.creado_en)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-700 mb-1">SÍNTOMAS</p>
                      <p className="text-sm text-gray-700">{registro.sintomas}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1">DIAGNÓSTICO</p>
                      <p className="text-sm text-gray-700">{registro.diagnostico}</p>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">TRATAMIENTO</p>
                    <p className="text-sm text-gray-700">{registro.tratamiento}</p>
                    {registro.medicamentos && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Medicamentos:</span> {registro.medicamentos}
                      </p>
                    )}
                  </div>

                  {registro.fecha_seguimiento && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-2">
                      <Calendar size={16} />
                      <span className="font-medium">
                        Seguimiento programado: {formatDate(registro.fecha_seguimiento)}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleOpenModal(registro)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}

          {filteredRegistros.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FileText className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">No se encontraron registros médicos</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVacunas.map(vacuna => (
            <div
              key={vacuna.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Syringe className="text-purple-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{vacuna.nombre}</h3>
                  <p className="text-sm text-gray-600 mt-1">{vacuna.mascota_nombre}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Administrada:</span>
                  <span className="font-medium text-gray-800">
                    {formatDate(vacuna.fecha_administracion)}
                  </span>
                </div>
                {vacuna.proxima_fecha && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Próxima dosis:</span>
                    <span className="font-medium text-teal-600">
                      {formatDate(vacuna.proxima_fecha)}
                    </span>
                  </div>
                )}
              </div>

              {vacuna.notas && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600">{vacuna.notas}</p>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleOpenVacunaModal(vacuna)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs font-medium"
                >
                  Editar
                </button>
              </div>
            </div>
          ))}

          {filteredVacunas.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Syringe className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">No se encontraron vacunas registradas</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedRegistro ? 'Ver Registro Médico' : 'Nuevo Registro Médico'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative autocomplete-mascota">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mascota <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.mascotaNombre}
                    onChange={(e) => {
                      const searchTerm = e.target.value;
                      setFormData(prev => ({ ...prev, mascotaNombre: searchTerm, mascota: '' }));
                      const filtered = mascotas.filter(m => 
                        (m.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (m.propietario_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
                      );
                      setMascotasFiltradas(filtered);
                      setShowMascotasList(true);
                      setSelectedMascotaIndex(-1);
                    }}
                    onFocus={() => {
                      const searchTerm = formData.mascotaNombre;
                      if (searchTerm) {
                        const filtered = mascotas.filter(m => 
                          (m.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.propietario_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
                        );
                        setMascotasFiltradas(filtered);
                      } else {
                        setMascotasFiltradas(mascotas);
                      }
                      setShowMascotasList(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowMascotasList(false);
                        setSelectedMascotaIndex(-1);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (!showMascotasList) {
                          setShowMascotasList(true);
                          setSelectedMascotaIndex(0);
                        } else {
                          setSelectedMascotaIndex(prev => 
                            prev + 1 >= mascotasFiltradas.length ? 0 : prev + 1
                          );
                        }
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSelectedMascotaIndex(prev => 
                          prev - 1 < 0 ? mascotasFiltradas.length - 1 : prev - 1
                        );
                      } else if (e.key === 'Enter' && selectedMascotaIndex >= 0) {
                        e.preventDefault();
                        const selectedMascota = mascotasFiltradas[selectedMascotaIndex];
                        setFormData(prev => ({
                          ...prev,
                          mascota: selectedMascota.id,
                          mascotaNombre: selectedMascota.nombre
                        }));
                        setShowMascotasList(false);
                        setSelectedMascotaIndex(-1);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Buscar mascota..."
                    required
                  />
                  {showMascotasList && (
                    <div 
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      role="listbox"
                      aria-label="Lista de mascotas"
                    >
                      {mascotasFiltradas.length > 0 ? (
                        mascotasFiltradas.map((mascota, index) => {
                          const searchTerm = formData.mascotaNombre.toLowerCase();
                          const nombreIndex = (mascota.nombre || '').toLowerCase().indexOf(searchTerm);
                          const propietarioIndex = (mascota.propietario_nombre || '').toLowerCase().indexOf(searchTerm);
                          
                          let displayText = mascota.nombre;
                          if (mascota.propietario_nombre) {
                            displayText += ` - ${mascota.propietario_nombre}`;
                          }

                          const beforeMatch = nombreIndex >= 0 ? 
                            mascota.nombre.slice(0, nombreIndex) : 
                            (propietarioIndex >= 0 ? mascota.nombre.slice(0, propietarioIndex) : displayText);
                          const match = nombreIndex >= 0 ? 
                            mascota.nombre.slice(nombreIndex, nombreIndex + formData.mascotaNombre.length) : 
                            (propietarioIndex >= 0 ? mascota.propietario_nombre?.slice(propietarioIndex, propietarioIndex + formData.mascotaNombre.length) || '' : '');
                          const afterMatch = nombreIndex >= 0 ? 
                            mascota.nombre.slice(nombreIndex + formData.mascotaNombre.length) : 
                            (propietarioIndex >= 0 ? mascota.propietario_nombre?.slice(propietarioIndex + formData.mascotaNombre.length) || '' : '');

                          return (
                            <div
                              key={mascota.id}
                              className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                                index === selectedMascotaIndex ? 'bg-gray-100' : ''
                              }`}
                              role="option"
                              aria-selected={formData.mascota === mascota.id || index === selectedMascotaIndex}
                              onClick={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  mascota: mascota.id,
                                  mascotaNombre: mascota.nombre
                                }));
                                setShowMascotasList(false);
                              }}
                            >
                              {searchTerm && (nombreIndex >= 0 || propietarioIndex >= 0) ? (
                                <>
                                  {beforeMatch}
                                  <span className="font-semibold text-teal-600">
                                    {match}
                                  </span>
                                  {afterMatch}
                                </>
                              ) : (
                                displayText
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          No se encontraron mascotas
                        </div>
                      )}
                    </div>
                  )}
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
                    <option value="" disabled>Seleccione un veterinario</option>
                    {veterinarios.map(vet => (
                      <option key={vet.id} value={vet.id}>
                        {`${vet.first_name} ${vet.last_name}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Síntomas <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.sintomas}
                  onChange={(e) => setFormData({ ...formData, sintomas: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnóstico <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.diagnostico}
                  onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tratamiento <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.tratamiento}
                  onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicamentos
                </label>
                <textarea
                  value={formData.medicamentos}
                  onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={2}
                  placeholder="Ej: Amoxicilina 250mg, 2 veces al día por 7 días"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Seguimiento
                </label>
                <input
                  type="date"
                  value={formData.fecha_seguimiento}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const inputDate = new Date(selectedDate);
                    const userTimezoneOffset = inputDate.getTimezoneOffset() * 60000;
                    const correctedInputDate = new Date(inputDate.getTime() + userTimezoneOffset);

                    if (correctedInputDate < today) {
                      setDateError('No se pueden seleccionar fechas pasadas.');
                    } else {
                      setDateError('');
                    }
                    setFormData({ ...formData, fecha_seguimiento: selectedDate });
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {dateError && <p className="text-red-500 text-xs mt-1">{dateError}</p>}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  {selectedRegistro ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVacunaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedVacuna ? 'Editar Vacuna' : 'Registrar Vacuna'}
              </h3>
              <button onClick={() => setShowVacunaModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleVacunaSubmit} className="space-y-4">
              <div className="relative autocomplete-mascota-vacuna">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mascota <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vacunaData.mascotaNombre}
                  onChange={(e) => {
                    const searchTerm = e.target.value;
                    setVacunaData(prev => ({ ...prev, mascotaNombre: searchTerm, mascota: '' }));
                    const filtered = mascotas.filter(m => 
                      (m.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (m.propietario_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    setMascotasVacunasFiltradas(filtered);
                    setShowMascotasVacunasList(true);
                    setSelectedMascotaVacunaIndex(-1);
                  }}
                  onFocus={() => {
                    const searchTerm = vacunaData.mascotaNombre;
                    if (searchTerm) {
                      const filtered = mascotas.filter(m => 
                        (m.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (m.propietario_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
                      );
                      setMascotasVacunasFiltradas(filtered);
                    } else {
                      setMascotasVacunasFiltradas(mascotas);
                    }
                    setShowMascotasVacunasList(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowMascotasVacunasList(false);
                      setSelectedMascotaVacunaIndex(-1);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (!showMascotasVacunasList) {
                        setShowMascotasVacunasList(true);
                        setSelectedMascotaVacunaIndex(0);
                      } else {
                        setSelectedMascotaVacunaIndex(prev => 
                          prev + 1 >= mascotasVacunasFiltradas.length ? 0 : prev + 1
                        );
                      }
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedMascotaVacunaIndex(prev => 
                        prev - 1 < 0 ? mascotasVacunasFiltradas.length - 1 : prev - 1
                      );
                    } else if (e.key === 'Enter' && selectedMascotaVacunaIndex >= 0) {
                      e.preventDefault();
                      const selectedMascota = mascotasVacunasFiltradas[selectedMascotaVacunaIndex];
                      setVacunaData(prev => ({
                        ...prev,
                        mascota: selectedMascota.id,
                        mascotaNombre: selectedMascota.nombre
                      }));
                      setShowMascotasVacunasList(false);
                      setSelectedMascotaVacunaIndex(-1);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Buscar mascota..."
                  required
                />
                {showMascotasVacunasList && (
                  <div 
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    role="listbox"
                    aria-label="Lista de mascotas"
                  >
                    {mascotasVacunasFiltradas.length > 0 ? (
                      mascotasVacunasFiltradas.map((mascota, index) => {
                        const searchTerm = vacunaData.mascotaNombre.toLowerCase();
                        const nombreIndex = (mascota.nombre || '').toLowerCase().indexOf(searchTerm);
                        const propietarioIndex = (mascota.propietario_nombre || '').toLowerCase().indexOf(searchTerm);
                        
                        let displayText = mascota.nombre;
                        if (mascota.propietario_nombre) {
                          displayText += ` - ${mascota.propietario_nombre}`;
                        }

                        const beforeMatch = nombreIndex >= 0 ? 
                          mascota.nombre.slice(0, nombreIndex) : 
                          (propietarioIndex >= 0 ? mascota.nombre.slice(0, propietarioIndex) : displayText);
                        const match = nombreIndex >= 0 ? 
                          mascota.nombre.slice(nombreIndex, nombreIndex + vacunaData.mascotaNombre.length) : 
                          (propietarioIndex >= 0 ? mascota.propietario_nombre?.slice(propietarioIndex, propietarioIndex + vacunaData.mascotaNombre.length) || '' : '');
                        const afterMatch = nombreIndex >= 0 ? 
                          mascota.nombre.slice(nombreIndex + vacunaData.mascotaNombre.length) : 
                          (propietarioIndex >= 0 ? mascota.propietario_nombre?.slice(propietarioIndex + vacunaData.mascotaNombre.length) || '' : '');

                        return (
                          <div
                            key={mascota.id}
                            className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                              index === selectedMascotaVacunaIndex ? 'bg-gray-100' : ''
                            }`}
                            role="option"
                            aria-selected={vacunaData.mascota === mascota.id || index === selectedMascotaVacunaIndex}
                            onClick={() => {
                              setVacunaData(prev => ({ 
                                ...prev, 
                                mascota: mascota.id,
                                mascotaNombre: mascota.nombre
                              }));
                              setShowMascotasVacunasList(false);
                            }}
                          >
                            {searchTerm && (nombreIndex >= 0 || propietarioIndex >= 0) ? (
                              <>
                                {beforeMatch}
                                <span className="font-semibold text-purple-600">
                                  {match}
                                </span>
                                {afterMatch}
                              </>
                            ) : (
                              displayText
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No se encontraron mascotas
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Vacuna <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vacunaData.nombre}
                  onChange={(e) => setVacunaData({ ...vacunaData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: Antirrábica, Parvovirus"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Administración <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={vacunaData.fecha_administracion}
                  onChange={(e) => setVacunaData({ ...vacunaData, fecha_administracion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Próxima Dosis
                </label>
                <input
                  type="date"
                  value={vacunaData.proxima_fecha}
                  min={vacunaData.fecha_administracion || new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const proximaFecha = e.target.value;
                    if (proximaFecha && vacunaData.fecha_administracion && new Date(proximaFecha) < new Date(vacunaData.fecha_administracion)) {
                      setError('La próxima dosis no puede ser anterior a la fecha de administración.');
                    } else {
                      setVacunaData({ ...vacunaData, proxima_fecha: proximaFecha });
                      if (error.includes('próxima dosis')) {
                        setError('');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={vacunaData.notas}
                  onChange={(e) => setVacunaData({ ...vacunaData, notas: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowVacunaModal(false);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  {selectedVacuna ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
