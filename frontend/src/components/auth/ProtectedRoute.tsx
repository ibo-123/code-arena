import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LoadingState } from "../common/LoadingState";

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
};
