import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions: string[];
  requireAll?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions,
  requireAll = false,
}) => {
  const { hasAllPermissions, hasAnyPermission } = useAuthStore();

  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};
