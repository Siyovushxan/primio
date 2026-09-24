# Primio

Primio — toifalar ichida kunlik taklif bo‘yicha saralanadigan reklama katalogi. Landingdagi reyting va narxlar interaktiv **namuna**; haqiqiy reklamalar va ularning statistikasi `/browse` hamda foydalanuvchi kabinetida ko‘rsatiladi.

## Ishga tushirish

```powershell
npm install
npm run dev
```

`http://127.0.0.1:3000` — landing; `/dashboard/demo` — hisobga kirmasdan ko‘riladigan namuna kabinet. Test va build:

```powershell
npm test
npx tsc --noEmit --incremental false
npm run build
```

## Biznes qoidalari

- Reklamalar toifasi ichida tartiblanadi: kunlik taklif yuqori bo‘lsa oldinda; teng taklifda avval faollashgan reklama oldinda; so‘ng ID bilan barqaror tartib.
- Faol muddati tugagan reklama reyting va katalogdan chiqariladi. `CRON_SECRET` bilan himoyalangan `/api/cron/expire-ads` holatni `expired` ga o‘tkazadi.
- Dastlabki to‘lov: kunlik taklif × tanlangan kunlar. Stavkani oshirish: (yangi − eski stavka) × qolgan kunlar, to‘liq bo‘lmagan kun yuqoriga yaxlitlanadi. Uzaytirishda **tanlangan yangi kunlar** qo‘llanadi.
- Moderatsiya tasdig‘i bir soat amal qiladi va reklama sarlavhasi, tavsifi, sayti hamda rasm URLi bilan bog‘langan. Server foydalanuvchi yuborgan `moderationPassed` bayrog‘ini qabul qilmaydi.
- Dodo to‘lovi server hisoblagan buyurtma bilan bog‘lanadi. Webhook va muvaffaqiyat sahifasidagi tekshiruv bir vaqtda kelsa, bitta tranzaksiya hisoblanadi. Bekor qilingan yoki kontenti o‘zgargan buyurtmaning kechikkan to‘lovi alohida ko‘rib chiqishga yuboriladi.
- Yangi hisobning to‘langan reklamasi `pending_verification` bo‘ladi; pullik muddat administrator tasdig‘idan so‘ng boshlanadi. Administrator huquqi Firebase Auth `admin: true` custom claim orqali beriladi.
- Muvaffaqiyatli refund hisoblangan xarajatni kamaytiradi. To‘liq qaytarilgan joriy to‘lov reklamani to‘xtatadi va qo‘lda ko‘rib chiqish belgisi qo‘yadi.
- Ko‘rilish kartochka ekranda kamida 50% ko‘rinib bir soniya turganda, bosish esa saytga o‘tish bosilganda qayd etiladi. Ikkalasi ham qisqa intervalda deduplikatsiya qilinadi.

## Xizmatlar va sozlamalar

Firebase web konfiguratsiyasi, Firebase Admin credentials, `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `DODO_PRODUCT_ID`, `NEXT_PUBLIC_BASE_URL` va `CRON_SECRET` kerak. Dodo mahsuloti bir martalik to‘lov va **Pay What You Want** dinamik narx uchun sozlangan bo‘lishi kerak; aks holda product cart dagi `amount` e’tiborsiz qoldiriladi. Test va live Dodo credentials/mode bir xil muhitga tegishli bo‘lsin. `DODO_LIVE_MODE=true` faqat production sozlanganda qo‘yiladi.

Firestore qoidalari va indekslari `firestore.rules` hamda `firestore.indexes.json` da. Dashboarddagi reklama, tranzaksiya va kunlik statistika so‘rovlari faqat egasining UIDiga cheklangan. Administrator bo‘ladigan hisobga custom claim berilishi, `/api/payment/webhook` Dodo panelida `payment.succeeded` va `refund.succeeded` eventlari uchun ro‘yxatdan o‘tishi, `/api/cron/expire-ads` muntazam chaqirilishi kerak. `trackingLimits.expiresAt` maydoniga Firestore TTL yoqilishi kerak.

## Hozirgi cheklovlar

- Tashqi AI moderatsiya va rasm hosting oqimi mavjud kodda xAI, Hugging Face va ImgBB ga uzatadi. Bu ikki marshrutning yangi tasdiq/rasm bog‘lash qismi alohida ruxsatgacha ulanmagan. Reklama formasi tasdiqni ololmaganda xatolik ko‘rsatadi va server reklama yaratishga ruxsat bermaydi.
- Real Firebase va Dodo hisoblari bilan to‘liq end-to-end to‘lov sinovi, Firebase qoidalarini deploy qilish, admin claim berish va webhook/cron konfiguratsiyasi bajarilmagan. Ular live ishga tushirishdan oldin alohida tekshirilishi kerak.
- Avval yaratilgan, `paymentOrders` hujjati bo‘lmagan to‘lovlar avtomatik yarashtirilmaydi; qo‘lda moslashtirish zarur. `paymentReviewRequired` belgilangan reklamalar administrator kabinetidagi to‘lov tekshiruvi navbatida chiqadi.
- `/api/cron/weekly-report` va `/api/admin/notify-waitlist` avvalgi email funksiyalari sifatida qolgan. Ularning foydalanuvchiga xabar yuborish siyosati va hisobot mazmuni alohida mahsulot qarorini talab qiladi.
