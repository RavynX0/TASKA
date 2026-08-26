import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageLoader } from "../components/ui/Spinner";

export default function GuestRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}
