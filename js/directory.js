/* Directory filters, results, map, and mobile controls. Data loads first. */
/* ============ DATA ============ */
const B=window.SS_DIRECTORY; // data lives in js/directory-data.js (shared with the route planner)
/* One pass to stamp each house with its folded search key (js/fd-search.js). */
if(window.SS_SEARCH)SS_SEARCH.index(B);

/* — Retail clusters (streets panel) — */
const STREETS=[
{h:"Trần Quang Diệu",d:"District 3 · the design strip",c:"13 shops",l:"Goût De Jun (1) · Kathy Atelier + BaaBeeBoo (6) · Laneci (27) · Moulin Rose + Lace Lingerie Lover (48) · 18 Again (52) · Tartan (70) · Chérieon (76) · Rêver (91) · So Dópe Club (97) · caleélilou (136/5) · Chan Club (154)"},
{h:"42 Tôn Thất Thiệp",d:"District 1 · Bến Nghé",c:"3 in one building",l:"Dawn Vintage + 1998 Before The Dawn (2F) · Depass (Rm 38E)"},
{h:"Võ Văn Tần",d:"District 3",c:"7 shops",l:"Mooris (234) · Résel + Résel Bridal (245) · Sexy Forever (291) · LAVIEM (289) · So Dópe Club (353) · Cocosin (365) · Bom Sister (422)"},
{h:"214 Hai Bà Trưng",d:"District 1 · Tân Định",c:"3 labels",l:"Huelley Rose · Huelley · Stress Mama — one address, three brands"},
{h:"Hai Bà Trưng · Tân Định",d:"District 1 · the sleepwear corridor",c:"3 doors",l:"VINCY Homewear (248) · Wacoal (232) · ONOFF (366) — all within ~300 m of the 214 Hai Bà Trưng stop"},
{h:"11 Garmentory",d:"Phú Nhuận · 117B Nguyễn Đình Chính",c:"multi-brand hub",l:"Duu Stu flagship · Babie Club · Badchoices · The Fancé + rotating local creatives & The Muse café"},
{h:"Lý Tự Trọng",d:"District 1",c:"4 shops",l:"The New Playground (26) · Wephobia (98) · Enuff Studio (261) · Calista de Minh Thanh (265)"},
{h:"Lê Thánh Tôn",d:"District 1 · the tailor & shoe strip",c:"MTM row",l:"Dung Tailor (221) · ManGii custom shoes (228) · Shimmer Silver (128 Lê Lai nearby) — Saigon's made-to-measure heart"}
];

/* ============ BRAND ICONS (icons/ folder, matched to entry names) ============ */
const ICONS={"11 Garmentory":"icons/11 Garmentory.jpg","18 Again":"icons/18 Again.jpg","1998 Before The Dawn":"icons/1998beforethedawn.png","Aeva Atelier":"icons/AEVA Atelier.jpg","Aguja Studio":"icons/Aguja Studio.jpg","Aimee":"icons/Aimee.jpg","Aisytum":"icons/Aisytum.jpg","AME Jewellery":"icons/AME Jewellery.jpg","Amory":"icons/Amory.jpg","Ananas":"icons/Ananas.jpg","Anna Clothes":"icons/Anna Clothes.jpg","Arya":"icons/Arya.jpg","Augety":"icons/Augety.jpg","BaaBeeBoo":"icons/BaaBeeBoo.jpg","Babie Club":"icons/Babie Club.jpg","Badchoices":"icons/Bad Choices.webp","Brown VN":"icons/Brown.png","Bubble":"icons/Bubble.jpg","Bupbes":"icons/Bupbes.png","By Cotno":"icons/By Cotno.jpg","By Fairy":"icons/By Fairy.jpg","By Vee":"icons/By Vee.jpg","caleélilou":"icons/caleelilou.jpg","Calista de Minh Thanh":"icons/Calista de Minh Thanh.png","Cao Minh Saigon":"icons/Cao Minh Saigon.png","CAOSTU":"icons/CAOSTU.jpg","CE CE":"icons/Ce Ce.jpg","CEM — Chị Em Mình":"icons/CEM - Chi Em Minh.jpg","Chan Club":"icons/Chan Club.jpg","CHATS by C.DAM":"icons/Chats by C.Dam.jpg","Chautfifth":"icons/Chautfifth.jpg","Chérieon":"icons/Cherieon.webp","Chou Chou":"icons/Chou Chou.png","Chung Thanh Phong":"icons/Chung Thanh Phong.jpg","Clothes Bar":"icons/Clothes Bar.jpg","Cocosin":"icons/Cocosin.jpg","Curnon":"icons/Curnon.jpg","Daniv Dear":"icons/Daniv Dear.jpg","Daphale Studios":"icons/427607833_358377757122119_2907036623528799797_n.jpg","Dawn Vintage":"icons/Dawn.png","De Pure":"icons/De Pure.jpg","Depass":"icons/Depass.png","Dimo":"icons/Dimo.jpg","Đỗ Long":"icons/Do Long.jpg","Dòng Dòng Sài Gòn":"icons/Dong Dong Sai Gon.jpg","Dune De Label":"icons/Dune De Label.jpg","Duu Stu":"icons/Duu Stu.jpg","Elena NGN":"icons/Elena NGN.jpg","Enuff Studio":"icons/Enuff Studio.jpg","EQL Apparel":"icons/EQL Apparel .jpg","Fancì Club":"icons/Fanci Club.jpg","Feiin Atelier":"icons/Feiin Atelier.jpg","Firefly Studio":"icons/Firefly Studio.jpg","Fitme":"icons/Fitme .jpg","Floralpunk":"icons/Floralpunk.jpg","Gèrme":"icons/Germe.jpg","GIA Studios":"icons/GIA Studios .jpg","Glamdoll":"icons/Glamdoll.png","Goût De Jun":"icons/Gout De Jun.webp","Guvie":"icons/Guvie.webp","Hà Linh Thu":"icons/Ha Linh Thu.jpg","Hangkao Closet":"icons/Hangkao Closet.jpg","Hapas":"icons/Hapas.jpg","Happy Hahaha Studio":"icons/Happy Hahaha Studio.jpg","Hello Weekend Market":"icons/Hello Weekend Market.jpg","Her Day Off":"icons/Her Day Off.jpg","Hoang Studios":"icons/Hoang Studios.jpg","Huelley":"icons/Huelley.jpg","Huelley Rose":"icons/Huelley Rose.jpg","Is Flourish":"icons/Is Flourish.jpg","IVY moda":"icons/IVY moda.jpg","Jenéa by Jenny":"icons/Jenea by Jenny.jpg","Jennie Choo":"icons/Jennie Choo.jpg","Josephine":"icons/Josephine.png","Josephine (Hanoi)":"icons/Josephine (Hanoi).jpg","Joven":"icons/Joven.jpg","Jubin Studio":"icons/Jubin Studio.jpg","Jujubae":"icons/Jujubae.jpg","Jula":"icons/Jula.png","Juno":"icons/Juno.jpg","Kae":"icons/Kae.jpg","Kaiiros":"icons/Kaiiros.jpg","Katherine Studio":"icons/Katherine Studio.jpg","Kathy Atelier":"icons/Kathy Atelier.jpeg","Keira Tong":"icons/Keira Tong.jpg","Kistiny":"icons/Kistiny.jpg","L'Espoir":"icons/L'Espoir.jpg","La Phạm":"icons/La Pham.jpg","La Vierge":"icons/la Vierge.jpg","Lace Lingerie Lover":"icons/Lace Lingerie Lover .webp","LaLune":"icons/LaLune.png","Laneci":"icons/Laneci.jpg","LAVIEM":"icons/Laviem.jpg","Le Thanh Hoa":"icons/Le Thanh Hoa .jpg","Levents":"icons/Levents.png","LI LAM / LAM":"icons/LI LAM LAM.jpg","Libé":"icons/Libe.jpg","Linh Nga Couture":"icons/Linh Nga Couture.jpg","Liniss":"icons/Liniss.png","Lovelyn":"icons/Lovelyn.jpg","LSOUL":"icons/LSOUL.jpg","Lụa Là by Diễm":"icons/Lua La by Diem.jpg","Lussera":"icons/Lussera.jpg","Mael Femme":"icons/Mael Femme.jpg","Mangata":"icons/Mangata.jpg","Matemade":"icons/Mate Made.jpg","Metiseko":"icons/Metiseko.jpg","Miah Noir":"icons/miah.noir.jpg","Mimilys":"icons/Mimilys.jpg","Minh Tuan Couture":"icons/Minh Tuan Couture.jpg","Mira Emb":"icons/Mira Emb.jpg","Mood Emode":"icons/Mood Emode.jpg","Moodswings":"icons/Moodswings.jpg","Moon Me":"icons/Moon Me.jpg","Mooris":"icons/Mooris.jpg","Morris":"icons/Morris.jpg","Moulin Rose":"icons/Moulin Rose.jpg","Nguyễn Hoàng Tú":"icons/Nguyen Hoang Tu.jpg","Nosbyn":"icons/Nosbyn.jpg","Nosbyn Studio":"icons/Nosbyn Studio.jpg","OAK — Wear of a Kind":"icons/OAK.jpg","OCÉARA":"icons/OCEARA.jpg","Olaben":"icons/Olaben.jpg","OLV":"icons/OLV.png","OnOnMM ®":"icons/OnOnMM.jpg","ONWAYS":"icons/ONWAYS.jpg","Perpearl":"icons/Per Pearl.png","Phan Đăng Hoàng":"icons/Phan Dang Hoang.jpg","Phan Huy":"icons/Phan Huy .jpg","Pomelo Flower":"icons/Pomelo Flower.jpg","Poppy Babi":"icons/Poppy Babi.jpg","Punch":"icons/Punch.jpg","REBN":"icons/REBN Official.jpg","Rêver":"icons/REVER.jpg","Rid Kid Closet":"icons/Rid Kid Closet.jpg","Rosie":"icons/Rosie.jpg","Rue Des Chats":"icons/Rue Des Chats.jpg","Rue Miche L'Édition":"icons/Rue Miche L'Edition.jpg","Sassy Sis":"icons/Sassy Sis.png","SEESON":"icons/SEESON.jpg","Sensore":"icons/Sensore.jpg","Shimmer Silver":"icons/Shimmer Silver.jpg","Shondo":"icons/Shondo.jpg","Shu Shi":"icons/Shu Shi.jpg","Sister Sister by Min":"icons/Sister Sister by Min.jpg","SIXDO":"icons/SIXDO .jpg","So Dópe Club":"icons/So Dope Club.jpg","Sò Vintage":"icons/So Vintage.jpg","Some Official":"icons/Some Official.jpg","Sonancy Mood":"icons/So Nancy Mood.webp","Stress Mama":"icons/Stress Mama.jpg","Striped T":"icons/Striped T.jpg","Subtle Le Nguyen":"icons/Subtle Le Nguyen.jpg","Sundei":"icons/Sundei.jpg","Swessy":"icons/Swessy.jpg","Szombies":"icons/Szombies.jpg","Tartan Studios":"icons/Tartan Studios.png","Teddy And":"icons/Teddy And.jpg","Thao Bibi":"icons/Thao Bibi .jpg","The Country Boutiques":"icons/The Country Boutiques .jpg","The Fancé":"icons/The Fance.webp","The New Playground":"icons/The New Playground.jpg","The Nicolette House":"icons/The Nicolette House.jpg","The Purists Club":"icons/The Purists Club.jpg","Tiela":"icons/Tiela.png","Trần Hùng":"icons/Tran Hung.jpg","Valenciani":"icons/Valenciani.jpg","Vanila Gals":"icons/Vanila Gals.jpg","Vascara":"icons/Vascara.jpg","Velia Co":"icons/Velia Co.jpg","Velvet Venom":"icons/Velvet Venom.png","Veos":"icons/Veos.jpg","Vintage Angel Tailor":"icons/Vintage Angel.jpg","VUNGOC&SON":"icons/VUNGOC&SON.jpg","Wabitales":"icons/WabiTales.jpg","Wephobia":"icons/Wephobia.png","Whenever Atelier":"icons/Where Atelier.png","Whose Studio":"icons/Whose Studio.webp","Xinh Hà":"icons/Xinh Ha.jpg"};

