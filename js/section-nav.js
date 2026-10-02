/* A labeled page outline: persistent on desktop, collapsible on smaller screens. */
(() => {
  'use strict';
  // Shared label order keeps this outline independent of page translation bundles.
  // Caption and navigation accessible name use the same first entry.
  const words = {
    en: 'On this page|Introduction|Service guide|About|Services|Sourcing|Styling|Custom Wardrobe|How it works|Directory|Lookbook|Gift styling|Group orders|Boutiques|Contact|Selected work|Styling prices|Process|Sourcing & estimate|Explore|Overview|The Trace|Buying fees|When work begins|Find your service',
    vi: 'Trên trang này|Giới thiệu|Hướng dẫn dịch vụ|Về tôi|Dịch vụ|Mua hộ|Tư vấn phong cách|Tủ đồ riêng|Cách thức hoạt động|Danh bạ|Bộ sưu tập phong cách|Tư vấn phong cách làm quà|Đơn hàng nhóm|Cửa hàng thời trang|Liên hệ|Dự án tiêu biểu|Giá tư vấn phong cách|Quy trình|Mua hộ & ước tính|Khám phá|Tổng quan|Truy tìm nguồn hàng|Phí mua hàng|Khi nào bắt đầu|Tìm dịch vụ phù hợp',
    zh: '本页内容|简介|服务指南|关于|服务|代购服务|造型搭配|专属衣橱|服务流程|名录|穿搭图集|造型礼赠|团体订单|精品店|联系|精选作品|造型价格|流程|代购与估价|探索|概览|溯源寻货|代购费用|何时开始服务|查找适合的服务',
    es: 'En esta página|Introducción|Guía de servicios|Acerca de|Servicios|Compra por encargo|Asesoría de estilo|Armario personalizado|Cómo funciona|Directorio|Catálogo de looks|Asesoría de estilo para regalar|Pedidos grupales|Boutiques|Contacto|Trabajos destacados|Precios de asesoría de estilo|Proceso|Compra y presupuesto|Explorar|Resumen|Rastreo de productos|Comisiones de compra|Cuándo comienza el trabajo|Encuentra tu servicio',
    ar: 'في هذه الصفحة|مقدمة|دليل الخدمات|نبذة|الخدمات|الشراء بالنيابة|تنسيق الأزياء|خزانة ملابس مخصصة|كيف نعمل|الدليل|كتالوج الإطلالات|تنسيق الأزياء كهدية|طلبات المجموعات|متاجر الأزياء|تواصل|أعمال مختارة|أسعار تنسيق الأزياء|الخطوات|الشراء وتقدير التكلفة|استكشف|نظرة عامة|تتبع مصدر المنتج|رسوم الشراء|متى يبدأ العمل|اعثر على خدمتك',
    fr: 'Sur cette page|Introduction|Guide des services|À propos|Services|Achat sur demande|Conseil en style|Garde-robe sur mesure|Comment ça marche|Annuaire|Carnet de looks|Conseil en style à offrir|Commandes groupées|Boutiques|Contact|Réalisations choisies|Tarifs du conseil en style|Étapes|Achat et estimation|Explorer|Vue d’ensemble|Recherche de provenance|Frais d’achat|Quand le travail commence|Trouvez votre service',
    pt: 'Nesta página|Introdução|Guia de serviços|Sobre|Serviços|Compra assistida|Consultoria de estilo|Guarda-roupa personalizado|Como funciona|Diretório|Catálogo de looks|Consultoria de estilo para presentear|Pedidos em grupo|Boutiques|Contato|Trabalhos selecionados|Preços da consultoria de estilo|Processo|Compra e orçamento|Explorar|Visão geral|Rastreamento de produtos|Taxas de compra|Quando o trabalho começa|Encontre seu serviço',
    ru: 'На этой странице|Введение|Гид по услугам|О нас|Услуги|Покупка на заказ|Подбор стиля|Индивидуальный гардероб|Как это работает|Справочник|Каталог образов|Стилист в подарок|Групповые заказы|Бутики|Контакты|Избранные работы|Цены на подбор стиля|Процесс|Покупка и оценка стоимости|Обзор разделов|Обзор|Поиск источника товара|Комиссии за покупку|Когда начинается работа|Найдите свою услугу',
    ja: 'このページの内容|はじめに|サービスガイド|私たちについて|サービス|購入代行|スタイリング|オーダーメイドのワードローブ|ご利用の流れ|店舗一覧|ルックブック|スタイリングの贈り物|グループ注文|ブティック|お問い合わせ|実績紹介|スタイリング料金|手順|購入代行とお見積もり|もっと見る|概要|商品の出所調査|購入代行手数料|サービス開始のタイミング|サービスを選ぶ',
    de: 'Auf dieser Seite|Einführung|Serviceleitfaden|Über uns|Leistungen|Einkaufsservice|Stilberatung|Individuelle Garderobe|So funktioniert es|Verzeichnis|Lookbook|Stilberatung verschenken|Gruppenbestellungen|Boutiquen|Kontakt|Ausgewählte Arbeiten|Preise der Stilberatung|Ablauf|Einkauf und Kostenschätzung|Entdecken|Überblick|Herkunftsrecherche|Einkaufsgebühren|Wann die Arbeit beginnt|Passenden Service finden',
    ko: '이 페이지에서|소개|서비스 안내|브랜드 소개|서비스|구매 대행|스타일링|맞춤 옷장|이용 방법|매장 목록|룩북|스타일링 선물|단체 주문|부티크|문의|주요 작업|스타일링 가격|진행 과정|구매 대행 및 견적|둘러보기|개요|상품 출처 추적|구매 수수료|작업 시작 시점|나에게 맞는 서비스',
    hi: 'इस पृष्ठ पर|परिचय|सेवा मार्गदर्शिका|हमारे बारे में|सेवाएँ|खरीदारी में सहायता|स्टाइल परामर्श|व्यक्तिगत वॉर्डरोब|यह कैसे काम करता है|निर्देशिका|लुकबुक|उपहार में स्टाइल परामर्श|समूह ऑर्डर|बुटीक|संपर्क|चुनिंदा काम|स्टाइल परामर्श की कीमतें|प्रक्रिया|खरीदारी और अनुमान|और देखें|अवलोकन|उत्पाद के स्रोत की खोज|खरीद शुल्क|काम कब शुरू होता है|अपनी सेवा खोजें',
    id: 'Di halaman ini|Pengantar|Panduan layanan|Tentang|Layanan|Jasa pembelian|Penataan gaya|Koleksi pakaian pribadi|Cara kerja|Direktori|Katalog gaya|Hadiah penataan gaya|Pesanan kelompok|Butik|Kontak|Karya pilihan|Harga penataan gaya|Proses|Pembelian & perkiraan biaya|Jelajahi|Ringkasan|Penelusuran asal produk|Biaya pembelian|Kapan pekerjaan dimulai|Temukan layanan Anda',
    th: 'ในหน้านี้|บทนำ|คู่มือบริการ|เกี่ยวกับเรา|บริการ|บริการจัดซื้อสินค้า|จัดสไตล์|ตู้เสื้อผ้าเฉพาะคุณ|ขั้นตอนการใช้บริการ|ทำเนียบร้านค้า|ลุคบุ๊ก|บริการจัดสไตล์เป็นของขวัญ|คำสั่งซื้อแบบกลุ่ม|บูติก|ติดต่อ|ผลงานคัดสรร|ราคาจัดสไตล์|กระบวนการ|จัดซื้อและประเมินราคา|สำรวจ|ภาพรวม|สืบหาแหล่งสินค้า|ค่าธรรมเนียมการซื้อ|เริ่มงานเมื่อใด|ค้นหาบริการที่เหมาะกับคุณ',
    it: 'In questa pagina|Introduzione|Guida ai servizi|Chi siamo|Servizi|Acquisto su richiesta|Consulenza di stile|Guardaroba personalizzato|Come funziona|Elenco negozi|Catalogo di look|Consulenza di stile in regalo|Ordini di gruppo|Boutique|Contatti|Lavori selezionati|Prezzi della consulenza di stile|Procedura|Acquisto e preventivo|Esplora|Panoramica|Ricerca della provenienza|Commissioni di acquisto|Quando inizia il lavoro|Trova il tuo servizio',
    tr: 'Bu sayfada|Giriş|Hizmet rehberi|Hakkımızda|Hizmetler|Satın alma desteği|Stil danışmanlığı|Kişiye özel gardırop|Nasıl çalışır|Dizin|Stil kataloğu|Hediye stil danışmanlığı|Grup siparişleri|Butikler|İletişim|Seçilmiş çalışmalar|Stil danışmanlığı fiyatları|Süreç|Satın alma ve tahmin|Keşfet|Genel bakış|Ürün kaynağı araştırması|Satın alma ücretleri|İş ne zaman başlar|Hizmetinizi bulun',
    tl: 'Sa pahinang ito|Panimula|Gabay sa mga serbisyo|Tungkol sa amin|Mga serbisyo|Serbisyo ng pagbili|Pag-aayos ng estilo|Personal na koleksiyon ng damit|Paano ito gumagana|Direktoryo|Katalogo ng mga porma|Regalong pag-aayos ng estilo|Mga order ng grupo|Mga boutique|Makipag-ugnayan|Mga piling gawa|Presyo ng pag-aayos ng estilo|Proseso|Pagbili at pagtataya|Tuklasin|Pangkalahatang-ideya|Pagsubaybay sa pinagmulan|Mga bayad sa pagbili|Kailan magsisimula ang trabaho|Hanapin ang iyong serbisyo',
    pl: 'Na tej stronie|Wprowadzenie|Przewodnik po usługach|O nas|Usługi|Zakup na zamówienie|Stylizacja|Indywidualna garderoba|Jak to działa|Katalog|Katalog stylizacji|Stylizacja w prezencie|Zamówienia grupowe|Butiki|Kontakt|Wybrane realizacje|Ceny stylizacji|Przebieg|Zakup i wycena|Odkrywaj|Przegląd|Badanie pochodzenia produktu|Opłaty za zakup|Kiedy zaczyna się praca|Znajdź swoją usługę',
    nl: 'Op deze pagina|Inleiding|Dienstengids|Over ons|Diensten|Aankoopservice|Stijladvies|Persoonlijke garderobe|Hoe het werkt|Adresboek|Lookbook|Stijladvies cadeau|Groepsbestellingen|Boetieks|Contact|Geselecteerd werk|Tarieven voor stijladvies|Werkwijze|Aankoop en kostenraming|Ontdekken|Overzicht|Herkomstonderzoek|Aankoopkosten|Wanneer het werk begint|Vind jouw dienst',
    fa: 'در این صفحه|مقدمه|راهنمای خدمات|درباره ما|خدمات|خرید به‌نمایندگی|مشاوره استایل|کمد لباس شخصی|نحوه کار|فهرست|دفترچه استایل|مشاوره استایل هدیه|سفارش‌های گروهی|بوتیک‌ها|تماس|کارهای منتخب|قیمت‌های مشاوره استایل|روند کار|خرید و برآورد هزینه|کاوش|نمای کلی|ردیابی منبع کالا|کارمزد خرید|زمان شروع کار|خدمت مناسب خود را بیابید',
    km: 'នៅលើទំព័រនេះ|សេចក្តីណែនាំ|មគ្គុទេសក៍សេវាកម្ម|អំពី|សេវាកម្ម|សេវាទិញជំនួស|រចនាស្ទីល|ទូខោអាវផ្ទាល់ខ្លួន|របៀបដំណើរការ|បញ្ជីរាយនាម|កម្រងរូបភាពសម្លៀកបំពាក់|រចនាស្ទីលជាអំណោយ|ការបញ្ជាទិញជាក្រុម|ហាងម៉ូដ|ទំនាក់ទំនង|ស្នាដៃដែលបានជ្រើសរើស|តម្លៃរចនាស្ទីល|ដំណើរការ|ការទិញ និងប៉ាន់ស្មានតម្លៃ|ស្វែងយល់|ទិដ្ឋភាពទូទៅ|ស្វែងរកប្រភពផលិតផល|ថ្លៃសេវាទិញ|ពេលចាប់ផ្តើមការងារ|ស្វែងរកសេវាកម្មសមស្រប'
  };
  const english = words.en.split('|');
  const home = !!document.getElementById('hero');
  const links = !!document.querySelector('.lp');
  const paths = home ? [
    ['hero','Introduction'],['service-story','Service guide'],['about','About'],['services','Services'],['lane-sourcing','Sourcing'],
    ['lane-styling','Styling'],['custom-wardrobe','Custom Wardrobe'],['process','How it works'],
    ['directory','Directory'],['lookbook','Lookbook'],['gift','Gift styling'],['bulk','Group orders'],['boutique','Boutiques'],['contact','Contact']
  ] : links ? [
    ['main','Introduction'],['links-services','Services'],['links-work','Selected work'],['links-styling','Styling prices'],['links-process','Process'],['links-sourcing','Sourcing & estimate'],['links-footer','Explore']
  ] : [
    ['service-overview','Overview'],['sourcing','Sourcing'],['trace','The Trace'],['styling','Styling'],
    ['prices','Styling prices'],['buying-fees','Buying fees'],['when-work-begins','When work begins'],['service-recommendation','Find your service']
  ];
  const sections = paths.map(([id,label]) => ({id,label,labelIndex:english.indexOf(label),el:document.getElementById(id)})).filter(s => s.el);
  if (!sections.length) return;
  sections.sort((a,b) => a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  const outline = document.createElement('details'); outline.className = 'ss-section-nav';
  const summary = document.createElement('summary');
  summary.innerHTML = '<span class="ss-section-caption">On this page</span><span class="ss-section-current"></span><span class="ss-section-toggle" aria-hidden="true">⌄</span>';
  const nav = document.createElement('nav'); nav.setAttribute('aria-label','On this page');
  const currentLabel = summary.querySelector('.ss-section-current');
  const caption = summary.querySelector('.ss-section-caption');
  const wide = matchMedia('(min-width:1280px)');
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches || document.documentElement.classList.contains('rm');
  sections.forEach(s => {
    const a = document.createElement('a'); a.href = '#' + s.id; a.textContent = s.label;
    a.addEventListener('click', e => {
      e.preventDefault();
      for (let p=s.el; p; p=p.parentElement) if(p.tagName === 'DETAILS') p.open=true;
      if (!wide.matches) outline.open = false;
      s.el.setAttribute('tabindex','-1'); s.el.focus({preventScroll:true});
      s.el.scrollIntoView({behavior:reduced() ? 'instant' : 'smooth',block:'start'});
      history.pushState(null,'','#' + s.id);
      setCurrent(s);
    });
    s.link = a; nav.append(a);
  });
  outline.append(summary,nav); document.body.append(outline); document.body.classList.add('ss-with-sections');
  const resize = () => { outline.open = wide.matches; };
  resize(); wide.addEventListener('change',resize);
  let active;
  function selectedLang() {
    if (typeof window.SS_LANG === 'function') return window.SS_LANG();
    const lang = document.documentElement.lang;
    if (lang && lang !== 'en') return lang;
    try { return localStorage.getItem('ss-lang') || lang || 'en'; } catch (_) { return lang || 'en'; }
  }
  function localize(lang) {
    const labels = (Object.prototype.hasOwnProperty.call(words,lang) ? words[lang] : words.en).split('|');
    caption.textContent = labels[0]; nav.setAttribute('aria-label',labels[0]);
    sections.forEach(s => {
      s.label = labels[s.labelIndex] || english[s.labelIndex];
      s.link.textContent = s.label;
    });
    if (active) currentLabel.textContent = active.label;
  }
  document.addEventListener('ss:lang',e => localize(e.detail?.lang || selectedLang()));
  localize(selectedLang());
  function setCurrent(section) {
    if (active === section) return;
    active = section; currentLabel.textContent = section.label;
    sections.forEach(s => { if(s === section) s.link.setAttribute('aria-current','location'); else s.link.removeAttribute('aria-current'); });
  }
  function mark() {
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    let best = sections[0], bestTop = -Infinity;
    sections.forEach(s => {
      const top = s.el.getBoundingClientRect().top;
      const margin = parseFloat(getComputedStyle(s.el).scrollMarginTop) || 0;
      const line = Math.max(Math.min(innerHeight * .28,190),padding + margin + 8);
      if (top > line) return;
      if (top > bestTop + 2) { best=s; bestTop=top; }
      else if (Math.abs(top-bestTop)<=2 && active===s) best=s;
    });
    setCurrent(best);
  }
  let ticking=false;
  addEventListener('scroll',() => { if(ticking)return; ticking=true; requestAnimationFrame(() => {mark();ticking=false;}); },{passive:true});
  addEventListener('resize',mark,{passive:true});
  addEventListener('load',mark,{once:true}); mark();
  outline.addEventListener('keydown',e => { if(e.key==='Escape' && !wide.matches) {outline.open=false;summary.focus();} });
  document.addEventListener('click',e => {if(!wide.matches && outline.open && !outline.contains(e.target))outline.open=false;});
})();
