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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className={`w-full ${width} rounded-card bg-white p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-muted hover:bg-canvas"
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