/* ============ CONFIG ============ */
const TIERCOL={mid:"var(--lav)",premium:"var(--peri)",luxury:"var(--orchid)",couture:"var(--mauve)",none:"var(--ink-faint)"};
const STLAB={walk:["Walk-in","walk"],appt:["Appointment","appt"],online:["Online","online"],hub:["In a hub","hub"],popup:["Pop-up","hub"]};
/* chip / option tuples: [value, i18n key, English default, indent?]
   Place names (Phú Nhuận, Thảo Điền, Q5 · Chợ Lớn…) are proper nouns: they stay
   verbatim in every language — you say them to a driver, you don't translate them.
   A null key means "never translate this label". */
const CATS=[["all","fd.cat.all","All"],["women","fd.cat.women","Womenswear"],["men","fd.cat.men","Menswear"],["luxury","fd.cat.luxury","Luxury & Couture"],["bridal","fd.cat.bridal","Bridal"],["tailor","fd.cat.tailor","Áo dài & Tailors"],["active","fd.cat.active","Athleisure"],["access","fd.cat.access","Accessories"],["lingerie","fd.cat.lingerie","Lingerie & intimates"],["sleep","fd.cat.sleep","Sleep & loungewear"],["vintage","fd.cat.vintage","Vintage & preloved"],["market","fd.cat.market","Markets"]];
/* Location taxonomy = exactly the map's zones, so filters and card areas finally agree. */
const LOCS=[
 ["all","fd.loc.all","Everywhere"],
 ["SGN","fd.loc.sgn","Saigon — all"],
 ["z:d1","fd.loc.d1","District 1",1],
 ["z:d3","fd.loc.d3","District 3",1],
 ["z:pn",null,"Phú Nhuận",1],
 ["z:td",null,"Thảo Điền · Thủ Đức",1],
 ["z:bt",null,"Bình Thạnh",1],
 ["z:tb",null,"Tân Bình",1],
 ["z:tp",null,"Tân Phú",1],
 ["z:gv",null,"Gò Vấp",1],
 ["z:q5",null,"Q5 · Chợ Lớn",1],
 ["z:other","fd.loc.other","Online & multi-brand",1],
 ["HAN","fd.loc.han","Hanoi"],
 ["VN","fd.loc.vn","Other Vietnam"],
 ["INTL","fd.loc.intl","Overseas"]];
const TIERS=[["all","fd.tiersel.all","All tiers"],["mid","fd.tiersel.mid","Mid"],["premium","fd.tiersel.premium","Premium"],["luxury","fd.tiersel.luxury","Luxury"],["couture","fd.tiersel.couture","Couture"]];
/* — Fabric. The question clients now ask first: "is it polyester?"
   A house is tagged only where the fibre is stated by the house itself (`fib` in
   directory-data.js). No tag is not an accusation — it means unstated, and unstated
   is exactly what you have to ask about in the shop. `natural` is the union of the
   plant/animal fibres; `circular` is upcycled, deadstock and secondhand. — */
const FIBERS=[["all","fd.fib.all","All fabrics"],["natural","fd.fib.natural","Natural fibre"],
  ["plant","fd.fib.plant","Plant-based · no silk"],
  ["linen","fd.fib.linen","Linen"],["cotton","fd.fib.cotton","Cotton"],["silk","fd.fib.silk","Silk"],
  ["hemp","fd.fib.hemp","Hemp"],["tencel","fd.fib.tencel","TENCEL & modal"],
  ["circular","fd.fib.circular","Upcycled & secondhand"]];
/* TENCEL/modal/lyocell is regenerated cellulose — not polyester, and it breathes, but it is not
   a natural fibre either. It gets its own tag rather than being smuggled into `natural`. */
const NATURAL=["linen","cotton","silk","hemp"];
/* — Plant-based. Silk is a natural fibre but an animal one, so a vegan wardrobe
   can't read the `natural` tag: it sweeps silk in. `plant` is the vegan-facing
   cut — a house that names a plant or plant-derived fibre and does not name
   silk. Same evidentiary rule as every fibre tag: it reflects what the house
   states, so it is a shortlist to start from, not a certification. Leather,
   wool and fur aren't tracked in `fib` at all — still ask in the shop. — */
const PLANT=["linen","cotton","hemp","tencel"];
const fibOf=b=>Array.isArray(b.fib)?b.fib:(b.fib?[b.fib]:[]);
const fibMatch=(b,f)=>{
  const t=fibOf(b);
  if(!t.length)return false;
  if(f==="natural")return t.some(x=>NATURAL.includes(x));
  if(f==="plant")return t.some(x=>PLANT.includes(x))&&!t.includes("silk");
  return t.includes(f);
};
const fibLabel=b=>fibOf(b).map(k=>{const t=FIBERS.find(x=>x[0]===k);return t?tlabel(t):k;}).join(" · ");
/* — Occasion. A use-case lens, not a wardrobe group: a gown house is still "Luxury &
   couture", a party label is still "Womenswear" — this select cuts across those groups.
   `occ` in directory-data.js is tagged editorially, only where a house's own work
   clearly dresses the moment: gowns/formal for balls & galas, statement pieces for
   nights out, dress-forward feminine RTW for birthdays. Untagged = unreviewed, not
   unsuitable — same philosophy as the fabric facet. — */
const OCCS=[["all","fd.occ.all","Any occasion"],
  ["event","fd.occ.event","Balls, galas & formal"],
  ["night","fd.occ.night","Nightlife & parties"],
  ["bday","fd.occ.bday","Birthdays & celebrations"]];
const occOf=b=>Array.isArray(b.occ)?b.occ:(b.occ?[b.occ]:[]);
const occLabel=b=>occOf(b).map(k=>{const t=OCCS.find(x=>x[0]===k);return t?tlabel(t):k;}).join(" · ");
const VIBES=[["all","fd.vibe.all","All vibes"],["coastal","fd.vibe.coastal","Coastal"],["studio","fd.vibe.studio","Studio"],["performance","fd.vibe.performance","Performance"]];
const SORTS=[["rec","fd.sort.rec","Curated order"],["az",null,"A → Z"],["tierup","fd.sort.tierup","Price tier: low → high"],["tierdn","fd.sort.tierdn","Price tier: high → low"]];
/* Tuple label: translated when it carries a key, verbatim when it doesn't. */
const OPT_INDENT=" ";
function tlabel(t){return t[1]?SS_T(t[1],t[2]):t[2];}
const TIER_RANK={mid:0,premium:1,luxury:2,couture:3,none:4};
/* On-now ribbon — every item carries an end date and hides itself the day after.
   These are operational notes (sales, pop-ups), not chrome: like house notes and
   addresses they stay in their source language. The footer says so plainly. */
const NOW=[
 {t:"Vincom Red Sale",d:"up to 70% off, all Vincom malls",dv:"giảm đến 70%, mọi TTTM Vincom",until:"2026-07-20"},
 {t:"7.7 mid-year mega-sale",d:"Shopee / Lazada / TikTok Shop",dv:"Shopee / Lazada / TikTok Shop",until:"2026-07-07"},
 {t:"Rue Miche L'Édition",d:"rotating PULSE pop-ups, Union Square",dv:"pop-up PULSE luân phiên, Union Square",until:"2026-08-31"}
];

/* ---------- Dynamic-string i18n ----------
   Strings built in JS (not markup) can't carry a data-i18n attribute, so they
   resolve through the same per-language bundle at call time:
     T(key, english)                     → plain lookup
     TF(key, english, {a:1,b:2})         → lookup + {placeholder} interpolation
   The English text lives here as the literal fallback, so a missing key in any
   bundle degrades to English rather than to a blank. Card notes, addresses and
   brand names are data and are never translated.                                */
const T=(k,en)=>window.SS_T?window.SS_T(k,en):en;
const TF=(k,en,v)=>window.SS_TF?window.SS_TF(k,en,v):String(en).replace(/\{(\w+)\}/g,(m,x)=>v&&v[x]!=null?v[x]:m);
function isVI(){return document.documentElement.getAttribute("lang")==="vi";}
function curLang(){return window.SS_LANG?window.SS_LANG():"en";}

