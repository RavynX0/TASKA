// Small, on-brand spot illustrations for empty states. Inline SVG so they stay
// crisp, weigh nothing, and pick up the Taska palette (orange #F0632C + soft
// neutrals). ~150x130, friendly and rounded to match the rest of the UI.

const ORANGE = "#F0632C";
const ORANGE_SOFT = "#FDE9E0";
const LINE = "#E4E0DB";
const INK = "#8A857D";

function Frame({ children }) {
  return (
    <svg width="152" height="132" viewBox="0 0 152 132" fill="none" aria-hidden="true">
      <ellipse cx="76" cy="118" rx="52" ry="8" fill={ORANGE} opacity="0.08" />
      {children}
    </svg>
  );
}

// "No tasks yet" - a clipboard with a fresh checkmark floating in.
export function TasksEmpty() {
  return (
    <Frame>
      <rect x="40" y="20" width="72" height="88" rx="10" fill="#fff" stroke={LINE} strokeWidth="2.5" />
      <rect x="60" y="12" width="32" height="16" rx="5" fill={ORANGE_SOFT} stroke={ORANGE} strokeWidth="2.5" />
      <path d="M52 46h34M52 60h34M52 74h22" stroke={INK} strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <circle cx="112" cy="44" r="18" fill={ORANGE} />
      <path d="M105 44.5l5 5 9-10.5" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 30l3.5 3.5M124 92l3.5 3.5M34 96l-4 4" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </Frame>
  );
}

// "All caught up" - a calm sun with soft rays.
export function AllClearEmpty() {
  return (
    <Frame>
      <path
        d="M44 96c0-17.7 14.3-32 32-32s32 14.3 32 32"
        fill={ORANGE_SOFT}
        stroke={ORANGE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="76" cy="64" r="16" fill={ORANGE} />
      <path
        d="M76 30v10M76 88v6M42 64h10M100 64h10M52 40l7 7M100 40l-7 7"
        stroke={ORANGE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M60 100h32M66 108h20" stroke={INK} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    </Frame>
  );
}

// "Nothing scheduled" - a calendar with a small star.
export function CalendarEmpty() {
  return (
    <Frame>
      <rect x="34" y="26" width="84" height="76" rx="10" fill="#fff" stroke={LINE} strokeWidth="2.5" />
      <path d="M34 44h84" stroke={LINE} strokeWidth="2.5" />
      <path d="M52 20v12M100 20v12" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" />
      <rect x="46" y="54" width="14" height="14" rx="3" fill={ORANGE_SOFT} />
      <rect x="69" y="54" width="14" height="14" rx="3" fill={ORANGE_SOFT} />
      <rect x="92" y="54" width="14" height="14" rx="3" fill={ORANGE_SOFT} />
      <rect x="46" y="76" width="14" height="14" rx="3" fill={ORANGE_SOFT} />
      <path
        d="M92 78l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L92 78z"
        fill={ORANGE}
      />
    </Frame>
  );
}

// "No matches" - a magnifying glass over scattered dots.
export function SearchEmpty() {
  return (
    <Frame>
      <circle cx="66" cy="58" r="30" fill="#fff" stroke={LINE} strokeWidth="2.5" />
      <circle cx="66" cy="58" r="18" fill={ORANGE_SOFT} />
      <path d="M88 80l18 18" stroke={ORANGE} strokeWidth="6" strokeLinecap="round" />
      <path d="M58 58h16M66 50v16" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="118" cy="40" r="3" fill={ORANGE} opacity="0.5" />
      <circle cx="34" cy="92" r="3" fill={ORANGE} opacity="0.5" />
      <circle cx="112" cy="96" r="3" fill={ORANGE} opacity="0.5" />
    </Frame>
  );
}
