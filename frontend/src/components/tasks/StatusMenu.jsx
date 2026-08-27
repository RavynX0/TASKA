import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, CheckIcon } from "../icons";
import { STATUS_OPTIONS, STATUS_LABEL } from "../../utils/status";

const DOT_STYLES = {
  pending: "bg-gray-400",
  in_progress: "bg-primary",
  completed: "bg-green-500",
};

const TRIGGER_STYLES = {
  pending: "bg-gray-100 text-gray-600",
  in_progress: "bg-primary-soft text-primary",
  completed: "bg-green-50 text-green-600",
};

export default function StatusMenu({ status, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${TRIGGER_STYLES[status]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[status]}`} />
        {STATUS_LABEL[status] || status}
        <ChevronDownIcon size={13} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-36 overflow-hidden rounded-xl border border-border-soft bg-white py-1 shadow-lg">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setOpen(false);
                if (opt.value !== status) onChange(opt.value);
              }}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm text-ink hover:bg-canvas"
            >
              <span className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[opt.value]}`} />
                {opt.label}
              </span>
              {opt.value === status && <CheckIcon size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
