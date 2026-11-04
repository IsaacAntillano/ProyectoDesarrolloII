interface LoadingStateProps {
  /** Texto anunciado a lectores de pantalla. */
  message?: string;
  /** Número de filas simuladas en tablas. */
  filas?: number;
}

/** Indicador de carga con esqueleto y texto accesible. */
export default function LoadingState({ message = 'Cargando...', filas = 3 }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{message}</span>
      <div aria-hidden="true" className="space-y-2">
        {Array.from({ length: filas }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
