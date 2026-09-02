
/* ══════════════════════════════════════════
   REMAINING UNCHANGED PAGES
══════════════════════════════════════════ */
/**
 * The project catalogue.
 *
 * `about` is the "Rreth projektit" copy, one entry per paragraph. It lives here because
 * the detail page used to print two fixed paragraphs of filler for EVERY project — the
 * same shape of bug the course cards and the semester credits had: content written into
 * the markup instead of into the data, so eight different projects all said the same
 * thing. Adding a project without its own text is now a type error.
 *
 * Several of these were supplied as bullet lists and deliberately rewritten as prose:
 * this block is a narrative about a finished piece of work, not a spec sheet.
 */
/* Project photos — /projektet/[slug]. `Main` is the large shot beside the "Rreth
   projektit" copy; the numbered ones fill the three-up strip below it. Six of the eight
   projects have real photos; SDC alone still has none and falls back to the stock images
   hard-coded in ProjectDetailPage. The delivered names differ slightly from how they were
   listed: us2/us3/us4, not us-2/us-3/us-4. */
/* LuxDev. `1` is the large shot; 2-4 fill the strip, left to right. All four are .jpeg
   now: luxdev1 was delivered as a 5208px PNG, and a PNG that wide is ~3.7MB even after
   resizing because PNG cannot compress a photograph. It is re-encoded as JPEG at 1600px
   (0.11MB) — 2x its 556px display slot, so it stays sharp on retina.
   `luxdev.png` is something else entirely: the FUNDER LOGO for the navbar dropdown,
   imported as `projectLuxDev` far above. Do not conflate the two. */
import projLuxDevMain from "../../imports/luxdev1.jpg";

import projLuxDev2 from "../../imports/luxdev2.jpeg";

import projLuxDev3 from "../../imports/luxdev3.jpeg";

import projLuxDev4 from "../../imports/luxdev4.jpeg";

/* SDC / Helvetas. `1` is the large shot; 2 and 3 fill the strip, which is a TWO-up
   row for this project rather than the usual three — only two extra photos exist.
   Mixed extensions, as delivered: sdc1 is .webp, 2 and 3 are .jpg. */
import projSdcMain from "../../imports/sdc1.webp";

import projSdc2 from "../../imports/sdc2.jpg";

import projSdc3 from "../../imports/sdc3.jpg";

import projSkillMain from "../../imports/skill7.jpeg";

import projSkill1 from "../../imports/skill1.jpeg";

import projSkill3 from "../../imports/skill3.jpeg";

import projSkill4 from "../../imports/skill4.jpeg";

import projUsaidMain from "../../imports/usaid.jpg";

import projUs2 from "../../imports/us2.jpg";

import projUs3 from "../../imports/us3.png";

import projUs4 from "../../imports/us4.jpg";

import projGraMain from "../../imports/gra2.jpg";

import projGra1 from "../../imports/gra1.jpg";

import projGra3 from "../../imports/gra3.jpg";

import projGra4 from "../../imports/gra4.jpg";

import projKodeMain from "../../imports/kode1.jpeg";

import projKode2 from "../../imports/kode2.jpg";

import projKode3 from "../../imports/kode3.jpg";

import projRcfMain from "../../imports/rcf3.jpg";

import projRcf1 from "../../imports/rcf1.jpg";

import projRcf2 from "../../imports/rcf2.jpg";

import projRcf4 from "../../imports/rcf4.jpg";

import projVicMain from "../../imports/vic.png";

import projVic1 from "../../imports/vic1.jpg";

import projVic2 from "../../imports/vic2.jpg";

import projVic3 from "../../imports/vic3.jpg";


