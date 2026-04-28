# دیپلۆی کتێبخانەی بڕایت لەسەر Railway

## تەنها ٢ فاریبڵ پێویستە

| فاریبڵ | بەها |
|--------|------|
| `DATABASE_URL` | بەستەری داتابەیس (Railway دابین دەکات) |
| `JWT_SECRET` | هەر نووسەیەکی درێژ، نموونە: `bright-library-secret-2026` |

هەموو شتی تر خۆکارە — migration داتابەیس، build، و سێرڤ کردنی ڕووکار.

---

## گام بە گام

### گام ١ — داتابەیس

١. بچۆ [railway.app](https://railway.app) → **New Project** → **Deploy PostgreSQL**
٢. لە Variables tab: `DATABASE_URL` کۆپی بکە (یان Railway Variable Reference بەکار بهێنە)

---

### گام ٢ — ئەپ (هەردووی API + ڕووکار یەک سێرڤیسە)

١. لە هەمان پڕۆژەکە: **+ New → GitHub Repo**
٢. Repository-ی `Library-Brilliance` هەڵبژێرە
٣. بچۆ **Settings → Build**:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `Dockerfile`
٤. بچۆ **Variables** و ئەمانە زیاد بکە:

```
DATABASE_URL  =  [لێرەوە لە PostgreSQL سێرڤیس کۆپی بکە]
JWT_SECRET    =  bright-library-secret-2026
```

٥. **Deploy** کلیک بکە

> **تێبینی:** دەمێک build دەکات (~٣-٥ خولەک). کاتی دەستپێکردن، migration خۆکار ئەجرا دەبێت.

---

## دواتر لە دیپلۆی

- **ئادمین**: ناوی بەکارهێنەر `admin` / تێپەڕەوشە `admin1234`
- **گرینگ**: تێپەڕەوشەکە لە پانێلی ئادمین دەگۆڕیت

---

## نوێکردنەوەی ئەپەکە دواتر

هەر جارێک گۆڕانکاریت کرد لە Replit، لە Shell بنووسە:

```bash
./deploy.sh "پەیامی دەگۆڕان"
```

Railway خۆکار دووبارە دیپلۆی دەکات.
