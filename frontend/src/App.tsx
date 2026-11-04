import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SecretariaDashboard from './pages/SecretariaDashboard';
import EntrenadorDashboard from './pages/EntrenadorDashboard';
import ClienteDashboard from './pages/ClienteDashboard';
import { PrivateRoute } from './components/PrivateRoute';
import RegistrarClienteMensual from './pages/RegistrarClienteMensual';
import RegistrarClienteDiario from './pages/RegistrarClienteDiario';
import RegistrarClienteEps from './pages/RegistrarClienteEps';
import RegistrarPago from './pages/RegistrarPago';
import GestionClientes from './pages/GestionClientes';
import GastosOperativos from './pages/GastosOperativos';
import ContratosVencidos from './pages/ContratosVencidos';
import SolicitudesPlus from './pages/SolicitudesPlus';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ui/ErrorBoundary';

function App() {
  const basename = import.meta.env.BASE_URL;

  return (
    <ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 4000 }}
        containerStyle={{ zIndex: 100 }}
        aria-live="polite"
      />
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['ADMINISTRADOR']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/secretaria"
            element={
              <PrivateRoute allowedRoles={['SECRETARIA']}>
                <SecretariaDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/entrenador"
            element={
              <PrivateRoute allowedRoles={['ENTRENADOR']}>
                <EntrenadorDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/cliente"
            element={
              <PrivateRoute allowedRoles={['CLIENTE']}>
                <ClienteDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/registrar-pago"
            element={
              <PrivateRoute allowedRoles={['ADMINISTRADOR', 'SECRETARIA']}>
                <RegistrarPago />
              </PrivateRoute>
            }
          />
          <Route
            path="/gastos-operativos"
            element={
              <PrivateRoute allowedRoles={['ADMINISTRADOR']}>
                <GastosOperativos />
              </PrivateRoute>
            }
          />
          <Route
            path="/contratos-vencidos"
            element={
              <PrivateRoute allowedRoles={['ADMINISTRADOR']}>
                <ContratosVencidos />
              </PrivateRoute>
            }
          />
          <Route
            path="/solicitudes-plus"
            element={
              <PrivateRoute allowedRoles={['ADMINISTRADOR']}>
                <SolicitudesPlus />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestion-clientes"
            element={
              <PrivateRoute allowedRoles={['ADMINISTRADOR', 'SECRETARIA']}>
                <GestionClientes />
              </PrivateRoute>
            }
          />
          <Route
            path="/registrar-cliente-mensual"
            element={
              <PrivateRoute allowedRoles={['ADMINISTRADOR', 'SECRETARIA']}>
                <RegistrarClienteMensual />
              </PrivateRoute>
            }
          />
          <Route
            path="/registrar-cliente-diario"
            element={
              <PrivateRoute allowedRoles={['ADMINISTRADOR', 'SECRETARIA']}>
                <RegistrarClienteDiario />
              </PrivateRoute>
            }
          />
          <Route
            path="/registrar-cliente-eps"
            element={
              <PrivateRoute allowedRoles={['ADMINISTRADOR', 'SECRETARIA']}>
                <RegistrarClienteEps />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
