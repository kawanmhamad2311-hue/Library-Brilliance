import { Router } from "express";
import { db, feedbackTable, usersTable, booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateFeedbackBody, ListFeedbackQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/feedback", async (req, res) => {
  const parsed = ListFeedbackQueryParams.safeParse({ bookId: req.query.bookId ? Number(req.query.bookId) : undefined });
  
  let feedbackRows;
  if (parsed.success && parsed.data.bookId) {
    feedbackRows = await db
      .select({
        id: feedbackTable.id,
        bookId: feedbackTable.bookId,
        bookTitle: booksTable.title,
        userId: feedbackTable.userId,
        userName: usersTable.name,
        content: feedbackTable.content,
        createdAt: feedbackTable.createdAt,
      })
      .from(feedbackTable)
      .innerJoin(usersTable, eq(feedbackTable.userId, usersTable.id))
      .innerJoin(booksTable, eq(feedbackTable.bookId, booksTable.id))
      .where(eq(feedbackTable.bookId, parsed.data.bookId));
  } else {
    feedbackRows = await db
      .select({
        id: feedbackTable.id,
        bookId: feedbackTable.bookId,
        bookTitle: booksTable.title,
        userId: feedbackTable.userId,
        userName: usersTable.name,
        content: feedbackTable.content,
        createdAt: feedbackTable.createdAt,
      })
      .from(feedbackTable)
      .innerJoin(usersTable, eq(feedbackTable.userId, usersTable.id))
      .innerJoin(booksTable, eq(feedbackTable.bookId, booksTable.id));
  }

  res.json(feedbackRows);
});

router.post("/feedback", requireAuth, async (req, res) => {
  const parsed = CreateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const books = await db.select().from(booksTable).where(eq(booksTable.id, parsed.data.bookId)).limit(1);
  if (books.length === 0) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  const book = books[0];

  const [feedback] = await db.insert(feedbackTable).values({
    userId: req.user.id,
    bookId: parsed.data.bookId,
    content: parsed.data.content,
  }).returning();

  res.status(201).json({
    id: feedback.id,
    bookId: feedback.bookId,
    bookTitle: book.title,
    userId: req.user.id,
    userName: req.user.name,
    content: feedback.content,
    createdAt: feedback.createdAt,
  });
});

export default router;
