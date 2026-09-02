import { useState } from "react";
import {
  Award,
  Briefcase,
  Check,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Phone,
  Projector,
  Users,
  Wifi,
  Wind,
} from "lucide-react";
import { Link } from "react-router";
import { CLASS_BOOKING_ROOMS } from "../../marketing/lib/forms.config";
import { useClassBooking } from "../hooks/useClassBooking";
import { sanitizePhone } from "../lib/phone";
import { C, globalStyle } from "../theme";
import { Breadcrumb } from "../ui/Breadcrumb";
import { PageWrapper } from "../ui/PageWrapper";
import { PrimaryBtn } from "../ui/buttons";

/* Hero photo for /biznese/klasa — replaces the Unsplash placeholder the section used.
   Same full-bleed frame and KLASA_HERO_IMG_POSITION crop as before. */
import klasaMeQeraHero from "../../imports/klasaMeQeraHero.jpeg";

/* Scholarship sponsors for /biznese/bursa — see BURSA_SPONSORS. All three arrived as .png
   despite being referred to as .svg. */
/* Room photos for the "Hapësirat tona" grid on /biznese/klasa — one per card, in the
   order the array lists them. Shot portrait (EXIF orientation 6) and delivered at
   4592x3448 / ~6MB each; downscaled to 1200px on the long edge with the rotation baked
   in, since the card renders them about 370px wide.

   All six were renamed .JPG -> .jpg: `vite/client` only declares the lowercase extensions,
   so the uppercase ones did not typecheck, and an uppercase extension is a trap on a
   case-sensitive deploy host besides. */
import klasaPortokalli from "../../imports/klasaportokalli.jpg";

import klasaRoze from "../../imports/klasaroze.jpg";

import klasaVerdhe from "../../imports/klasaverdhe.jpg";

import klasaGjelber from "../../imports/klasagjelber.jpg";

import klasaKuqe from "../../imports/klasakuqe.jpg";

import klasaHapsira from "../../imports/hapsira.jpg";

/* Gallery photos for the "Pamje nga hapësirat" grid further down the same page — six
   positions, left-to-right then top-to-bottom, so the import order IS the display order.
   Same treatment as the room photos above: delivered at 4592x3448 / ~5MB each, downscaled
   to 1200px on the long edge with any EXIF rotation baked in. Orientation is mixed here —
   1, 3 and 5 are portrait, 2, 4 and 6 landscape — which the grid handles, since each cell
   sets its own aspect ratio and crops with `object-cover`. Note `hapsira.jpg` above is a
   different photo entirely (the shared-space CARD), not part of this set. */
import hapsira1 from "../../imports/hapsira1.jpg";

import hapsira2 from "../../imports/hapsira2.jpg";

import hapsira3 from "../../imports/hapsira3.jpg";

import hapsira4 from "../../imports/hapsira4.jpg";

import hapsira5 from "../../imports/hapsira5.jpg";

import hapsira6 from "../../imports/hapsira6.jpg";


/** Anchor for the room cards' "Rezervo" buttons to scroll to. */
export const KLASA_BOOKING_ID = "rezervo-klasen";


/* ── 5.4 KLASËT ME QERA ── */
/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
export const KLASA_HERO_IMG_POSITION = "center 50%";


