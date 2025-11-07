import { ReactNode, useState, useEffect } from 'react';
import { Menu, X, Calendar, Users, PawPrint, FileText, Package, BarChart3, Home, LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: string | null;
}

export default function Layout({ children, currentPage, onNavigate, userRole }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState<{ nombre: string; rol: string } | null>(null);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUserData(parsedUser);
    }
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'citas', label: 'Citas', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'mascotas', label: 'Mascotas', icon: PawPrint },
    { id: 'registros', label: 'Registros Médicos', icon: FileText },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 }
  ];

  const getVisibleItems = () => {
    if (!userRole) return [];
    switch (userRole) {
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

  const visibleItems = getVisibleItems();
  const filteredMenuItems = menuItems.filter(item => visibleItems.includes(item.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <PawPrint className="text-teal-600" size={28} />
              <h1 className="text-xl font-bold text-gray-800">VetClinic</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700">{userData?.nombre || 'Usuario'}</p>
              <p className="text-xs text-gray-500">{userRole || 'Usuario'}</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                onNavigate('login');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex pt-[57px]">
        <aside
          className={`fixed lg:sticky top-[57px] left-0 bottom-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-20 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-4 space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden top-[57px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
