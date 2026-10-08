import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SeleccionarRol from './pages/SeleccionarRol';
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
import { Toaster } from 'react-hot-toast';

function App() {
  const basename = import.meta.env.BASE_URL;

  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/seleccionar-rol" element={<SeleccionarRol />} />
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
    </>
  );
}

export default App;