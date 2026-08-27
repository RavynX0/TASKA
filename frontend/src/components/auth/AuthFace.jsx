import { Link } from "react-router-dom";
import { LogoMark } from "../Logo";

export default function AuthFace({ illustrationSrc, illustrationAlt, mirrored = false, children }) {
  return (
    <div className="flex h-full min-h-screen w-full bg-canvas">
      <div className={`flex w-full flex-col lg:flex-row ${mirrored ? "lg:flex-row-reverse" : ""}`}>
        <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
          <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-sm">{children}</div>
        </div>
        <div className="hidden w-full flex-col items-center justify-center gap-8 px-16 py-12 lg:flex lg:w-1/2">
          <Link to="/" className="relative flex flex-col items-center gap-3 text-center">
            <div
              className="absolute left-1/2 top-1/2 -z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-2xl"
              style={{ background: "radial-gradient(circle, #fde7dc 0%, transparent 70%)" }}
            />
            <LogoMark size={104} />
            <span>
              <p className="text-4xl font-extrabold tracking-tight text-primary">Taska</p>
              <p className="mt-0.5 text-base text-ink-muted">Productivity, simplified.</p>
            </span>
          </Link>
          <img src={illustrationSrc} alt={illustrationAlt} className="w-full max-w-sm" />
        </div>
      </div>
    </div>
  );
}
