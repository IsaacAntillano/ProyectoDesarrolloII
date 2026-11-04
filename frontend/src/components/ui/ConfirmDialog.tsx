import type { ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  /** Consecuencia de la acción, en lenguaje claro. */
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

/**
 * Confirmación accesible que reemplaza a `window.confirm`.
 * Explica qué va a pasar y exige un clic consciente en el botón de acción.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={() => void onConfirm()} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-gray-700">{message}</div>
    </Modal>
  );
}
