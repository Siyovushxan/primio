# PRIMIO: sodda reklama va 168 soatlik TOP taklifi

Havola → toifa → kunlik narx → AI tekshiruvi → to‘lov → faol reklama.
Profil majburiy emas. Boshlang‘ich muddat 1 kun. Sarlavha havoladagi domen nomidan olinadi. Rasm yuklanmasa, domen nomidan sodda muqova yaratiladi; ushbu muqova ham mavjud yuklash va AI tekshiruv oqimidan o‘tadi. Foydalanuvchi sarlavha, izoh, rasm va muddatni o‘zgartirishi mumkin.

## Narx qoidalari

- Oddiy reklama: kamida $1/kun; yuqori o‘rin kafolatlanmaydi.
- Bo‘sh toifadagi TOP-1: $1/kun.
- Raqobatli toifadagi TOP-1: eng yuqori **joriy reyting taklifi + $0.01**.
- Teng taklifda avval faollashgan reklama ustun; so‘ng ID bilan barqaror tartib.
- Muddati tugagan reklama TOP narxi va reytingdan darhol chiqadi. Tarixiy rekord narx saqlanmaydi.
- TOP narxi $10,000 chegarasidan oshsa, yangi TOP taklifi mavjud emas. Noto‘g‘ri, chegaradan tashqari narx olinmaydi.
- Toifa tanlash faqat shu toifadagi faol reklamalarni hisobga oladi.

## Foydalanuvchi tasdiqlagan muddat

**Pasayish 168 soatdan keyin boshlanadi.** Birinchi pasayish 169-soatda, keyin har soatda. Pasayishning boshlang‘ich davomiyligi 24 soat qilib belgilandi: 192-soatda reyting taklifi $1 ga yetadi. Bu birinchi o‘rinda 168 soat qolish kafolati emas: raqobatchi oldinroq yuqori taklif berishi mumkin.

`B` — to‘langan kunlik narx (sent), `h` — 168 soatdan keyingi to‘liq soatlar:

`rankingStrength = 100 + ceil((B - 100) × max(0, 1 - h / 24))`

Masalan, $25 taklifning kuchi:

| To‘langan taklifdan keyingi vaqt | Joriy kuch | Boshqa reklama uchun TOP-1 |
|---|---:|---:|
| 0–168 soat | $25.00 | $25.01 |
| 169 soat | $24.00 | $24.01 |
| 174 soat | $19.00 | $19.01 |
| 180 soat | $13.00 | $13.01 |
| 192 soat | $1.00 | $1.01 |

Jadval bitta uzoq muddatli reklama va yangi raqib yo‘q holat uchun. Boshqa reklamaning joriy kuchi yuqoriroq bo‘lsa, TOP narxi o‘sha reklama asosida aniqlanadi. Bir kunlik reklama 24 soatdan keyin tugaydi: uni yuqori narxi uchun 168 soat kutish kerak emas. Reklama muddatidan oldin tugasa, jadvalning keyingi qatorlari qo‘llanmaydi.

## To‘lov va reyting alohida

`dailyBidCents` hisob-kitob uchun asl kunlik narxdir. `rankingBidCents()` vaqt o‘tishi bilan o‘zgaradigan reyting kuchidir. Pasayish eski to‘lovni kamaytirmaydi, pul qaytarmaydi, reklama muddatini o‘zgartirmaydi va avtomatik to‘lov olmaydi.

Taklifni oshirishda to‘lov avvalgi **asl** narx va yangi narx farqi × qolgan kunlar orqali olinadi. Arzon, pasaygan reyting kuchi eski to‘lovning o‘rniga ishlatilmaydi. Muddati tugagan reklama yangi, pastroq kunlik narxda qayta joylashtirilishi mumkin.

`rankingBidAt` faqat muvaffaqiyatli, tasdiqlangan pulli faollashtirish/yangilash/oshirishdan keyin server vaqtiga qo‘yiladi. Sahifani ochish, formani o‘zgartirish, checkout yaratish va takroriy webhook soatni qayta boshlamaydi. Boshqa reklamaning to‘lovi ushbu reklamaning soatini qayta boshlamaydi. Yangi raqibning o‘z pulli taklifi yangi 168 soatlik muddatga ega bo‘ladi.

## Mavjud reklamalarga moslik

Yangi to‘lov buyurtmasi `rankingVersion: 2` oladi. Avval to‘langan yoki ochilgan eski buyurtmalarning mavjud qoidalari saqlanadi. Barcha eski reklamalarni avtomatik pasaytirish uchun migratsiya qo‘shilmagan. Mavjud bepul hafta va vaqtinchalik bepul oshirishlar o‘z chegaralari bilan ishlaydi; bepul oshirish pulli pasayish soatini yangilamaydi.

Public API reytingning hisoblash uchun zarur vaqt va versiyasini yuboradi. Public sahifalar va taxminiy o‘rin bir xil algoritmdan foydalanadi. Firestore `rankings` kolleksiyasidagi eski Cloud Function snapshotlari ushbu yangi reyting uchun manba emas; UI ulardan foydalanmaydi. Timer asosidagi avtomatik bildirishnomalar bu o‘zgarishga kiritilmagan.

## Jonli narx va tekshiruv

Narx har bir hisoblashda joriy vaqt bilan aniqlanadi; cron kerak emas. Public API keshi 15+15 soniya, UI yangilanishi 30 soniya: ekranda qisqa kechikish bo‘lishi mumkin. To‘lovdan oldin ko‘rsatilgan o‘rin taxminiy, bron emas. Bir vaqtda ikkita odam to‘lasa, haqiqiy taklif va faollashish vaqti tartibni belgilaydi. TOP-1 uchun yangi odam avvalgi katta narxni tenglashtirishi shart emas — joriy kuchdan oshirishi yetarli.

29 biznes testi: 168/169/192 soat, $1 chegarasi, hisob-kitobga ta’sir qilmaslik, eski buyurtmalar, bepul oshirish, teng narx, muddat tugashi, narx chegarasi, arzon yangilash, faqat tasdiqlangan to‘lovda soatni boshlash va webhook takrorlanishi. TypeScript, o‘zgargan fayllar lint va production build tekshiriladi. Real Firebase/AI/to‘lov oqimini tasdiqlash uchun Vercel preview yoki production muhitida tekshiruv talab etiladi; lokal mock to‘lov haqiqiy bank operatsiyasi tasdig‘i emas.
