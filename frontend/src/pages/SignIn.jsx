import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ErrorBanner from "../components/ui/ErrorBanner";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "../components/icons";
import { useAuth } from "../context/AuthContext";

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [forgotNote, setForgotNote] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    setNeedsVerify(false);
    if (!form.email.trim() || !form.password) {
      setSubmitError("Enter your email and password");
      return;
    }
    setLoading(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err.status === 403) {
        setSubmitError("Please verify your email before logging in.");
        setNeedsVerify(true);
      } else {
        setSubmitError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-muted">Please enter your details to sign in.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <ErrorBanner message={submitError} />
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          icon={<MailIcon size={18} />}
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          icon={<LockIcon size={18} />}
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="pointer-events-auto"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          }
          labelAction={
            <button
              type="button"
              onClick={() => setForgotNote(true)}
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </button>
          }
        />
        {forgotNote && (
          <p className="text-xs text-ink-muted">
            Password reset isn't available yet, contact support to regain access.
          </p>
        )}
        {needsVerify && (
          <button
            type="button"
            onClick={() =>
              navigate("/verify-email", {
                state: { email: form.email.trim(), fromLogin: true },
              })
            }
            className="w-full text-center text-sm font-medium text-primary hover:underline"
          >
            Verify your email now →
          </button>
        )}
        <Button type="submit" className="w-full" loading={loading}>
          Log In
        </Button>
        <p className="text-center text-sm text-ink-muted">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </>
  );
}
