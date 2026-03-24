import { useAuth } from '@/contexts/AuthContext';

export const useUserPermissions = () => {
  const { user } = useAuth();

  const hasRHPermissions = () => {
    if (!user?.roles) return false;
    
    const rhRoles = [
      'HR_APPROVE',
      'HR_READ', 
      'HR_WRITE',
      'HR_DELETE',
      'SUPER_ADMIN',
      'ADMIN',
      'GESTOR',
      'SUPERVISOR',
      'ROLE_SUPER_ADMIN',
      'ROLE_ADMIN',
      'ROLE_GESTOR',
      'ROLE_SUPERVISOR',
      'RECURSOS_HUMANOS',
      'RH',
      'DEPARTAMENTO_PESSOAL'
    ];
    
    return user.roles.some(role => rhRoles.includes(role));
  };

  const canApproveVacations = () => {
    return hasRHPermissions();
  };

  const canApproveAbsences = () => {
    return hasRHPermissions();
  };

  const canManageEmployees = () => {
    return hasRHPermissions();
  };

  const canAccessReports = () => {
    return hasRHPermissions();
  };

  return {
    hasRHPermissions: hasRHPermissions(),
    canApproveVacations: canApproveVacations(),
    canApproveAbsences: canApproveAbsences(),
    canManageEmployees: canManageEmployees(),
    canAccessReports: canAccessReports(),
    userRoles: user?.roles || []
  };
};
