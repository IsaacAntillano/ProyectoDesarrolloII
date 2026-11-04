import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearBeneficiarioEps, type BeneficiarioEpsDTO, getApiErrorMessage } from '../services/clienteService';
import Layout from '../components/Layout';
import DocumentTypeBar from '../components/DocumentTypeBar';
import { Field, Input, PasswordInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import HelpTip from '../components/ui/HelpTip';
import toast from 'react-hot-toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(form: BeneficiarioEpsDTO): Record<string, string> {
  const errores: Record<string, string> = {};
  if (!['CC', 'TI', 'CE'].includes(form.tipoDeDocumento)) errores.tipoDeDocumento = 'Elige un tipo de documento';
  if (!form.numeroDeDocumento || form.numeroDeDocumento <= 0) errores.numeroDeDocumento = 'Debe ser un número positivo';
  if (!form.nombreCompleto.trim()) errores.nombreCompleto = 'El nombre es obligatorio';
  if (!form.fechaDeNacimiento) errores.fechaDeNacimiento = 'La fecha de nacimiento es obligatoria';
  else if (form.fechaDeNacimiento > new Date().toISOString().slice(0, 10)) errores.fechaDeNacimiento = 'No puede ser una fecha futura';
  if (!form.telefono || form.telefono <= 0) errores.telefono = 'Debe ser un número positivo';
  if (form.correoElectronico && !EMAIL_RE.test(form.correoElectronico)) errores.correoElectronico = 'Ingresa un correo válido';
  if (!form.entidadEps.trim()) errores.entidadEps = 'La entidad EPS es obligatoria';
  if (!form.medicoRemitente.trim()) errores.medicoRemitente = 'El médico remitente es obligatorio';
  if (!form.sesionesAutorizadas || form.sesionesAutorizadas < 1) errores.sesionesAutorizadas = 'Debe ser al menos 1 sesión';
  if (!form.fechaFin) errores.fechaFin = 'La fecha de fin de la remisión es obligatoria';
  else if (form.fechaFin < new Date().toISOString().slice(0, 10)) errores.fechaFin = 'No puede ser una fecha pasada';
  if (!form.diagnostico.trim()) errores.diagnostico = 'El diagnóstico es obligatorio';
  if (!form.zonaCuerpoTratar.trim()) errores.zonaCuerpoTratar = 'La zona a tratar es obligatoria';
  return errores;
}

