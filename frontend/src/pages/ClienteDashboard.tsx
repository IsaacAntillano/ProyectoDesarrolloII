import Layout from '../components/Layout';

export default function ClienteDashboard() {
  return (
    <Layout title="Mi Panel - Victus CAF">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Bienvenido a Victus CAF</h2>
        <p className="text-gray-600">Aquí podrás ver tu progreso, rutinas asignadas y el estado de tu membresía.</p>
      </div>
    </Layout>
  );
}