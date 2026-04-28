# دیپلۆی کتێبخانەی بڕایت لەسەر Railway

## تەنها ٢ فاریبڵ پێویستە

| فاریبڵ | بەها |
|--------|------|
| `DATABASE_URL` | بەستەری داتابەیس (Railway دابین دەکات) |
| `JWT_SECRET` | هەر نووسەیەکی درێژ، نموونە: `bright-library-secret-2026` |

هەموو شتی تر لە Dockerfile دادەنێرێت.

---

## گام بە گام

### گام ١ — داتابەیس

١. بچۆ [railway.app](https://railway.app) → **New Project** → **Deploy PostgreSQL**
٢. لە Variables tab: `DATABASE_URL` بکۆپی بکە

---

### گام ٢ — ئەپ (هەردووی API + ڕووکار یەک سێرڤیسە)

١. لە هەمان پڕۆژەکە: **+ New → GitHub Repo**
٢. Repository-ەکەت هەڵبژێرە
٣. بچۆ **Settings → Build**:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `Dockerfile`
٤. بچۆ **Variables** و ئەمانە زیاد بکە:

```
DATABASE_URL  =  [لێرەوە لە PostgreSQL سێرڤیس کۆپی بکە]
JWT_SECRET    =  bright-library-secret-2026
```

٥. **Deploy** کلیک بکە — چاوەڕێ بکە تا build تەواو بێت (~٣-٥ خولەک)

---

### گام ٣ — مایگریشن داتابەیس

دواتر لە دیپلۆیکردن، بچۆ:  
**Settings → Deploy → Pre-deploy Command**:

```
pnpm --filter @workspace/db run push
```

---

## دواتر لە دیپلۆی

- **ئادمین**: ناوی بەکارهێنەر `admin` / تێپەڕەوشە `admin1234`
- **گرینگ**: تێپەڕەوشەکە دەگۆڕیت لە پانێلی ئادمین
