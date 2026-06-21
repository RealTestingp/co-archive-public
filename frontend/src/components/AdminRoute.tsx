import React from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  return <>{children}</>;
}

export default AdminRoute;