/* Every dynamic string the page can render, as key + English default. */
const LX=()=>({
  houses:T("fd.dyn.houses","houses"),
  pct:T("fd.dyn.pct","% of Saigon"),
  showAll:n=>TF("fd.dyn.showAll","Showing all {n} houses",{n}),
  showSome:(a,b)=>TF("fd.dyn.showSome","Showing {a} of {b} houses",{a,b}),
  banner:T("fd.dyn.banner",`Planning a trip around these houses? Read <a href="field-guide">the field guide</a> — getting around, dressing for the heat, and 1-to-30-day shopping itineraries.`),
  st:{walk:T("fd.dyn.st.walk","Walk-in"),appt:T("fd.dyn.st.appt","Appointment"),online:T("fd.dyn.st.online","Online"),hub:T("fd.dyn.st.hub","In a hub"),popup:T("fd.dyn.st.popup","Pop-up")},
  tier:{mid:T("fd.dyn.tier.mid","mid"),premium:T("fd.dyn.tier.premium","premium"),luxury:T("fd.dyn.tier.luxury","luxury"),couture:T("fd.dyn.tier.couture","couture")},
  conf:{ok:T("fd.dyn.conf.ok","Verified"),warn:T("fd.dyn.conf.warn","Confirm first"),stale:T("fd.dyn.conf.stale","May be outdated")},
  map:T("fd.dyn.map","Map ↗"),
  mapFor:n=>TF("fd.dyn.mapFor","Open Google Maps for {n}",{n}),
  byAppt:T("fd.dyn.byAppt","By appointment"),
  listing:T("fd.dyn.listing","Directory listing"),
  share:T("fd.dyn.share","Share"),
  shared:T("fd.dyn.shared","Link copied ✓"),
  shareFor:n=>TF("fd.dyn.shareFor","Share a link to {n}",{n}),
  moreF:T("fd.morefilters","More filters"),
  stat:[T("fd.dyn.stat.1","houses catalogued"),T("fd.dyn.stat.2","in Saigon"),T("fd.dyn.stat.3","walk-in stores"),T("fd.dyn.stat.4","districts mapped")],
  streetsH:T("fd.dyn.streetsH","The retail clusters"),
  streetsSub:T("fd.dyn.streetsSub","Saigon's fashion isn't spread evenly — these streets and buildings each hold several boutiques, the highest-value stops on any styling route."),
  showAllBtn:n=>TF("fd.dyn.showAllBtn","Show all {n} houses",{n}),
  removeF:l=>TF("fd.dyn.removeF","Remove filter: {l}",{l}),
  searchF:q=>TF("fd.dyn.searchF","Search: “{q}”",{q}),
  walkF:T("fd.dyn.walkF","Walk-in only"),
  savedF:T("fd.dyn.savedF","Saved only"),
  sigF:T("fd.dyn.sigF","Signature houses"),sigB:T("fd.dyn.sigB","Signature"),
  one:T("fd.dyn.one","Exactly one house matches."),
  oneBtn:n=>TF("fd.dyn.showAllBtn","Show all {n} houses",{n}),
  emptyH:T("fd.dyn.emptyH","No houses match"),
  emptyP:T("fd.dyn.emptyP","Nothing in the directory fits that combination — Saigon's scene moves fast, but not that fast."),
  actClear:T("fd.dyn.actClear","Clear search"),
  actAll:n=>TF("fd.dyn.showAllBtn","Show all {n} houses",{n}),
  actWomen:T("fd.dyn.actWomen","Browse womenswear"),
  shortlist:T("fd.dyn.shortlist","Your shortlist — saved to this browser only"),
  copy:T("fd.dyn.copy","Copy as text"),
  copied:T("fd.dyn.copied","Copied ✓"),
  onlineChip:n=>TF("fd.dyn.onlineChip","{n} online & multi-brand →",{n}),
  qbAll:T("fd.dyn.qbAll","The full directory"),
  qbBrowse:T("fd.dyn.qbBrowse","Browse →"),
  nowTag:T("fd.dyn.nowTag","On now"),
  to:T("fd.dyn.to","to"),
  savedTip:T("fd.dyn.savedTip","Saved to this browser — no account needed."),
  expandFor:n=>TF("fd.dyn.expandFor","Show details for {n}",{n}),
  saveFor:n=>TF("fd.dyn.saveFor","Save {n}",{n}),
  openNow:T("fd.dyn.openNow","Open now"),
  opensAt:t=>TF("fd.dyn.opensAt","Opens {t}",{t}),
  closedNow:T("fd.dyn.closedNow","Closed now"),
  mapShow:T("fd.mapshow","Show map"),
  mapHide:T("fd.maphide","Hide map"),
  moreFilters:T("fd.morefilters","More filters"),
  fewerFilters:T("fd.lessfilters","Fewer filters"),
  tapFilter:T("fd.dyn.tapFilter","Tap to filter"),
  more:n=>TF("fd.dyn.more","+{n} more",{n}),
  mapNote:(d,o,s)=>TF("fd.dyn.mapNote",
    `Symbol <b>area</b> is proportional to house count (r = k·√n). The nine districts hold <b>{d}</b> walk-able houses; the chip above adds the <b>{o}</b> online &amp; multi-brand names — together the <b>{s}</b> in Saigon.`,{d,o,s})
});
const VI_RE=/[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵĐ]/;
const viAttr=s=>VI_RE.test(s||"")?' lang="vi"':'';
/* aesthetic vibe for activewear — coastal=California/laid-back-luxe, studio=Pilates/yoga, performance=gym/run */
const VIBEMAP={Olaben:"coastal","EQL Apparel":"coastal",REBN:"studio","Hibi Sports":"studio",Kydra:"performance",Supersports:"performance",Fitme:"performance","Thế Giới Đồ Tập":"performance",Shamdi:"performance",Coolmate:"performance","I.Sport":"performance"};
function vibeOf(b){return b.vibe||VIBEMAP[b.n]||"";}
/* group tuples: [key, EN title, EN desc, VI title] — descs stay EN (data precedent) */
/* group tuples: [key] — title + description resolve from the bundle at render time */
const GROUPS=[
 ["women","Contemporary womenswear","Local design houses and boutiques — the heart of the Saigon scene, plus a few chains and Hanoi names."],
 ["men","Menswear & streetwear","Local menswear labels, streetwear flagships (most unisex-leaning) and made-to-measure suiting."],
 ["luxury","Luxury & couture","Designer labels and made-to-order houses. Most work by appointment; several show internationally."],
 ["bridal","Bridal — gowns & áo dài cưới","Wedding dresses and áo dài cưới made to buy and keep — couture houses, made-to-measure studios and the accessories that finish the look. Buy-to-own only: everything here can ship home with you."],
 ["tailor","Áo dài, tailors & craft studios","Bespoke áo dài, made-to-measure ateliers, embroidery and upcycling — what's distinctive to Vietnam."],
 ["active","Premium athleisure","Studio-to-street activewear and functional sun-wear. No official Lululemon or Alo store exists in Vietnam yet."],
 ["access","Eyewear, shoes, bags & jewelry","Vietnamese accessory labels with real HCMC stores."],
 ["lingerie","Lingerie & intimates","Designer and handmade lingerie houses first, then the counters that actually fit a band and a cup — most Vietnamese labels sell S/M/L only, which is the thing to know before you go. Sizes run small; the fitting group is the safer start above ~34C."],
 ["sleep","Sleep & loungewear","Cotton, linen and silk nightwear built for tropical nights — the natural-fibre houses, not the polyester-satin mass market."],
 ["vintage","Vintage & preloved","Curated secondhand houses, reworked one-offs and đồ si hunting grounds — Saigon's circular wardrobe. I can pair finds with a trusted tailor for repairs and resizing."],
 ["market","Markets & pop-ups","Where many brands gather at once — highest value per trip. Dates roam; check socials first."]
];
const grpTitle=g=>T("fd.grp."+g[0]+".t",g[1]);
const grpDesc =g=>T("fd.grp."+g[0]+".d",g[2]);

/* ============ STATE ============ */
let fCat="all",fCity="all",fWalk=false,fQ="",fZone="",fTier="all",fVibe="all",fFib="all",fOcc="all",fSaved=false,fSig=false,fSort="rec";

/* — Saved shortlist (localStorage; hearts never leave this browser) — */
let SAVED=new Set();
try{SAVED=new Set(JSON.parse(localStorage.getItem("fd-saved")||"[]"));}catch(e){}
function bid(b){return b.h||b.n;}
function isSaved(b){return SAVED.has(bid(b));}
function persistSaved(){try{localStorage.setItem("fd-saved",JSON.stringify([...SAVED]));}catch(e){}}
function updateSavedCount(){
  const n=SAVED.size;
  const el=document.getElementById("savedcount");if(el)el.textContent="("+n+")";
}
/* the tray (js/fd-basket.js) rewrites fd-saved on every change — including undo —
   so the page's SAVED set follows the tray, never the other way round */
document.addEventListener("ss:tray",()=>{
  try{SAVED=new Set(JSON.parse(localStorage.getItem("fd-saved")||"[]"));}catch(e){}
  updateSavedCount();
  if(fSaved)render(); /* the saved-only lens must reflect the new set */
});

/* — Confidence normalisation: standardised badges instead of inline ⚠️ text — */
function confOf(b){
  if(b.conf)return b.conf; /* future data override: "ok"|"warn"|"stale" */
  if(b.flag)return "warn";
  const t=(b.no||"")+" "+(b.area||"");
  if(/⚠️|confirm|verify|unconfirmed|coming soon|opening soon/i.test(t))return "warn";
  if(b.st==="popup")return "warn";
  return "ok";
}
function cleanNote(s){return (s||"").replace(/⚠️\s*/g,"");}

