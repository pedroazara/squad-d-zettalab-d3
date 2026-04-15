import type { ComponentType } from 'react';
import { Redirect } from 'wouter';
import { isAuthenticated } from '@/services/authApi';

interface ProtectedRouteProps {
  component: ComponentType;
}

export default function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}