export function PageBiznestKlasa() {
  /*
    The booking band posts to the DEDICATED room-booking form now, not the general
    business-enquiry form: the band is literally "Rezervo hapësirën tënde", and a booking
    carries a room, which a general enquiry has no field for. `useBusinessLead` is still
    what the other two /biznese pages use.
  */
  const booking = useClassBooking();
  const [klasa, setKlasa] = useState({ emri: "", email: "", telefoni: "", data: "", pjesemarres: "", klasa: "", shenime: "" });

  /* A room card's "Rezervo" pre-selects that room and brings the band into view — the
     form already exists further down the page, so this reveals it rather than opening a
     modal the /biznese pages have no precedent for. */
  const bookRoom = (room: string) => {
    setKlasa((prev) => ({ ...prev, klasa: room }));
    document.getElementById(KLASA_BOOKING_ID)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <PageWrapper>
      <style>{globalStyle}</style>

      {/* 1. Hero — image-led */}
      <section className="relative min-h-[60vh] flex items-end">
        <div className="absolute inset-0">
          <img src={klasaMeQeraHero} alt="Klasë moderne" className="w-full h-full object-cover" style={{ objectPosition: KLASA_HERO_IMG_POSITION }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.1) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-5 py-16 w-full">
          <div className="max-w-md rounded-2xl p-7 shadow-2xl" style={{ backgroundColor: "#fff" }}>
            <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Për biznese", path: "/biznese" }, { label: "Klasët me qera" }]} />
            <h1 className="text-4xl md:text-5xl font-bold mb-2 leading-tight" style={{ color: C.n900 }}>Hapësira moderne për trajnimet dhe eventet tuaja</h1>
            <p className="text-sm mb-5" style={{ color: C.muted }}>Klasa plotësisht të pajisura për trajnime, workshope, provime, takime dhe konferenca, në një lokacion të përshtatshëm.</p>
            {/* The HERO button only. The identically-labelled button further down this
                page is a form's submit control, not a link, and is left alone. */}
            <Link to="/kontakti"><PrimaryBtn>Rezervo tani</PrimaryBtn></Link>
          </div>
        </div>
      </section>

      {/* 2. Quick specs */}
      <section className="py-10" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-wrap gap-6 justify-center">
            {[
              [Users, "Deri 30 persona"],
              [Monitor, "Kompjuterë dhe workstation"],
              [Projector, "Projektor"],
              [Wifi, "Free Wi-Fi"],
              [Wind, "Klimatizim"],
            ].map(([Icon, label]) => (
              <div key={label as string} className="flex items-center gap-3 px-5 py-3 rounded-full" style={{ backgroundColor: C.brandSoft, border: `1px solid ${C.cardBorder}` }}>
                <Icon size={18} style={{ color: C.brand }} />
                <span className="text-sm font-medium" style={{ color: C.n900 }}>{label as string}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. The spaces */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-10" style={{ color: C.n900 }}>Hapësirat tona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              /*
                `price` is the monthly figure in euro, or null for a room that is quoted
                rather than listed — null is what selects the "Çmimi me kërkesë" wording
                below, so a room becomes quote-only by clearing this field, not by editing
                markup.

                `accent` colours that price. Each is the room's own colour, sampled from
                the reference design rather than eyeballed, and is deliberately NOT one of
                the `C` brand tokens: these belong to the rooms, not to the site palette,
                and folding them into `C` would invite their reuse somewhere they mean
                nothing.

                ⚠ CONTRAST on white, large text needs 3:1 to meet WCAG AA:
                    #853A93 rozë    6.94:1  ok
                    #CF142B kuqe    5.54:1  ok
                    #00A651 gjelbër 3.19:1  ok, only just
                    #FAA700 portok. 1.98:1  FAILS
                    #FFC726 verdhë  1.56:1  FAILS
                The two failing values are kept because they are the rooms' actual colours
                and the brief asked for a match. Darker shades of the same hue that do pass
                are #C77A00 (3.38:1) and #B8860B (3.25:1) — swap them in here if the price
                proves hard to read against the white card.
              */
              { name: "Klasa Portokalli", capacity: "30 persona", price: 160, accent: "#FAA700", includes: ["30 Kompjuterë", "Projektor", "Tabelë e bardhë", "Klimatizim"], img: klasaPortokalli, imgPosition: "center 50%" },
              { name: "Klasa Rozë", capacity: "20 persona", price: 180, accent: "#853A93", includes: ["16 Kompjuterë iMac", "Projektor", "Tabelë e bardhë", "Klimatizim"], img: klasaRoze, imgPosition: "center 50%" },
              { name: "Klasa e verdhë", capacity: "50 persona", price: 220, accent: "#FFC726", includes: ["50 Kompjuterë", "Projektor", "Tabelë e bardhë", "Klimatizim"], img: klasaVerdhe, imgPosition: "center 50%" },
              { name: "Klasa e gjelbër", capacity: "20 persona", price: 140, accent: "#00A651", includes: ["16 Kompjuterë", "Projektor", "Tabelë e bardhë", "Klimatizim"], img: klasaGjelber, imgPosition: "center 50%" },
              { name: "Klasa e kuqe", capacity: "30 persona", price: 160, accent: "#CF142B", includes: ["30 Kompjuterë", "Projektor", "Tabelë e bardhë", "Klimatizim"], img: klasaKuqe, imgPosition: "center 50%" },
              { name: "Hapsira e përbashkët", capacity: "16 persona", price: null, accent: C.brand, includes: ["Aparat për kafe", "Free Wi-Fi", "Aparat për ujë", "Klimatizim"], img: klasaHapsira, imgPosition: "center 50%" },
            ].map(({ name, capacity, price, accent, includes, img, imgPosition }) => (
              <div key={name} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.n0 }}>
                <div className="aspect-video overflow-hidden" style={{ backgroundColor: C.n100 }}>
                  <img src={img} alt={name} className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: imgPosition }} />
                </div>
                <div className="p-5">
                  <p className="font-semibold mb-1" style={{ color: C.n900 }}>{name}</p>
                  <p className="text-sm mb-3" style={{ color: C.brand }}>Kapaciteti: {capacity}</p>
                  <div className="flex flex-col gap-1 mb-3">
                    {includes.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
                        <Check size={11} style={{ color: C.brand }} /> {item}
                      </div>
                    ))}
                  </div>
                  {/*
                    Fixed-height price block. The quote-only room's one line of small text
                    is far shorter than a 30px numeral, and without a floor here its
                    "Rezervo" would ride up out of line with the priced rooms beside it in
                    the same grid row. `flex items-end` keeps both variants sitting on the
                    same baseline off the button.
                  */}
                  <div className="min-h-[44px] flex items-end mb-4">
                    {price === null ? (
                      <p className="text-xs" style={{ color: C.n500 }}>Çmimi me kërkesë</p>
                    ) : (
                      /* Label small and neutral, figure large in the room's own colour —
                         the number is what is being scanned for, the word is not. */
                      <p className="flex items-baseline gap-1.5 leading-none">
                        <span className="text-xs" style={{ color: C.n500 }}>Çmimi:</span>
                        <span className="text-3xl font-bold tracking-tight" style={{ color: accent }}>{price}€</span>
                      </p>
                    )}
                  </div>
                  <PrimaryBtn className="text-xs px-4 py-2" onClick={() => bookRoom(name)}>Rezervo</PrimaryBtn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Full equipment list */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[900px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-8" style={{ color: C.n900 }}>Çfarë përfshin qeraja</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {["Kompjuterë / workstation", "Projektor", "Whiteboard dhe markerë", "Free Wi-Fi", "Klimatizim dhe ngrohje", "Aparat Uji", "Sistem audio", "Aparat Kafe", "Ekrane digjitale"].map((item) => (
              <div key={item} className="flex items-center gap-3 py-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: C.brandLight }}>
                  <Check size={11} style={{ color: C.brand }} />
                </div>
                <span className="text-sm" style={{ color: C.n700 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Ideal for */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-10 text-center" style={{ color: C.n900 }}>I përshtatshëm për</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Briefcase, label: "Trajnime korporative" },
              { icon: Users, label: "Workshope dhe bootcamp" },
              { icon: Award, label: "Ekzaminime dhe çertifikime" },
              { icon: MessageSquare, label: "Konferenca dhe prezantime" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center p-6 rounded-2xl" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: C.brandLight }}>
                  <Icon size={22} style={{ color: C.brand }} />
                </div>
                <p className="font-medium text-sm" style={{ color: C.n900 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Photo gallery */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-8" style={{ color: C.n900 }}>Pamje nga hapësirat</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              /* Real photos of the rooms, replacing the stock set. Order is the grid's
                 reading order: 1-3 across the top row, 4-6 across the bottom.

                 `imgPosition` is per photo, not per grid: 1, 3 and 5 are portrait shots
                 squeezed into landscape cells and lose most of their height, while 2, 4
                 and 6 are already landscape and barely crop at all. One shared value could
                 not suit both. Second number is vertical — raise it to push the image DOWN. */
              { url: hapsira1,  imgPosition: "center 82%" },
              { url: hapsira3,  imgPosition: "center 90%" },
              { url: hapsira2,  imgPosition: "center 70%" },
              { url: hapsira5,  imgPosition: "center 50%" },
              { url: hapsira4,  imgPosition: "center 70%" },
              { url: hapsira6, alt: "Hapësira 6", imgPosition: "center 60%" },
            ].map(({ url, imgPosition }, i) => (
              <div key={i} className="rounded-2xl overflow-hidden group cursor-zoom-in" style={{ backgroundColor: C.n100, aspectRatio: i < 3 ? "4/3" : "16/9" }}>
                <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" style={{ objectPosition: imgPosition }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Location & access */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: C.n900 }}>Lokacioni dhe aksesi</h2>
              {[
                [MapPin, "Rr. Bashkim Fehmiu, Arbëria 3, BC2/14 nr.4, Prishtinë"],
                [Globe, "Afër qendrës — 10 min me këmbë nga bulevardi"],
                [Users, "Parking i disponueshëm në oborr"],
                [Phone, "+383 (0)38 600 237"],
                [Mail, "info@cacttus.education"],
              ].map(([Icon, text], i) => (
                <div key={i} className="flex items-start gap-3 mb-4">
                  <Icon size={17} className="mt-0.5 shrink-0" style={{ color: C.brand }} />
                  <span className="text-sm" style={{ color: C.muted }}>{text as string}</span>
                </div>
              ))}
            </div>
            <div className="aspect-video rounded-2xl flex items-center justify-center" style={{ backgroundColor: C.n100, border: `1px solid ${C.cardBorder}` }}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: C.brand }}>
                  <MapPin size={22} className="text-white" />
                </div>
                <p className="text-sm font-semibold" style={{ color: C.n700 }}>Rr. Bashkim Fehmiu, Arbëria 3</p>
                <p className="text-xs mt-1" style={{ color: C.n500 }}>10000 Prishtinë, Kosovë</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* 9. Booking form */}
      <section id={KLASA_BOOKING_ID} className="py-16 scroll-mt-24" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="rounded-3xl px-8 md:px-12 py-14" style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}>
            <h2 className="text-2xl font-bold text-white mb-2">Rezervo hapësirën tënde</h2>
            <p className="text-white/70 text-sm mb-8">Plotëso formularin dhe do të kontaktohesh brenda 24 orëve.</p>
            {booking.sent ? (
              <p className="text-white text-sm font-semibold">Faleminderit! Rezervimi u dërgua — do të kontaktohesh brenda 24 orëve.</p>
            ) : (
              <>
            {/* Seven tracks, not six: the room select joins the five inputs and the button.
                Same cell styling as the inputs beside it. */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              <select value={klasa.klasa} onChange={(e) => setKlasa({ ...klasa, klasa: e.target.value })} className="px-4 text-sm rounded-xl col-span-1" style={{ height: 52, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: klasa.klasa ? C.n900 : C.n400, outline: "none" }}>
                <option value="">Zgjidh klasën</option>
                {CLASS_BOOKING_ROOMS.map((room) => <option key={room} value={room}>{room}</option>)}
              </select>
              {([
                { ph: "Emri", key: "emri" },
                { ph: "Email", key: "email" },
                { ph: "Telefoni", key: "telefoni" },
                { ph: "Data e dëshiruar", key: "data" },
                { ph: "Nr. i personave", key: "pjesemarres" },
              ] as const).map(({ ph, key }) => (
                <input key={ph} type="text" placeholder={ph} value={klasa[key]} onChange={(e) => setKlasa({ ...klasa, [key]: key === "telefoni" ? sanitizePhone(e.target.value) : e.target.value })} className="px-4 text-sm rounded-xl col-span-1" style={{ height: 52, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: C.n900, outline: "none" }} />
              ))}
              <button onClick={() => booking.submit({ name: klasa.emri, email: klasa.email, phone: klasa.telefoni }, { klasa: klasa.klasa, data_deshiruar: klasa.data, nr_personave: klasa.pjesemarres, shenime: klasa.shenime })} className="h-[52px] px-5 rounded-xl font-semibold text-sm text-white col-span-1 whitespace-nowrap" style={{ border: "1.5px solid rgba(255,255,255,0.7)" }}>{booking.isSubmitting ? "Duke dërguar…" : "Rezervo tani"}</button>
            </div>
            <textarea rows={3} placeholder="Shënime (opsionale)" value={klasa.shenime} onChange={(e) => setKlasa({ ...klasa, shenime: e.target.value })} className="w-full px-4 py-3 text-sm rounded-xl mt-3 resize-none" style={{ border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: C.n900, outline: "none" }} />
                {booking.error && <p className="text-white text-sm mt-3">{booking.error}</p>}
              </>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
