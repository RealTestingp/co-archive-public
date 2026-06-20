import React from "react";
import { Navigate } from "react-router-dom";

// TEMP: mirrors MOCK_USER in NavBar — keep in sync
const IS_ADMIN = true; // toggle to false to test redirect

interface AdminRouteProps {
  children: React.ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  if (!IS_ADMIN) return <Navigate to="/search" replace />;
  return <>{children}</>;
}

export default AdminRoute;