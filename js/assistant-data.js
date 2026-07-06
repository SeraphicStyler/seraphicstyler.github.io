/* ============================================================================
   Seraphic Styler — Shopping Assistant DATA  ("the little database")
   ============================================================================
   THIS FILE IS YOURS TO EDIT. You don't need to touch any other file.

   It holds three lists the Shopping Assistant reads from:
     1. SS_BRANDS  — the brand directory (what the quiz recommends & "Browse" shows)
     2. SS_TERMS   — the local-fashion dictionary
     3. SS_QUIZ    — the questions the style quiz asks

   ----------------------------------------------------------------------------
   HOW TO ADD A BRAND
   ----------------------------------------------------------------------------
   Copy one { ... } block, paste it inside SS_BRANDS, and change the values.
   Keep the commas. Fields:

     name      Brand name (shown on the card).
     category  ONE of: 'clothing' 'shoes' 'eyewear' 'accessories' 'vintage'
               (must match the quiz answers, or the quiz won't find it)
     tags      Words describing the brand. The quiz matches on these. Useful ones:
               STYLE:  'minimalist' 'romantic' 'streetwear' 'eco-artisan'
               BUDGET: 'accessible' 'mid' 'premium'
               You can add any extra words too (e.g. 'silk', 'leather').
     note      One short sentence shown under the name (English).
     noteKey   OPTIONAL. If this brand already has a Vietnamese translation in
               js/translations.js (the eco.b.* keys), put that key here and the
               card will auto-translate. Leave '' if you don't have one — it
               will just show the English note in both languages. Totally fine.
     url       OPTIONAL link. Leave '' if you don't have one.

   That's it. Save the file and refresh the page.
   These ~24 brands are the real ones already named on your site — nothing made up.
   ============================================================================ */

