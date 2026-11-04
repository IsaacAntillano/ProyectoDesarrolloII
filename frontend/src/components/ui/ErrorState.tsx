import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Error con acción de reintento (no obliga a recargar la página). */
export default function ErrorState({
  message,
  onRetry,
  retryLabel = 'Reintentar',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-4 sm:flex-row sm:items-center"
    >
      <FiAlertTriangle className="h-6 w-6 shrink-0 text-red-500" aria-hidden="true" />
      <p className="flex-1 text-sm text-red-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-red-500"
        >
          <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
