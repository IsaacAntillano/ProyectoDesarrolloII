import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearBeneficiarioEps, type BeneficiarioEpsDTO, getApiErrorMessage } from '../services/clienteService';
import Layout from '../components/Layout';
import DocumentTypeBar from '../components/DocumentTypeBar';
import toast from 'react-hot-toast';

export default function RegistrarClienteEps() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BeneficiarioEpsDTO>({
    tipoDeDocumento: 'CC',
    numeroDeDocumento: 0,
    nombreCompleto: '',
    fechaDeNacimiento: '',
    telefono: 0,
    correoElectronico: '',
    contrasena: '',
    tieneEntrenadorPermanente: false,
    fechaFin: '',
    sesionesAutorizadas: 10,
    medicoRemitente: '',
    entidadEps: '',
    diagnostico: '',
    zonaCuerpoTratar: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'numeroDeDocumento' || name === 'telefono' || name === 'sesionesAutorizadas'
          ? Number(value)
          : type === 'checkbox'
            ? checked
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await crearBeneficiarioEps(formData);
      toast.success('Beneficiario EPS registrado');
      navigate('/gestion-clientes');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al registrar beneficiario'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Registrar Beneficiario EPS">
      <div className="bg-white p-8 rounded-lg shadow-sm border max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento</label>
            <DocumentTypeBar
              value={formData.tipoDeDocumento}
              onChange={(v) => setFormData((p) => ({ ...p, tipoDeDocumento: v }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Número Documento</label>
            <input
              type="number"
              name="numeroDeDocumento"
              value={formData.numeroDeDocumento || ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Nombre Completo</label>
            <input
              type="text"
              name="nombreCompleto"
              value={formData.nombreCompleto}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha Nacimiento</label>
            <input type="date" name="fechaDeNacimiento" value={formData.fechaDeNacimiento} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input type="number" name="telefono" value={formData.telefono || ''} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Correo</label>
            <input type="email" name="correoElectronico" value={formData.correoElectronico} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input type="password" name="contrasena" value={formData.contrasena} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Entidad EPS</label>
            <input type="text" name="entidadEps" value={formData.entidadEps} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Médico remitente</label>
            <input type="text" name="medicoRemitente" value={formData.medicoRemitente} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sesiones autorizadas</label>
            <input type="number" name="sesionesAutorizadas" value={formData.sesionesAutorizadas} onChange={handleChange} required min={1} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha fin remisión</label>
            <input type="date" name="fechaFin" value={formData.fechaFin} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Diagnóstico</label>
            <input type="text" name="diagnostico" value={formData.diagnostico} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Zona a tratar</label>
            <input type="text" name="zonaCuerpoTratar" value={formData.zonaCuerpoTratar} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="tieneEntrenadorPermanente" checked={!!formData.tieneEntrenadorPermanente} onChange={handleChange} />
              Tiene entrenador permanente
            </label>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded-md">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md">
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
