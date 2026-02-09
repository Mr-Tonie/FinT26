import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { firebaseAuthService } from "@/services/firebase/auth.service";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const currentUser = firebaseAuthService.getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
