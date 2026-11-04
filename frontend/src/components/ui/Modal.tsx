import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  /** Controlado por el padre: `true` muestra el modal. */
  open: boolean;
  onClose: () => void;
  title: string;
  /** Descripción corta para lectores de pantalla; opcional si el cuerpo ya la contiene. */
  describedBy?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Ancho del panel. */
  size?: 'sm' | 'md' | 'lg';
  /** Cierra al pulsar el fondo. Por defecto `true`. */
  dismissOnBackdropClick?: boolean;
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

/**
 * Diálogo accesible basado en `<dialog>` + `showModal()`.
 *
 * Da gratis: foco atrapado, cierre con Escape, fondo inert y `::backdrop`.
 * Además guarda el foco al abrir y lo restaura al cerrar.
 */
const Modal = forwardRef<HTMLDialogElement, ModalProps>(function Modal(
  { open, onClose, title, describedBy, children, footer, size = 'md', dismissOnBackdropClick = true },
  ref
) {
  const internalRef = useRef<HTMLDialogElement | null>(null);
  const tituloId = useId();
  const ultimoFoco = useRef<HTMLElement | null>(null);

  // Une el ref externo con el interno.
  const setRefs = (el: HTMLDialogElement | null) => {
    internalRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as { current: HTMLDialogElement | null }).current = el;
  };

  useEffect(() => {
    const dialog = internalRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      ultimoFoco.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      // Foco al primer campo o al propio panel para lectores de pantalla.
      const foco = dialog.querySelector<HTMLElement>(
        'input, select, textarea, button:not([data-modal-close])'
      );
      (foco ?? dialog).focus({ preventScroll: true });
    } else if (!open && dialog.open) {
      dialog.close();
      ultimoFoco.current?.focus?.({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => {
    const dialog = internalRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (!dismissOnBackdropClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dentro =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!dentro) onClose();
  };

  return (
    <dialog
      ref={setRefs}
      onClick={handleBackdropClick}
      aria-labelledby={tituloId}
      aria-describedby={describedBy}
      className={`rounded-lg p-0 shadow-xl backdrop:bg-black/40 w-[calc(100vw-2rem)] ${SIZES[size]}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
        <h3 id={tituloId} className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          data-modal-close
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
        >
          <FiX className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-4 px-5 py-4 text-sm text-gray-700">{children}</div>
      {footer && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-5 py-4">{footer}</div>
      )}
    </dialog>
  );
});

export default Modal;
