import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { FiInbox } from 'react-icons/fi';

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: IconType;
  action?: ReactNode;
}

/** Estado vacío con siguiente paso sugerido (no solo "sin datos"). */
export default function EmptyState({
  title = 'Nada por aquí todavía',
  message,
  icon: Icon = FiInbox,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <Icon className="h-8 w-8 text-gray-400" aria-hidden="true" />
      <p className="font-medium text-gray-800">{title}</p>
      <p className="max-w-sm text-sm text-gray-500">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
