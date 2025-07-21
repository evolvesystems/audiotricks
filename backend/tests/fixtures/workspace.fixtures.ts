import { PrismaClient } from '@prisma/client';
import { TestUser, createTestUser } from './user.fixtures';

/**
 * Test fixtures for Workspace models
 * Provides consistent test data per CLAUDE.md requirements
 */

export interface TestWorkspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdBy: string;
  isActive: boolean;
}

export const createTestWorkspace = async (
  prisma: PrismaClient, 
  owner?: TestUser,
  overrides: Partial<TestWorkspace> = {}
): Promise<{ workspace: TestWorkspace; owner: TestUser }> => {
  // Create owner if not provided
  const workspaceOwner = owner || await createTestUser(prisma, {
    email: 'owner@example.com',
    name: 'Workspace Owner'
  });

  const defaultWorkspace = {
    name: 'Test Workspace',
    slug: 'test-workspace',
    description: 'A test workspace for unit tests',
    isActive: true,
    ...overrides
  };

  const workspace = await prisma.workspace.create({
    data: {
      name: defaultWorkspace.name,
      slug: defaultWorkspace.slug,
      description: defaultWorkspace.description,
      createdBy: workspaceOwner.id,
      isActive: defaultWorkspace.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      users: {
        create: {
          userId: workspaceOwner.id,
          role: 'owner',
          joinedAt: new Date()
        }
      }
    }
  });

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      createdBy: workspace.createdBy,
      isActive: workspace.isActive
    },
    owner: workspaceOwner
  };
};

export const addUserToWorkspace = async (
  prisma: PrismaClient,
  workspaceId: string,
  user: TestUser,
  role: 'owner' | 'admin' | 'member' = 'member'
) => {
  return await prisma.workspaceUser.create({
    data: {
      workspaceId,
      userId: user.id,
      role,
      joinedAt: new Date()
    }
  });
};

export const createWorkspaceWithMembers = async (
  prisma: PrismaClient,
  memberCount: number = 2
): Promise<{
  workspace: TestWorkspace;
  owner: TestUser;
  members: TestUser[];
}> => {
  const { workspace, owner } = await createTestWorkspace(prisma);
  const members: TestUser[] = [];

  for (let i = 0; i < memberCount; i++) {
    const member = await createTestUser(prisma, {
      email: `member${i + 1}@example.com`,
      name: `Member ${i + 1}`
    });
    
    await addUserToWorkspace(prisma, workspace.id, member, 'member');
    members.push(member);
  }

  return { workspace, owner, members };
};