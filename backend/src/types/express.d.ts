declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
      user?: {
        id: string;
        email: string;
        username: string;
        role: string;
        isActive: boolean;
      };
      workspaceRole?: string;
    }
  }
}

export {};