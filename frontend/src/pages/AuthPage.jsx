import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import AuthFace from "../components/auth/AuthFace";
import { LogoMark } from "../components/Logo";
import SignUp from "./SignUp";
import SignIn from "./SignIn";

const CLOSE_MS = 900;
const HOLD_MS = 650;
const OPEN_MS = 900;
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

// Real theater curtains: closed, they meet in the middle and hide the stage;
// they swing shut, hold a beat, the scene changes behind them, then they
// swing open again to reveal it. Sign Up and Sign In both stay mounted the
// whole time (so nothing in either form is ever lost) - only which one is on
// display changes, and only during the hold, while nothing is visible to
// swap behind.
export default function AuthPage() {
  const location = useLocation();
  const isSignInTarget = location.pathname === "/login";
  const [shown, setShown] = useState(isSignInTarget);
  const [drawn, setDrawn] = useState(false);
  // Tracks the same thing as `shown`, but read-only and non-reactive: the
  // effect below must NOT re-run when `shown` changes (that change is a
  // side effect of the timer chain itself), only when the route changes.
  // Depending on `shown` would re-run the effect mid-sequence, whose cleanup
  // would cancel the very timer it had just scheduled.
  const shownRef = useRef(shown);
  const timersRef = useRef({});

  useEffect(() => {
    if (isSignInTarget === shownRef.current) return;
    setDrawn(true);
    timersRef.current.close = setTimeout(() => {
      shownRef.current = isSignInTarget;
      setShown(isSignInTarget);
      timersRef.current.open = setTimeout(() => setDrawn(false), HOLD_MS);
    }, CLOSE_MS);
    return () => {
      clearTimeout(timersRef.current.close);
      clearTimeout(timersRef.current.open);
    };
  }, [isSignInTarget]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <div style={{ display: shown ? "none" : "block" }}>
        <AuthFace illustrationSrc="/auth/signup-illustration.png" illustrationAlt="" mirrored={false}>
          <SignUp />
        </AuthFace>
      </div>
      <div style={{ display: shown ? "block" : "none" }}>
        <AuthFace illustrationSrc="/auth/signin-illustration.png" illustrationAlt="" mirrored>
          <SignIn />
        </AuthFace>
      </div>

      <Curtain side="left" drawn={drawn} transitionMs={drawn ? CLOSE_MS : OPEN_MS} />
      <Curtain side="right" drawn={drawn} transitionMs={drawn ? CLOSE_MS : OPEN_MS} />
    </div>
  );
}

function Curtain({ side, drawn, transitionMs }) {
  const isLeft = side === "left";
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 z-50 w-1/2 overflow-hidden ${
        isLeft ? "left-0" : "right-0"
      }`}
      style={{
        transform: drawn ? "translateX(0%)" : `translateX(${isLeft ? "-100%" : "100%"})`,
        transition: `transform ${transitionMs}ms ${EASE}`,
        backgroundColor: "#e6d7b9",
        // Soft, rounded fabric pleats: warm cream highlight fading through a
        // muted brown shadow (never pure black/white, never a hard edge) so
        // each fold reads as draped cloth catching light, not corrugated
        // metal. A faint warm wash top-to-bottom adds depth to the drape.
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.05) 50%, rgba(255,255,255,0.1) 100%)," +
          "repeating-linear-gradient(90deg, rgba(255,250,238,0.65) 0px, rgba(255,250,238,0.15) 10px, rgba(107,78,45,0.16) 19px, rgba(107,78,45,0.32) 24px, rgba(107,78,45,0.16) 29px, rgba(255,250,238,0.15) 38px, rgba(255,250,238,0.65) 48px)",
        boxShadow: isLeft ? "14px 0 28px rgba(60,42,20,0.18)" : "-14px 0 28px rgba(60,42,20,0.18)",
      }}
    >
      {/* Scalloped valance: drapes low at the outer edge, swags up to a peak
          at the inner edge, so the two panels together read as one arch
          meeting at the center - drawn once and mirrored for the right side. */}
      <svg
        viewBox="0 0 200 90"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-24 w-full"
        style={{ transform: isLeft ? "none" : "scaleX(-1)" }}
      >
        <defs>
          <linearGradient id={`valance-${side}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d8ba82" />
            <stop offset="100%" stopColor="#b6924f" />
          </linearGradient>
        </defs>
        <path
          d="M0,0 L200,0 L200,18 C160,22 148,60 108,64 C84,66 84,34 56,34 C30,34 26,58 0,52 Z"
          fill={`url(#valance-${side})`}
        />
        <path
          d="M200,18 C160,22 148,60 108,64 C84,66 84,34 56,34 C30,34 26,58 0,52"
          fill="none"
          stroke="#f0632c"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Inner-edge trim: a thin dark piping line, then a wider orange accent band. */}
      <div className={`absolute inset-y-0 w-[3px] bg-[#2a2320]/70 ${isLeft ? "right-2" : "left-2"}`} />
      <div
        className={`absolute inset-y-0 w-2 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-80 ${
          isLeft ? "right-0" : "left-0"
        }`}
      />

      <div
        className={`absolute inset-y-0 flex w-32 items-center justify-center ${isLeft ? "right-6" : "left-6"}`}
      >
        <LogoMark size={68} />
      </div>

      <Tieback isLeft={isLeft} />
    </div>
  );
}

