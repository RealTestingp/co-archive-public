import { useMsal } from "@azure/msal-react";
import { Navigate } from "react-router-dom";

interface AdminRouteProps {
  children: React.ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  const { accounts } = useMsal();
  const account = accounts[0];

  const roles = (account?.idTokenClaims as { roles?: string[] })?.roles ?? [];
  const isAdmin = roles.includes("Admin");

  if (!isAdmin) return <Navigate to="/search" replace />;
  return <>{children}</>;
}

export default AdminRoute;
