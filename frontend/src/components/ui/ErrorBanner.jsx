export default function ErrorBanner({ message, className = "" }) {
  if (!message) return null;
  return (
    <div
      className={`rounded-control border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 ${className}`}
    >
      {message}
    </div>
  );
}
