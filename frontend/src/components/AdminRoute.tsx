/* AdminRoute
   Admin only routes. Sits inside ProtectedRoute on /manage, so the session check
   has already run by the time this does.

   Non admins go to /search rather than a 403 page. The Manage Archive link is
   not in their navbar anyway, so this only catches someone typing the URL.

   Important limitation: this is a client side redirect. It hides the screen, it
   does not secure anything. Anyone can edit localStorage and reach this page,
   and nothing here stops a direct call to the API. Real protection has to be on
   the backend. */

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