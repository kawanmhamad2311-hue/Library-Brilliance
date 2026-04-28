# دیپلۆی کتێبخانەی بڕایت لەسەر Railway

## ئامادەکاری: سێ سێرڤیس پێویستە

| سێرڤیس | بەکارهێنان | Dockerfile |
|--------|-----------|------------|
| **PostgreSQL** | داتابەیس | Railway دابین دەکات |
| **API Server** | باکئەند | `Dockerfile.api` |
| **Frontend** | ڕووکار | `Dockerfile.frontend` |

---

## گام ١ — داتابەیس PostgreSQL

١. بچۆ [railway.app](https://railway.app) → **New Project**
٢. هەڵبژێرە **Deploy PostgreSQL**
٣. لە **Variables** tab، `DATABASE_URL` بکۆپی بکە — پاشتر پێویستت دەبێت

---

## گام ٢ — API Server

١. لە هەمان پڕۆژەکە کلیک بکە **+ New → GitHub Repo**
٢. Repository-ەکەت هەڵبژێرە
٣. بچۆ **Settings → Build**:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `Dockerfile.api`
٤. بچۆ **Settings → Deploy**:
   - **Start Command**: _(خاڵی بهێڵەوە، Dockerfile خۆی دیاری دەکات)_
٥. بچۆ **Variables** و ئەمانە زیاد بکە:

```
DATABASE_URL   = [لێرەوە کۆپی بکە لە PostgreSQL سێرڤیسەکە]
JWT_SECRET     = [هەر نووسەیەکی درێژ و ناسراو، نموونە: my-super-secret-key-2026]
NODE_ENV       = production
PORT           = 8080
```

٦. کلیک بکە **Deploy** — چاوەڕێ بکە تا build تەواو بێت
٧. دواتر لە **Settings → Networking**: دۆمەینی پڕۆژەکەت کۆپی بکە، نموونە:
   `https://bright-api.up.railway.app`

---

## گام ٣ — Frontend

١. دووبارە کلیک بکە **+ New → GitHub Repo** (هەمان Repository)
٢. بچۆ **Settings → Build**:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `Dockerfile.frontend`
٣. بچۆ **Variables**:

```
PORT           = 3000
VITE_API_URL   = https://bright-api.up.railway.app
```
> `VITE_API_URL` ئەو دۆمەینەیە کە لە گام ٢ کۆپیت کردووە

٤. کلیک بکە **Deploy**

---

## گام ٤ — مایگریشن داتابەیس

دواتر لە دیپلۆیکردنی API Server، لە **Railway Dashboard → API Service → Settings → Deploy**:

لە **Pre-deploy Command**:
```
pnpm --filter @workspace/db run push
```

ئەمەش تەبڵۆکانی داتابەیس دروست دەکات و ئادمینی دەفاولت زیاد دەکات.

---

## گام ٥ — دەستکردن بە ئادمین

دواتر لە دیپلۆی:
- **ناوی بەکارهێنەر**: `admin`
- **تێپەڕەوشە**: `admin1234`

> **گرینگ**: دواتر لە یەکەم چوونەژوورەوە، تێپەڕەوشەکە دەگۆڕیت

---

## تێبینی دەربارەی کێشەی `Failed to resolve version 9 of pnpm`

ئەم کێشەیە چارەسەر کراوە. `package.json` ئێستا هەیەتی:
```json
"packageManager": "pnpm@10.26.1"
```
Railway ئێستا دەزانێت کام وەشانی pnpm بەکار بهێنێت.
