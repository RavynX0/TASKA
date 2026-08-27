import { useState } from "react";

export function LogoMark({ size = 36, className = "" }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl bg-primary font-bold text-white ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.44 }}
      >
        T
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Taska"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      onError={() => setErrored(true)}
    />
  );
}

export default function Logo({
  size = 36,
  subtitle,
  nameClassName = "text-[15px] font-extrabold text-primary",
  subtitleClassName = "text-xs text-ink-muted",
}) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} />
      <div>
        <p className={`leading-tight ${nameClassName}`}>Taska</p>
        {subtitle && <p className={`leading-tight ${subtitleClassName}`}>{subtitle}</p>}
      </div>
    </div>
  );
}
