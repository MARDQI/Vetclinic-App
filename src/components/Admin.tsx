import { useState, useEffect } from 'react';
import { Users, LogOut, Plus, X, Edit, Trash2, Mail, PawPrint } from 'lucide-react';

// Ajustamos el tipo User para que coincida con el serializador
type User = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  rol: string;
  telefono?: string;
  especialidad?: string;
};

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ nombre: string; rol: string } | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    rol: 'VETERINARIO',
    password: '',
    confirmPassword: '',
    telefono: '',
    especialidad: ''
  });
  const [error, setError] = useState('');

  // Funciones de validación adaptadas de Clientes.tsx
  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string): boolean => /^[0-9]{8,15}$/.test(phone);
  const validateName = (name: string): boolean => name.trim().split(/\s+/).every(n => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*$/.test(n));

  useEffect(() => {
    fetchUsers();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUserData(parsedUser);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/accounts/users/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []));
      } else {
        setError('No tienes permiso para ver los usuarios.');
        setUsers([]); // Asegurarse de que users es un array
      }
    } catch {
      setError('Error de conexión al cargar usuarios.');
      setUsers([]); // Asegurarse de que users es un array
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/accounts/users/${id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` },
        });
        if (response.status === 204) {
          setUsers(users.filter(user => user.id !== id));
        } else {
          console.error('Error deleting user:', await response.json());
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleOpenModal = (user: User | null) => {
    setSelectedUser(user);
    setFormData(user ? {
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      rol: user.rol,
      password: '',
      confirmPassword: '',
      telefono: user.telefono || '',
      especialidad: user.especialidad || ''
    } : {
      username: '', first_name: '', last_name: '', email: '', rol: 'VETERINARIO', password: '', confirmPassword: '', telefono: '', especialidad: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pedir confirmación al editar
    if (selectedUser) {
      const isConfirmed = window.confirm(`¿Está seguro de que desea actualizar los datos de ${selectedUser.first_name} ${selectedUser.last_name}?`);
      if (!isConfirmed) {
        return;
      }
    }

    // --- INICIO DE VALIDACIONES ---
    if (!validateName(formData.first_name)) {
      setError('El nombre debe comenzar con mayúscula.');
      return;
    }
    if (!validateName(formData.last_name)) {
      setError('El apellido debe comenzar con mayúscula.');
      return;
    }
    if (!validateEmail(formData.email)) {
      setError('El formato del correo electrónico no es válido.');
      return;
    }
    if (formData.telefono && !validatePhone(formData.telefono)) {
      setError('El teléfono debe tener entre 8 y 15 dígitos numéricos.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!selectedUser && !formData.password) {
      setError('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }
    // --- FIN DE VALIDACIONES ---

    const url = selectedUser
      ? `${import.meta.env.VITE_API_URL}/accounts/users/${selectedUser.id}/`
      : `${import.meta.env.VITE_API_URL}/accounts/users/`;
    
    const method = selectedUser ? 'PUT' : 'POST';

    // Construir el cuerpo de la petición con los campos necesarios
    const body: { [key: string]: string } = {
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      rol: formData.rol,
      telefono: formData.telefono,
      especialidad: formData.especialidad,
    };

    // Solo incluir la contraseña si se ha introducido una nueva
    if (formData.password) {
      body.password = formData.password;
    }

    try {
      const token = localStorage.getItem('token');
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
        fetchUsers(); // Recargar la lista de usuarios
        handleCloseModal();
      } else {
        setError(JSON.stringify(data));
      }
    } catch {
      setError('Error de conexión');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'ALL' || user.rol === roleFilter;
    const matchesSearch = searchTerm === '' ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <PawPrint className="text-teal-600" size={28} />
          <h1 className="text-xl font-bold text-gray-800">Panel de Administración</h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden sm:block text-sm text-gray-700">Bienvenido, <span className="font-medium">{userData?.nombre || 'Admin'}</span></p>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </header>
      <div className="px-16 py-4 max-w-[2000px] mx-auto space-y-6">
        <UserManagement 
          users={paginatedUsers} 
          onEdit={handleOpenModal} 
          onDelete={handleDelete} 
          onAdd={() => handleOpenModal(null)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={handleCloseModal}><X size={20} /></button>
            </div>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className={`w-full p-2 border rounded-lg ${error.includes('username') ? 'border-red-500' : 'border-gray-300'}`} required />
              <input type="text" placeholder="Nombre" value={formData.first_name} onChange={e => { setFormData({...formData, first_name: e.target.value }); if(e.target.value && !validateName(e.target.value)) setError('El nombre debe comenzar con mayúscula.'); else setError(''); }} className={`w-full p-2 border rounded-lg ${error.includes('nombre') ? 'border-red-500' : 'border-gray-300'}`} required />
              <input type="text" placeholder="Apellido" value={formData.last_name} onChange={e => { setFormData({...formData, last_name: e.target.value }); if(e.target.value && !validateName(e.target.value)) setError('El apellido debe comenzar con mayúscula.'); else setError(''); }} className={`w-full p-2 border rounded-lg ${error.includes('apellido') ? 'border-red-500' : 'border-gray-300'}`} required />
              <input type="email" placeholder="Email" value={formData.email} onChange={e => { setFormData({...formData, email: e.target.value }); if(e.target.value && !validateEmail(e.target.value)) setError('El formato del correo no es válido.'); else setError(''); }} className={`w-full p-2 border rounded-lg ${error.includes('correo') ? 'border-red-500' : 'border-gray-300'}`} required />
              <input
                type="password"
                placeholder={selectedUser ? "Nueva Contraseña" : "Contraseña"}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className={`w-full p-2 border rounded-lg ${error.includes('contraseña') ? 'border-red-500' : 'border-gray-300'}`}
                required={!selectedUser}
              />
              <input
                type="password"
                placeholder="Confirmar Contraseña"
                value={formData.confirmPassword}
                onChange={e => { setFormData({...formData, confirmPassword: e.target.value }); if(formData.password !== e.target.value) setError('Las contraseñas no coinciden.'); else setError(''); }}
                className={`w-full p-2 border rounded-lg ${error.includes('contraseñas') ? 'border-red-500' : 'border-gray-300'}`}
                required={!selectedUser || !!formData.password}
              />
              <select 
                value={formData.rol} 
                onChange={e => {
                  const newRole = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    rol: newRole,
                    especialidad: newRole !== 'VETERINARIO' ? '' : prev.especialidad
                  }));
                }} 
                className="w-full p-2 border rounded-lg"
              >
                <option value="VETERINARIO">Veterinario</option>
                <option value="RECEPCIONISTA">Recepcionista</option>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="SYSTEM_ADMIN">Admin del Sistema</option>
              </select>
              <input type="text" placeholder="Teléfono" value={formData.telefono} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setFormData({...formData, telefono: val }); if(val && !validatePhone(val)) setError('El teléfono debe tener entre 8 y 15 dígitos.'); else setError(''); }} className={`w-full p-2 border rounded-lg ${error.includes('teléfono') ? 'border-red-500' : 'border-gray-300'}`} />
              {formData.rol === 'VETERINARIO' && (
                <input type="text" placeholder="Especialidad" value={formData.especialidad} onChange={e => setFormData({...formData, especialidad: e.target.value})} className="w-full p-2 border rounded-lg" />
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg">{selectedUser ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para la gestión de usuarios con diseño de tarjetas
const UserManagement = ({ 
  users, 
  onEdit, 
  onDelete, 
  onAdd,
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  currentPage,
  totalPages,
  onPageChange
}: { 
  users: User[], 
  onEdit: (user: User) => void, 
  onDelete: (id: string) => void, 
  onAdd: () => void,
  searchTerm: string,
  setSearchTerm: (term: string) => void,
  roleFilter: string,
  setRoleFilter: (role: string) => void,
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
}) => {
  const roles = ['ALL', 'VETERINARIO', 'RECEPCIONISTA', 'ADMINISTRADOR', 'SYSTEM_ADMIN'];

  return (
  <div>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Gestionar Usuarios</h2>
        <p className="text-gray-600 mt-1">Crea, edita y elimina usuarios del sistema.</p>
      </div>
      <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
        <Plus size={20} />
        Nuevo Usuario
      </button>
    </div>

    <div className="mb-6 flex flex-col md:flex-row gap-4">
      <input
        type="text"
        placeholder="Buscar por nombre, apellido, email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:flex-1 p-2 border rounded-lg"
      />
      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="w-full md:w-auto p-2 border rounded-lg"
      >
        {roles.map(role => (
          <option key={role} value={role}>{role === 'ALL' ? 'Todos los roles' : role.charAt(0).toUpperCase() + role.slice(1).toLowerCase().replace('_', ' ')}</option>
        ))}
      </select>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map(user => (
        <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{`${user.first_name} ${user.last_name}`}</h3>
              <p className="text-sm text-gray-500 mt-1">
                <span className="px-2 py-1 text-xs font-semibold text-white bg-teal-600 rounded-full">{user.rol}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(user)} className="p-2 hover:bg-gray-100 rounded-lg" title="Editar">
                <Edit size={18} className="text-gray-600" />
              </button>
              <button onClick={() => onDelete(user.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Eliminar">
                <Trash2 size={18} className="text-red-600" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={16} className="text-gray-400" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    {users.length === 0 && (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No se encontraron usuarios.</p>
      </div>
    )}

    {totalPages > 1 && (
      <div className="mt-6 flex justify-center items-center gap-4">
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1} 
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <span className="text-gray-700">
          Página {currentPage} de {totalPages}
        </span>
        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages} 
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    )}
  </div>
  );
};
