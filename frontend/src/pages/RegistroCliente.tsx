import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUserPlus } from 'react-icons/fi';
import { registroCliente } from '../services/registroService';
import type { ClienteMensualDTO } from '../services/clienteService';
import DocumentTypeBar from '../components/DocumentTypeBar';
import { Field, Input, Select, PasswordInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { getApiErrorMessage } from '../utils/apiError';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MEMBRESIAS: { value: ClienteMensualDTO['tipoMembresia']; label: string }[] = [
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
];

function validar(form: ClienteMensualDTO): Record<string, string> {
  const errores: Record<string, string> = {};
  if (!['CC', 'TI', 'CE'].includes(form.tipoDeDocumento)) errores.tipoDeDocumento = 'Elige un tipo de documento';
  if (!form.numeroDeDocumento || form.numeroDeDocumento <= 0) errores.numeroDeDocumento = 'Debe ser un número positivo';
  if (!form.nombreCompleto.trim()) errores.nombreCompleto = 'El nombre es obligatorio';
  if (!form.fechaDeNacimiento) errores.fechaDeNacimiento = 'La fecha de nacimiento es obligatoria';
  else if (form.fechaDeNacimiento > new Date().toISOString().slice(0, 10)) errores.fechaDeNacimiento = 'No puede ser una fecha futura';
  if (!form.telefono || form.telefono <= 0) errores.telefono = 'Debe ser un número positivo';
  if (!EMAIL_RE.test(form.correoElectronico)) errores.correoElectronico = 'Ingresa un correo válido';
  if (!form.contrasena || form.contrasena.length < 6) errores.contrasena = 'Mínimo 6 caracteres';
  return errores;
}

/**
 * Registro público de cliente particular mensual (CO-0001).
 *
 * <p>Fuera del flujo de PrivateRoute: cualquier persona puede crear su cuenta.
 * El backend genera el contrato con el tipo de membresía elegido y asigna el
 * entrenador del primer mes.
 */
export default function RegistroCliente() {
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ClienteMensualDTO>({
    tipoDeDocumento: 'CC',
    numeroDeDocumento: 0,
    nombreCompleto: '',
    fechaDeNacimiento: '',
    telefono: 0,
    correoElectronico: '',
    contrasena: '',
    tipoMembresia: 'MENSUAL',
  });

  const actualizar = <K extends keyof ClienteMensualDTO>(campo: K, valor: ClienteMensualDTO[K]) => {
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
      await registroCliente(formData);
      toast.success('Cuenta creada. Ya puedes iniciar sesión.');
      navigate('/');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo completar el registro'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <FiUserPlus className="h-6 w-6 text-blue-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crear tu cuenta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Cliente particular mensual · el primer mes incluye entrenador.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Tipo de documento" htmlFor="tipo-doc" required error={errores.tipoDeDocumento}>
              <DocumentTypeBar
                id="tipo-doc"
                value={formData.tipoDeDocumento}
                onChange={(v) => actualizar('tipoDeDocumento', v)}
              />
            </Field>
          </div>
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
          <Field label="Fecha de nacimiento" htmlFor="fecha-nacimiento" required error={errores.fechaDeNacimiento}>
            <Input
              id="fecha-nacimiento"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={formData.fechaDeNacimiento}
              onChange={(e) => actualizar('fechaDeNacimiento', e.target.value)}
              required
              error={!!errores.fechaDeNacimiento}
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
          <Field label="Teléfono" htmlFor="telefono" required help="Solo números" error={errores.telefono}>
            <Input
              id="telefono"
              type="tel"
              inputMode="numeric"
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
          <Field label="Tipo de membresía" htmlFor="tipo-membresia" required>
            <Select
              id="tipo-membresia"
              value={formData.tipoMembresia}
              onChange={(e) => actualizar('tipoMembresia', e.target.value as ClienteMensualDTO['tipoMembresia'])}
              required
            >
              {MEMBRESIAS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Contraseña" htmlFor="contrasena" required help="Mínimo 6 caracteres" error={errores.contrasena}>
            <PasswordInput
              id="contrasena"
              autoComplete="new-password"
              value={formData.contrasena}
              onChange={(e) => actualizar('contrasena', e.target.value)}
              required
              error={!!errores.contrasena}
            />
          </Field>
        </div>

        <Button type="submit" loading={guardando} className="w-full" size="lg">
          {guardando ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/" className="font-medium text-blue-600 hover:text-blue-800">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
