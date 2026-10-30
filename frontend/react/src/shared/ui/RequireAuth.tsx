import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useApp } from "../store";

/** Guard роутера: auth + допустимые роли (аналог meta.roles в Quasar). */
export default function RequireAuth({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { token, user } = useApp();
  const location = useLocation();

  if (!token) return <Navigate to="/login" state={{ next: location.pathname }} replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
