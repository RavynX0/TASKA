export default function Spinner({ size = 24, className = "" }) {
  return (
    <div
      className={`rounded-full border-2 border-border-soft border-t-primary animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[40vh] w-full items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}
