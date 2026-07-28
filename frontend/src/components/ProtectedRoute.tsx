/* ProtectedRoute
   Wraps any route that needs a signed in user. No session means a redirect to
   login.

   replace: true so the guarded URL does not go into history, otherwise the back
   button bounces the user straight back into the redirect.

   Passing location in state lets LoginPage send them where they were originally
   headed instead of dumping everyone on /search. */

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