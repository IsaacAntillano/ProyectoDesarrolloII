import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { FiLoader } from 'react-icons/fi';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  success: 'bg-green-600 text-white hover:bg-green-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
};

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Muestra un spinner y deshabilita el botón mientras termina la acción. */
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const deshabilitado = disabled || loading;
  return (
    <button
      type={type}
      disabled={deshabilitado}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 [&:focus-visible]:ring-offset-1 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading && <FiLoader className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
