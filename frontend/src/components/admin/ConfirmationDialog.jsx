import { useEffect, useId, useRef } from "react";
import { Button } from "./AdminFields";

export default function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const dialogId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="admin-confirm-dialog"
      aria-labelledby={`${dialogId}-title`}
      aria-describedby={`${dialogId}-message`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section className="admin-confirm-dialog__panel">
        <div className="admin-confirm-dialog__icon" aria-hidden="true">!</div>
        <div className="admin-confirm-dialog__content">
          <h2 id={`${dialogId}-title`}>{title}</h2>
          <p id={`${dialogId}-message`}>{message}</p>
        </div>
        <div className="admin-confirm-dialog__actions">
          <Button type="button" variant="secondary" disabled={busy} autoFocus onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="danger" disabled={busy} onClick={onConfirm}>
            {busy ? "Working..." : confirmLabel}
          </Button>
        </div>
      </section>
    </dialog>
  );
}
