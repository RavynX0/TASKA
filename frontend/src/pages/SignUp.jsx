import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ErrorBanner from "../components/ui/ErrorBanner";
import { MailIcon, LockIcon } from "../components/icons";
import { useAuth } from "../context/AuthContext";

export default function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 8) next.password = "Password must be at least 8 characters";
    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-ink">Create an Account</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <ErrorBanner message={submitError} />
        <Input
          label="Full Name"
          placeholder="John Doe"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          icon={<MailIcon size={18} />}
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={<LockIcon size={18} />}
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          error={errors.password}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          icon={<LockIcon size={18} />}
          value={form.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          error={errors.confirmPassword}
        />
        <Button type="submit" className="w-full" loading={loading}>
          Create Account →
        </Button>
        <p className="text-center text-sm text-ink-muted">
          Already a member?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </>
  );
}
