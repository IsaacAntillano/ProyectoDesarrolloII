import { Component, type ReactNode } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Evita la pantalla en blanco ante un fallo de render: muestra un mensaje
 * y permite recargar. La sesión no se toca.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Error de la interfaz:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
          <FiAlertTriangle className="h-10 w-10 text-red-500" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-gray-900">Algo salió mal</h1>
          <p className="text-sm text-gray-600">
            Ocurrió un error inesperado al mostrar esta pantalla. Tus datos están a salvo en el
            servidor.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 [&:focus-visible]:ring-offset-2"
          >
            Recargar la página
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
