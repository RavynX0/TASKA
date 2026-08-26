import { Link } from "react-router-dom";
import AuthIllustration from "./AuthIllustration";

export default function AuthLayout({ children, mirrored = false }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className={`flex w-full flex-col lg:flex-row ${mirrored ? "lg:flex-row-reverse" : ""}`}>
        <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
          <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-sm">{children}</div>
        </div>
        <div className="hidden w-full flex-col items-center justify-center gap-10 px-16 py-12 lg:flex lg:w-1/2">
          <Link to="/" className="text-center">
            <p className="text-3xl font-extrabold text-primary">Taska</p>
            <p className="text-sm text-ink-muted">Productivity, simplified.</p>
          </Link>
          <AuthIllustration />
        </div>
      </div>
    </div>
  );
}
