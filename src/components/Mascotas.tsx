import { useState, useEffect } from 'react';
import { Search, Plus, User, Calendar, CreditCard as Edit, Trash2, X, FileText, Stethoscope, Syringe, Loader2 } from 'lucide-react';
import { Mascota, PetSex, Cliente, RegistroMedico, Vacuna } from '../types';

export default function Mascotas() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMascota, setSelectedMascota] = useState<Mascota | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    especie: '',
    raza: '',
    fecha_nacimiento: '',
    sexo: PetSex.DESCONOCIDO,
    propietario: '',
    propietarioNombre: ''
  });
  const [error, setError] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [showClientesList, setShowClientesList] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Estados para el modal de historial médico
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPetForHistory, setSelectedPetForHistory] = useState<Mascota | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<RegistroMedico[]>([]);
  const [vaccines, setVaccines] = useState<Vacuna[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');


  // Funciones de validación
  const validateName = (name: string): boolean => {
    // Permite uno o más nombres, cada uno comenzando con mayúscula
    const names = name.trim().split(/\s+/);
    return names.every(name => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*$/.test(name));
  };

  const validateBreed = (breed: string): boolean => {
    // Si está vacío es válido, si no, debe comenzar con mayúscula
    return !breed || /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]*$/.test(breed);
  };

  const validateDate = (date: string): boolean => {
    if (!date) return true; // Fecha opcional
    const birthDate = new Date(date);
    const today = new Date();
    return birthDate <= today;
  };

  useEffect(() => {
    fetchMascotas();
    fetchClientes();
  }, []);

  // Efecto para manejar clics fuera del autocompletado
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

  const fetchMascotas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pets/mascotas/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      const data = await response.json();
      setMascotas(data.results);
    } catch (error) {
      console.error('Error fetching mascotas:', error);
    }
  };

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

  const filteredMascotas = mascotas.filter(mascota =>
    mascota.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mascota.especie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mascota.propietario_nombre && mascota.propietario_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (mascota?: Mascota) => {
    if (mascota) {
      setSelectedMascota(mascota);
      setFormData({
        nombre: mascota.nombre,
        especie: mascota.especie,
        raza: mascota.raza || '',
        fecha_nacimiento: mascota.fecha_nacimiento || '',
        sexo: mascota.sexo,
        propietario: mascota.propietario,
        propietarioNombre: mascota.propietario_nombre || '',
      });
    } else {
      setSelectedMascota(null);
      setFormData({
        nombre: '',
        especie: '',
        raza: '',
        propietarioNombre: '',
        fecha_nacimiento: '',
        sexo: PetSex.DESCONOCIDO,
        propietario: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMascota(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.propietario) {
      setError('Debe seleccionar un propietario');
      return;
    }

    if (!formData.nombre.trim()) {
      setError('El nombre de la mascota es requerido');
      return;
    }

    if (!validateName(formData.nombre)) {
      setError('El nombre de la mascota debe comenzar con mayúscula');
      return;
    }

    if (!formData.especie) {
      setError('Debe seleccionar una especie');
      return;
    }

    if (formData.raza && !validateBreed(formData.raza)) {
      setError('La raza debe comenzar con mayúscula');
      return;
    }

    if (formData.fecha_nacimiento && !validateDate(formData.fecha_nacimiento)) {
      setError('La fecha de nacimiento no puede ser futura');
      return;
    }

    // Si estamos editando, pedir confirmación
    if (selectedMascota) {
      const isConfirmed = window.confirm(`¿Está seguro de que desea actualizar los datos de ${selectedMascota.nombre}?`);
      if (!isConfirmed) {
        return;
      }
    }

    const url = selectedMascota
      ? `${import.meta.env.VITE_API_URL}/pets/mascotas/${selectedMascota.id}/`
      : `${import.meta.env.VITE_API_URL}/pets/mascotas/`;
    const method = selectedMascota ? 'PUT' : 'POST';

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        fetchMascotas();
        handleCloseModal();
      } else {
        // Manejar diferentes tipos de errores del servidor
        if (data.error) {
          setError(data.error);
        } else if (data.detail) {
          setError(data.detail);
        } else if (typeof data === 'object') {
          // Si hay errores de validación específicos del servidor
          const errorMessages = Object.entries(data)
            .map(([campo, mensajes]) => `${campo}: ${Array.isArray(mensajes) ? mensajes.join(', ') : mensajes}`)
            .join('. ');
          setError(errorMessages);
        } else {
          setError('Error al guardar la mascota');
        }
      }
    } catch (error) {
      setError('Error de conexión. Por favor, inténtelo de nuevo');
      console.error('Error saving mascota:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta mascota?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/pets/mascotas/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${token}`,
          },
        });

        if (response.ok) {
          fetchMascotas();
        } else {
          console.error('Error deleting mascota:', await response.json());
        }
      } catch (error) {
        console.error('Error deleting mascota:', error);
      }
    }
  };

  const calculateAge = (fechaNacimiento: string | undefined) => {
    if (!fechaNacimiento) return 'No especificada';
    const birthDate = new Date(fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} año${age !== 1 ? 's' : ''}`;
  };

  const getSpeciesColor = (especie: string) => {
    const colors: Record<string, string> = {
      'Perro': 'bg-blue-100 text-blue-700',
      'Gato': 'bg-amber-100 text-amber-700',
      'Ave': 'bg-green-100 text-green-700',
      'Conejo': 'bg-purple-100 text-purple-700'
    };
    return colors[especie] || 'bg-gray-100 text-gray-700';
  };

  const handleViewHistory = async (mascota: Mascota) => {
    setSelectedPetForHistory(mascota);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryError('');
    setMedicalRecords([]);
    setVaccines([]);

    try {
      const token = localStorage.getItem('token');
      // Fetch medical records
      const recordsResponse = await fetch(`${import.meta.env.VITE_API_URL}/medical-records/registros-medicos/?mascota=${mascota.id}`, {
        headers: { 'Authorization': `Token ${token}` },
      });
      if (!recordsResponse.ok) throw new Error('Error al cargar el historial médico.');
      const recordsData = await recordsResponse.json();
      setMedicalRecords(recordsData.results || []);

      // Fetch vaccines
      const vaccinesResponse = await fetch(`${import.meta.env.VITE_API_URL}/medical-records/vacunas/?mascota=${mascota.id}`, {
        headers: { 'Authorization': `Token ${token}` },
      });
      if (!vaccinesResponse.ok) throw new Error('Error al cargar las vacunas.');
      const vaccinesData = await vaccinesResponse.json();
      setVaccines(vaccinesData.results || []);

    } catch (error) {
      if (error instanceof Error) {
        setHistoryError(error.message);
      } else {
        setHistoryError('Ocurrió un error desconocido.');
      }
    } finally {
      setHistoryLoading(false);
    }
  };


  return (
    <div className="p-4 max-w-[2000px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mascotas</h2>
          <p className="text-gray-600 mt-1">Gestión de mascotas</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Nueva Mascota
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, especie o propietario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMascotas.map(mascota => (
          <div key={mascota.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{mascota.nombre}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSpeciesColor(mascota.especie)}`}>
                    {mascota.especie}
                  </span>
                </div>
                {mascota.raza && (
                  <p className="text-sm text-gray-600">{mascota.raza}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(mascota)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit size={18} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(mascota.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Edad:</span>
                <span className="font-medium text-gray-700">
                  {calculateAge(mascota.fecha_nacimiento)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Sexo:</span>
                <span className="font-medium text-gray-700">{mascota.sexo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
                <User size={16} className="text-gray-400" />
                <span className="font-medium">{mascota.propietario_nombre}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={14} className="text-gray-400" />
                <span>
                  Registrado: {new Date(mascota.creado_en).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>

            <button 
              onClick={() => handleViewHistory(mascota)}
              className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium">
              <FileText size={16} />
              Ver Historial Médico
            </button>
          </div>
        ))}
      </div>

      {filteredMascotas.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No se encontraron mascotas</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedMascota ? 'Editar Mascota' : 'Nueva Mascota'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value });
                    if (e.target.value && !validateName(e.target.value)) {
                      setError('El nombre debe comenzar con mayúscula');
                    } else {
                      setError('');
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    error && error.includes('nombre') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  pattern="[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*(\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*)*"
                  title="Cada nombre debe comenzar con mayúscula"
                />
              </div>
              <div className="relative autocomplete-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propietario <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.propietarioNombre || ''}
                  onChange={(e) => {
                    const searchTerm = e.target.value;
                    setFormData(prev => ({ ...prev, propietarioNombre: searchTerm }));
                    const filteredClients = clientes.filter(cliente => 
                      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    setClientesFiltrados(filteredClients);
                    setShowClientesList(true);
                    setSelectedIndex(-1);
                  }}
                  onFocus={() => {
                    const searchTerm = formData.propietarioNombre;
                    if (searchTerm) {
                      const filteredClients = clientes.filter(cliente => 
                        cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                      setClientesFiltrados(filteredClients);
                    } else {
                      setClientesFiltrados(clientes);
                    }
                    setShowClientesList(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowClientesList(false);
                      setSelectedIndex(-1);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (!showClientesList) {
                        setShowClientesList(true);
                        setSelectedIndex(0);
                      } else {
                        setSelectedIndex(prev => 
                          prev + 1 >= clientesFiltrados.length ? 0 : prev + 1
                        );
                      }
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedIndex(prev => 
                        prev - 1 < 0 ? clientesFiltrados.length - 1 : prev - 1
                      );
                    } else if (e.key === 'Enter' && selectedIndex >= 0) {
                      e.preventDefault();
                      const selectedClient = clientesFiltrados[selectedIndex];
                      setFormData(prev => ({
                        ...prev,
                        propietario: selectedClient.id,
                        propietarioNombre: selectedClient.nombre
                      }));
                      setShowClientesList(false);
                      setSelectedIndex(-1);
                    }
                  }}
                  role="combobox"
                  aria-expanded={showClientesList}
                  aria-controls="propietarios-listbox"
                  aria-autocomplete="list"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Buscar propietario..."
                  required
                />
                {showClientesList && (
                  <div 
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    role="listbox"
                    aria-label="Lista de propietarios"
                  >
                    {clientesFiltrados.length > 0 ? (
                      clientesFiltrados.map(cliente => {
                        const index = cliente.nombre.toLowerCase()
                          .indexOf(formData.propietarioNombre.toLowerCase());
                        const beforeMatch = cliente.nombre.slice(0, index);
                        const match = cliente.nombre.slice(
                          index,
                          index + formData.propietarioNombre.length
                        );
                        const afterMatch = cliente.nombre.slice(
                          index + formData.propietarioNombre.length
                        );

                        return (
                          <div
                            key={cliente.id}
                            className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                              clientesFiltrados.indexOf(cliente) === selectedIndex ? 'bg-gray-100' : ''
                            }`}
                            role="option"
                            aria-selected={formData.propietario === cliente.id || clientesFiltrados.indexOf(cliente) === selectedIndex}
                            onClick={() => {
                              setFormData(prev => ({ 
                                ...prev, 
                                propietario: cliente.id,
                                propietarioNombre: cliente.nombre 
                              }));
                              setShowClientesList(false);
                            }}
                          >
                            {index >= 0 ? (
                              <>
                                {beforeMatch}
                                <span className="font-semibold text-teal-600">
                                  {match}
                                </span>
                                {afterMatch}
                              </>
                            ) : (
                              cliente.nombre
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No se encontraron propietarios
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especie <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.especie}
                  onChange={(e) => setFormData({ ...formData, especie: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Seleccionar especie</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Ave">Ave</option>
                  <option value="Conejo">Conejo</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raza
                </label>
                <input
                  type="text"
                  value={formData.raza}
                  onChange={(e) => {
                    setFormData({ ...formData, raza: e.target.value });
                    if (e.target.value && !validateBreed(e.target.value)) {
                      setError('La raza debe comenzar con mayúscula');
                    } else {
                      setError('');
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    error && error.includes('raza') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  pattern="[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]*"
                  title="La raza debe comenzar con mayúscula"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const date = e.target.value;
                      if (validateDate(date)) {
                        setFormData({ ...formData, fecha_nacimiento: date });
                        setError('');
                      } else {
                        setError('La fecha de nacimiento no puede ser futura');
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      error && error.includes('fecha') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sexo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value as PetSex })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value={PetSex.MACHO}>Macho</option>
                    <option value={PetSex.HEMBRA}>Hembra</option>
                    <option value={PetSex.DESCONOCIDO}>Desconocido</option>
                  </select>
                </div>
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
                  {selectedMascota ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && selectedPetForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Historial Médico de <span className="text-teal-600">{selectedPetForHistory.nombre}</span>
                </h3>
                <p className="text-sm text-gray-500">Propietario: {selectedPetForHistory.propietario_nombre}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="animate-spin text-teal-600" size={40} />
                </div>
              ) : historyError ? (
                <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{historyError}</div>
              ) : (
                <div className="space-y-6">
                  {/* Sección de Registros Médicos */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Stethoscope size={20} />
                      Consultas y Registros
                    </h4>
                    {medicalRecords.length > 0 ? (
                      <div className="space-y-4">
                        {medicalRecords.map(record => (
                          <div key={record.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="font-semibold text-gray-800">Fecha: <span className="font-normal">{new Date(record.creado_en).toLocaleDateString('es-ES')}</span></p>
                            <p className="font-semibold text-gray-800 mt-1">Veterinario: <span className="font-normal">{record.veterinario_nombre || 'No especificado'}</span></p>
                            <p className="font-semibold text-gray-800 mt-2">Síntomas:</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{record.sintomas}</p>
                            <p className="font-semibold text-gray-800 mt-2">Diagnóstico:</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{record.diagnostico}</p>
                            <p className="font-semibold text-gray-800 mt-2">Tratamiento:</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{record.tratamiento}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No hay registros médicos.</p>
                    )}
                  </div>

                  {/* Sección de Vacunas */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Syringe size={20} />
                      Vacunas
                    </h4>
                    {vaccines.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vacuna</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Aplicación</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próxima Dosis</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {vaccines.map(vaccine => (
                              <tr key={vaccine.id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{vaccine.nombre}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(vaccine.fecha_administracion).toLocaleDateString('es-ES')}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{vaccine.proxima_fecha ? new Date(vaccine.proxima_fecha).toLocaleDateString('es-ES') : 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500">No hay vacunas registradas.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
