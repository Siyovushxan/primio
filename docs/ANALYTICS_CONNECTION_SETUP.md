# Google Analytics ulanishini production’da sozlash

Google Analytics OAuth kalitlari Primio kodiga qo‘shilmaydi. Ularni Google Cloud va Vercel’da loyiha egasi sozlashi kerak. Kalitlar sozlanmaguncha kabinetda Primio ichidagi ko‘rsatkichlar ishlaydi, Google bo‘limi esa ulanish hali tayyor emasligini aytadi.

## Google Cloud sozlamalari

1. Google Cloud’da Primio uchun loyiha tanlang yoki yarating.
2. Google Analytics Data API va Google Analytics Admin API’ni yoqing.
3. OAuth consent screen’da ilova nomi, aloqa manzili va `primio.com.uz` domenini kiriting. Foydalanuvchidan faqat Google Analytics ma’lumotini o‘qish ruxsati so‘raladi.
4. OAuth Client ID’ni Web application turi bilan yarating.
5. Authorized redirect URI sifatida aynan `https://www.primio.com.uz/api/analytics/google/callback` ni kiriting.
6. `analytics.readonly` scope sezgir ruxsat hisoblanadi. Production’da ommaviy foydalanuvchilar ulanishidan oldin Google OAuth verification talab qilishi mumkin. Google tekshiruv holati tasdiqlanmaguncha ulanish test foydalanuvchilari bilan cheklangan bo‘lishi mumkin.

## Vercel production environment

Quyidagi qiymatlarni Vercel Project → Settings → Environment Variables’da **Production** uchun qo‘shing. Preview muhitida sinov qilinsa, o‘sha muhitga alohida OAuth client va callback URL sozlang.

- `GOOGLE_ANALYTICS_CLIENT_ID` — Google yaratgan client ID.
- `GOOGLE_ANALYTICS_CLIENT_SECRET` — maxfiy client kaliti. Uni hech qayerga yubormang yoki repoga kiritmang.
- `GOOGLE_ANALYTICS_REDIRECT_URI` — `https://www.primio.com.uz/api/analytics/google/callback`.
- `ANALYTICS_TOKEN_ENCRYPTION_KEY` — refresh tokenlarni AES-256-GCM bilan shifrlash kaliti. Uni lokal terminalda `openssl rand -base64 32` bilan yarating va faqat Vercel’ga kiriting. Oldindan mavjud kalit almashtirilsa, avvalgi tokenlarni o‘qib bo‘lmaydi; foydalanuvchilar qayta ulanishi kerak.

XAI sozlamasi mavjud bo‘lsa, ixtiyoriy AI xulosasi `XAI_API_KEY` bilan ishlaydi. Ulanish yoki asosiy analitika uchun xAI kaliti shart emas. Foydalanuvchi har safar xulosa so‘rashdan oldin roziligini belgilaydi.

Environment variable qo‘shilgach, production deployment’ni qayta build/deploy qiling. Keyin ro‘yxatda bor ruxsatli Google Analytics property bilan ulanishni tekshiring. OAuth kalitlarini chatda yoki GitHub’da ulashmang.