export const PROJECTS = [
  {
    title: "Skill Factory",
    partner: "PARTNER",
    desc: "Skill Factory nga Cacttus Education ishte një akademi trajnimi inovative, e mbështetur nga Bashkimi Evropian dhe Qeveria Gjermane përmes iniciativës Digital4Business.",
    path: "/projektet/skill-factory",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["1,200", "Pjesëmarrës"],
      ["35", "Trajnime"],
      ["10+", "Kategori Trajnimesh"],
    ],
    mainImg: projSkillMain,
    gallery: [
      { url: projSkill1, imgPosition: "center 50%" },
      { url: projSkill3, imgPosition: "center 50%" },
      { url: projSkill4, imgPosition: "center 50%" },
    ],
    about: [
      "Në kuadër të këtij projekti janë organizuar 35 trajnime, duke përfshirë 20 në Prizren dhe 15 në Prishtinë, të cilat kanë trajnuar mbi 1,200 kandidatë nga kategori të ndryshme, përfshirë të rinjtë e papunë dhe profesionistët e ndërmarrjeve të vogla dhe të mesme (MSEs). Programi ka ofruar kurse në programim, digjitalizimi të biznesit, menaxhim të projekteve, dizajn grafik, marketing dixhital dhe përdorimin e paketës Microsoft Office, duke i ndihmuar pjesëmarrësit të fitojnë aftësi praktike të aplikueshme në tregun e punës.",
      "Një aspekt kyç i Skill Factory ka qenë qasja e tij e hapur dhe gjithëpërfshirëse, me formate hibride të mësimdhënies që kanë kombinuar mësimin online dhe pjesëmarrjen fizike. Ky model ka lehtësuar qasjen për pjesëmarrës nga e gjithë Kosova, duke përfshirë edhe trajnime të ofruara plotësisht falas për periudha të caktuara. Një tjetër arritje e rëndësishme ka qenë pjesëmarrja e lartë e grave, veçanërisht në trajnimet e marketingut dhe dizajnit grafik.",
      "Skill Factory nuk ishte vetëm një akademi trajnimi, por një hapësirë ku talentet zhvillohen dhe mundësitë e reja krijohen. Përmes bashkëpunimeve me biznese dhe institucione të ndryshme, pjesëmarrësit tanë kanë arritur të punësohen, të hapin biznese të reja dhe të avancohen në karrierat e tyre.",
    ],
  },
  {
    title: "Partneriteti për Impaktin në TIK",
    partner: "USAID",
    desc: "Cacttus Education zbaton Programin YOU, i mbështetur nga USAID Kosovo, për të rritur qasjen e të rinjve në arsim profesional, njohuri dhe tregun e punës në ICT. Projekti ofron trajnime praktike në zhvillim softueri, administrim rrjetesh, siguri kibernetike dhe sipërmarrësi digjitale, duke i lidhur pjesëmarrësit me sektorin privat për praktika dhe mentorim.",
    path: "/projektet/usaid",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["250", "Pjesëmarrës"],
      ["60", "Bursa"],
      ["32", "Programe Trajnimi"],
    ],
    mainImg: projUsaidMain,
    gallery: [
      { url: projUs2, imgPosition: "center 50%" },
      { url: projUs3, imgPosition: "center 50%" },
      { url: projUs4, imgPosition: "center 50%" },
    ],
    about: [
      "Gjatë katër viteve të implementimit, programi përfshiu 450 aplikantë, ku 250 u përzgjodhën për trajnime aktive. U ofruan 32 programe dhe 60 studentë përfituan bursa, nga të cilët 22 ishin gra, duke promovuar barazinë gjinore në ICT. Pjesëmarrësit ishin kryesisht të moshës 18-25 vjeç, ndërsa shumë u punësuan ose themeluan startup-e. Për të siguruar suksesin afatgjatë, u krijuan partneritete me kompani teknologjike për mbështetje të karrierës.",
      "Programi u ndërtua si një cikël katërvjeçar trajnimi për aftësi në ICT, i zhvilluar njëkohësisht në institucione arsimore dhe në kompani partnere në Kosovë. Përmes 32 programeve të trajnimit, 250 të rinj përfituan mentorim nga profesionistë të fushës dhe praktikë të drejtpërdrejtë në industri, ndërsa 60 studentë — 22 prej tyre gra — u mbështetën me bursa.",
      "Pjesëmarrësit dolën me aftësi teknike dhe sipërmarrëse njëkohësisht, të cilat u hapën mundësi të reja punësimi. Mbi të gjitha, projekti krijoi një lidhje të qëndrueshme mes arsimit dhe tregut të punës — një model që mbetet i zbatueshëm për zhvillimin e aftësive në ICT edhe pas përfundimit të tij.",
    ],
  },
  {
    title: "SDC",
    partner: "SDC",
    desc: "Projekti synon përmirësimin e punësimit të të rinjve në sektorin ICT në Kosovë, duke ndërtuar ura bashkëpunimi mes arsimit dhe industrisë dhe duke rritur kapacitetet për eksport të shërbimeve ICT drejt tregjeve të BE-së dhe vendeve gjermanofolëse (DACH).",
    path: "/projektet/sdc",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["30+", "Të Punësuar"],
      ["340+", "Orë Trajnuese"],
      ["14+", "Trajnime Të Personalizuara"],
    ],
    mainImg: projSdcMain,
    /* TWO entries, not three. The strip's column count follows this array's length —
       see `shots` in ProjectDetailPage — so two photos make a two-up row that fills the
       width, rather than three columns with one left empty. */
    gallery: [
      { url: projSdc2, imgPosition: "center 50%" },
      { url: projSdc3, imgPosition: "center 50%" },
    ],
    about: [
      "Projekti, i financuar nga SDC dhe i zbatuar nga Helvetas dhe MDA, zhvilloi një model inovativ të trajnimit dhe punësimit për të rinjtë në sektorin ICT.",
      "Përmes një programi intensiv katërmujor për Full-Stack Web Development, të zhvilluar në bashkëpunim me kompanitë ICT në Kosovë, u ofrua trajnim i përshtatur me kërkesat reale të tregut.",
      "Pjesëmarrësit përzgjidheshin bashkë me kompanitë ICT dhe pas përfundimit të trajnimit u garantohej punësimi. Pagesa e trajnimit bëhej përmes një skeme ku shuma e trajnimit zbritej nga pagat e tyre pas punësimit, duke ulur barrierat financiare.",
      "Që kompanitë të bien dakord për kontrata të tilla, ato do të përfshihen shumë në përzgjedhjen e kandidatëve. Nëpërmjet kësaj, kompanitë do të kenë mundësinë të përzgjedhin njerëz që u përshtaten nevojave të tyre për sa i përket karakterit, aftësive të buta dhe të përgjithshme.",
    ],
  },
  {
    title: "Gratë në Punë Online",
    partner: "WoW",
    desc: "Projekti, zbatuar nga Cacttus Education me mbështetjen e USAID Kosovo, fuqizon gratë e papuna dhe të nënpunësuara me aftësi për punë online — freelancing, zhvillim web, dizajn grafik, SEO, menaxhim rrjetesh sociale dhe përkthim — duke i ndihmuar të ndërtojnë profile profesionale dhe të fitojnë të ardhura të pavarura.",
    path: "/projektet/wow",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["135+", "Gra Të Trajnuara"],
      ["35+", "fituan 2,511€"],
      ["1,670+", "Aplikime"],
    ],
    mainImg: projGraMain,
    gallery: [
      { url: projGra1, imgPosition: "center 50%" },
      { url: projGra3, imgPosition: "center 50%" },
      { url: projGra4, imgPosition: "center 50%" },
    ],
    about: [
      "Nga 1,670 aplikime, 250 gra u përzgjodhën për testim dhe 135 u trajnuan. Programi përfshinte ndërtimin e profileve online, strategji për aplikim, menaxhimin e kohës dhe pagesave ndërkombëtare. Monitorimi pas trajnimit ndihmoi pjesëmarrëset të aplikojnë për projekte dhe të sigurojnë të ardhura përmes platformave online. Për të rritur impaktin, organizoheshin sesione informuese dhe takime me mentorë, duke forcuar lidhjet mes pjesëmarrëseve dhe komunitetit profesional.",
      "Trajnimi u ofrua për aftësi digjitale dhe punë online, në një format që kombinonte mësimin online me praninë fizike, dhe përfshiu 135 gra nga Prishtina dhe Gjilani. Deri në fund të programit, 35 prej tyre kishin siguruar të ardhura prej 2,511 € përmes platformave online.",
      "Rezultati kryesor ishte rritja e pavarësisë financiare dhe e mundësive të punësimit për gratë në Kosovë — një model i suksesshëm për integrimin e tyre në tregun digjital.",
    ],
  },
  {
    title: "KODE",
    partner: "KODE",
    desc: "Cacttus Education zbaton Projektin KODE të Programit YOU, duke rikualifikuar përfitues të përzgjedhur në Komunën e Prizrenit përmes kurseve në Microsoft Azure Cloud, Linux dhe aftësi të buta, me katër klasa trajnimi dhe rreth 80 përfitues gjithsej.",
    path: "/projektet/kode",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["285+", "Orë Të Mbajtura"],
      ["80+", "Përfitues"],
      ["6", "Muaj"],
    ],
    mainImg: projKodeMain,
    gallery: [
      { url: projKode2, imgPosition: "center 50%" },
      { url: projKode3, imgPosition: "center 50%" },
    ],
    about: [
      "Zbatimi i kursit Microsoft Azure Cloud dhe Linux dhe aftësive të buta të listuara në Komunën e Prizrenit është pjesë e përgjegjësisë së Cacttus Education, e cila ka përfshirë organizimin e katër klasave të trajnimit me afërsisht 20 përfitues për klasë, për gjithsej 80 përfitues. Ofrimi i trajnimeve është kryer nga Cacttus Education.",
      "Gjatë projektit, Cacttus Education ka implementuar një program trajnimi gjithëpërfshirës me një kohëzgjatje prej gjashtë muajsh për klasë, i cili përfshin trajnime me qasje në klasë dhe laboratore digjitale në shtëpi. Qëllimi ynë është t'i pajisim përfituesit me aftësi teknike dhe të buta për të rritur punësimin e tyre në tregun e TI-së në Kosovë dhe/ose në platformat e pavarura online. Programi ynë i trajnimit fokusohet në rikualifikimin dhe, në disa raste, përmirësimin e aftësive të përfituesve në ekspertizën teknike dhe aftësitë e buta që lidhen me zhvillimin e tyre profesional. Kohëzgjatja totale e parashikuar e programit ishte 285 orë, e cila ka përfshirë udhëzime në klasë, detyra individuale në shtëpi dhe detyra grupore për zbatimin praktik të koncepteve teorike.",
    ],
  },
  {
    title: "Regional Challenge Fund (RCF)",
    partner: "RCF",
    desc: "Projekti, zbatuar nga Cacttus Education me partnerë teknologjikë, përmirëson aftësitë digjitale dhe punësueshmërinë e të rinjve përmes trajnimit bashkëpunues (Cooperative Training), duke kombinuar mësimin teorik me praktikën në zhvillim web, mobile dhe administrim sistemesh.",
    path: "/projektet/rcf",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["60+", "Të Trajnuar"],
      ["50%", "Gra"],
      ["2", "Vite"],
    ],
    mainImg: projRcfMain,
    gallery: [
      { url: projRcf1, imgPosition: "center 50%" },
      { url: projRcf2, imgPosition: "center 50%" },
      { url: projRcf4, imgPosition: "center 50%" },
    ],
    about: [
      "Projekti trajnon 60 të rinj në dy vite, me 50% gra, duke promovuar barazinë gjinore në sektorin e IT-së. Çdo vit, 30 studentë përfitojnë nga trajnimet e strukturuara dhe mentorimi nga profesionistë të industrisë. Programi përfshin teknologjitë më të fundit, softuerë të avancuar dhe pajisje moderne, duke i përgatitur pjesëmarrësit për tregun e punës.",
      "Trajnimi u ndërtua si një program bashkëpunues për aftësi digjitale, i zhvilluar njëkohësisht në institucionet arsimore dhe në kompanitë partnere, me një ndarje të barabartë mes teorisë dhe praktikës — gjysma e kohës në klasë, gjysma në punë reale. Pjesëmarrësit dolën me aftësi teknike, njohuri për menaxhim projektesh dhe siguri kibernetike.",
      "Ndikimi ndihet në tri drejtime: rritja e punësueshmërisë, fuqizimi i të rinjve dhe një lidhje më e ngushtë mes arsimit dhe industrisë së IT-së.",
    ],
  },
  {
    title: "LuxDev Smart Mobility Project",
    partner: "LuxDev",
    desc: "LuxDev Smart Mobility Project është një iniciativë e financuar nga LuxDev dhe fituar nga Cacttus Sh.A., që synon zhvillimin e zgjidhjeve të mençura dhe të qëndrueshme në mobilitetin urban të Kosovës, duke forcuar njohuritë lokale në smart mobility dhe teknologjitë e aplikuara.",
    path: "/projektet/luxdev",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["100+", "Pjesëmarrës"],
      ["5+", "Partnerë"],
      ["4000+", "IoT Pajisje"],
    ],
    mainImg: projLuxDevMain,
    /* Strip order IS the array order, left to right. */
    gallery: [
      { url: projLuxDev2, imgPosition: "center 50%" },
      { url: projLuxDev3, imgPosition: "center 50%" },
      { url: projLuxDev4, imgPosition: "center 50%" },
    ],
    about: [
      "Fokusi i projektit është forcimi i njohurive dhe aftësive lokale në fusha që lidhen me smart mobility, sistemet digjitale dhe teknologjitë e aplikuara, duke krijuar lidhje të drejtpërdrejta ndërmjet arsimit, nevojave të tregut të punës dhe zhvillimeve të ardhshme në sektorin e transportit dhe mobilitetit.",
      "Roli i Cacttus Education në këtë projekt është i përqendruar kryesisht në arsim dhe zhvillim të aftësive profesionale. Si institucion i arsimit dhe trajnimit profesional, Cacttus Education është përgjegjës për dizajnimin dhe ofrimin e programeve trajnuese praktike, punëtorive dhe moduleve mësimore që pajisin studentët dhe profesionistët me aftësi konkrete digjitale dhe teknike të lidhura me smart mobility. CE kontribuon gjithashtu në zhvillimin e kurrikulave, aktiviteteve praktike dhe ndërtimin e kapaciteteve afatgjata, duke siguruar që rezultatet e projektit të jenë të matshme dhe të qëndrueshme.",
      "LuxDev Smart Mobility Project është një iniciativë zhvillimore e financuar nga LuxDev dhe e fituar nga Cacttus Sh.A. Ajo synon zhvillimin e zgjidhjeve të mençura, të qëndrueshme dhe të bazuara në teknologji në fushën e mobilitetit urban në Kosovë, duke u mbështetur te ngritja e kapaciteteve dhe inovacioni si rruga kryesore drejt atij qëllimi.",
    ],
  },
  {
    title: "Virtual Innovation Consortium (VIC)",
    partner: "VIC",
    desc: "VIC është një iniciativë e mbështetur nga Bashkimi Evropian që zhvillon aftësi dixhitale të avancuara në Realitetin e Zgjeruar (AR/VR), duke bashkuar universitete, institucione kërkimore dhe liderë industrie për trajnime të përshtatura si për profesionistë të TIK-ut ashtu edhe për audiencat jo-tradicionale.",
    path: "/projektet/vic",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["500+", "Pjesëmarrës"],
      ["11+", "Partnerë"],
      ["25+", "Trajnime të Avancuara"],
    ],
    mainImg: projVicMain,
    gallery: [
      { url: projVic1, imgPosition: "center 50%" },
      { url: projVic2, imgPosition: "center 50%" },
      { url: projVic3, imgPosition: "center 50%" },
    ],
    about: [
      "Duke kombinuar përsosmërinë akademike me bashkëpunimin e industrisë, VIC siguron që të diplomuarit të fitojnë aftësi praktike, të harmonizuara me tregun, duke rritur punësimin dhe duke kontribuar në transformimin dixhital të Evropës.",
      "VIC është një iniciativë e mbështetur nga Bashkimi Evropian për zhvillimin e aftësive dixhitale të avancuara, e përqendruar te teknologjitë XR — duke përfshirë Realitetin e Shtuar (AR) dhe Realitetin Virtual (VR). Iniciativa bashkon universitete, institucione kërkimore, ofrues të arsimit profesional (VET) dhe liderë të industrisë.",
      "Programet e trajnimit janë moderne, në teknologji gjithëpërfshirëse dhe të orientuara drejt nevojave të tregut të punës, dhe synojnë si profesionistët e TIK-ut ashtu edhe audienca jo-tradicionale — edukatorë, profesionistë shëndetësorë, dizajnerë dhe inxhinierë. Duke mbështetur rikualifikimin dhe përmirësimin e aftësive, ato rrisin punësueshmërinë dhe kontribuojnë në transformimin dixhital të Evropës.",
    ],
  },
];


/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */

/*
  The strip shown for a project that has no photos of its own. Every project has real
  ones now, so nothing reaches this today — it is kept so that a newly added project
  renders a complete page before its photography arrives, rather than three empty boxes.
*/
export const PROJECT_FALLBACK_GALLERY = [
  { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=266&fit=crop&auto=format", imgPosition: "center 50%" },
  { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=266&fit=crop&auto=format", imgPosition: "center 50%" },
  { url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=266&fit=crop&auto=format", imgPosition: "center 50%" },
];
