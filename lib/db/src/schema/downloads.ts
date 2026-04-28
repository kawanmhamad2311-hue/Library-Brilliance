import { pgTable, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { booksTable } from "./books";

export const downloadsTable = pgTable("downloads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  bookId: integer("book_id").notNull().references(() => booksTable.id),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false),
});

export type Download = typeof downloadsTable.$inferSelect;
