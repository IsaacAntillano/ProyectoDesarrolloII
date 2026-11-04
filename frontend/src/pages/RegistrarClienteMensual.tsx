import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearClienteMensual, type ClienteMensualDTO, getApiErrorMessage } from '../services/clienteService';
import Layout from '../components/Layout';
import DocumentTypeBar from '../components/DocumentTypeBar';
import { Field, Input, Select, PasswordInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import HelpTip from '../components/ui/HelpTip';
import toast from 'react-hot-toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(form: ClienteMensualDTO): Record<string, string> {
  const errores: Record<string, string> = {};
  if (!['CC', 'TI', 'CE'].includes(form.tipoDeDocumento)) errores.tipoDeDocumento = 'Elige un tipo de documento';
  if (!form.numeroDeDocumento || form.numeroDeDocumento <= 0) errores.numeroDeDocumento = 'Debe ser un número positivo';
  if (!form.nombreCompleto.trim()) errores.nombreCompleto = 'El nombre es obligatorio';
  if (!form.fechaDeNacimiento) errores.fechaDeNacimiento = 'La fecha de nacimiento es obligatoria';
  else if (form.fechaDeNacimiento > new Date().toISOString().slice(0, 10)) errores.fechaDeNacimiento = 'No puede ser una fecha futura';
  if (!form.telefono || form.telefono <= 0) errores.telefono = 'Debe ser un número positivo';
  if (!EMAIL_RE.test(form.correoElectronico)) errores.correoElectronico = 'Ingresa un correo válido (ej: nombre@correo.com)';
  if (!form.contrasena || form.contrasena.length < 6) errores.contrasena = 'Mínimo 6 caracteres';
  return errores;
}

export default function RegistrarClienteMensual() {
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
      await crearClienteMensual(formData);
      toast.success(`${formData.nombreCompleto} creado. Se le asignó un entrenador del primer mes.`);
      navigate('/gestion-clientes');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo crear el cliente'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout title="Registrar Cliente Mensual" description="Al registrarse, el cliente recibe un entrenador durante el primer mes">
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

        <HelpTip title="¿Qué pasa al registrar un cliente mensual?">
          <p>
            Se crea su contrato por un mes, se le asigna automáticamente un entrenador durante ese
            primer mes (cupo de 4 clientes por entrenador) y queda habilitado para ingresar al
            gimnasio. Después del primer mes puede solicitar el servicio Plus.
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

          <Field label="Contraseña" htmlFor="contrasena" required help="Mínimo 6 caracteres. El cliente la usará para ingresar." error={errores.contrasena}>
            <PasswordInput
              id="contrasena"
              autoComplete="new-password"
              value={formData.contrasena}
              onChange={(e) => actualizar('contrasena', e.target.value)}
              required
              error={!!errores.contrasena}
            />
          </Field>

          <Field label="Tipo de membresía" htmlFor="membresia" required className="md:col-span-2">
            <Select
              id="membresia"
              value={formData.tipoMembresia}
              onChange={(e) => actualizar('tipoMembresia', e.target.value as ClienteMensualDTO['tipoMembresia'])}
              required
            >
              <option value="MENSUAL">Mensual</option>
              <option value="TRIMESTRAL">Trimestral</option>
              <option value="SEMESTRAL">Semestral</option>
              <option value="ANUAL">Anual</option>
            </Select>
          </Field>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 md:col-span-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" loading={guardando}>
              {guardando ? 'Registrando...' : 'Registrar cliente'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
