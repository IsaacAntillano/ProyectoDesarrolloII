import { type ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiLogOut, FiUsers, FiUserPlus, FiHome, FiMenu, FiX, FiDollarSign, FiTrendingDown, FiAlertTriangle, FiUserCheck } from 'react-icons/fi';

interface LayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof FiHome;
}

const NAV_POR_ROL: Record<string, NavItem[]> = {
  ADMINISTRADOR: [
    { to: '/admin', label: 'Usuarios del sistema', icon: FiUsers },
    { to: '/gestion-clientes', label: 'Clientes (Mensual/Diario/EPS)', icon: FiUserPlus },
    { to: '/registrar-pago', label: 'Registrar Pago', icon: FiDollarSign },
    { to: '/gastos-operativos', label: 'Gastos Operativos', icon: FiTrendingDown },
    { to: '/contratos-vencidos', label: 'Contratos Vencidos', icon: FiAlertTriangle },
    { to: '/solicitudes-plus', label: 'Solicitudes Plus', icon: FiUserCheck },
  ],
  SECRETARIA: [
    { to: '/secretaria', label: 'Inicio', icon: FiHome },
    { to: '/gestion-clientes', label: 'Clientes (Mensual/Diario/EPS)', icon: FiUserPlus },
    { to: '/registrar-pago', label: 'Registrar Pago', icon: FiDollarSign },
  ],
  ENTRENADOR: [{ to: '/entrenador', label: 'Inicio', icon: FiHome }],
  CLIENTE: [{ to: '/cliente', label: 'Inicio', icon: FiHome }],
};

interface UsuarioSesion {
  rol?: string;
  nombreCompleto?: string;
  numeroDocumento?: number;
}

function leerUsuario(): UsuarioSesion | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as UsuarioSesion;
  } catch {
    return null;
  }
}

export default function Layout({ children, title, description }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = leerUsuario();

  // Cierra el menú móvil al navegar (NavLink ya cambia la ruta).
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = import.meta.env.BASE_URL;
  };

  // Al navegar, cerrar el menú móvil: se hace en el enlace mismo.
  const cerrarMenu = () => setMobileMenuOpen(false);

  const items = NAV_POR_ROL[user?.rol ?? ''] ?? [];

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
      {/* En móvil es fixed (se desliza sobre el contenido); en md pasa a ocupar
          su propio espacio en el flujo, por eso el main no lleva margen: el
          aside ya lo aporta como item del flex. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-slate-900 text-white flex flex-col transform transition-transform duration-200 md:relative ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 bg-slate-950">
          <h2 className="text-2xl font-bold text-center">Victus CAF</h2>
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-slate-200 hover:bg-slate-800 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-white"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <FiX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Navegación principal" className="flex-1 p-4 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={cerrarMenu}
              className={({ isActive }) =>
                `flex items-center space-x-2 rounded p-2 transition [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-white ${
                  isActive
                    ? 'bg-slate-800 font-semibold text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <p className="text-sm text-slate-400">Sesión iniciada como:</p>
          <p className="font-semibold truncate">{user?.nombreCompleto || 'Usuario'}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 transition [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="menu-navegacion"
              aria-label="Abrir menú"
            >
              <FiMenu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-800 truncate">{title}</h1>
              {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition rounded-md px-2 py-1 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
          >
            <FiLogOut aria-hidden="true" /> <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:rounded focus:shadow focus:text-blue-700"
          >
            Saltar al contenido
          </a>
          <div id="contenido">{children}</div>
        </div>
      </main>
    </div>
  );
}
