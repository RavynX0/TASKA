import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import AppPreview from "../components/landing/AppPreview";
import { ArrowRightIcon, PencilIcon, TasksIcon, BellIcon } from "../components/icons";

const FEATURES = [
  {
    icon: PencilIcon,
    title: "Capture Instantly",
    description: "Quickly log ideas and to-dos before they slip away. Our frictionless entry means nothing gets lost.",
  },
  {
    icon: TasksIcon,
    title: "Organize Effortlessly",
    description: "Group tasks, add priorities, and set due dates. A clear layout keeps your focus sharp.",
  },
  {
    icon: BellIcon,
    title: "Gentle Reminders",
    description: "Get notified only when it matters, so you can maintain your flow state without annoying interruptions.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-xl font-extrabold text-primary">Taska</p>
          <p className="-mt-1 text-xs text-ink-muted">Productivity, simplified.</p>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/login" className="text-sm font-medium text-ink hover:text-primary">
            Log in
          </Link>
          <Link to="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight text-ink lg:text-5xl">
            Remember less.
            <br />
            Accomplish more.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-muted">
            Taska helps you organize your day, remember what matters, and stay focused without the
            mental clutter. A calm productivity hub for modern professionals.
          </p>
          <Link to="/signup">
            <Button className="mt-7" size="lg">
              Get Started <ArrowRightIcon size={18} />
            </Button>
          </Link>
        </div>
        <div className="relative">
          <div className="absolute -inset-8 -z-10 rounded-full bg-primary-soft blur-2xl" />
          <AppPreview />
        </div>
      </section>

      <section className="bg-canvas py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-bold text-ink lg:text-3xl">A calmer way to work</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted">
            Everything you need to manage your personal and professional life, without the
            overwhelming clutter.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {FEATURES.map(({ icon: FeatureIcon, title, description }) => (
              <div key={title} className="rounded-card bg-white p-7 text-left shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                  <FeatureIcon size={20} />
                </div>
                <h3 className="text-[15px] font-bold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border-soft py-8 text-center">
        <p className="text-xs text-ink-muted">© 2026 Taska. All rights reserved.</p>
        <p className="mt-1 text-xs text-ink-faint">
          Email:{" "}
          <a href="mailto:uhenriette88@gmail.com" className="text-primary hover:underline">
            uhenriette88@gmail.com
          </a>{" "}
          for feedback and suggestions
        </p>
      </footer>
    </div>
  );
}
