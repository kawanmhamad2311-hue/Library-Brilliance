import { Router } from "express";
import { db, downloadsTable, usersTable, booksTable, feedbackTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/admin/downloads", requireAdmin, async (_req, res) => {
  const downloads = await db
    .select({
      id: downloadsTable.id,
      bookId: downloadsTable.bookId,
      bookTitle: booksTable.title,
      userId: downloadsTable.userId,
      userName: usersTable.name,
      userDepartment: usersTable.department,
      userBadgeCode: usersTable.badgeCode,
      downloadedAt: downloadsTable.downloadedAt,
      isRead: downloadsTable.isRead,
    })
    .from(downloadsTable)
    .innerJoin(usersTable, eq(downloadsTable.userId, usersTable.id))
    .innerJoin(booksTable, eq(downloadsTable.bookId, booksTable.id))
    .orderBy(desc(downloadsTable.downloadedAt));

  res.json(downloads);
});

router.get("/admin/notifications/unread-count", requireAdmin, async (_req, res) => {
  const [result] = await db
    .select({ value: count() })
    .from(downloadsTable)
    .where(eq(downloadsTable.isRead, false));

  res.json({ count: result.value });
});

router.post("/admin/notifications/mark-all-read", requireAdmin, async (_req, res) => {
  await db
    .update(downloadsTable)
    .set({ isRead: true })
    .where(eq(downloadsTable.isRead, false));

  res.json({ success: true });
});

router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const [totalUsersResult] = await db.select({ value: count() }).from(usersTable);
  const [totalBooksResult] = await db.select({ value: count() }).from(booksTable);
  const [totalDownloadsResult] = await db.select({ value: count() }).from(downloadsTable);
  const [totalFeedbackResult] = await db.select({ value: count() }).from(feedbackTable);

  const booksByDeptRows = await db
    .select({ department: booksTable.department, count: count() })
    .from(booksTable)
    .groupBy(booksTable.department);

  const recentDownloads = await db
    .select({
      id: downloadsTable.id,
      bookId: downloadsTable.bookId,
      bookTitle: booksTable.title,
      userId: downloadsTable.userId,
      userName: usersTable.name,
      userDepartment: usersTable.department,
      userBadgeCode: usersTable.badgeCode,
      downloadedAt: downloadsTable.downloadedAt,
      isRead: downloadsTable.isRead,
    })
    .from(downloadsTable)
    .innerJoin(usersTable, eq(downloadsTable.userId, usersTable.id))
    .innerJoin(booksTable, eq(downloadsTable.bookId, booksTable.id))
    .orderBy(desc(downloadsTable.downloadedAt))
    .limit(10);

  res.json({
    totalUsers: totalUsersResult.value,
    totalBooks: totalBooksResult.value,
    totalDownloads: totalDownloadsResult.value,
    totalFeedback: totalFeedbackResult.value,
    booksByDepartment: booksByDeptRows.map(r => ({ department: r.department, count: r.count })),
    recentDownloads,
  });
});

router.get("/admin/users", requireAdmin, async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    username: usersTable.username,
    department: usersTable.department,
    badgeCode: usersTable.badgeCode,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable);

  res.json(users);
});

router.get("/admin/feedback", requireAdmin, async (_req, res) => {
  const feedbackRows = await db
    .select({
      id: feedbackTable.id,
      bookId: feedbackTable.bookId,
      bookTitle: booksTable.title,
      bookDepartment: booksTable.department,
      userId: feedbackTable.userId,
      userName: usersTable.name,
      userDepartment: usersTable.department,
      content: feedbackTable.content,
      createdAt: feedbackTable.createdAt,
    })
    .from(feedbackTable)
    .innerJoin(usersTable, eq(feedbackTable.userId, usersTable.id))
    .innerJoin(booksTable, eq(feedbackTable.bookId, booksTable.id))
    .orderBy(desc(feedbackTable.createdAt));

  res.json(feedbackRows);
});

export default router;
