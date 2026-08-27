import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import AppLayout from "./components/layout/AppLayout";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Reminders from "./pages/Reminders";
import CalendarPage from "./pages/CalendarPage";
import PlanMyDay from "./pages/PlanMyDay";
import Profile from "./pages/Profile";

// AuthPage (the Sign Up / Sign In flip card) is rendered here, outside the
// <Routes> switch, so navigating between /signup and /login never unmounts
// it - only the URL and the flip's target angle change. The two paths still
// need a match inside <Routes> (as no-ops) so the catch-all route doesn't
// redirect them away.
function AppShell() {
  const location = useLocation();
  const isAuthRoute = location.pathname === "/signup" || location.pathname === "/login";

  return (
    <>
      {isAuthRoute && (
        <GuestRoute>
          <AuthPage />
        </GuestRoute>
      )}
      <div style={isAuthRoute ? { display: "none" } : undefined}>
        <Routes>
          <Route
            path="/"
            element={
              <GuestRoute>
                <LandingPage />
              </GuestRoute>
            }
          />
          <Route path="/signup" element={null} />
          <Route path="/login" element={null} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/plan-my-day" element={<PlanMyDay />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
