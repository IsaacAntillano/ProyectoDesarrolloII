import Layout from '../components/Layout';

export default function EntrenadorDashboard() {
  return (
    <Layout title="Panel de Entrenador">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Bienvenido</h2>
        <p className="text-gray-600">Aquí podrás visualizar tus clientes asignados, crear rutinas y hacer seguimiento físico.</p>
        
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-gray-500 italic">No hay clientes asignados recientemente.</p>
        </div>
      </div>
    </Layout>
  );
}