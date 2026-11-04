import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Encabezado de página consistente: título, descripción y acciones a la derecha. */
export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-gray-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
