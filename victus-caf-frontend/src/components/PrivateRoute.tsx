import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

export const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return <Navigate to="/" replace />;
  }
  let user: { rol?: string };
  try {
    user = JSON.parse(userStr);
  } catch {
    return <Navigate to="/" replace />;
  }
  const rol = user?.rol ?? '';
  if (!rol || !allowedRoles.includes(rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
};