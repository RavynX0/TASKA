import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TaskFormModal from "../tasks/TaskFormModal";
import RescheduleDeepLinkHandler from "../tasks/RescheduleDeepLinkHandler";
import { LogoMark } from "../Logo";
import { TasksProvider } from "../../context/TasksContext";
import { NotificationsProvider } from "../../context/NotificationsContext";

function MenuIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <TasksProvider>
      <NotificationsProvider>
        <div className="min-h-screen bg-canvas">
          <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
          <div className="min-w-0 lg:pl-[272px]">
            <div className="flex items-center gap-3 border-b border-border-soft bg-white px-4 py-3 lg:hidden">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-canvas"
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
              <LogoMark size={26} />
              <span className="text-[15px] font-bold text-ink">Taska</span>
            </div>
            <main className="px-5 py-6 sm:px-8 sm:py-7 lg:px-10">
              <Outlet />
            </main>
          </div>
        </div>
        <TaskFormModal />
        <RescheduleDeepLinkHandler />
      </NotificationsProvider>
    </TasksProvider>
  );
}