// A gathered pinch of fabric plus a roped tassel, sitting about two-thirds
// down the inner edge - the spot where a real curtain is cinched back.
function Tieback({ isLeft }) {
  const id = isLeft ? "l" : "r";
  const strands = Array.from({ length: 9 }, (_, i) => -32 + i * 8);
  return (
    <div className={`absolute top-[62%] flex w-36 flex-col items-center ${isLeft ? "right-2" : "left-2"}`}>
      <div
        className="h-24 w-24 rounded-full opacity-80"
        style={{
          background: "radial-gradient(circle, rgba(50,35,16,0.4) 0%, rgba(50,35,16,0) 68%)",
        }}
      />
      <svg viewBox="0 0 120 150" className="-mt-[92px] h-[150px] w-[120px]">
        <defs>
          <linearGradient id={`rope-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4a15c" />
            <stop offset="50%" stopColor="#e07a2e" />
            <stop offset="100%" stopColor="#b85a1d" />
          </linearGradient>
          <linearGradient id={`fringe-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e07a2e" />
            <stop offset="100%" stopColor="#a4531c" />
          </linearGradient>
        </defs>

        {/* Twisted rope loop cinching the fabric */}
        <ellipse cx="60" cy="26" rx="38" ry="14" fill="none" stroke={`url(#rope-${id})`} strokeWidth="8" />
        <ellipse cx="60" cy="26" rx="38" ry="14" fill="none" stroke="#8f4416" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.5" />

        {/* Rope drop down to the tassel head */}
        <path d="M60,38 C60,55 52,58 54,76" fill="none" stroke={`url(#rope-${id})`} strokeWidth="8" strokeLinecap="round" />
        <path d="M60,38 C60,55 52,58 54,76" fill="none" stroke="#8f4416" strokeWidth="1.5" strokeDasharray="2 5" opacity="0.5" />

        {/* Tassel head (the cap the fringe hangs from) */}
        <g transform="translate(54,74)">
          <ellipse cx="0" cy="0" rx="16" ry="10" fill="#e07a2e" />
          <ellipse cx="0" cy="-2" rx="16" ry="9" fill="#f4a15c" />
          <ellipse cx="0" cy="4" rx="13" ry="6" fill="#a4531c" opacity="0.5" />

          {/* Fringe strands */}
          {strands.map((dx, i) => (
            <path
              key={i}
              d={`M${dx * 0.42},4 C${dx * 0.5},30 ${dx * 0.3},45 ${dx * 0.38},60`}
              fill="none"
              stroke={`url(#fringe-${id})`}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          ))}
          <ellipse cx="0" cy="6" rx="14" ry="5" fill="#c9631f" />
        </g>
      </svg>
    </div>
  );
}
