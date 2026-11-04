import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'gray';

const TONES: Record<Tone, string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
};

interface StatusBadgeProps {
  tone?: Tone;
  icon?: IconType;
  children: ReactNode;
}

/** Etiqueta de estado con tono semántico (activo, pendiente, vencido...). */
export default function StatusBadge({ tone = 'gray', icon: Icon, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}
