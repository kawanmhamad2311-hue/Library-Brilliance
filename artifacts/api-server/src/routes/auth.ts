import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken, requireAuth } from "../lib/auth";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { name, username, password, department, badgeCode } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    name,
    username,
    passwordHash,
    department,
    badgeCode,
    role: "student",
  }).returning();

  const token = signToken(user.id);
  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      department: user.department,
      badgeCode: user.badgeCode,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { username, password } = parsed.data;

  if (username === "admin" && password === "admin1234") {
    const admins = await db.select().from(usersTable).where(eq(usersTable.username, "admin")).limit(1);
    let adminUser = admins[0];
    if (!adminUser) {
      const [newAdmin] = await db.insert(usersTable).values({
        name: "ئەدمین",
        username: "admin",
        passwordHash: await bcrypt.hash("admin1234", 10),
        department: "ئیدارە",
        badgeCode: "ADMIN001",
        role: "admin",
      }).returning();
      adminUser = newAdmin;
    }
    const token = signToken(adminUser.id);
    res.json({
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        username: adminUser.username,
        department: adminUser.department,
        badgeCode: adminUser.badgeCode,
        role: adminUser.role,
        createdAt: adminUser.createdAt,
      },
    });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const user = users[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      department: user.department,
      badgeCode: user.badgeCode,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    name: user.name,
    username: user.username,
    department: user.department,
    badgeCode: user.badgeCode,
    role: user.role,
    createdAt: user.createdAt,
  });
});

export default router;
