import { Request, Response } from 'express';
import * as WorkspaceManagement from './workspace-management.controller';
import * as WorkspaceUsers from './workspace-users.controller';
import * as WorkspaceInvitations from './workspace-invitations.controller';

/**
 * Main workspace controller that orchestrates workspace management, users, and invitations
 * This maintains backward compatibility while delegating to focused controllers
 */

// Workspace Management
export const createWorkspace = (req: Request, res: Response) => {
  return WorkspaceManagement.createWorkspace(req, res);
};

export const getWorkspaces = (req: Request, res: Response) => {
  return WorkspaceManagement.getWorkspaces(req, res);
};

export const getWorkspace = (req: Request, res: Response) => {
  return WorkspaceManagement.getWorkspace(req, res);
};

export const updateWorkspace = (req: Request, res: Response) => {
  return WorkspaceManagement.updateWorkspace(req, res);
};

export const deleteWorkspace = (req: Request, res: Response) => {
  return WorkspaceManagement.deleteWorkspace(req, res);
};

// User Management
export const getWorkspaceUsers = (req: Request, res: Response) => {
  return WorkspaceUsers.getWorkspaceUsers(req, res);
};

export const addUserToWorkspace = (req: Request, res: Response) => {
  return WorkspaceUsers.addUserToWorkspace(req, res);
};

export const updateWorkspaceUser = (req: Request, res: Response) => {
  return WorkspaceUsers.updateWorkspaceUser(req, res);
};

export const removeFromWorkspace = (req: Request, res: Response) => {
  return WorkspaceUsers.removeFromWorkspace(req, res);
};

export const getAvailableUsers = (req: Request, res: Response) => {
  return WorkspaceUsers.getAvailableUsers(req, res);
};

// Invitation Management
export const inviteToWorkspace = (req: Request, res: Response) => {
  return WorkspaceInvitations.inviteToWorkspace(req, res);
};

export const getWorkspaceInvitations = (req: Request, res: Response) => {
  return WorkspaceInvitations.getWorkspaceInvitations(req, res);
};

export const acceptInvitation = (req: Request, res: Response) => {
  return WorkspaceInvitations.acceptInvitation(req, res);
};

export const revokeInvitation = (req: Request, res: Response) => {
  return WorkspaceInvitations.revokeInvitation(req, res);
};