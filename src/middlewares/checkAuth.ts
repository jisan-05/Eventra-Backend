import { NextFunction, Request, Response } from "express";
import { auth as betterAuth } from "../lib/auth";

type UserRole = "ADMIN" | "USER" | "MANAGER";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        emailVerified: boolean;
      };
    }
  }
}

const auth = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cookie forwarded from Next.js rewrites must be present on this request.
      const session = await betterAuth.api.getSession({
        headers: req.headers as any,
      });
      // const session = req.cookies["__Secure-session_token"] || req.cookies["session_token"]

      if (!session) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized!",
        });
      }

      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role as string,
        emailVerified: session.user.emailVerified,
      };

      if (roles.length && !roles.includes(req.user.role as UserRole)) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden ! You don't have permission to access the resources",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
