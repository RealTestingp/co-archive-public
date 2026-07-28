import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const session = useSession();
  const location = useLocation();

  // Remember where they were headed so /login can send them back after
  // signing in.
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;