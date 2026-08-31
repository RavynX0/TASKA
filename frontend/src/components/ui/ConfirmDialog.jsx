import Modal from "./Modal";
import Button from "./Button";

// Small yes/no confirmation built on the shared Modal. Use for actions the user
// might trigger by accident (logging out, deleting, discarding).
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      {message && <p className="text-sm text-ink-muted">{message}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          className={destructive ? "bg-red-500 hover:bg-red-600" : ""}
          onClick={() => {
            onClose();
            onConfirm();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
