import type { BusinessRole } from '@/types';

export type Permission =
  | 'manageBusiness'
  | 'manageTeam'
  | 'manageServices'
  | 'manageAppointments'
  | 'manageClients'
  | 'viewFinance'
  | 'manageFinance'
  | 'manageGoals';

const permissionsByRole: Record<BusinessRole, ReadonlySet<Permission>> = {
  owner: new Set([
    'manageBusiness',
    'manageTeam',
    'manageServices',
    'manageAppointments',
    'manageClients',
    'viewFinance',
    'manageFinance',
    'manageGoals',
  ]),
  admin: new Set([
    'manageBusiness',
    'manageTeam',
    'manageServices',
    'manageAppointments',
    'manageClients',
    'viewFinance',
    'manageFinance',
    'manageGoals',
  ]),
  receptionist: new Set(['manageAppointments', 'manageClients']),
  professional: new Set(['manageAppointments', 'manageClients']),
};

export function hasPermission(
  role: BusinessRole | undefined,
  permission: Permission,
): boolean {
  return role ? permissionsByRole[role].has(permission) : false;
}

export const roleLabels: Record<BusinessRole, string> = {
  owner: 'Proprietário(a)',
  admin: 'Administrador(a)',
  receptionist: 'Recepção',
  professional: 'Profissional',
};
