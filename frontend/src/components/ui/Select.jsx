import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, CheckIcon } from "../icons";

// Minimal on-theme dropdown - same surface, radius and shadow as the rest of
// Taska, so it never drops to the raw OS <select> list. Keyboard accessible:
// Enter/Space/ArrowDown opens, arrows move, Enter selects, Esc closes.
//
// variant "pill"  -> compact rounded-full trigger (filter bars)
// variant "field" -> full-width control matching the form inputs
export default function Select({
  value,
  onChange,
  options,
  variant = "pill",
  disabled = false,
  placeholder = "",
  className = "",
  "aria-label": ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);

  const match = options.find((o) => o.value === value);
  // With a placeholder, an unmatched value stays unselected (required fields);
  // without one, fall back to the first option (filter pills always have a value).
  const selected = match || (placeholder ? null : options[0]);
  const isField = variant === "field";

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, options, value]);

  function pick(v) {
    setOpen(false);
    if (v !== value) onChange(v);
  }

  function onKeyDown(e) {
    if (disabled) return;
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(options[active].value);
    }
  }

  const triggerBase =
    "items-center gap-2 border border-border-soft bg-white text-sm text-ink outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:border-primary aria-expanded:border-primary";
  const triggerShape = isField
    ? "flex h-11 w-full justify-between rounded-control px-3.5 text-[15px]"
    : "inline-flex h-10 rounded-full px-4 font-medium hover:bg-canvas";

  return (
    <div ref={ref} className={`relative ${isField ? "w-full" : ""} ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={`${triggerBase} ${triggerShape}`}
      >
        <span className={`truncate ${selected ? "" : "text-ink-faint"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon
          size={14}
          className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute left-0 z-30 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-border-soft bg-white py-1 shadow-lg ${
            isField ? "w-full" : "w-max min-w-full"
          }`}
        >
          {options.map((opt, i) => (
            <li key={String(opt.value)} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(opt.value)}
                className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm ${
                  i === active ? "bg-canvas text-ink" : "text-ink"
                }`}
              >
                {opt.label}
                {opt.value === value && <CheckIcon size={14} className="shrink-0 text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