/* — Shareable URL state (#cat=…&zone=… etc.) — */
function syncHash(){
  const p=new URLSearchParams();
  if(fCat!=="all")p.set("cat",fCat);
  if(fCity!=="all")p.set("city",fCity);
  if(fTier!=="all")p.set("tier",fTier);
  if(fVibe!=="all")p.set("vibe",fVibe);
  if(fFib!=="all")p.set("fib",fFib);
  if(fOcc!=="all")p.set("occ",fOcc);
  if(fZone)p.set("zone",fZone);
  if(fWalk)p.set("walk","1");
  if(fSaved)p.set("saved","1");
  if(fSig)p.set("sig","1");
  if(fSort!=="rec")p.set("sort",fSort);
  if(fQ)p.set("q",fQ);
  const s=p.toString();
  try{history.replaceState(null,"",s?"#"+s:location.pathname+location.search);}catch(e){}
}

/* — Google Maps link helpers — */
function cityLabel(b){return b.city==="SGN"?"Ho Chi Minh City":b.city==="HAN"?"Hanoi":"Vietnam";}
function mapsUrl(b){
  const a1=(b.a||"").split(/\s*[+·]\s*/)[0];
  return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(b.n+", "+a1+", "+cityLabel(b));
}
function hasStreet(b){return b.st!=="online"&&["walk","hub","popup","appt"].includes(b.st)&&["SGN","HAN","VN"].includes(b.city);}

function statChips(){
  const sl=document.getElementById("statline");
  const walk=B.filter(b=>b.st==="walk").length,sgn=B.filter(b=>b.city==="SGN").length;
  const lab=LX().stat,vals=[B.length,sgn,walk,DISTRICTS];
  sl.innerHTML=vals.map((v,i)=>`<div class="stat"><b>${v}</b><span>${lab[i]}</span></div>`).join("");
}
function chipbar(id,arr,cur,cls){
  document.getElementById(id).innerHTML=arr.map(t=>
    `<button class="chip ${cls}" data-v="${t[0]}" aria-pressed="${cur===t[0]}">${tlabel(t)}</button>`).join("")
   /* mobile only (CSS): the chip row ends in a More-filters chip that opens the sheet */
   +(id==="catchips"?`<button class="chip fchipbtn" id="fchipbtn" aria-haspopup="dialog" aria-controls="sheet">${LX().moreF}</button>`:"");
}
function fillSel(id,arr,cur){
  const el=document.getElementById(id);
  el.innerHTML=arr.map(t=>`<option value="${t[0]}"${cur===t[0]?" selected":""}>${t[3]?OPT_INDENT:""}${tlabel(t)}</option>`).join("");
}
function locValue(){return fZone?("z:"+fZone):fCity;}
function setLoc(v){
  if(v.startsWith("z:")){fZone=v.slice(2);fCity="all";}
  else{fCity=v;fZone="";}
}
function match(b,ignore){
  if(ignore!=="cat"&&fCat!=="all"&&b.cat!==fCat)return false;
  if(ignore!=="loc"&&fCity!=="all"&&b.city!==fCity)return false;
  if(ignore!=="walk"&&fWalk&&b.st!=="walk")return false;
  if(ignore!=="tier"&&fTier!=="all"&&b.tier!==fTier)return false;
  if(ignore!=="vibe"&&fVibe!=="all"&&vibeOf(b)!==fVibe)return false;
  if(ignore!=="fib"&&fFib!=="all"&&!fibMatch(b,fFib))return false;
  if(ignore!=="occ"&&fOcc!=="all"&&!occOf(b).includes(fOcc))return false;
  if(fSaved&&!isSaved(b))return false;
  if(fSig&&!b.sig)return false;
  if(ignore!=="loc"&&fZone&&zoneOf(b)!==fZone)return false;
  if(fQ&&!qMatch(b))return false;
  return true;
}
/* — Text search. fd-search.js folds the tone marks off both sides, so a client
     typing "ao dai", "phu nhuan" or "district 3" on a US keyboard reaches
     "áo dài", "Phú Nhuận" and "D3". Parsing the query is memoised on fQ: it
     runs once per keystroke, not once per house per keystroke. If the module
     ever fails to load the page falls back to the old substring behaviour. — */
let _qk=null,_qt=null;
function qTerms(){
  if(_qk!==fQ){_qk=fQ;_qt=window.SS_SEARCH?SS_SEARCH.parse(fQ):null;}
  return _qt;
}
function qMatch(b){
  if(window.SS_CATALOG)return SS_CATALOG.matches(SS_CATALOG.fromLegacy(b),fQ);
  const terms=qTerms();
  if(!terms)return (b.n+" "+(b.h||"")+" "+(b.a||"")+" "+(b.no||"")+" "+b.area).toLowerCase().includes(fQ);
  if(!terms.length)return true; /* nothing but stopwords — show everything */
  return SS_SEARCH.test(b._sk||SS_SEARCH.keyOf(b),terms);
}
function sortList(arr){
  if(fSort==="az")return [...arr].sort((a,b)=>a.n.localeCompare(b.n,"vi"));
  if(fSort==="tierup")return [...arr].sort((a,b)=>(TIER_RANK[a.tier]??4)-(TIER_RANK[b.tier]??4));
  if(fSort==="tierdn")return [...arr].sort((a,b)=>(TIER_RANK[b.tier]??4)-(TIER_RANK[a.tier]??4));
  /* Searching replaces the curated order with relevance — a house whose NAME is
     what you typed should not sit below one that merely mentions it in a note.
     Sort is stable, so equal scores keep the curated order. An explicit sort
     (az/tier) still wins; this only fills in for "rec". */
  if(fQ&&window.SS_CATALOG)return [...arr].sort((a,b)=>SS_CATALOG.ranking(SS_CATALOG.fromLegacy(b),fQ).score-SS_CATALOG.ranking(SS_CATALOG.fromLegacy(a),fQ).score);
  if(fQ&&window.SS_SEARCH){
    const t=qTerms();
    if(t&&t.length)return [...arr].sort((a,b)=>SS_SEARCH.score(b,t)-SS_SEARCH.score(a,t));
  }
  return arr; /* rec = curated data order */
}
/* Live open/closed status from a store's stated hours (walk-in / hub only) */
function openState(b){
  // Freeform hours do not establish weekday schedules or a current opening status.
  return null;
}
/* — Strips: streets that hold three or more houses. Read straight off the addresses, so
     it can never drift from the data. A strip is a walk you can do in one go, which is how
     a stylist actually moves through the city — so the card says so, and tapping it searches
     the street. This is the route view folded into the grid. — */
const STRIP_STREETS=["Trần Quang Diệu","Võ Văn Tần","Lý Tự Trọng","Lê Thánh Tôn","Tôn Thất Thiệp",
  "Hai Bà Trưng","Nguyễn Trãi","Đồng Khởi","Nguyễn Đình Chính","Lê Thị Riêng"];
const STRIPS=(()=>{
  const m=new Map();
  for(const s of STRIP_STREETS){
    const n=B.filter(b=>(b.a||"").includes(s)).length;
    if(n>=3)m.set(s,n);
  }
  return m;
})();
const stripOf=b=>{
  for(const [s,n] of STRIPS) if((b.a||"").includes(s)) return {street:s,n};
  return null;
};
/* A wide card is punctuation, and it has to be earned: a couture or luxury house, a house
   you have marked `pick:true` in js/directory-data.js, or one whose note needs the room.
   Nothing is featured for decoration — a fake "editor's pick" would be a lie on the page. */
const isWide=b=>b.pick===true||b.tier==="couture"||b.tier==="luxury"||(b.no||"").length>=100;

