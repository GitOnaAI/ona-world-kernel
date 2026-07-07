import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLES,
  ASSIGNABLE_ADMIN_ROLES,
  isAdminRole,
  permissionsForRoles,
  ROLE_PERMISSIONS,
  SUPERADMIN_ONLY_PERMISSIONS,
  SUPERADMIN_ROLE,
  sanitizeRoles,
} from '../server/admin_permissions';

describe('admin permission vocabulary', () => {
  it('grants every permission to superadmin', () => {
    const granted = new Set(ROLE_PERMISSIONS.superadmin);
    for (const permission of ADMIN_PERMISSIONS) {
      expect(granted.has(permission)).toBe(true);
    }
  });

  it('makes every permission reachable through at least one role', () => {
    const reachable = permissionsForRoles([...ADMIN_ROLES]);
    expect([...reachable].sort()).toEqual([...ADMIN_PERMISSIONS].sort());
  });

  it('keeps every role bundle inside the vocabulary', () => {
    for (const role of ADMIN_ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(ADMIN_PERMISSIONS).toContain(permission);
      }
    }
  });

  it('gives the admin role every permission except the superadmin-only set', () => {
    const granted = new Set(ROLE_PERMISSIONS.admin);
    for (const permission of ADMIN_PERMISSIONS) {
      expect(granted.has(permission), permission).toBe(
        !SUPERADMIN_ONLY_PERMISSIONS.includes(permission),
      );
    }
    expect(granted.has('staff.manage')).toBe(false);
  });

  it('keeps every superadmin-only permission reachable ONLY through superadmin', () => {
    expect(SUPERADMIN_ONLY_PERMISSIONS.length).toBeGreaterThan(0);
    for (const permission of SUPERADMIN_ONLY_PERMISSIONS) {
      for (const role of ADMIN_ROLES) {
        const grants = new Set(ROLE_PERMISSIONS[role]).has(permission);
        expect(grants, `${role} grants ${permission}`).toBe(role === SUPERADMIN_ROLE);
      }
    }
  });

  it('keeps ops_usage.read to admin and superadmin only', () => {
    for (const role of ADMIN_ROLES) {
      const grants = new Set(ROLE_PERMISSIONS[role]).has('ops_usage.read');
      expect(grants, `${role} grants ops_usage.read`).toBe(
        role === 'admin' || role === SUPERADMIN_ROLE,
      );
    }
  });

  it('gives viewer the general read permissions, excluding the restricted ones', () => {
    // Reads that are NOT part of the general viewer bundle: anti-bot internals
    // and Operations/Usage are admin/superadmin only.
    const restricted = ['botdetector.read', 'ops_usage.read'];
    const reads = ADMIN_PERMISSIONS.filter(
      (permission) => permission.endsWith('.read') && !restricted.includes(permission),
    );
    expect([...ROLE_PERMISSIONS.viewer].sort()).toEqual(reads.sort());
    for (const permission of restricted) {
      expect(ROLE_PERMISSIONS.viewer).not.toContain(permission);
    }
  });

  it('excludes superadmin from the dashboard-assignable roles', () => {
    expect(ASSIGNABLE_ADMIN_ROLES).not.toContain(SUPERADMIN_ROLE);
    expect(ASSIGNABLE_ADMIN_ROLES.length).toBe(ADMIN_ROLES.length - 1);
  });

  it('unions permissions across a role set and ignores unknown roles', () => {
    const permissions = permissionsForRoles(['viewer', 'moderator', 'retired-role']);
    expect(permissions.has('moderation.act')).toBe(true); // from moderator
    expect(permissions.has('analytics.read')).toBe(true); // from viewer
    expect(permissions.has('staff.manage')).toBe(false); // neither
    expect(permissionsForRoles(['retired-role']).size).toBe(0);
  });

  it('sanitizes role writes strictly', () => {
    expect(sanitizeRoles(['viewer', 'moderator', 'viewer'])).toEqual(['moderator', 'viewer']);
    expect(sanitizeRoles([])).toEqual([]);
    expect(sanitizeRoles(['wizard'])).toBeNull();
    expect(sanitizeRoles('viewer')).toBeNull();
    expect(sanitizeRoles([42])).toBeNull();
    expect(isAdminRole('moderator')).toBe(true);
    expect(isAdminRole('root')).toBe(false);
  });
});

// The role vocabulary is hand-mirrored in the plain-Node grant script (which
// cannot import the server module); pin it so adding a role cannot silently
// miss it.
describe('role vocabulary mirrors', () => {
  it('keeps scripts/grant_admin.mjs KNOWN_ROLES in sync', () => {
    const source = readFileSync('scripts/grant_admin.mjs', 'utf8');
    const match = /const KNOWN_ROLES = \[([^\]]+)\]/.exec(source);
    expect(match).not.toBeNull();
    const known = [...(match?.[1] ?? '').matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect(known).toEqual([...ADMIN_ROLES]);
  });
});
