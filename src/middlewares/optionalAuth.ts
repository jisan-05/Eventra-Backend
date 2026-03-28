import { NextFunction, Request, Response } from "express";
import { auth as betterAuth } from "../lib/auth";

/**
 * Attaches req.user when a valid session cookie is present; otherwise continues without user.
 */
const optionalAuth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await betterAuth.api.getSession({
        headers: req.headers as any,
      });
      if (session?.user) {
        req.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role as string,
          emailVerified: session.user.emailVerified,
        };
      }
    } catch {
      // ignore invalid session
    }
    next();
  };
};

export default optionalAuth;
