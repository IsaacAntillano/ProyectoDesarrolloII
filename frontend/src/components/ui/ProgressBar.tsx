import { useId } from 'react';

/** Barra de progreso accesible para cupos, sesiones EPS y similares. */
interface ProgressBarProps {
  /** Valor actual (0..max). */
  value: number;
  max: number;
  label?: string;
  tone?: 'blue' | 'green' | 'amber' | 'red';
}

const TONES = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
} as const;

export default function ProgressBar({ value, max, label, tone = 'blue' }: ProgressBarProps) {
  const id = useId();
  const porcentaje = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div>
      {label && (
        <div id={id} className="mb-1 flex items-center justify-between text-xs text-gray-600">
          <span>{label}</span>
          <span className="font-semibold text-gray-800">
            {value}/{max}
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} de ${max}`}
        aria-labelledby={label ? id : undefined}
        className="h-2 overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className={`h-full rounded-full transition-[width] ${TONES[tone]}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}
