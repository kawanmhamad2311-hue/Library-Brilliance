import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("FATAL: JWT_SECRET environment variable is not set");
    process.exit(1);
  }
  return secret;
})();

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  if (!users[0].isActive) {
    res.status(403).json({ error: "Account is deactivated" });
    return;
  }
  req.user = users[0];
  next();
}

export async function requireAuthOrQueryToken(req: Request, res: Response, next: NextFunction) {
  const queryToken = req.query.token as string | undefined;
  if (queryToken) {
    const payload = verifyToken(queryToken);
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    const users = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (users.length === 0) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    if (!users[0].isActive) {
      res.status(403).json({ error: "Account is deactivated" });
      return;
    }
    req.user = users[0];
    next();
    return;
  }
  await requireAuth(req, res, next);
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (req.user.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}
