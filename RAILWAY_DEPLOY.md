# 🚂 دیپلۆی کتێبخانەی بڕایت لەسەر Railway

## پێشمەرجەکان

- هەژماری Railway: https://railway.app
- GitHub Repo ئەم پڕۆژەیەت

---

## گام بە گام

### گام ١ — داتابەیس PostgreSQL

١. لە Railway Dashboard کلیک بکە **New Project**
٢. هەڵبژێرە **Deploy PostgreSQL**
٣. دواتر لە Variables tab وەی داتابەیسەکە، `DATABASE_URL` بکۆپی بکە

---

### گام ٢ — دیپلۆی API Server

١. کلیک بکە **New Service → GitHub Repo**
٢. Repository-ەکەت هەڵبژێرە
٣. لە Settings زانیارییەکانی خوارەوە دابنێ:

**Build Command:**
```
pnpm install && pnpm --filter @workspace/api-server run build
```

**Start Command:**
```
node --enable-source-maps ./artifacts/api-server/dist/index.mjs
```

**Dockerfile Path (ئەگەر Docker بەکار دەهێنیت):**
```
Dockerfile.api
```

٤. لە **Variables** تابەکە ئەمانە زیاد بکە:

| ناو | بەها |
|-----|------|
| `DATABASE_URL` | بەستەری داتابەیسەکەت |
| `JWT_SECRET` | هەر نووسەیەکی درێژ و تایبەت |
| `PORT` | `8080` |
| `NODE_ENV` | `production` |

---

### گام ٣ — دیپلۆی Frontend

١. سێرڤیسی نوێی تریش زیاد بکە لە هەمان پڕۆژەکە
٢. هەمان Repository هەڵبژێرە
٣. لە Settings:

**Build Command:**
```
pnpm install && PORT=3000 BASE_PATH=/ pnpm --filter @workspace/bright-library run build
```

**Start Command:**
```
npx serve -s ./artifacts/bright-library/dist/public -l 3000
```

**Dockerfile Path (ئەگەر Docker بەکار دەهێنیت):**
```
Dockerfile.frontend
```

٤. لە **Variables**:

| ناو | بەها |
|-----|------|
| `PORT` | `3000` |
| `BASE_PATH` | `/` |
| `VITE_API_URL` | URL-ی API سێرڤیسەکەت (لە Railway دەستت پێدەگات) |

---

## تێبینییەکان

- **Database Migration:** دواتر لە دیپلۆی کردن, ئەم کۆمەندە بەکار بهێنە:
  ```
  pnpm --filter @workspace/db run push
  ```
- **Admin Account:** دواتر لە migration, admin دروست دەکرێت:
  - Username: `admin`
  - Password: `admin1234`
  - **پاشگەڕانەوەی پێویست:** تێپەڕەوشەکە لە پانێلی ئەدمین دەگۆڕیت

---

## دیاریکردنی وەشانی pnpm

فایلی `package.json` ئێستا `"packageManager": "pnpm@10.26.1"` تێدایە، ئەمەش کێشەی  
**`Failed to resolve version 9 of pnpm`** چارەسەر دەکات.
