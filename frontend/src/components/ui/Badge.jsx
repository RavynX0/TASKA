const PRIORITY_STYLES = {
  high: "bg-red-50 text-red-500",
  medium: "bg-gray-100 text-gray-500",
  low: "bg-gray-100 text-gray-500",
};

const PRIORITY_LABEL = { high: "High", medium: "Med", low: "Low" };

const STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-500",
  in_progress: "bg-primary-soft text-primary",
  completed: "bg-green-50 text-green-600",
};

const STATUS_LABEL = { pending: "Pending", in_progress: "In progress", completed: "Done" };

export function PriorityBadge({ priority, className = "" }) {
  if (!priority) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[priority]} ${className}`}
    >
      {PRIORITY_LABEL[priority] || priority}
    </span>
  );
}

export function StatusBadge({ status, className = "" }) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]} ${className}`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export function Pill({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-ink-muted ${className}`}
    >
      {children}
    </span>
  );
}
