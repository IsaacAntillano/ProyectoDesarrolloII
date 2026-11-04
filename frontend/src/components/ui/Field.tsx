import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cloneElement, isValidElement } from 'react';

/**
 * Campo de formulario con label visible, ayuda y error inline.
 *
 * El padre pasa el mismo `id` al campo y a este componente (`htmlFor`), así
 * el label se enlaza con el control. Si no se pasa, se genera uno.
 */
interface FieldProps {
  label: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, help, error, required, className = '', children }: FieldProps) {
  const fallbackId = useId();
  const id = htmlFor ?? fallbackId;
  const ayudaId = `${id}-ayuda`;
  const errorId = `${id}-error`;

  let control: ReactNode = children;
  if (isValidElement(children)) {
    const describedBy = [help ? ayudaId : null, error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;
    control = cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      id,
      'aria-required': required || undefined,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedBy,
    });
  }

  return (
    <div className={`text-sm ${className}`}>
      <label htmlFor={id} className="block font-medium text-gray-700">
        {label}
        {required && (
          <span className="text-red-600" aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>
      <div className="mt-1">{control}</div>
      {help && !error && (
        <p id={ayudaId} className="mt-1 text-xs text-gray-500">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const BASE =
  'w-full rounded-md border px-3 py-2 text-sm shadow-sm transition disabled:cursor-not-allowed disabled:bg-gray-100 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 [&:focus-visible]:ring-offset-1';

interface ControlProps {
  error?: boolean;
  className?: string;
}

function controlClass(error?: boolean, className = '') {
  return `${BASE} ${error ? 'border-red-400' : 'border-gray-300'} ${className}`;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & ControlProps>(
  function Input({ error, className, ...rest }, ref) {
    return <input ref={ref} className={controlClass(error, className)} {...rest} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & ControlProps>(
  function Select({ error, className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={`${controlClass(error, className)} bg-white`} {...rest}>
        {children}
      </select>
    );
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps
>(function Textarea({ error, className, ...rest }, ref) {
  return <textarea ref={ref} className={controlClass(error, className)} {...rest} />;
});

/** Campo de contraseña con botón mostrar/ocultar. */
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement> & ControlProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-20" />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-pressed={visible}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 rounded-r-md px-3 text-xs font-medium text-gray-500 hover:text-gray-800 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
      >
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  );
}
