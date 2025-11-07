import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Clientes from './components/Clientes';
import Mascotas from './components/Mascotas';
import Citas from './components/Citas';
import RegistrosMedicos from './components/RegistrosMedicos';
import Inventario from './components/Inventario';
import Reportes from './components/Reportes';
import Login from './components/Login';
import Admin from './components/Admin';

type Page = 'dashboard' | 'clientes' | 'mascotas' | 'citas' | 'registros' | 'inventario' | 'reportes' | 'login' | 'admin';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      // Leer el rol del usuario desde el localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.rol);
        if (user.rol === 'SYSTEM_ADMIN') {
          setCurrentPage('admin');
        } else {
          setCurrentPage('dashboard');
        }
      }
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    // La redirección se manejará en el useEffect
  };

  const getVisibleItems = (role: string | null) => {
    if (!role) return [];
    switch (role) {
      case 'RECEPCIONISTA':
        return ['dashboard', 'citas', 'clientes', 'mascotas'];
      case 'VETERINARIO':
        return ['dashboard', 'mascotas', 'registros'];
      case 'ADMINISTRADOR':
        return ['dashboard', 'inventario', 'reportes'];
      default:
        return ['dashboard'];
    }
  };

  const handleNavigate = (page: string) => {
    if (page === 'login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setCurrentPage('login');
    } else {
      const allowedPages = getVisibleItems(userRole);
      if (allowedPages.includes(page as Page)) {
        setCurrentPage(page as Page);
      }
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Si es admin, mostrar solo el panel de administración
  if (userRole === 'SYSTEM_ADMIN') {
    return <Admin />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'clientes':
        return <Clientes />;
      case 'mascotas':
        return <Mascotas />;
      case 'citas':
        return <Citas />;
      case 'registros':
        return <RegistrosMedicos />;
      case 'inventario':
        return <Inventario />;
      case 'reportes':
        return <Reportes />;
      // El caso 'admin' ya no es necesario aquí para el flujo principal
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate} userRole={userRole}>
      {renderPage()}
    </Layout>
  );
}

export default App;
