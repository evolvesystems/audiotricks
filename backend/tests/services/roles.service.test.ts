import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import RolesService from '../../src/services/roles.service';

// Mock Prisma
const mockPrisma = {
  role: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  permission: {
    findMany: vi.fn(),
    create: vi.fn()
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn()
  }
} as unknown as PrismaClient;

const rolesService = new RolesService(mockPrisma);

describe('RolesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllRoles', () => {
    it('should return all roles with permissions', async () => {
      const mockRoles = [
        {
          id: '1',
          name: 'admin',
          description: 'Administrator role',
          permissions: [
            { permission: { name: 'user:read', description: 'Read users' } }
          ]
        }
      ];

      mockPrisma.role.findMany.mockResolvedValue(mockRoles);

      const result = await rolesService.getAllRoles();

      expect(result).toEqual(mockRoles);
      expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.role.findMany.mockRejectedValue(new Error('Database error'));

      await expect(rolesService.getAllRoles()).rejects.toThrow('Database error');
    });
  });

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      const roleData = {
        name: 'moderator',
        description: 'Moderator role',
        permissions: ['user:read', 'user:write']
      };

      const mockCreatedRole = {
        id: '2',
        name: 'moderator',
        description: 'Moderator role',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.role.create.mockResolvedValue(mockCreatedRole);

      const result = await rolesService.createRole(roleData);

      expect(result).toEqual(mockCreatedRole);
      expect(mockPrisma.role.create).toHaveBeenCalledWith({
        data: {
          name: roleData.name,
          description: roleData.description,
          permissions: {
            create: roleData.permissions.map(permission => ({
              permission: {
                connectOrCreate: {
                  where: { name: permission },
                  create: { name: permission, description: permission }
                }
              }
            }))
          }
        },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
    });

    it('should handle validation errors', async () => {
      const invalidRoleData = {
        name: '', // Invalid empty name
        description: 'Test role',
        permissions: []
      };

      await expect(rolesService.createRole(invalidRoleData)).rejects.toThrow();
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      const roleId = '1';
      const updateData = {
        name: 'updated-admin',
        description: 'Updated admin role',
        permissions: ['user:read', 'user:write', 'admin:read']
      };

      const mockUpdatedRole = {
        id: roleId,
        name: updateData.name,
        description: updateData.description,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.role.update.mockResolvedValue(mockUpdatedRole);

      const result = await rolesService.updateRole(roleId, updateData);

      expect(result).toEqual(mockUpdatedRole);
      expect(mockPrisma.role.update).toHaveBeenCalledWith({
        where: { id: roleId },
        data: {
          name: updateData.name,
          description: updateData.description,
          permissions: {
            deleteMany: {},
            create: updateData.permissions.map(permission => ({
              permission: {
                connectOrCreate: {
                  where: { name: permission },
                  create: { name: permission, description: permission }
                }
              }
            }))
          }
        },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
    });

    it('should handle non-existent role', async () => {
      const roleId = 'non-existent';
      const updateData = {
        name: 'test',
        description: 'test',
        permissions: []
      };

      mockPrisma.role.update.mockRejectedValue(new Error('Role not found'));

      await expect(rolesService.updateRole(roleId, updateData)).rejects.toThrow('Role not found');
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      const roleId = '1';

      mockPrisma.role.delete.mockResolvedValue({ id: roleId });

      await rolesService.deleteRole(roleId);

      expect(mockPrisma.role.delete).toHaveBeenCalledWith({
        where: { id: roleId }
      });
    });

    it('should handle non-existent role deletion', async () => {
      const roleId = 'non-existent';

      mockPrisma.role.delete.mockRejectedValue(new Error('Role not found'));

      await expect(rolesService.deleteRole(roleId)).rejects.toThrow('Role not found');
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      const userId = 'user-1';
      const roleName = 'admin';

      const mockUser = {
        id: userId,
        role: roleName
      };

      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await rolesService.assignRoleToUser(userId, roleName);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { role: roleName }
      });
    });

    it('should handle invalid user assignment', async () => {
      const userId = 'non-existent';
      const roleName = 'admin';

      mockPrisma.user.update.mockRejectedValue(new Error('User not found'));

      await expect(rolesService.assignRoleToUser(userId, roleName)).rejects.toThrow('User not found');
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions based on role', async () => {
      const userId = 'user-1';

      const mockUser = {
        id: userId,
        role: 'admin'
      };

      const mockRole = {
        id: '1',
        name: 'admin',
        permissions: [
          { permission: { name: 'user:read', description: 'Read users' } },
          { permission: { name: 'user:write', description: 'Write users' } }
        ]
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      const result = await rolesService.getUserPermissions(userId);

      expect(result).toEqual(['user:read', 'user:write']);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'admin' },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
    });

    it('should return empty array for user without role', async () => {
      const userId = 'user-1';

      const mockUser = {
        id: userId,
        role: null
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await rolesService.getUserPermissions(userId);

      expect(result).toEqual([]);
    });

    it('should handle non-existent user', async () => {
      const userId = 'non-existent';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(rolesService.getUserPermissions(userId)).rejects.toThrow('User not found');
    });
  });
});