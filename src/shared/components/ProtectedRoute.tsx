import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  authenticated: boolean;
}

export function ProtectedRoute({
  children,
  authenticated
}: ProtectedRouteProps) {
  const location = useLocation();

  if (!authenticated) {
    // Prevent redirect loop if already on login
    if (location.pathname === "/login") {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
