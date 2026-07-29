import { hasPermission, roleLabels } from '../permissions';

describe('role permissions', () => {
  it('grants owners and admins administrative access', () => {
    expect(hasPermission('owner', 'manageTeam')).toBe(true);
    expect(hasPermission('admin', 'manageFinance')).toBe(true);
  });

  it('keeps financial and settings data away from operational roles', () => {
    expect(hasPermission('receptionist', 'viewFinance')).toBe(false);
    expect(hasPermission('professional', 'manageBusiness')).toBe(false);
  });

  it('allows reception and professionals to operate appointments and clients', () => {
    expect(hasPermission('receptionist', 'manageAppointments')).toBe(true);
    expect(hasPermission('professional', 'manageClients')).toBe(true);
  });

  it('has a user-facing label for every role', () => {
    expect(Object.keys(roleLabels).sort()).toEqual(
      ['admin', 'owner', 'professional', 'receptionist'].sort(),
    );
  });
});