export default function RegistrarClienteEps() {
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

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

  const actualizar = <K extends keyof BeneficiarioEpsDTO>(campo: K, valor: BeneficiarioEpsDTO[K]) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fallos = validar(formData);
    if (Object.values(fallos).some(Boolean)) {
      setErrores(fallos);
      toast.error('Revisa los campos marcados en rojo');
      return;
    }
    setGuardando(true);
    try {
      await crearBeneficiarioEps(formData);
      toast.success(`${formData.nombreCompleto} registrado con remisión EPS`);
      navigate('/gestion-clientes');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar el beneficiario'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout title="Registrar Beneficiario EPS" description="Se crea la remisión con las sesiones autorizadas y la zona a tratar">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-800">Formulario de registro</h2>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
          >
            ← Volver
          </button>
        </div>

        <HelpTip title="¿Qué es la remisión EPS?">
          <p>
            Es la orden de la EPS con el médico remitente, las sesiones autorizadas, la zona del
            cuerpo a tratar y la fecha de fin. Si marcas "tiene entrenador permanente", el
            beneficiario queda habilitado para horarios con un entrenador asignado.
          </p>
        </HelpTip>

        <form onSubmit={handleSubmit} noValidate className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Tipo de documento" htmlFor="tipo-doc" required error={errores.tipoDeDocumento}>
            <DocumentTypeBar
              id="tipo-doc"
              value={formData.tipoDeDocumento}
              onChange={(v) => actualizar('tipoDeDocumento', v)}
            />
          </Field>

          <Field label="Número de documento" htmlFor="num-doc" required help="Solo números, sin puntos ni espacios" error={errores.numeroDeDocumento}>
            <Input
              id="num-doc"
              type="number"
              inputMode="numeric"
              min={1}
              value={formData.numeroDeDocumento || ''}
              onChange={(e) => actualizar('numeroDeDocumento', Number(e.target.value))}
              required
              error={!!errores.numeroDeDocumento}
            />
          </Field>

          <Field label="Nombre completo" htmlFor="nombre" required className="md:col-span-2" error={errores.nombreCompleto}>
            <Input
              id="nombre"
              type="text"
              autoComplete="name"
              value={formData.nombreCompleto}
              onChange={(e) => actualizar('nombreCompleto', e.target.value)}
              required
              error={!!errores.nombreCompleto}
            />
          </Field>

          <Field label="Fecha de nacimiento" htmlFor="nacimiento" required error={errores.fechaDeNacimiento}>
            <Input
              id="nacimiento"
              type="date"
              value={formData.fechaDeNacimiento}
              onChange={(e) => actualizar('fechaDeNacimiento', e.target.value)}
              required
              error={!!errores.fechaDeNacimiento}
            />
          </Field>

          <Field label="Teléfono" htmlFor="telefono" required help="Solo números" error={errores.telefono}>
            <Input
              id="telefono"
              type="tel"
              inputMode="numeric"
              min={1}
              value={formData.telefono || ''}
              onChange={(e) => actualizar('telefono', Number(e.target.value))}
              required
              error={!!errores.telefono}
            />
          </Field>

          <Field label="Correo electrónico" htmlFor="correo" required error={errores.correoElectronico}>
            <Input
              id="correo"
              type="email"
              autoComplete="email"
              value={formData.correoElectronico}
              onChange={(e) => actualizar('correoElectronico', e.target.value)}
              required
              error={!!errores.correoElectronico}
            />
          </Field>

          <Field label="Contraseña" htmlFor="contrasena" required help="Mínimo 6 caracteres. La usará para ingresar al portal del cliente." error={errores.contrasena}>
            <PasswordInput
              id="contrasena"
              autoComplete="new-password"
              value={formData.contrasena}
              onChange={(e) => actualizar('contrasena', e.target.value)}
              required
              error={!!errores.contrasena}
            />
          </Field>

          <Field label="Entidad EPS" htmlFor="eps" required error={errores.entidadEps}>
            <Input
              id="eps"
              type="text"
              value={formData.entidadEps}
              onChange={(e) => actualizar('entidadEps', e.target.value)}
              required
              error={!!errores.entidadEps}
            />
          </Field>

          <Field label="Médico remitente" htmlFor="medico" required error={errores.medicoRemitente}>
            <Input
              id="medico"
              type="text"
              value={formData.medicoRemitente}
              onChange={(e) => actualizar('medicoRemitente', e.target.value)}
              required
              error={!!errores.medicoRemitente}
            />
          </Field>

          <Field label="Sesiones autorizadas" htmlFor="sesiones" required help="Cuántas sesiones cubre la remisión" error={errores.sesionesAutorizadas}>
            <Input
              id="sesiones"
              type="number"
              inputMode="numeric"
              min={1}
              value={formData.sesionesAutorizadas || ''}
              onChange={(e) => actualizar('sesionesAutorizadas', Number(e.target.value))}
              required
              error={!!errores.sesionesAutorizadas}
            />
          </Field>

          <Field label="Fecha de fin de la remisión" htmlFor="fecha-fin" required error={errores.fechaFin}>
            <Input
              id="fecha-fin"
              type="date"
              value={formData.fechaFin}
              onChange={(e) => actualizar('fechaFin', e.target.value)}
              required
              error={!!errores.fechaFin}
            />
          </Field>

          <Field label="Diagnóstico" htmlFor="diagnostico" required className="md:col-span-2" error={errores.diagnostico}>
            <Input
              id="diagnostico"
              type="text"
              value={formData.diagnostico}
              onChange={(e) => actualizar('diagnostico', e.target.value)}
              required
              error={!!errores.diagnostico}
            />
          </Field>

          <Field label="Zona del cuerpo a tratar" htmlFor="zona" required className="md:col-span-2" error={errores.zonaCuerpoTratar}>
            <Input
              id="zona"
              type="text"
              value={formData.zonaCuerpoTratar}
              onChange={(e) => actualizar('zonaCuerpoTratar', e.target.value)}
              required
              error={!!errores.zonaCuerpoTratar}
            />
          </Field>

          <div className="md:col-span-2">
            <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!formData.tieneEntrenadorPermanente}
                onChange={(e) => actualizar('tieneEntrenadorPermanente', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <span>
                Tiene entrenador permanente
                <span className="block text-xs text-gray-500">
                  Habilita al beneficiario para ver y reservar horarios con un entrenador asignado.
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 md:col-span-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" loading={guardando}>
              {guardando ? 'Registrando...' : 'Registrar beneficiario'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