function card(b,i){
  const L=LX(),st=STLAB[b.st]||["",""],stl=(L.st[b.st]||st[0]);
  const ost=openState(b),openbadge=ost?`<span class="badge ${ost.cls}">${ost.label}</span>`:"";
  const cf=confOf(b);
  const confbadge=window.SS_CATALOG?(b.flag?`<span class="badge warn" lang="en">Recorded caution</span>`:""):(cf!=="ok"?`<span class="badge ${cf}">${L.conf[cf]||cf}</span>`:"");
  const note=cleanNote(b.no);
  const ig=`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>`;
  const handle=b.w?`<a class="hd" href="${b.w}" target="_blank" rel="noopener noreferrer">${new URL(b.w).hostname}</a>`
    :b.h?`<a class="hd" href="https://instagram.com/${b.h}" target="_blank" rel="noopener noreferrer">${ig}@${b.h}</a>`
    :`<span class="hd" style="color:var(--ink-mute)">${b.area.includes("appointment")||b.st==="appt"?L.byAppt:L.listing}</span>`;
  const tier=b.tier&&b.tier!=="none"?`<span class="tierchip" style="--tier:${TIERCOL[b.tier]}">${L.tier[b.tier]||b.tier}</span>`:"";
  const sub=b.sub?`<span class="area"${viAttr(b.sub)}>${b.sub}</span>`:"";
  const vb=vibeOf(b),vibe=vb?`<span class="vibe">${vb}</span>`:"";
  const fl=fibLabel(b),fib=fl?`<span class="fib">${fl}</span>`:"";  /* what the house says its cloth is */
  const ol=occLabel(b),occ=ol?`<span class="occ">${ol}</span>`:"";  /* the occasions it dresses */
  const sigb=b.sig?`<span class="sigb">✦ ${L.sigB}</span>`:"";
  const price=b.price?`<span class="price">${b.price}</span>`:"";
  const on=isSaved(b);
  const sv=`<button class="sv${on?" on":""}" data-id="${bid(b)}" aria-pressed="${on}" aria-label="${L.saveFor(b.n)}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21C7 16.5 3 13 3 8.8 3 6.1 5.1 4 7.7 4c1.7 0 3.2.9 4.3 2.4C13.1 4.9 14.6 4 16.3 4 18.9 4 21 6.1 21 8.8c0 4.2-4 7.7-9 12.2Z"/></svg></button>`;
  const inBk=window.SS_BASKET?SS_BASKET.has(bid(b)):false; /* fd-basket.js re-syncs after boot */
  const bk=`<button class="bk${inBk?" on":""}" data-id="${bid(b)}" aria-pressed="${inBk}" aria-label="Add ${b.n} to basket">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></button>`;
  const nDis=b.sub?`${b.n} (${b.sub})`:b.n; /* sub disambiguates same-name records (e.g. the two Metiseko doors) */
  const map=hasStreet(b)?`<a class="maplink" target="_blank" rel="noopener noreferrer" href="${mapsUrl(b)}" aria-label="${L.mapFor(nDis)}">${L.map}</a>`:"";
  const shr=`<button class="shr" data-n="${b.n}" aria-label="${L.shareFor(nDis)}">${L.share}</button>`;
  const logo=ICONS[b.n]?`<img class="blogo" src="${encodeURI(ICONS[b.n])}" alt="" width="44" height="44" loading="lazy" decoding="async">`:"";
  const wide=isWide(b);
  const pick=b.pick===true?`<span class="pick">${L.pick||"Editor's pick"}</span>`:"";
  const walkIcon=`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  const strip=stripOf(b);
  const stripChip=strip?`<button class="strip" data-street="${strip.street}" aria-label="${L.searchF(strip.street)}">${walkIcon}${strip.street} · ${strip.n}</button>`:"";
  /* one primary action (bag) + the heart; share/map/street fold into a quiet ⋯ menu */
  const cm=`<button class="cm-btn" aria-haspopup="true" aria-expanded="false" aria-label="${T("fd.cd.more","More actions")} — ${nDis}">⋯</button>`;
  const cmPop=`<div class="cm-pop" hidden>${shr}${map}${stripChip}</div>`;
  return `<article data-house-index="${B.indexOf(b)}" class="card${wide?" wide":""}" style="--tier:${TIERCOL[b.tier]||'var(--lav)'}">
    <div class="top">${logo}<div class="tt">${pick}<div class="nm"${viAttr(b.n)}>${b.n}</div>${handle}</div>${bk}${sv}</div>
    <div class="cd-more">
      <div class="note"${viAttr(note)}>${note}</div>
      <div class="addr"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg><span${viAttr(b.a)}>${b.a}</span><span class="acts">${cm}</span></div>
      <div class="foot"><span class="st ${st[1]}">${stl}</span>${openbadge}${confbadge}${price}${tier}${sigb}${fib}${occ}${vibe}${sub}<span class="area"${viAttr(b.area)}>${b.area}</span></div>
    </div>
    ${cmPop}
    <div class="fd-house-actions" lang="en"><button type="button" data-compare-house="${B.indexOf(b)}" aria-pressed="false">Compare</button><button type="button" data-similar-house="${B.indexOf(b)}">More like this</button></div>
    <span class="credit" aria-hidden="true">seraphicstyler.com</span>
  </article>`;
}
/* — Active-filter chips: every narrowed state shows removable chips + one primary escape hatch — */
function activeFilters(){
  const L=LX(),out=[];
  const lbl=(arr,v)=>{const t=arr.find(x=>x[0]===v);return t?tlabel(t):v;};
  if(fQ){const raw=(document.getElementById("q").value||"").trim();
    out.push({k:"q",label:L.searchF(raw||fQ)});} /* chip echoes what was typed, not the lowercased match key */
  if(fCat!=="all")out.push({k:"cat",label:lbl(CATS,fCat)});
  if(fZone)out.push({k:"loc",label:lbl(LOCS,"z:"+fZone).trim()});
  else if(fCity!=="all")out.push({k:"loc",label:lbl(LOCS,fCity)});
  if(fTier!=="all")out.push({k:"tier",label:lbl(TIERS,fTier)});
  if(fVibe!=="all")out.push({k:"vibe",label:lbl(VIBES,fVibe)});
  if(fFib!=="all")out.push({k:"fib",label:lbl(FIBERS,fFib)});
  if(fOcc!=="all")out.push({k:"occ",label:lbl(OCCS,fOcc)});
  if(fWalk)out.push({k:"walk",label:L.walkF});
  if(fSaved)out.push({k:"saved",label:L.savedF});
  if(fSig)out.push({k:"sig",label:L.sigF});
  return out;
}
function removeFilter(k){
  if(k==="q"){fQ="";const q=document.getElementById("q");q.value="";document.getElementById("qclear").hidden=true;}
  if(k==="cat")fCat="all";
  if(k==="loc"){fCity="all";fZone="";}
  if(k==="tier")fTier="all";
  if(k==="vibe")fVibe="all";
  if(k==="fib")fFib="all";
  if(k==="occ")fOcc="all";
  if(k==="walk")fWalk=false;
  if(k==="saved")fSaved=false;
  if(k==="sig"){fSig=false;const sb=document.getElementById("sigbtn");if(sb)sb.setAttribute("aria-pressed","false");}
  syncHash();syncUI();
}
function resetAll(){
  fCat="all";fCity="all";fTier="all";fVibe="all";fFib="all";fOcc="all";fZone="";fWalk=false;fSaved=false;fSig=false;fQ="";
  const q=document.getElementById("q");q.value="";document.getElementById("qclear").hidden=true;
  syncHash();syncUI();
}
function renderActivebar(){
  const bar=document.getElementById("activebar"),L=LX(),af=activeFilters();
  if(!af.length){bar.classList.remove("on");bar.innerHTML="";return;}
  bar.classList.add("on");
  bar.innerHTML=af.map(f=>`<span class="fchip"><b>${f.label}</b><button class="x" data-k="${f.k}" aria-label="${L.removeF(f.label)}">✕</button></span>`).join("")
   +`<button class="showall" data-act="reset">${L.showAllBtn(B.length)}</button>`;
}
/* — Wave reveal: a group of cards enters when it scrolls into view, not all 300 at load — */
/* Cards reveal one by one as they scroll in, not a whole group at a time: the womenswear
   grid is ~30,000px tall on a phone, and no viewport can ever intersect enough of that for
   a group-level trigger to fire. Watching each card also means a row's cards land together,
   which is what makes the wave read.
   The delay is the card's distance from the centre COLUMN, measured from where it actually
   sits — wide cards span two columns and `dense` reorders the flow, so index maths would
   scatter it. */
function waveIndex(g){
  const t=getComputedStyle(g).gridTemplateColumns;
  const tracks=(t&&t!=="none")?t.split(" ").filter(Boolean).map(parseFloat):[];
  const colW=(tracks.length&&tracks[0]>0)?tracks[0]:g.clientWidth;
  const mid=g.offsetLeft+g.clientWidth/2;
  for(const c of g.children){
    const x=c.offsetLeft+c.offsetWidth/2;
    const cols=Math.min(Math.abs(x-mid)/Math.max(colW,1),3); /* columns out from the centre */
    c.style.setProperty("--i",(cols*1.3).toFixed(2));
  }
}
const waveIO=("IntersectionObserver"in window)?new IntersectionObserver(es=>{
  es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add("in");waveIO.unobserve(e.target);});
},{threshold:0,rootMargin:"0px 0px -40px 0px"}):null;
function cascade(root){
  const grids=[...root.querySelectorAll(".grid,.qbgrid")];
  if(root.matches&&root.matches(".grid,.qbgrid"))grids.unshift(root);
  grids.forEach(g=>{
    if(!g.children.length)return;
    waveIndex(g);
    for(const c of g.children){
      c.classList.remove("in");
      if(waveIO)waveIO.observe(c); else c.classList.add("in"); /* no IO: just show them */
    }
  });
}
function render(){
  const main=document.getElementById("main");
  const shown=B.filter(match);
  const L=LX();
  document.getElementById("count").textContent=
    shown.length===B.length?L.showAll(B.length):L.showSome(shown.length,B.length);
  document.getElementById("qtip").classList.toggle("on",!!fQ);
  renderActivebar();
  if(window.SS_WORKSPACE_RENDER?.(shown))return;
  let html="";
  if(shown.length===1)
    html+=`<div class="onehit"><span>${L.one}</span><button class="showall" data-act="reset">${L.oneBtn(B.length)}</button></div>`;
  const useGroups=(fCat==="all");
  const order=useGroups?GROUPS:GROUPS.filter(g=>g[0]===fCat);
  for(const g of order){
    const key=g[0];
    const items=sortList(shown.filter(b=>b.cat===key));
    if(!items.length)continue;
    html+=`<section class="group"><div class="ghead"><h2>${grpTitle(g)} <span class="n">${items.length}</span></h2></div><p>${grpDesc(g)}</p>`;
    html+=`<div class="grid">${items.map(card).join("")}</div>`;
    if(key==="women"&&fCity!=="HAN"&&fCity!=="INTL"&&fCity!=="VN")html+=streetsPanel();
    html+=`</section>`;
  }
  if(!shown.length)html=emptyState();
  if(fSaved&&shown.length)html=`<div class="savebar">${L.shortlist} · <button id="copylist">${L.copy}</button></div>`+html;
  html+=`<div class="fg-banner">${L.banner}</div>`;
  main.innerHTML=html;
  cascade(main);
}
function emptyState(){
  const L=LX();
  const acts=[
    fQ?`<button class="chip" data-act="clearq">${L.actClear}</button>`:"",
    `<button class="showall" data-act="reset">${L.actAll(B.length)}</button>`,
    fCat!=="women"?`<button class="chip" data-act="women">${L.actWomen}</button>`:""
  ].join("");
  return `<div class="grid"><div class="empty">
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M22.3,27 C18.4,18 21.6,8.4 31.6,6.6 C38.2,5.4 41,11.4 37.8,18 C35,24.2 28.6,27.4 23,28.6 Z"/>
      <path d="M22.6,29.4 C26.8,31.2 32.2,33 35,38 C36.6,40.8 36,43.8 33.6,43.4 C29.6,42.7 25,35.6 22.4,30.4 Z"/>
      <path d="M22.3,27 C19.9,22.2 17.2,18.4 13.4,16.4"/></svg>
    <h3>${L.emptyH}</h3><p>${L.emptyP}</p>
    <div class="acts">${acts}</div>
  </div></div>`;
}
function streetsPanel(){
  const L=LX();
  return `<div class="streets"><h3>${L.streetsH}</h3>
    <p class="sub">${L.streetsSub}</p>
    <div class="stgrid">${STREETS.map(s=>`<div class="stcard">
      <div class="h"${viAttr(s.h)}>${s.h} <b>${s.c}</b></div><div class="d">${s.d}</div><div class="l">${s.l}</div></div>`).join("")}</div></div>`;
}

/* ---- Cluster map: proportional-symbol, area ∝ count (r = k·√n) ---- */
const ZONES=[
 {k:"gv",x:120,y:58,n:"Gò Vấp"},
 {k:"tb",x:214,y:86,n:"Tân Bình"},
 {k:"tp",x:118,y:150,n:"Tân Phú"},
 {k:"pn",x:262,y:172,n:"Phú Nhuận"},
 {k:"bt",x:430,y:112,n:"Bình Thạnh"},
 {k:"d3",x:332,y:258,n:"District 3"},
 {k:"d1",x:452,y:262,n:"District 1"},
 {k:"td",x:634,y:168,n:"Thảo Điền"},
 {k:"q5",x:256,y:384,n:"Q5 · Chợ Lớn"}
];
const ZONE_OTHER={k:"other",n:"Other Saigon listings"};
const DISTRICTS=ZONES.length;
/* Every Saigon record maps to exactly one node → node counts sum to the "in Saigon" total. */
function zoneOf(b){
 if(b.city!=="SGN")return null;
 const a=b.area||"";
 if(/Thảo Điền|Thủ Đức/.test(a))return "td";
 if(/Phú Nhuận/.test(a))return "pn";
 if(/Tân Phú/.test(a))return "tp";
 if(/Tân Bình/.test(a))return "tb";
 if(/Gò Vấp/.test(a))return "gv";
 if(/Bình Thạnh/.test(a))return "bt";
 if(/Q5|Chợ Lớn|Chợ Quán/.test(a))return "q5";
 if(/D1|Đồng Khởi|Bến Thành|Bến Nghé|Tân Định|Đa Kao|Sài Gòn ward|Ký Con/.test(a))return "d1";
 if(/D3|Bàn Cờ|Nhiêu Lộc|Võ Thị Sáu/.test(a))return "d3";
 return "other";
}
function zoneCounts(){const c={};B.forEach(b=>{const z=zoneOf(b);if(z)c[z]=(c[z]||0)+1;});return c;}
function zoneName(k){return k==="other"?ZONE_OTHER.n:(ZONES.find(z=>z.k===k)||{}).n||"";}
function topHouses(zk){return B.filter(b=>zoneOf(b)===zk&&b.st!=="online").slice(0,3).map(b=>b.n);}
const R_MAX=44;
function renderMap(){
 const g=document.getElementById("fdmapnodes");if(!g)return;
 const focused=document.activeElement,focusZone=focused?.dataset.z,focusInMap=focused?.closest("#fdmap"),focusInList=focused?.closest("#fdmap-districts");
 const counts=zoneCounts(),max=Math.max(1,...Object.values(counts)),K=R_MAX/Math.sqrt(max);
 g.innerHTML=ZONES.map(z=>{
   const c=counts[z.k]||0,r=c?Math.max(5,K*Math.sqrt(c)):4,act=fZone===z.k?" active":"";
   const fs=r>=20?16:r>=11?12:0; /* numerals only where they can sit legibly on the cobalt core */
   return `<g class="fdmap-node${act}" data-z="${z.k}" tabindex="0" role="button" aria-pressed="${fZone===z.k}" aria-label="${z.n}: ${c} ${LX().houses}">
     <circle cx="${z.x}" cy="${z.y}" r="${r.toFixed(1)}" fill="url(#nodeg)" opacity="${c?0.92:0.2}"/>
     ${fs?`<text class="z-n" x="${z.x}" y="${z.y}" font-size="${fs}" dominant-baseline="central">${c||""}</text>`:""}
     <text class="z-l" x="${z.x}" y="${(z.y+r+15).toFixed(1)}"${viAttr(z.n)}>${z.n} · ${c}</text>
   </g>`;
 }).join("");
 const list=document.getElementById("fdmap-districts");
 if(list)list.innerHTML=[...ZONES,ZONE_OTHER].map(z=>`<button type="button" data-z="${z.k}" aria-pressed="${fZone===z.k}"><span><span class="fd-zone-check" aria-hidden="true">✓</span>${z.n}</span><span>${counts[z.k]||0} houses</span></button>`).join("");
 const selected=document.getElementById("fdmap-selection");
 if(selected)selected.textContent=fZone?`Showing ${zoneName(fZone)} · ${counts[fZone]||0} recorded houses before other filters.`:'Choose a district, then view the matching houses.';
 if(focusZone&&(focusInMap||focusInList))document.querySelector((focusInMap?'#fdmap':'#fdmap-districts')+` [data-z="${focusZone}"]`)?.focus({preventScroll:true});
}
function setZone(z){
 const viewX=scrollX,viewY=scrollY;
 fZone=(!z||fZone===z)?"":z;
 if(fZone)fCity="all";
 updateMapClear();
 syncHash();renderMap();fillSel("locsel",LOCS,locValue());render();
 document.getElementById("map").getBoundingClientRect();scrollTo({left:viewX,top:viewY,behavior:"instant"});
}
function updateMapClear(){
 const cl=document.getElementById("fdmapclear");if(!cl)return;
 cl.disabled=!fZone;document.getElementById("fdmapzone").textContent=fZone?": "+zoneName(fZone):"";
}
function fdTip(n){
 const tip=document.getElementById("fdtip");if(!tip||!n)return;
 const zk=n.dataset.z,sgn=B.filter(b=>b.city==="SGN").length;
 const c=B.filter(b=>zoneOf(b)===zk).length,pct=Math.round(c/sgn*100),tops=topHouses(zk);
 const more=c-tops.length,L=LX();
 tip.innerHTML=`<b>${zoneName(zk)}</b><span>${c} ${LX().houses} · ${pct}${LX().pct}</span>`
   +(tops.length?`<em>${tops.join(" · ")}${more>0?" "+L.more(more):""}</em>`:"")
   +`<i>${L.tapFilter}</i>`;
 tip.hidden=false; /* reveal before measuring */
 const circle=n.querySelector("circle")||n,r=circle.getBoundingClientRect();
 const cx=r.left+r.width/2,tw=tip.offsetWidth,th=tip.offsetHeight,gap=11,pad=12;
 const left=Math.max(pad,Math.min(cx-tw/2,window.innerWidth-tw-pad));
 let top=r.top-th-gap,below=false;
 if(top<pad){top=r.bottom+gap;below=true;}
 tip.style.left=left+"px";tip.style.top=top+"px";
 tip.style.setProperty("--caret",Math.max(14,Math.min(cx-left,tw-14))+"px");
 tip.classList.toggle("below",below);
}
function fdHideTip(){const t=document.getElementById("fdtip");if(t)t.hidden=true;}

/* ============ QUICK BROWSE ============ */
function renderBrowse(){
  const g=document.getElementById("qbgrid");if(!g)return;
  const L=LX();
  g.innerHTML=GROUPS.map(g2=>{
    const n=B.filter(b=>b.cat===g2[0]).length;
    return `<button class="qb" data-cat="${g2[0]}"><span class="n">${n}</span><span class="t">${grpTitle(g2)}</span><span class="a">${L.qbBrowse}</span></button>`;
  }).join("")+`<button class="qb sig" data-sig="1"><span class="n">${B.filter(b=>b.sig).length}</span><span class="t">✦ ${L.sigF}</span><span class="a">${L.qbBrowse}</span></button>`+`<button class="qb all" data-cat="all"><span class="n">${B.length}</span><span class="t">${L.qbAll}</span><span class="a">${L.qbBrowse}</span></button>`;
  cascade(g);
}

/* ============ NOW RIBBON (auto-expiring) ============ */
function renderNow(){
  const bar=document.getElementById("nowbar"),items=document.getElementById("nowitems");
  if(!bar)return;
  const today=new Date().toISOString().slice(0,10);
  const live=NOW.filter(x=>today<=x.until);
  if(!live.length){bar.hidden=true;return;}
  const vi=isVI(),L=LX(),loc=curLang()==="en"?"en-GB":curLang();
  const mon=new Date().toLocaleDateString(loc,{month:"long",year:"numeric"});
  document.getElementById("nowtag").textContent=L.nowTag+" · "+mon;
  items.innerHTML=live.map(x=>{
    const until=new Date(x.until+"T12:00:00").toLocaleDateString(loc,{day:"numeric",month:"short"});
    return `<span class="it"><b>${x.t}</b> — ${vi&&x.dv?x.dv:x.d} <span class="til">· ${L.to} ${until}</span></span>`;
  }).join("");
  bar.hidden=false;
}

/* ============ EVENTS ============ */
document.getElementById("catchips").addEventListener("click",e=>{
  const b=e.target.closest(".chip");if(!b)return;
  if(b.id==="fchipbtn"){sheetCtl.open(b);return;}
  fCat=b.dataset.v;
  chipbar("catchips",CATS,fCat,"cat");syncHash();render();});
document.getElementById("vibechips").addEventListener("click",e=>{
  const b=e.target.closest(".chip");if(!b)return;fVibe=b.dataset.v;
  chipbar("vibechips",VIBES,fVibe,"vibe");syncHash();render();});
document.getElementById("locsel").addEventListener("change",e=>{setLoc(e.target.value);updateMapClear();syncHash();renderMap();render();});
document.getElementById("tiersel").addEventListener("change",e=>{fTier=e.target.value;syncHash();render();});
document.getElementById("fibsel").addEventListener("change",e=>{fFib=e.target.value;syncHash();render();});
document.getElementById("occsel").addEventListener("change",e=>{fOcc=e.target.value;syncHash();render();});
document.getElementById("sortsel").addEventListener("change",e=>{fSort=e.target.value;syncHash();render();});
document.getElementById("walkonly").addEventListener("change",e=>{fWalk=e.target.checked;syncHash();render();});
document.getElementById("savedbtn").addEventListener("click",e=>{
  fSaved=!fSaved;e.currentTarget.setAttribute("aria-pressed",String(fSaved));
  syncHash();render();});
document.getElementById("sigbtn").addEventListener("click",e=>{
  fSig=!fSig;e.currentTarget.setAttribute("aria-pressed",String(fSig));
  syncHash();render();});
document.getElementById("morebtn").addEventListener("click",e=>{
  const p=document.getElementById("morepanel"),open=!p.classList.contains("open");
  p.classList.toggle("open",open);e.currentTarget.setAttribute("aria-expanded",String(open));
  const s=e.currentTarget.querySelector("span");
  if(s)s.textContent=open?LX().fewerFilters:LX().moreFilters;
});
/* search: 300ms debounce; ✕ clears instantly; UI stays put on focus */
(function(){
  const q=document.getElementById("q"),x=document.getElementById("qclear");let t;
  q.addEventListener("input",()=>{
    x.hidden=!q.value;
    clearTimeout(t);t=setTimeout(()=>{fQ=q.value.trim().toLowerCase();syncHash();render();},300);
  });
  x.addEventListener("click",()=>{q.value="";x.hidden=true;clearTimeout(t);fQ="";syncHash();render();q.focus();});
})();
/* active-chip bar: remove single filters or reset everything */
document.getElementById("activebar").addEventListener("click",e=>{
  const x=e.target.closest(".x");if(x){removeFilter(x.dataset.k);return;}
  const r=e.target.closest("[data-act=reset]");if(r)resetAll();
});
/* quick browse */
document.getElementById("qbgrid").addEventListener("click",e=>{
  const b=e.target.closest(".qb");if(!b)return;
  if(b.dataset.sig){fSig=true;syncHash();syncUI();
    document.getElementById("main").scrollIntoView({behavior:"smooth",block:"start"});return;}
  fCat=b.dataset.cat;
  chipbar("catchips",CATS,fCat,"cat");syncHash();render();
  document.getElementById("main").scrollIntoView({behavior:"smooth",block:"start"});
});
/* card ⋯ menus: one open at a time; outside click and Esc close */
function closeAllPops(){
  document.querySelectorAll(".cm-pop:not([hidden])").forEach(p=>{
    p.hidden=true;
    const b=p.closest(".card")?.querySelector(".cm-btn");
    if(b)b.setAttribute("aria-expanded","false");
  });
}
document.addEventListener("click",e=>{
  if(!e.target.closest(".cm-btn")&&!e.target.closest(".cm-pop"))closeAllPops();
});
addEventListener("keydown",e=>{if(e.key==="Escape")closeAllPops();});
/* results: hearts, expanders, copy, state actions — delegated; heart clicks never re-render */
document.getElementById("main").addEventListener("click",e=>{
  const sv=e.target.closest(".sv");
  if(sv){
    const id=sv.dataset.id;
    if(window.SS_TRAY){ /* the tray owns saved-state; fd-saved stays written as its mirror */
      if(SS_TRAY.isSaved(id))SS_TRAY.removeSaved(id);else SS_TRAY.addSaved(id);
      try{SAVED=new Set(JSON.parse(localStorage.getItem("fd-saved")||"[]"));}catch(err){}
    }else{ /* module failed to load — plain localStorage hearts still work */
      if(SAVED.has(id))SAVED.delete(id);else SAVED.add(id);
      persistSaved();
    }
    const on=SAVED.has(id);
    sv.classList.toggle("on",on);sv.setAttribute("aria-pressed",on);
    updateSavedCount();
    return;
  }
  const cmb=e.target.closest(".cm-btn");
  if(cmb){
    const card=cmb.closest(".card"),pop=card.querySelector(".cm-pop");
    const wasOpen=pop&&!pop.hidden;
    closeAllPops();
    if(pop&&!wasOpen){
      pop.hidden=false;cmb.setAttribute("aria-expanded","true");
      /* sit just under the ⋯; flip above it when the card's clipped bottom is too close */
      const below=cmb.offsetTop+cmb.offsetHeight+4;
      if(below+pop.offsetHeight>card.clientHeight-6){
        pop.style.top="auto";pop.style.bottom=(card.clientHeight-cmb.offsetTop+4)+"px";
      }else{pop.style.bottom="auto";pop.style.top=below+"px";}
    }
    return;
  }
  const bk=e.target.closest(".bk");
  if(bk){ /* basket: fd-basket.js owns the state; the card button just relays */
    if(window.SS_BASKET){
      const on=SS_BASKET.addOrOpen(bk.dataset.id);
      bk.classList.toggle("on",on);bk.setAttribute("aria-pressed",String(on));
    }
    return;
  }
  const strip=e.target.closest(".strip");
  if(strip){ /* the whole walk, in one tap: search the street the house stands on */
    const q=document.getElementById("q");
    q.value=strip.dataset.street;
    q.dispatchEvent(new Event("input",{bubbles:true}));
    document.querySelector(".controls")?.scrollIntoView({block:"start"});
    return;
  }
  const sh=e.target.closest(".shr");
  if(sh){ /* share a deep link that lands as a pre-filled search + removable chip */
    const url=location.href.split("#")[0]+"#q="+encodeURIComponent(sh.dataset.n);
    if(navigator.share)navigator.share({title:sh.dataset.n+" — The Saigon Fashion Directory",url}).catch(()=>{});
    else if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>{
      const L=LX();sh.classList.add("ok");sh.textContent=L.shared;
      setTimeout(()=>{sh.classList.remove("ok");sh.textContent=LX().share;},1500);
    });
    return;
  }
  const act=e.target.closest("[data-act]");
  if(act){
    const a=act.dataset.act;
    if(a==="reset")resetAll();
    if(a==="clearq")removeFilter("q");
    if(a==="women"){fCat="women";fQ="";document.getElementById("q").value="";syncHash();syncUI();}
    return;
  }
  const cp=e.target.closest("#copylist");
  if(cp&&navigator.clipboard){
    const L=LX();
    const rows=B.filter(match).map(b=>
      b.n+" — "+b.a+" ("+b.area+")"+(hasStreet(b)?" — "+mapsUrl(b):"")+(b.h?" — @"+b.h:""));
    navigator.clipboard.writeText(rows.join("\n")).then(()=>{
      cp.textContent=L.copied;setTimeout(()=>{cp.textContent=L.copy;},1600);
    });
  }
});
/* map: click / keyboard filter; hover tips on fine pointers only (they blocked taps on touch) */
(function(){const fdmap=document.getElementById("fdmap");
 if(fdmap){
  fdmap.addEventListener("click",e=>{const n=e.target.closest(".fdmap-node");if(n){setZone(n.dataset.z);fdHideTip();}});
  fdmap.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const n=e.target.closest(".fdmap-node");if(n){e.preventDefault();setZone(n.dataset.z);fdHideTip();}});
  if(matchMedia("(hover:hover) and (pointer:fine)").matches){
    fdmap.addEventListener("mousemove",e=>{const n=e.target.closest(".fdmap-node");if(n)fdTip(n);else fdHideTip();});
    fdmap.addEventListener("mouseleave",fdHideTip);
  }
  fdmap.addEventListener("focusin",e=>{const n=e.target.closest(".fdmap-node");if(n)fdTip(n);});
  fdmap.addEventListener("focusout",fdHideTip);
  addEventListener("keydown",e=>{if(e.key==="Escape")fdHideTip();});
  /* capture: scroll doesn't bubble, and the map sits in an overflow-x container */
  addEventListener("scroll",fdHideTip,{passive:true,capture:true});
  addEventListener("resize",fdHideTip,{passive:true});
 }
 const fdc=document.getElementById("fdmapclear");if(fdc)fdc.addEventListener("click",()=>setZone(null));
 document.getElementById("fdmap-districts")?.addEventListener("click",e=>{const b=e.target.closest("button[data-z]");if(b)setZone(b.dataset.z);});
})();
/* map collapse on mobile */
(function(){
  const t=document.getElementById("maptoggle"),body=document.getElementById("mapbody");
  if(!t||!body)return;
  function setOpen(open){
    body.classList.toggle("open",open);
    t.setAttribute("aria-expanded",String(open));
    const s=t.querySelector("span");
    if(s)s.textContent=open?LX().mapHide:LX().mapShow;
  }
  t.addEventListener("click",()=>setOpen(!body.classList.contains("open")));
  window.__fdMapOpen=setOpen;
  setOpen(!!fZone); /* deep-linked zone → arrive with the map visible */
})();
/* Appearance is shared with the atelier via js/theme.js. */
/* ============ FILTER SHEET (mobile) ============ */
const sheetCtl=(function(){
  const sheet=document.getElementById("sheet"),scrim=document.getElementById("scrim"),
        body=document.getElementById("sheetbody"),row2=document.getElementById("row2"),
        more=document.getElementById("morepanel"),controls=document.querySelector(".controls .wrap");
  let opener=null,startY=null,curY=0;
  const mq=matchMedia("(max-width:720px)");
  function relocate(){ /* one set of controls, two homes: controls row on desktop, sheet on mobile */
    if(mq.matches){body.appendChild(row2);body.appendChild(more);more.classList.add("open");}
    else{const ab=document.getElementById("activebar");controls.append(row2,more);
      more.classList.remove("open");
      const mbn=document.getElementById("morebtn");mbn.setAttribute("aria-expanded","false");
      const ms=mbn.querySelector("span");if(ms)ms.textContent=LX().moreFilters;}
  }
  mq.addEventListener?mq.addEventListener("change",relocate):mq.addListener(relocate);
  relocate();
  function open(from){
    opener=from||null;
    sheet.hidden=false;scrim.hidden=false;
    requestAnimationFrame(()=>{sheet.classList.add("open");scrim.classList.add("open");});
    document.body.style.overflow="hidden";
    document.getElementById("sheetdone").focus();
  }
  function close(){
    sheet.classList.remove("open");scrim.classList.remove("open");
    document.body.style.overflow="";
    setTimeout(()=>{sheet.hidden=true;scrim.hidden=true;},340);
    if(opener&&opener.focus)opener.focus();
  }
  document.getElementById("sheetdone").addEventListener("click",close);
  scrim.addEventListener("click",close);
  addEventListener("keydown",e=>{if(e.key==="Escape"&&!sheet.hidden)close();});
  /* simple focus trap */
  sheet.addEventListener("keydown",e=>{
    if(e.key!=="Tab")return;
    const f=sheet.querySelectorAll("button,select,input,[tabindex]:not([tabindex='-1'])");
    if(!f.length)return;
    const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  /* drag-down to dismiss */
  const grab=document.getElementById("sheetgrab");
  grab.addEventListener("touchstart",e=>{startY=e.touches[0].clientY;curY=0;},{passive:true});
  grab.addEventListener("touchmove",e=>{
    if(startY==null)return;
    curY=Math.max(0,e.touches[0].clientY-startY);
    sheet.style.transform=`translateY(${curY}px)`;
  },{passive:true});
  grab.addEventListener("touchend",()=>{
    sheet.style.transform="";
    if(curY>70)close();
    startY=null;
  });
  return{open,close};
})();
/* ============ BOTTOM TAB BAR ============ */
document.querySelector(".tabbar").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  const act=b.dataset.act;
  if(act==="search"){
    document.querySelector(".controls").scrollIntoView({behavior:"smooth",block:"start"});
    setTimeout(()=>document.getElementById("q").focus({preventScroll:true}),450);
  }
  if(act==="sheet")sheetCtl.open(b);
  if(act==="tray"&&window.SS_BASKET)SS_BASKET.open(b);
  if(act==="map"){
    if(window.__fdMapOpen)window.__fdMapOpen(true);
    document.getElementById("map").scrollIntoView({behavior:"smooth",block:"start"});
  }
  if(act==="all"){
    resetAll();
    document.getElementById("main").scrollIntoView({behavior:"smooth",block:"start"});
  }
});

/* ============ AURORA (the one bold moment) ============ */
(function(){
  const c=document.getElementById("aurora");if(!c)return;
  const rm=matchMedia("(prefers-reduced-motion:reduce)").matches;
  const ctx=c.getContext("2d");let W,H,t=0;
  const blobs=[["#c9b6e8",.55],["#8a93de",.5],["#c98fc4",.42],["#cf9bb4",.4]];
  function size(){W=c.width=c.offsetWidth;H=c.height=c.offsetHeight;}
  function draw(){
    ctx.clearRect(0,0,W,H);ctx.globalCompositeOperation="lighter";
    blobs.forEach((b,i)=>{
      const x=W*(.25+.28*Math.sin(t*.0004+i*1.7))+ (i%2?W*.3:0);
      const y=H*(.4+.34*Math.cos(t*.0005+i*2.1));
      const r=Math.max(W,H)*(.34+.06*Math.sin(t*.0006+i));
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,b[0]);g.addColorStop(1,"transparent");
      ctx.globalAlpha=b[1];ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
    });
    ctx.globalAlpha=1;
  }
  size();draw();addEventListener("resize",()=>{size();draw();});
  if(!rm){(function loop(){if(document.body.classList.contains("fd-workspace"))return;t+=16;draw();requestAnimationFrame(loop);})();}
})();

/* — Map-note numbers computed from B/zoneOf — */
function renderMapNote(){
  const c=zoneCounts(),o=c.other||0,s=B.filter(b=>b.city==="SGN").length,d=s-o;
  const el=document.getElementById("fdmapnote");
  if(el){el.lang="en";el.textContent=`${d} house records across ${ZONES.length} district groups, plus ${o} other Saigon listings. Counts describe directory records, not live stock or individual store branches.`;}
}

/* — Re-localize all dynamic UI whenever the i18n engine switches <html lang> — */
new MutationObserver(()=>{
  statChips();renderBrowse();renderNow();renderMapNote();
  chipbar("catchips",CATS,fCat,"cat");chipbar("vibechips",VIBES,fVibe,"vibe");
  fillSel("locsel",LOCS,locValue());fillSel("tiersel",TIERS,fTier);fillSel("fibsel",FIBERS,fFib);fillSel("occsel",OCCS,fOcc);fillSel("sortsel",SORTS,fSort);
  render();renderMap();
  /* stateful labels the data-i18n pass can't know about */
  const sb=document.getElementById("savedbtn");if(sb)sb.title=LX().savedTip;
  const mb=document.getElementById("mapbody");
  if(window.__fdMapOpen&&mb)window.__fdMapOpen(mb.classList.contains("open"));
  const mp=document.getElementById("morepanel");
  if(mp&&mp.classList.contains("open")){
    const s=document.getElementById("morebtn").querySelector("span");
    if(s)s.textContent=LX().fewerFilters;
  }
}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});

/* — Hairline shadow on the sticky controls once they stick; expose height for sticky subheaders — */
(function(){
  const s=document.getElementById("stickysentinel"),c=document.querySelector(".controls");
  if(!s||!c)return;
  if("IntersectionObserver"in window)
    new IntersectionObserver(es=>c.classList.toggle("stuck",!es[0].isIntersecting),
      {rootMargin:"30px 0px 0px 0px"}).observe(s);
  function h(){document.documentElement.style.setProperty("--ctrl-h",c.offsetHeight+"px");}
  if("ResizeObserver"in window)new ResizeObserver(h).observe(c);else addEventListener("resize",h);
  h();
})();

/* — Side-rail scroll-spy: same IntersectionObserver recipe as index.html, but over an
     explicit id list (#filters is a div and #main is <main>, so section[id] would miss them) — */
(function(){
  const rail=document.querySelectorAll(".fd-rail a");
  if(!rail.length||!("IntersectionObserver"in window))return;
  const spy=new IntersectionObserver(es=>{
    es.forEach(en=>{
      if(!en.isIntersecting)return;
      const id=en.target.getAttribute("id");
      rail.forEach(a=>{
        const on=a.getAttribute("href")==="#"+id;
        a.classList.toggle("active",on);
        if(on)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current");
      });
    });
  },{rootMargin:"-45% 0px -50% 0px",threshold:0});
  ["browse","map","filters","main","house-compare","piece-board"].forEach(id=>{
    const el=document.getElementById(id);if(el)spy.observe(el);
  });
})();

/* — Restore state from a shared deep link (#cat=men&tier=mid, #zone=d3, #q=…) — */
function applyHash(){
  const h=location.hash.replace(/^#/,"");
  fCat="all";fCity="all";fTier="all";fVibe="all";fFib="all";fOcc="all";fZone="";fWalk=false;fSaved=false;fSig=false;fQ="";fSort="rec";
  const q=document.getElementById("q");q.value="";
  if(h){
    const p=new URLSearchParams(h);
    if(p.get("cat"))fCat=p.get("cat");
    if(p.get("city"))fCity=p.get("city");
    if(p.get("tier"))fTier=p.get("tier");
    if(p.get("vibe"))fVibe=p.get("vibe");
    if(p.get("fib"))fFib=p.get("fib");
    if(p.get("occ"))fOcc=p.get("occ");
    if(p.get("sort"))fSort=p.get("sort");
    fZone=p.get("zone")||"";
    fWalk=p.get("walk")==="1";
    fSaved=p.get("saved")==="1";
    fSig=p.get("sig")==="1";const _sb=document.getElementById("sigbtn");if(_sb)_sb.setAttribute("aria-pressed",String(fSig));
    const qs=p.get("q")||"";
    if(qs){fQ=qs.toLowerCase();q.value=qs;}
  }
  document.getElementById("qclear").hidden=!fQ;
  document.getElementById("walkonly").checked=fWalk;
  document.getElementById("savedbtn").setAttribute("aria-pressed",String(fSaved));
  var _sg=document.getElementById("sigbtn");if(_sg)_sg.setAttribute("aria-pressed",String(fSig));
  updateMapClear();
}
function syncUI(){
  chipbar("catchips",CATS,fCat,"cat");chipbar("vibechips",VIBES,fVibe,"vibe");
  fillSel("locsel",LOCS,locValue());fillSel("tiersel",TIERS,fTier);fillSel("fibsel",FIBERS,fFib);fillSel("occsel",OCCS,fOcc);fillSel("sortsel",SORTS,fSort);
  document.getElementById("walkonly").checked=fWalk;
  document.getElementById("savedbtn").setAttribute("aria-pressed",String(fSaved));
  var _sg=document.getElementById("sigbtn");if(_sg)_sg.setAttribute("aria-pressed",String(fSig));
  statChips();updateSavedCount();updateMapClear();render();renderMap();
}
applyHash();
renderBrowse();renderNow();renderMapNote();
syncUI();
if(fZone&&window.__fdMapOpen)window.__fdMapOpen(true);
addEventListener("hashchange",function(){
  // Section links preserve the visitor's existing filters and native anchor jump.
  if(document.getElementById(location.hash.slice(1)))return;
  applyHash();syncUI();
  const m=document.getElementById("main");if(m)m.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.classList.contains('rm')?'instant':'smooth',block:"start"});
});

/* — Reusable hooks for the route planner (js/route-panel.js): reuse the real zoneOf/match/mapsUrl — */
window.SS_FD={zoneOf,match,mapsUrl,refresh:render,sort:sortList,streets:streetsPanel,
 state:()=>({q:fQ,cat:fCat,city:fCity,tier:fTier,fib:fFib,occ:fOcc,zone:fZone,walk:fWalk,saved:fSaved,sig:fSig,sort:fSort}),
 facetCounts:()=>{const result={};for(const [key,id,fn] of [['cat','catchips',(b,v)=>v==='all'||b.cat===v],['loc','locsel',(b,v)=>v==='all'||(v.startsWith('z:')?zoneOf(b)===v.slice(2):b.city===v)],['tier','tiersel',(b,v)=>v==='all'||b.tier===v],['fib','fibsel',(b,v)=>v==='all'||fibMatch(b,v)],['occ','occsel',(b,v)=>v==='all'||occOf(b).includes(v)]]){const candidates=B.filter(b=>match(b,key));result[id]={};document.querySelectorAll('#'+id+' '+(key==='cat'?'button':'option')).forEach(n=>{const v=key==='cat'?n.dataset.v:n.value;result[id][v]=candidates.filter(b=>fn(b,v)).length;});}return result;},
 openFilters:()=>sheetCtl.open(document.activeElement),reset:()=>{history.replaceState(null,'',location.pathname+location.search);applyHash();syncUI();}};
