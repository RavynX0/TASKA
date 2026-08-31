import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthFace from "../components/auth/AuthFace";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ErrorBanner from "../components/ui/ErrorBanner";
import { MailIcon } from "../components/icons";
import { useAuth } from "../context/AuthContext";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = useMemo(() => {
    const fromState = location.state?.email;
    const fromQuery = new URLSearchParams(location.search).get("email");
    return (fromState || fromQuery || "").trim();
  }, [location]);

  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  // Coming straight from registration, a code was just sent - start the cooldown.
  // Coming from a login attempt, let them request one immediately.
  const [cooldown, setCooldown] = useState(
    location.state?.fromLogin ? 0 : RESEND_COOLDOWN_SECONDS
  );
  const timerRef = useRef(null);

  useEffect(() => {
    if (!email) navigate("/signup", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    timerRef.current = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      await verifyEmail({ email, code });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setNotice(null);
    setResending(true);
    try {
      const res = await resendVerification(email);
      setNotice(
        `${res.message || "We've sent a new code."} Remember to check your spam folder.`
      );
      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.message);
      // A 429 already tells us to wait - reflect it in the button.
      if (err.status === 429) setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthFace illustrationSrc="/auth/signup-illustration.png" illustrationAlt="" mirrored={false}>
      <h1 className="text-2xl font-bold text-ink">Check your email</h1>
      <p className="mt-1 text-sm text-ink-muted">
        We sent a 6-digit verification code to{" "}
        <span className="font-medium text-ink">{email}</span>. It can take a minute to
        arrive, if you don't see it, check your <span className="font-medium text-ink">spam</span>{" "}
        or <span className="font-medium text-ink">promotions</span> folder.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <ErrorBanner message={error} />
        {notice && (
          <div className="rounded-control border border-green-100 bg-green-50 px-3.5 py-2.5 text-sm text-green-700">
            {notice}
          </div>
        )}
        <Input
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          icon={<MailIcon size={18} />}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="[&_input]:tracking-[0.5em] [&_input]:font-semibold"
        />
        <p className="text-xs text-ink-faint">
          The code expires 10 minutes after it's sent. Keep this tab open while you check your email.
        </p>
        <Button type="submit" className="w-full" loading={loading}>
          Verify email →
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-ink-muted">
        <p>Didn't receive the code?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="mt-1 font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-ink-faint disabled:no-underline"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? "Sending…" : "Resend code"}
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-ink-muted">
        Wrong address?{" "}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Start over
        </Link>
      </p>
    </AuthFace>
  );
}
