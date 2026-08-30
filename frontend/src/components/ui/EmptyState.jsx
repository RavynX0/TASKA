export default function EmptyState({ icon, illustration, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border-soft bg-white/50 px-6 py-12 text-center">
      {illustration ? (
        <div className="mb-4">{illustration}</div>
      ) : (
        icon && <div className="mb-4 text-ink-faint">{icon}</div>
      )}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
