import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/utils/permissions';
import { UserPermissions } from '@/types/user';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: keyof UserPermissions;
  permissions?: (keyof UserPermissions)[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(user.permissions, permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(user.permissions, permissions)
      : hasAnyPermission(user.permissions, permissions);
  } else {
    // Se não especificou permissão, permite acesso
    hasAccess = true;
  }

  return <>{hasAccess ? children : fallback}</>;
};

export default PermissionGuard; 