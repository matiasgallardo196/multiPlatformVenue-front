/**
 * Jerarquía de roles en el frontend
 * Cada rol hereda los permisos de los roles inferiores
 */
export const ROLE_HIERARCHY: Record<string, string[]> = {
  admin: ['head-manager', 'manager', 'staff'],
  'head-manager': ['manager', 'staff'],
  manager: ['staff'],
  staff: [],
};

/**
 * Verifica si un rol tiene acceso a otro rol (incluyendo herencia de jerarquía transitiva)
 * @param userRole El rol del usuario
 * @param requiredRole El rol requerido
 * @returns true si el usuario tiene el rol requerido o un rol superior que lo incluye
 */
export function hasRoleOrAbove(userRole: string, requiredRole: string): boolean {
  const accessibleRoles = getAllAccessibleRoles(userRole);
  return accessibleRoles.includes(requiredRole);
}

/**
 * Verifica si un usuario es ADMIN
 */
export function isAdmin(role: string): boolean {
  return role === 'admin';
}

/**
 * Verifica si un usuario es HEAD_MANAGER o superior
 */
export function isHeadManagerOrAbove(role: string): boolean {
  return hasRoleOrAbove(role, 'head-manager');
}

/**
 * Verifica si un usuario es MANAGER o superior
 */
export function isManagerOrAbove(role: string): boolean {
  return hasRoleOrAbove(role, 'manager');
}

/**
 * Obtiene todos los roles que un rol dado puede acceder (incluyendo sí mismo y sus heredados)
 */
export function getAllAccessibleRoles(role: string): string[] {
  const inheritedRoles = ROLE_HIERARCHY[role] || [];
  const allRoles = [role, ...inheritedRoles];
  
  // Aplanar recursivamente para incluir roles heredados de los heredados
  const flattened: string[] = [];
  const processRole = (r: string) => {
    if (!flattened.includes(r)) {
      flattened.push(r);
      const inherited = ROLE_HIERARCHY[r] || [];
      inherited.forEach(processRole);
    }
  };
  
  allRoles.forEach(processRole);
  return flattened;
}

