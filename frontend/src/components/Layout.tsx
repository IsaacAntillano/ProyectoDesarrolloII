import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiLogOut, FiUsers, FiUserPlus, FiHome, FiMenu, FiX } from 'react-icons/fi';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const userStr = localStorage.getItem('user');
  let user: { rol?: string; nombreCompleto?: string; numeroDocumento?: number } | null = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      /* JSON de usuario inválido: se ignora */
    }
  }

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = import.meta.env.BASE_URL;
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-200 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between p-4 bg-slate-950">
          <h2 className="text-2xl font-bold text-center">Victus CAF</h2>
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-slate-200 hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {user?.rol === 'ADMINISTRADOR' && (
            <>
              <Link to="/admin" className="flex items-center space-x-2 p-2 hover:bg-slate-800 rounded transition">
                <FiUsers /> <span>Usuarios Sistema</span>
              </Link>
              <Link to="/gestion-clientes" className="flex items-center space-x-2 p-2 hover:bg-slate-800 rounded transition">
                <FiUserPlus /> <span>Clientes (Mensual/Diario/EPS)</span>
              </Link>
            </>
          )}
          {user?.rol === 'SECRETARIA' && (
            <>
              <Link to="/secretaria" className="flex items-center space-x-2 p-2 hover:bg-slate-800 rounded transition">
                <FiHome /> <span>Dashboard</span>
              </Link>
              <Link to="/gestion-clientes" className="flex items-center space-x-2 p-2 hover:bg-slate-800 rounded transition">
                <FiUserPlus /> <span>Clientes (Mensual/Diario/EPS)</span>
              </Link>
            </>
          )}
          {user?.rol === 'ENTRENADOR' && (
            <Link to="/entrenador" className="flex items-center space-x-2 p-2 hover:bg-slate-800 rounded transition">
              <FiHome /> <span>Dashboard</span>
            </Link>
          )}
          {user?.rol === 'CLIENTE' && (
            <Link to="/cliente" className="flex items-center space-x-2 p-2 hover:bg-slate-800 rounded transition">
              <FiHome /> <span>Dashboard</span>
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <p className="text-sm text-slate-400">Logueado como:</p>
          <p className="font-semibold truncate">{user?.nombreCompleto || 'Usuario'}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <header className="bg-white h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 transition"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition"
          >
            <FiLogOut /> <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
