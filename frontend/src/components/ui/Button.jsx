const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed shadow-sm",
  outline:
    "bg-white text-ink border border-border-soft hover:bg-canvas disabled:opacity-60",
  ghost: "bg-transparent text-ink-muted hover:bg-canvas",
  dark: "bg-surface-dark text-white hover:bg-black disabled:opacity-60",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  children,
  disabled,
  ...rest
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  );
}
