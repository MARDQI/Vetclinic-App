import { useState, useEffect } from 'react';
import { Search, Plus, Mail, Phone, MapPin, CreditCard as Edit, Trash2, X } from 'lucide-react';
import { Cliente } from '../types';

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [error, setError] = useState('');

  // Funciones de validación
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{8,15}$/;
    return phoneRegex.test(phone);
  };

  const validateName = (name: string): boolean => {
    // Permite uno o más nombres, cada uno comenzando con mayúscula
    const names = name.trim().split(/\s+/);
    return names.every(name => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*$/.test(name));
  };

  const validateLastName = (lastName: string): boolean => {
    // Permite uno o más apellidos, cada uno comenzando con mayúscula
    const lastNames = lastName.trim().split(/\s+/);
    return lastNames.every(name => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*$/.test(name));
  };

  useEffect(() => {
    fetchClientes();
  }, []);

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

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono.includes(searchTerm)
  );

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setSelectedCliente(cliente);
      setFormData({
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        telefono: cliente.telefono,
        email: cliente.email,
        direccion: cliente.direccion || ''
      });
    } else {
      setSelectedCliente(null);
      setFormData({ nombre: '', apellido: '', telefono: '', email: '', direccion: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCliente(null);
    setFormData({ nombre: '', apellido: '', telefono: '', email: '', direccion: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Si estamos editando, pedir confirmación
    if (selectedCliente) {
      const isConfirmed = window.confirm(`¿Está seguro de que desea actualizar los datos de ${selectedCliente.nombre}?`);
      if (!isConfirmed) {
        return;
      }
    }

    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!validateName(formData.nombre)) {
      setError('Cada nombre debe comenzar con mayúscula');
      return;
    }

    if (!formData.apellido.trim()) {
      setError('El apellido es requerido');
      return;
    }

    if (!validateLastName(formData.apellido)) {
      setError('Cada apellido debe comenzar con mayúscula');
      return;
    }

    if (!formData.email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('El correo electrónico no es válido');
      return;
    }

    if (!formData.telefono.trim()) {
      setError('El teléfono es requerido');
      return;
    }

    if (!validatePhone(formData.telefono)) {
      setError('El número de teléfono no es válido (debe tener entre 8 y 15 dígitos)');
      return;
    }

    const method = selectedCliente ? 'PUT' : 'POST';
    const url = selectedCliente
      ? `${import.meta.env.VITE_API_URL}/clients/clientes/${selectedCliente.id}/`
      : `${import.meta.env.VITE_API_URL}/clients/clientes/`;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa');
        return;
      }

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
        if (selectedCliente) {
          setClientes(clientes.map(c => c.id === data.id ? data : c));
        } else {
          setClientes([...clientes, data]);
        }
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
          setError('Error al guardar el cliente');
        }
      }
    } catch (error) {
      setError('Error de conexión. Por favor, inténtelo de nuevo');
      console.error('Error saving cliente:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/clients/clientes/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${token}`,
          },
        });

        if (response.status === 204) {
          setClientes(clientes.filter(c => c.id !== id));
        } else {
          console.error('Error deleting cliente:', await response.json());
        }
      } catch (error) {
        console.error('Error deleting cliente:', error);
      }
    }
  };

  return (
    <div className="p-4 max-w-[2000px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
          <p className="text-gray-600 mt-1">Gestión de clientes</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClientes.map(cliente => (
          <div key={cliente.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{cliente.nombre}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Cliente desde {new Date(cliente.creado_en).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(cliente)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit size={18} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(cliente.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={16} className="text-gray-400" />
                <span>{cliente.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <span>{cliente.telefono}</span>
              </div>
              {cliente.direccion && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{cliente.direccion}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredClientes.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No se encontraron clientes</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
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
                      setError('Cada nombre debe comenzar con mayúscula');
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido <span className="text-red-500">*</span>
                </label>
                  <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => {
                    setFormData({ ...formData, apellido: e.target.value });
                    if (e.target.value && !validateLastName(e.target.value)) {
                      setError('Cada apellido debe comenzar con mayúscula');
                    } else {
                      setError('');
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    error && error.includes('apellido') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  pattern="[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*(\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*)*"
                  title="Cada apellido debe comenzar con mayúscula"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (e.target.value && !validateEmail(e.target.value)) {
                      setError('El correo debe tener un formato válido (ejemplo@dominio.com)');
                    } else {
                      setError('');
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    error && error.includes('correo') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
                  title="Ingrese un correo electrónico válido"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                  <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => {
                    // Solo permitir números
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, telefono: value });
                    
                    if (value) {
                      if (!/^[0-9]+$/.test(value)) {
                        setError('El teléfono solo puede contener números');
                      } else if (value.length < 8) {
                        setError('El teléfono debe tener al menos 8 dígitos');
                      } else if (value.length > 15) {
                        setError('El teléfono no puede tener más de 15 dígitos');
                      } else {
                        setError('');
                      }
                    } else {
                      setError('');
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    error && error.includes('teléfono') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  pattern="[0-9]{8,15}"
                  title="El número debe tener entre 8 y 15 dígitos, solo números"
                  maxLength={15}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => {
                    setFormData({ ...formData, direccion: e.target.value });
                    setError('');
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    error && error.includes('dirección') ? 'border-red-500' : 'border-gray-300'
                  }`}
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
                  {selectedCliente ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
