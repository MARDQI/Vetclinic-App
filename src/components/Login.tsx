import { useState } from 'react';
import { PawPrint, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '', // puede ser email o nombre de usuario
    password: ''
  });

  const [error, setError] = useState('');
  const [isEmail, setIsEmail] = useState(false); // false para empezar con nombre de usuario

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación del correo electrónico si estamos en modo email
    if (isEmail && !validateEmail(formData.identifier)) {
      setError('Por favor, ingrese un correo electrónico válido (ejemplo@dominio.com)');
      return;
    }

    // Validación de campos vacíos
    if (!formData.identifier.trim()) {
      setError(isEmail ? 'El correo electrónico es requerido' : 'El nombre de usuario es requerido');
      return;
    }

    if (!formData.password.trim()) {
      setError('La contraseña es requerida');
      return;
    }

    try {
      const loginData = {
        [isEmail ? 'email' : 'username']: formData.identifier,
        password: formData.password
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/accounts/users/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        // Determinar el rol basado en el nombre de usuario (temporal)
        const rol = data.user.username === 'admin' ? 'Administrador' : 'Usuario';
        
        localStorage.setItem('user', JSON.stringify({
          nombre: data.user.nombre || data.user.username,
          email: data.user.email,
          rol: data.user.rol || rol
        }));
        onLogin();
      } else {
        const errorData = await response.json();
        switch (response.status) {
          case 400:
            setError(errorData.error || 'Por favor, complete todos los campos correctamente');
            break;
          case 401:
            setError('Las credenciales ingresadas son incorrectas');
            break;
          case 403:
            setError('Su cuenta ha sido desactivada');
            break;
          case 429:
            setError('Demasiados intentos fallidos. Por favor, espere unos minutos');
            break;
          default:
            setError('Error al iniciar sesión. Inténtelo de nuevo');
        }
      }
    } catch (error) {
      setError('Error de conexión. Por favor, verifique su conexión a internet');
      console.error('Error de inicio de sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <PawPrint size={40} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center">VetClinic</h1>
            <p className="text-teal-100 text-center mt-2">Sistema de Gestión Veterinaria</p>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-600 mb-6">Ingresa tus credenciales para acceder</p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {isEmail ? 'Correo Electrónico' : 'Nombre de Usuario'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmail(!isEmail);
                      setFormData({...formData, identifier: ''}); // Limpiar el campo al cambiar
                      setError(''); // Limpiar errores al cambiar
                    }}
                    className="text-sm text-teal-600 hover:text-teal-700"
                  >
                    Usar {isEmail ? 'nombre de usuario' : 'correo electrónico'}
                  </button>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={isEmail ? "email" : "text"}
                    value={formData.identifier}
                    onChange={(e) => {
                      setFormData({ ...formData, identifier: e.target.value });
                      if (isEmail && e.target.value && !validateEmail(e.target.value)) {
                        setError('El correo debe tener un formato válido (ejemplo@dominio.com)');
                      } else {
                        setError('');
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                      error && formData.identifier ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={isEmail ? "correo@ejemplo.com" : "nombre de usuario"}
                    required
                    pattern={isEmail ? "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" : ".*"}
                    title={isEmail ? "Ingrese un correo electrónico válido" : "Ingrese su nombre de usuario"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="ml-2 text-gray-600">Recordarme</span>
                </label>
                <a href="#" className="text-teal-600 hover:text-teal-700 font-medium">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Iniciar Sesión
              </button>
            </form>


          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes una cuenta?{' '}
            <a href="#" className="text-teal-600 hover:text-teal-700 font-medium">
              Contacta al administrador
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