window.SS_BRANDS = [
  /* ---- Clothing & textiles ---- */
  { name: 'Metiseko', category: 'clothing', tags: ['minimalist', 'eco-artisan', 'premium', 'silk'],
    note: 'GOTS-organic cotton & Vietnamese silk, low-impact dyes, small-batch (Hội An).', noteKey: 'eco.b.metiseko', url: '' },
  { name: 'Môi Điên', category: 'clothing', tags: ['streetwear', 'eco-artisan', 'mid', 'designer'],
    note: 'Saigon designer label; durability & "buy better, keep longer".', noteKey: 'eco.b.moidien', url: '' },
  { name: 'TimTay', category: 'clothing', tags: ['minimalist', 'eco-artisan', 'mid'],
    note: 'Natural fibres with zero-waste cutting (HCMC).', noteKey: 'eco.b.timtay', url: '' },
  { name: 'Fashion4Freedom', category: 'clothing', tags: ['eco-artisan', 'premium', 'artisan'],
    note: 'Artisan-direct supply chain, radical transparency (Huế).', noteKey: 'eco.b.f4f', url: '' },
  { name: 'Archive Sashiko', category: 'clothing', tags: ['romantic', 'eco-artisan', 'mid', 'vintage'],
    note: 'Boro / Sashiko mending & upcycling — one-off pieces (Đà Lạt).', noteKey: 'eco.b.archive', url: '' },
  { name: 'The 31', category: 'clothing', tags: ['minimalist', 'romantic', 'eco-artisan', 'mid'],
    note: 'Modern womenswear using recycled & lower-impact materials.', noteKey: 'eco.b.the31', url: '' },
  { name: 'BOO', category: 'clothing', tags: ['streetwear', 'eco-artisan', 'accessible'],
    note: 'Streetwear with visible sustainability practices & a strong local following.', noteKey: 'eco.b.boo', url: '' },
  { name: 'Kilomet109 · KHAAR · Dong', category: 'clothing', tags: ['eco-artisan', 'premium', 'artisan'],
    note: 'Natural dyes, indigenous fibres, artisan craft (Hanoi).', noteKey: 'eco.b.hanoi', url: '' },
  { name: 'Himistore', category: 'clothing', tags: ['accessible', 'extended-sizing'],
    note: 'Extended sizing up to 6XL, on European measurements.', noteKey: '', url: '' },
  { name: "Cow's House", category: 'clothing', tags: ['accessible', 'extended-sizing', 'romantic'],
    note: 'Curvy boutique cutting deliberately for fuller frames (M–5XL).', noteKey: '', url: '' },

  /* ---- Shoes ---- */
  { name: 'TNBHSG', category: 'shoes', tags: ['eco-artisan', 'premium', 'leather', 'artisan'],
    note: 'Saigon atelier (est. 2018), handmade leather shoes.', noteKey: 'eco.b.tnbhsg', url: '' },
  { name: 'Go Grunge 90s', category: 'shoes', tags: ['streetwear', 'eco-artisan', 'mid', 'artisan'],
    note: 'Saigon handmade shoes preserving local shoemaking craft.', noteKey: 'eco.b.gogrunge', url: '' },
  { name: 'Rens Original', category: 'shoes', tags: ['streetwear', 'eco-artisan', 'mid'],
    note: 'Vietnam-based sneakers made with coffee-ground material innovation.', noteKey: 'eco.b.rens', url: '' },

  /* ---- Eyewear ---- */
  { name: 'Seeson', category: 'eyewear', tags: ['minimalist', 'eco-artisan', 'accessible'],
    note: 'Vietnamese eyewear in bio-based cellulose acetate, modern design.', noteKey: 'eco.b.seeson', url: '' },

  /* ---- Accessories & bags ---- */
  { name: 'Leinné', category: 'accessories', tags: ['minimalist', 'eco-artisan', 'premium'],
    note: 'Saigon sustainable-luxury accessories with a strong Vietnamese identity.', noteKey: 'eco.b.leinne', url: '' },
  { name: 'Dòng Dòng Sài Gòn', category: 'accessories', tags: ['eco-artisan', 'accessible'],
    note: 'Bags from reused materials — reduce, reuse, recycle.', noteKey: 'eco.b.dongdong', url: '' },
  { name: 'Lơ Silk', category: 'accessories', tags: ['romantic', 'eco-artisan', 'mid', 'silk'],
    note: 'Saigon-made slow fashion; refined silk scarves & soft accessories.', noteKey: 'eco.b.losilk', url: '' },

  /* ---- High-end secondhand & vintage (Saigon) ---- */
  { name: 'Maintwo', category: 'vintage', tags: ['vintage', 'mid'],
    note: 'Curated vintage & secondhand in District 1.', noteKey: '', url: '' },
  { name: 'The Normal', category: 'vintage', tags: ['vintage', 'mid'],
    note: 'Curated thrift in Thủ Đức.', noteKey: '', url: '' },
  { name: '2Abnormal', category: 'vintage', tags: ['vintage', 'streetwear', 'mid'],
    note: 'Curated vintage & secondhand finds.', noteKey: '', url: '' },
  { name: 'Mayhem', category: 'vintage', tags: ['vintage', 'streetwear', 'mid'],
    note: 'Curated vintage with a streetwear lean.', noteKey: '', url: '' },
  { name: 'Hebe Vintage', category: 'vintage', tags: ['vintage', 'romantic', 'mid'],
    note: 'Curated vintage pieces with a softer, romantic feel.', noteKey: '', url: '' },
  { name: 'Nhật Tảo shops', category: 'vintage', tags: ['vintage', 'accessible'],
    note: 'The secondhand shops around Nhật Tảo, District 10.', noteKey: '', url: '' },
  { name: 'Bà Chiểu & Chợ Bàn Cờ markets', category: 'vintage', tags: ['vintage', 'accessible'],
    note: 'Market stalls for thrifting; designer secondhand via verified consignment on request.', noteKey: '', url: '' },

  /* ==========================================================================
     SAIGON FASHION DIRECTORY — added from your store research.
     'status' controls which group a brand shows under in "Browse all brands":
        'verified'   ✅ confirmed physical store
        'online'     🌐 online / appointment-only
        'unverified' ❓ long tail — DM to confirm (NOT shown by the quiz)
        'research'   📝 on your "chase these" list (NOT shown by the quiz)
     If you leave status off entirely, a brand is treated as 'verified'.
     Only 'verified'/'online' brands appear in quiz results — confirm a brand,
     change its status, and it joins the recommendations. Add style tags
     (minimalist/romantic/streetwear/eco-artisan) + budget (accessible/mid/premium)
     to make the quiz match it well; without tags it still shows under Browse.
     ========================================================================== */

  /* ---- ✅ Verified physical stores ---- */
  { name: 'Fancì Club', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'LSOUL', category: 'clothing', status: 'verified', tags: [], note: '@lsoul' },
  { name: 'Ononmm', category: 'clothing', status: 'verified', tags: [], note: '→ OnOnMM / ononmm.monde' },
  { name: 'Laneci / Lane Cì', category: 'clothing', status: 'verified', tags: [], note: '→ lancei.stu' },
  { name: 'Kathy Atelier', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'Feng', category: 'clothing', status: 'verified', tags: [], note: 'Feng System' },
  { name: 'Levents', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'Cocosin', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'Libé', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'Nosbyn', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'Daphale Studios', category: 'clothing', status: 'verified', tags: [], note: '→ Daphale' },
  { name: 'Whenever Atelier', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'Anna Clothes', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'Wephobia', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'Sò Vintage', category: 'vintage', status: 'verified', tags: ['vintage'], note: '→ So Vintage' },
  { name: 'Into.eight', category: 'clothing', status: 'verified', tags: [], note: '→ Into Eight' },
  { name: 'Hangkao Closet', category: 'clothing', status: 'verified', tags: [], note: '→ Hangkao' },
  { name: 'Chou Chou (District 3)', category: 'clothing', status: 'verified', tags: [], note: '@chouchou.clothing · District 3' },
  { name: 'Chou Chou (Phú Nhuận)', category: 'clothing', status: 'verified', tags: [], note: '@__chouchou.official · Phú Nhuận' },
  { name: 'Daniv Dear', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'Glamdoll', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'Thao Bibi', category: 'clothing', status: 'verified', tags: [], note: '→ Thaobibi' },
  { name: 'Veos', category: 'clothing', status: 'verified', tags: [], note: "Veo's" },
  { name: 'Clothes Bar', category: 'clothing', status: 'verified', tags: [], note: '' },
  { name: 'The New Playground', category: 'clothing', status: 'verified', tags: [], note: 'Concept mall — many brands under one roof, a key stop' },

  /* ---- 🌐 Online / appointment-only ---- */
  { name: 'LaLune', category: 'clothing', status: 'online', tags: [], note: '' },
  { name: 'Mael Femme', category: 'clothing', status: 'online', tags: [], note: '' },
  { name: 'Linh Phung', category: 'clothing', status: 'online', tags: [], note: '' },
  { name: 'Bupbes', category: 'clothing', status: 'online', tags: [], note: 'Búp Bê' },
  { name: 'Bel Ange', category: 'clothing', status: 'online', tags: [], note: '' },
  { name: 'isoul.official', category: 'clothing', status: 'online', tags: [], note: '⚠ unconfirmed — not the same as LSOUL' },

  /* ---- ❓ Unverified — DM to confirm (long tail) ---- */
  { name: 'By Jenny', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Sissy Nation', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Jubin Studio', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Ceci', category: 'clothing', status: 'unverified', tags: [], note: '→ Ceci.VN' },
  { name: 'Those Studios', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'BaaBeeBoo', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Amelie', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Feminist', category: 'clothing', status: 'unverified', tags: [], note: '→ feministore' },
  { name: 'Lamcoco', category: 'clothing', status: 'unverified', tags: [], note: '→ Iamcoco' },
  { name: 'Gill Baby', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'La Vierge', category: 'clothing', status: 'unverified', tags: [], note: 'lavierge.vn' },
  { name: 'Glossy', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Allurie', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'HHappy', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Tran Ali', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Karlotte Concept', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Dumm', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Modern', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Jenny Fairy', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Smeia', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'RidKidSet', category: 'clothing', status: 'unverified', tags: [], note: '→ Ridkid' },
  { name: 'Firefly', category: 'clothing', status: 'unverified', tags: [], note: 'firefly_studio.vn' },
  { name: 'OuahStudios', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Caleelilou', category: 'clothing', status: 'unverified', tags: [], note: '→ caleeliou.studio' },
  { name: 'TheNicoletteHouse', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Dora.label', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Wabitales', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Lynsie.co', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: '1998beforethedawn', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Zareen', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Résel', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Doublebizz', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Liniss', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Depass', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'aiai', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Cera', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Byvee', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Madebymum', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Fourmood', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Mona', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Remmus', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Peppervn', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Lamai', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Dahlia', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Seo Studio', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Jirene', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Duu.Stu', category: 'clothing', status: 'unverified', tags: [], note: '→ Duu Stu' },
  { name: 'Ours Studio', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Miều', category: 'clothing', status: 'unverified', tags: [], note: '→ Miêu' },
  { name: 'Mood Emode', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'La Dinh Dinh', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Ribbon Nude', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Fig and Tonka', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Wonder House', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Sweetea', category: 'clothing', status: 'unverified', tags: [], note: '→ Sweet Tea' },
  { name: 'Oanh Bibi', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Normos', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Bad Rabbit', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Aoi Zone', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Healing.mesh', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'PrincessClub', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Bubble', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Heatburn.co', category: 'clothing', status: 'unverified', tags: [], note: '→ Heartburn.co' },
  { name: 'Lovelyn', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Szombies', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Chudada', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Cece', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Pomelo Flower', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Tiela', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Darlingism', category: 'clothing', status: 'unverified', tags: [], note: '→ Darling.ism' },
  { name: 'Ngaos', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Hérisson', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Chaufifth', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Hapas', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Amory', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'LingerieLover', category: 'clothing', status: 'unverified', tags: [], note: '→ Lace Lingerie' },
  { name: 'Prettyme', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Kistiny', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Emilie', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Secodee', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Twenti', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Colin', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Kisserine', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Mollynista', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Calissandra', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Lauala', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Normal', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Clay Clothing', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'The C.I.U', category: 'clothing', status: 'unverified', tags: [], note: '→ The Ciu' },
  { name: 'Rechic', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Viery Studios', category: 'clothing', status: 'unverified', tags: [], note: '→ Viery' },
  { name: 'Huelleyrose', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'ChaClub', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Mangata', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'So Dópe Club', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Beach Club', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Dune De Label', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Tartan', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Feiin', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Rubies', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Sensore', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Le Soleil', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'By Aria', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Huong Boutique', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'The Maven', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Mooris', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Lane JT', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Bydi', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Les Pavot', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Sassysis', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Poppybabi', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Bunnyhill Concept', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'The Stan', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'IEU Studio', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Nakedbyv', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: '18again', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Dawn', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Ichi', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Pradies', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Remolacha', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Dottie', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Lassie', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Itsy', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Vintage Angel', category: 'vintage', status: 'unverified', tags: ['vintage'], note: '' },
  { name: 'So Young VN', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Endvivy Savage', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'District One', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'She by Chi', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Kido Wear', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Sun', category: 'clothing', status: 'unverified', tags: [], note: '' },
  { name: 'Twissy', category: 'clothing', status: 'unverified', tags: [], note: '' },

  /* ---- 📝 Research list — chase these to confirm (duplicates of seeded brands omitted) ---- */
  { name: 'AEIE Studios', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'LaTui', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Wet Avocado', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Mamavirus', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Dear José', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Melenmeman', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Joie Des Roses', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Flane', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Tí Ngoan', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Léger', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Achelois Studio', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'The Country Boutiques', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Cong Tri', category: 'clothing', status: 'research', tags: ['premium'], note: 'High-end Vietnamese couture' },
  { name: 'Subtle Le Nguyen', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'CAOSTU', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Klei Studio', category: 'clothing', status: 'research', tags: [], note: '' },
  { name: 'Duc Studio', category: 'clothing', status: 'research', tags: [], note: '' }
];

/* ============================================================================
   2. TERMINOLOGY DICTIONARY
   ----------------------------------------------------------------------------
   Add an entry by copying a { ... } block. Fields:
     term         The word/phrase.
     def          Plain-English definition.
     def_vi       OPTIONAL Vietnamese definition. Leave '' to show English in both.
     relatedTags  OPTIONAL tags — if a brand shares one of these, it shows under
                  the definition as "you might like". Leave [] for none.
   ============================================================================ */

window.SS_TERMS = [
  { term: 'Áo Dài', def: "Vietnam's national dress — a long, fitted silk tunic worn over trousers. Cut close with little give, so measurements matter.",
    def_vi: 'Trang phục truyền thống của Việt Nam — áo lụa dài, ôm sát, mặc cùng quần. Form ôm nên số đo rất quan trọng.', relatedTags: ['silk', 'romantic'] },
  { term: 'Local Brand', def: 'A Vietnamese-founded, Vietnam-made label (as opposed to an international import). Often small-batch and designer-led.',
    def_vi: 'Thương hiệu do người Việt sáng lập và sản xuất tại Việt Nam (khác với hàng nhập khẩu). Thường sản xuất số lượng nhỏ, có dấu ấn nhà thiết kế.', relatedTags: ['eco-artisan', 'designer'] },
  { term: 'Saigonese', def: 'Of or from Saigon (Ho Chi Minh City) — the style, energy, and street culture of the city the sourcing trips run through.',
    def_vi: 'Thuộc về Sài Gòn (TP. Hồ Chí Minh) — phong cách, năng lượng và văn hóa đường phố của thành phố nơi mình tìm hàng.', relatedTags: ['streetwear'] },
  { term: 'Slow Fashion', def: 'Clothing made to last and bought thoughtfully — the opposite of fast, disposable trends.',
    def_vi: 'Thời trang bền vững, mua có chọn lọc — trái ngược với thời trang nhanh, dùng một lần.', relatedTags: ['eco-artisan', 'minimalist'] },
  { term: 'Boro / Sashiko', def: 'A Japanese mending tradition — visible stitching that patches and strengthens cloth, turning repairs into decoration.',
    def_vi: 'Kỹ thuật vá vải của Nhật — đường khâu lộ ra để vá và gia cố vải, biến vết vá thành họa tiết trang trí.', relatedTags: ['eco-artisan', 'vintage'] },
  { term: 'Consignment', def: 'Reselling pre-owned designer pieces through a trusted middleman who verifies authenticity before they go on sale.',
    def_vi: 'Bán lại đồ hiệu đã qua sử dụng qua bên trung gian uy tín, có kiểm định thật giả trước khi bán.', relatedTags: ['vintage', 'premium'] },
  { term: 'Zero-waste cutting', def: 'A pattern-making method that uses the whole length of fabric so almost nothing is thrown away.',
    def_vi: 'Cách cắt rập tận dụng toàn bộ khổ vải để gần như không bỏ phí mảnh nào.', relatedTags: ['eco-artisan'] },
  { term: 'Extended sizing', def: 'Brands that cut deliberately for fuller and international frames — beyond the small local default sizes.',
    def_vi: 'Các thương hiệu may cho dáng người đầy đặn và quốc tế — vượt qua các size nhỏ mặc định ở địa phương.', relatedTags: ['extended-sizing', 'accessible'] }
];

/* ============================================================================
   3. STYLE QUIZ
   ----------------------------------------------------------------------------
   Each question has a key, the question text (en/vi), and a list of answers.
   Each answer maps to either:
     category: 'clothing'   -> filters/boosts brands in that category, OR
     tag: 'minimalist'      -> boosts brands carrying that tag, OR
     preloved: true/false   -> true keeps only 'vintage', false drops 'vintage'
   To change the quiz, edit the text or add/remove answer objects. Keep commas.
   ============================================================================ */

window.SS_QUIZ = [
  { key: 'category',
    q: { en: 'What are you shopping for?', vi: 'Bạn đang tìm gì?' },
    answers: [
      { label: { en: 'Clothing', vi: 'Quần áo' }, category: 'clothing' },
      { label: { en: 'Shoes', vi: 'Giày' }, category: 'shoes' },
      { label: { en: 'Eyewear', vi: 'Kính mắt' }, category: 'eyewear' },
      { label: { en: 'Accessories & bags', vi: 'Phụ kiện & túi' }, category: 'accessories' }
    ] },
  { key: 'style',
    q: { en: 'Which style feels most you?', vi: 'Phong cách nào hợp với bạn nhất?' },
    answers: [
      { label: { en: 'Minimalist & clean', vi: 'Tối giản, gọn gàng' }, tag: 'minimalist' },
      { label: { en: 'Romantic & soft', vi: 'Lãng mạn, dịu dàng' }, tag: 'romantic' },
      { label: { en: 'Street & bold', vi: 'Đường phố, cá tính' }, tag: 'streetwear' },
      { label: { en: 'Artisan & natural', vi: 'Thủ công, tự nhiên' }, tag: 'eco-artisan' }
    ] },
  { key: 'budget',
    q: { en: 'What feels comfortable to spend?', vi: 'Mức chi tiêu nào bạn thấy thoải mái?' },
    answers: [
      { label: { en: 'Accessible', vi: 'Phải chăng' }, tag: 'accessible' },
      { label: { en: 'Mid-range', vi: 'Tầm trung' }, tag: 'mid' },
      { label: { en: 'Premium', vi: 'Cao cấp' }, tag: 'premium' }
    ] },
  { key: 'preloved',
    q: { en: 'New pieces or pre-loved?', vi: 'Đồ mới hay đồ đã qua sử dụng?' },
    answers: [
      { label: { en: 'Brand-new', vi: 'Đồ mới' }, preloved: false },
      { label: { en: 'Vintage & secondhand', vi: 'Vintage & đồ cũ' }, preloved: true },
      { label: { en: "No preference", vi: 'Không quan trọng' } }
    ] }
];
