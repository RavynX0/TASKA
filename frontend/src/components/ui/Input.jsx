export default function Input({
  label,
  error,
  icon,
  endAdornment,
  labelAction,
  className = "",
  id,
  ...rest
}) {
  const inputId = id || rest.name;
  return (
    <div className={className}>
      {(label || labelAction) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <label htmlFor={inputId} className="block text-sm font-medium text-ink">
              {label}
            </label>
          )}
          {labelAction}
        </div>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`h-11 w-full rounded-control border border-border-soft bg-white text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-primary ${
            icon ? "pl-10" : "px-3.5"
          } ${icon && !endAdornment ? "pr-3.5" : ""} ${endAdornment ? "pr-10" : ""} ${
            error ? "border-red-400" : ""
          }`}
          {...rest}
        />
        {endAdornment && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
            {endAdornment}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
