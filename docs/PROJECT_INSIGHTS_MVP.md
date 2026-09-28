# Primio Loyiha tahlili — bajariladigan talablar

## Mahsulot natijasi

Biznes egasi sayt yoki ijtimoiy loyiha havolasini qo‘shadi. Primio loyiha kartasini ko‘rsatadi, Primio ichidagi reklama natijalarini o‘lchaydi va egasi ruxsat bergan sayt analitikasini alohida ulash imkonini beradi. Har bir natija manba, davr va yangilangan vaqt bilan ko‘rsatiladi. Raqam topilmasa, nol deb ko‘rsatilmaydi.

## MVP talablari

1. **Primio ko‘rsatkichlari** alohida: reklama kartasi ko‘rilishi, Primio loyiha sahifasi ko‘rilishi, Primio’dan tashqi havolaga bosish. Hisob mavjud tracking oqimidan olinadi.
2. **Google Analytics 4 ulanishi** ixtiyoriy, OAuth 2.0 orqali va `analytics.readonly` doirasida. Google paroli so‘ralmaydi. Egasi faqat o‘zi kira oladigan property’lardan birini tanlaydi.
3. **GA4 hisobotlari** tanlangan bugun/kecha/7 kun/30 kun yoki sana oralig‘ida `activeUsers`, `newUsers`, `screenPageViews`, `sessions` va `click` hodisalari sonini ko‘rsatadi; mamlakat bo‘yicha faol foydalanuvchilar va kunlik qatorlar ham bor. “Yangi foydalanuvchi” ro‘yxatdan o‘tgan hisob degani emas. Click hodisasi bo‘lmasa “mavjud emas” deb ko‘rsatiladi.
4. **Domen sanasi** analitikadan alohida bo‘limda. RDAP ma’lumoti domen ro‘yxat sanasini tasdiqlaydi, sayt ishga tushgan sanani emas. Topilmasa “aniqlanmadi”.
5. **Hisobot yorliqlari** har bir manba, qamrab olingan sana va so‘nggi so‘rov vaqti bilan.
6. **AI tavsiyasi** faqat reklama beruvchi ixtiyoriy ravishda rozilik berib tugmani bosganda yaratiladi. xAI’ga faqat umumlashtirilgan sonlar jo‘natiladi; URL, shaxsga doir ma’lumot, hisob identifikatori yoki xom analitika jo‘natilmaydi. Rozilik berilmasa, o‘lchovlar baribir ishlaydi.
7. **Ulanish holatlari**: ulanmagan, property tanlanmagan, yuklanmoqda, manbada ma’lumot yo‘q, kirish ruxsati bekor qilingan, xizmat vaqtincha ishlamayapti.
8. **Maxfiylik**: Google refresh token AES-256-GCM bilan serverda shifrlanadi; token va OAuth state Firestore mijozidan yopiq; ma’lumot har bir Firebase hisob UID’siga tegishli; uzish tokenni o‘chiradi va Google tokenini bekor qilishga urinadi.
9. **Soddalik**: Google ulash ixtiyoriy. Ulanmagan holatda Primio hisoboti ishlaydi. 7 kunlik bepul huquq to‘lovga aylanmaydi va Google’ga ulanishni talab qilmaydi.

## Ko‘rsatkich ta’riflari

| Ko‘rsatkich | Manba | Izoh |
| --- | --- | --- |
| Reklama ko‘rinishi | Primio | Reklama kartasi ko‘ringan holatlar |
| Loyiha sahifasi ko‘rilishi | Primio | Primio’da loyiha ma’lumoti ochilishi |
| Tashqi bosish | Primio | Primio orqali sayt/sahifa havolasi bosilishi; borish sahifasida ochilish tasdig‘i emas |
| Sayt sahifasi ko‘rilishi | GA4 | Ulangan GA4 property’dagi `screenPageViews` |
| Faol/yangi foydalanuvchilar | GA4 | GA4 ta’rifi; ro‘yxatdan o‘tgan hisoblar soni emas |
| Sessiyalar | GA4 | GA4 ta’rifi; tashrifchilar soni bilan aynan bir xil emas |
| Click hodisasi | GA4 | Faqat GA4 property’da qayd etilgan `click` hodisasi; o‘lchov yoqilmagan bo‘lsa mavjud emas |
| Davlatlar | GA4 | GA4’da mavjud davlat qatorlari, faqat yig‘ma holda |
| Yosh guruhlari | MVP emas | Faqat manba bersa va maxfiylik chegarasidan o‘tsa keyin qo‘shiladi |
| Ro‘yxatdan o‘tgan hisoblar | GA4 emas | Faqat biznesning o‘z hisob tizimi alohida umumiy sonni bersa keyin ulanadi |

## Qabul qilish mezonlari

- Ruxsatsiz API so‘rovi 401 qaytaradi; boshqa hisobning analitikasiga so‘rov berib bo‘lmaydi.
- Hisobot Primio tracking’ini GA4 natijasiga qo‘shib bitta raqam qilmaydi.
- GA4 so‘rovidagi sana oralig‘i 90 kundan oshmaydi, teskari davr qabul qilinmaydi.
- Har bir raqamning manbasi va davri ko‘rinadi; ma’lumot berilmagan holatda `0` o‘ylab topilmaydi.
- Yosh, shaxsiy harakat tarixi, ism, telefon yoki elektron pochta ko‘rsatilmaydi.
- Google OAuth kalitlari bo‘lmasa, ulanish amalga oshmaydi va interfeys buni ochiq aytadi.
- 7 kunlik bepul muddat reklama to‘lovini avtomatik boshlamaydi.

## MVP tashqarisida

Raqobatchining maxfiy trafiki, to‘liq ro‘yxatdan o‘tganlar soni, foydalanuvchi yoshi, CRM’lar, umumiy bozor reytingi va trafik kafolati. Bu ma’lumotlar ishonchli, ruxsatli manbasiz ko‘rsatilmaydi.
