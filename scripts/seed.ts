import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { booksTable, usersTable } from "../lib/db/src/schema/index.js";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const departments = [
  "بەشی پەرستاری",
  "بەشی تەکنیکی چاو",
  "بەشی ئایتی",
  "بەشی دەرمانسازی",
  "بەشی شیکاری نەخۆشیەکان",
  "بەشی میکانیکی ئۆتۆمبیل",
];

const booksByDepartment: Record<string, Array<{ title: string; author: string; description: string; pdfUrl: string }>> = {
  "بەشی پەرستاری": [
    { title: "بنەمەی پەرستاری", author: "د. سەرکەوت ئەحمەد", description: "کتێبێکی بنەرەتی لە بواری پەرستاری بۆ قوتابیانی نوێ", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "ئانائاتۆمی مرۆڤ", author: "پرۆف. خالید ئیبراهیم", description: "پێناسەی ئاستی بەرزی ئانائاتۆمی مرۆڤ", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "دەرمانی پزیشکی", author: "د. شیرکۆ محمود", description: "دەرمان و کاریگەری لەسەر جەستەی مرۆڤ", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "چاودێری نەخۆش", author: "د. هاوژین عومەر", description: "شێوازی چاودێری نەخۆش لە نەخۆشخانە", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "پەرستاری کوردەواری", author: "پرۆف. ئارام حسێن", description: "بنچینەکانی پەرستاری لە چوارچێوەی کوردستان", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
  ],
  "بەشی تەکنیکی چاو": [
    { title: "تەکنیکی چاو - ئاستی یەکەم", author: "د. ئارام سەعید", description: "دەرسی بنەرەتی تەکنیکی چاو", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "ئەندازەگیری چاو", author: "پرۆف. رازاو مستەفا", description: "شێوازی ئەندازەگیری و پشکنینی چاو", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "شیشەی چاو و جۆرەکانی", author: "د. لێلان ئەحمەد", description: "جۆرەکانی شیشەی چاو و تایبەتمەندییەکانیان", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "نەخۆشییەکانی چاو", author: "پرۆف. سەنگەر عومەر", description: "نەخۆشییە باوەکانی چاو و چارەسەرەکانیان", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "کۆنتاکت لێنس", author: "د. هاوناز کریم", description: "تەکنیکی کۆنتاکت لێنس و چاودێریکردنی", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
  ],
  "بەشی ئایتی": [
    { title: "بەرنامەسازی پایتۆن", author: "م. ئەشتی باشا", description: "دەستپێکردن بە بەرنامەسازی پایتۆن", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "داتابێس و SQL", author: "م. هەڵمەت رەشید", description: "دامەزراندن و بەڕێوەبردنی داتابێس", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "تۆڕی کۆمپیوتەر", author: "پرۆف. کاروان نادر", description: "بنچینەکانی تۆڕی کۆمپیوتەر و پرۆتۆکۆلەکان", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "ئەمنیەتی سایبەر", author: "م. ئامانج موحمەد", description: "بەرگری لە سیستەم و داتا لە ئینتەرنێتەوە", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "دیزاینی وێبسایت", author: "م. شاخەوان حامید", description: "دروستکردنی وێبسایت بە HTML و CSS", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
  ],
  "بەشی دەرمانسازی": [
    { title: "فارماکۆلۆژی بنەرەتی", author: "د. شادان سەعید", description: "بنچینەکانی فارماکۆلۆژی و دەرمانسازی", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "کیمیاوی دەرمانی", author: "پرۆف. دلشاد ئیسماعیل", description: "ئەندازەگیری کیمیاوی دەرمانەکان", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "جۆرەکانی دەرمان", author: "د. ئاراس موحمەد", description: "جۆرەکانی دەرمان و چۆنێتی بەکارهێنانیان", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "دەرمانسازی کلینیکی", author: "پرۆف. هۆزان ئەحمەد", description: "دەرمانسازی کلینیکی و کاربردی", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "بۆتانیکی دەرمانی", author: "د. رێبین حسێن", description: "ڕووەکی دەرمانی و تایبەتمەندییەکانیان", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
  ],
  "بەشی شیکاری نەخۆشیەکان": [
    { title: "شیکاری خوێن", author: "د. دلنیا ئەحمەد", description: "شێوازی شیکاری خوێن و نتیجەکانی", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "میکرۆبیۆلۆژی", author: "پرۆف. ئادل موحمەد", description: "مەیکرۆبەکان و نەخۆشییەکانی تووشبووی", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "بیۆکیمیا کلینیکی", author: "د. هاوکار رەشید", description: "شیکاری کیمیاوی بیۆلۆژیکی", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "شیکاری مید", author: "پرۆف. ئیمان سەعید", description: "جۆرەکانی شیکاری مید و ئامانجەکانیان", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "ئیمیونۆلۆژی", author: "د. ژیان موحمەد", description: "سیستەمی بەرگری جەستە و ئایمیونۆلۆژی", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
  ],
  "بەشی میکانیکی ئۆتۆمبیل": [
    { title: "ئەندازیاری ئۆتۆمبیل", author: "م. ئارام ئیبراهیم", description: "بنچینەکانی ئەندازیاری ئۆتۆمبیل", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "ئینجینی ئۆتۆمبیل", author: "م. کامیل حسێن", description: "شێوازی کاری ئینجینی ئۆتۆمبیل و چارەسەرکردنی کێشەکانی", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "سیستەمی ئەوتۆماتیکی", author: "پرۆف. هاوراز سەعید", description: "سیستەمی ئەوتۆماتیکی نوێ لە ئۆتۆمبیلەکاندا", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "ئەلیکترۆنیکی ئۆتۆمبیل", author: "م. شێرزاد موحمەد", description: "سیستەمی ئەلیکترۆنیکی ئۆتۆمبیلەکانی نوێ", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
    { title: "چارەسەرکردنی ئۆتۆمبیل", author: "م. دیاکۆ رەحیم", description: "داگیرسانی کێشەکانی ئۆتۆمبیل و چارەسەرکردنیان", pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf" },
  ],
};

async function seed() {
  console.log("Seeding database...");

  const existingBooks = await db.select().from(booksTable).limit(1);
  if (existingBooks.length > 0) {
    console.log("Books already seeded. Skipping...");
    await pool.end();
    return;
  }

  for (const [department, books] of Object.entries(booksByDepartment)) {
    for (const book of books) {
      await db.insert(booksTable).values({ ...book, department });
    }
    console.log(`Seeded ${books.length} books for ${department}`);
  }

  const adminExists = await db.select().from(usersTable).where(
    (await import("drizzle-orm")).eq(usersTable.username, "admin")
  ).limit(1);
  
  if (adminExists.length === 0) {
    const hash = await bcrypt.hash("bright-secret-2026", 10);
    await db.insert(usersTable).values({
      name: "ئەدمین",
      username: "admin",
      passwordHash: hash,
      department: "ئیدارە",
      badgeCode: "ADMIN001",
      role: "admin",
    });
    console.log("Admin user created");
  }

  console.log("Seeding complete!");
  await pool.end();
}

seed().catch(console.error);
