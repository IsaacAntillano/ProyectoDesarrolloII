import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearClienteMensual, type ClienteMensualDTO, getApiErrorMessage } from '../services/clienteService';
import Layout from '../components/Layout';
import DocumentTypeBar from '../components/DocumentTypeBar';
import toast from 'react-hot-toast';

export default function RegistrarClienteMensual() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<ClienteMensualDTO>({
    tipoDeDocumento: 'CC',
    numeroDeDocumento: 0,
    nombreCompleto: '',
    fechaDeNacimiento: '',
    telefono: 0,
    correoElectronico: '',
    contrasena: '',
    tipoMembresia: 'MENSUAL'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numeroDeDocumento' || name === 'telefono' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.numeroDeDocumento <= 0) {
      toast.error('El número de documento debe ser positivo');
      return;
    }
    
    setLoading(true);
    try {
      await crearClienteMensual(formData);
      toast.success('Cliente creado exitosamente');
      navigate('/gestion-clientes');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al crear el cliente'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Registrar Cliente Mensual">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Formulario de Registro</h2>
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            &larr; Volver
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento</label>
            <DocumentTypeBar
              value={formData.tipoDeDocumento}
              onChange={(v) => setFormData((p) => ({ ...p, tipoDeDocumento: v }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número Documento</label>
            <input 
              type="number" 
              name="numeroDeDocumento" 
              value={formData.numeroDeDocumento || ''} 
              onChange={handleChange} 
              required min="1" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              name="nombreCompleto" 
              value={formData.nombreCompleto} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
            <input 
              type="date" 
              name="fechaDeNacimiento" 
              value={formData.fechaDeNacimiento} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input 
              type="number" 
              name="telefono" 
              value={formData.telefono || ''} 
              onChange={handleChange} 
              required min="1" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              name="correoElectronico" 
              value={formData.correoElectronico} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              name="contrasena" 
              value={formData.contrasena} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Membresía</label>
            <select 
              name="tipoMembresia" 
              value={formData.tipoMembresia} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="MENSUAL">Mensual</option>
              <option value="TRIMESTRAL">Trimestral</option>
              <option value="SEMESTRAL">Semestral</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>
          
          <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={loading} 
              className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
            >
              {loading ? 'Registrando...' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
