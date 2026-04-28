import { Router } from "express";
import { db, booksTable, downloadsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateBookBody, ListBooksQueryParams, GetBookParams, DeleteBookParams, DownloadBookParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

router.get("/books", async (req, res) => {
  const parsed = ListBooksQueryParams.safeParse(req.query);
  const department = parsed.success ? parsed.data.department : undefined;

  let books;
  if (department) {
    books = await db.select().from(booksTable).where(eq(booksTable.department, department));
  } else {
    books = await db.select().from(booksTable);
  }

  res.json(books.map(b => ({
    id: b.id,
    title: b.title,
    author: b.author,
    description: b.description,
    department: b.department,
    pdfUrl: b.pdfUrl,
    createdAt: b.createdAt,
    downloadCount: b.downloadCount,
  })));
});

router.post("/books", requireAdmin, async (req, res) => {
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [book] = await db.insert(booksTable).values(parsed.data).returning();
  res.status(201).json({
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    department: book.department,
    pdfUrl: book.pdfUrl,
    createdAt: book.createdAt,
    downloadCount: book.downloadCount,
  });
});

router.get("/books/:id", async (req, res) => {
  const parsed = GetBookParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid book ID" });
    return;
  }
  const books = await db.select().from(booksTable).where(eq(booksTable.id, parsed.data.id)).limit(1);
  if (books.length === 0) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  const book = books[0];
  res.json({
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    department: book.department,
    pdfUrl: book.pdfUrl,
    createdAt: book.createdAt,
    downloadCount: book.downloadCount,
  });
});

router.delete("/books/:id", requireAdmin, async (req, res) => {
  const parsed = DeleteBookParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid book ID" });
    return;
  }
  const books = await db.select().from(booksTable).where(eq(booksTable.id, parsed.data.id)).limit(1);
  if (books.length === 0) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  await db.delete(booksTable).where(eq(booksTable.id, parsed.data.id));
  res.json({ success: true });
});

router.post("/books/:id/download", requireAuth, async (req, res) => {
  const parsed = DownloadBookParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid book ID" });
    return;
  }
  const books = await db.select().from(booksTable).where(eq(booksTable.id, parsed.data.id)).limit(1);
  if (books.length === 0) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  const book = books[0];
  const user = (req as any).user;

  await db.insert(downloadsTable).values({
    userId: user.id,
    bookId: book.id,
  });

  await db.update(booksTable)
    .set({ downloadCount: sql`${booksTable.downloadCount} + 1` })
    .where(eq(booksTable.id, book.id));

  res.json({
    pdfUrl: book.pdfUrl,
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description,
      department: book.department,
      pdfUrl: book.pdfUrl,
      createdAt: book.createdAt,
      downloadCount: book.downloadCount + 1,
    },
  });
});

export default router;
