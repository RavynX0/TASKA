import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageLoader } from "../components/ui/Spinner";

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
