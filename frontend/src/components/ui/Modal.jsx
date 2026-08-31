import { useEffect } from "react";
import { XIcon } from "../icons";

export default function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    // Scroll the whole overlay when the dialog is taller than the viewport
    // (small screens / long forms) - otherwise the bottom of the form and its
    // buttons become unreachable.
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`w-full ${width} rounded-card bg-white shadow-xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-ink-muted hover:bg-canvas"
              aria-label="Close"
            >
              <XIcon size={18} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
