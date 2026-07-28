import React from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../auth";

interface AdminRouteProps {
  children: React.ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  const session = useSession();

  if (!session) return <Navigate to="/login" replace />;
  // Non-admins get bounced to Search rather than a 403 — the Manage Archive
  // link isn't in their NavBar anyway, so this only catches a typed URL.
  if (!session.isAdmin) return <Navigate to="/search" replace />;

  return <>{children}</>;
}

export default AdminRoute;