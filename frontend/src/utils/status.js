// PENDING -> DOING -> DONE is the product's mental model. The stored/API
// values stay pending/in_progress/completed (matching the existing DB enum
// and endpoints) - only the displayed wording changes.
export const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "Doing" },
  { value: "completed", label: "Done" },
];

export const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));
