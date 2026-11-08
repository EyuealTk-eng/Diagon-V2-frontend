import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../app/auth";
import { Spinner } from "./ui";

export function RequireAuth({ children, moderator = false }: { children: ReactNode; moderator?: boolean }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (moderator && !user.is_moderator) return <Navigate to="/" replace />;
  return <>{children}</>;
}
