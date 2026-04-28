import { Router } from "express";
import { db, booksTable, downloadsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateBookBody, GetBookParams, DeleteBookParams, DownloadBookParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

router.get("/books", requireAuth, async (req, res) => {
  const isAdmin = req.user.role === "admin";

  if (isAdmin) {
    const departmentParam = req.query.department as string | undefined;
    const books = departmentParam
      ? await db.select().from(booksTable).where(eq(booksTable.department, departmentParam))
      : await db.select().from(booksTable);
    res.json(books.map(mapBook));
    return;
  }

  const books = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.department, req.user.department));

  res.json(books.map(mapBook));
});

router.post("/books", requireAdmin, async (req, res) => {
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [book] = await db.insert(booksTable).values(parsed.data).returning();
  res.status(201).json(mapBook(book));
});

router.get("/books/:id", requireAuth, async (req, res) => {
  const parsed = GetBookParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid book ID" });
    return;
  }
  const books = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.id, parsed.data.id))
    .limit(1);

  if (books.length === 0) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  const book = books[0];

  if (req.user.role !== "admin" && book.department !== req.user.department) {
    res.status(403).json({ error: "Access denied: book belongs to a different department" });
    return;
  }

  res.json(mapBook(book));
});

router.delete("/books/:id", requireAdmin, async (req, res) => {
  const parsed = DeleteBookParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid book ID" });
    return;
  }
  const books = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.id, parsed.data.id))
    .limit(1);

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
  const books = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.id, parsed.data.id))
    .limit(1);

  if (books.length === 0) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  const book = books[0];

  if (req.user.role !== "admin" && book.department !== req.user.department) {
    res.status(403).json({ error: "Access denied: book belongs to a different department" });
    return;
  }

  await db.insert(downloadsTable).values({
    userId: req.user.id,
    bookId: book.id,
  });

  await db
    .update(booksTable)
    .set({ downloadCount: sql`${booksTable.downloadCount} + 1` })
    .where(eq(booksTable.id, book.id));

  res.json({
    pdfUrl: book.pdfUrl,
    book: mapBook({ ...book, downloadCount: book.downloadCount + 1 }),
  });
});

function mapBook(b: typeof booksTable.$inferSelect) {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    description: b.description,
    department: b.department,
    pdfUrl: b.pdfUrl,
    coverImage: b.coverImage ?? null,
    createdAt: b.createdAt,
    downloadCount: b.downloadCount,
  };
}

export default router;
