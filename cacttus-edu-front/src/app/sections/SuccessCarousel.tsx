import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { STUDENT_PHOTOS } from "../data/student-photos";
import { C } from "../theme";


export function SuccessCarousel() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % STUDENT_PHOTOS.length), 3500);
    return () => clearInterval(t);
  }, []);
  const visible = [0, 1, 2].map((i) => STUDENT_PHOTOS[(current + i) % STUDENT_PHOTOS.length]);
  return (
    <div className="relative">
      <div className="flex gap-6">
        {visible.map((photo, i) => (
          /* `relative` is the only change to the frame itself — the caption below is
             positioned against it. Rounding, aspect and sizing are untouched, so a card
             that carries its own name and a plain photo that gets a drawn one are the
             same shape on the page. */
          <div key={i} className="relative flex-1 rounded-2xl overflow-hidden aspect-[16/9]" style={{ backgroundColor: C.n100 }}>
            {/* The name is the alt text on every slide, including the cards that show it
                in the artwork: a screen reader cannot read text baked into a PNG, so
                without this the whole carousel announces as nine unlabelled images. */}
            <img src={photo.src} alt={photo.name} className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: photo.imgPosition }} />
            {/* Drawn ONLY for plain photographs. Every card in the current set already has
                its name set into the graphic, so this branch renders nothing today — it is
                here so that dropping in an unbranded photo later still gets a label, and
                so nobody is tempted to add a blanket overlay that would double the name on
                the eight cards that already carry one. The gradient is what keeps the text
                readable over an unknown photo. */}
            {!photo.nameInImage && (
              <div
                className="absolute inset-x-0 bottom-0 px-4 pt-8 pb-3"
                style={{ background: "linear-gradient(to top, rgba(17,17,19,0.75), rgba(17,17,19,0))" }}
              >
                <p className="text-sm font-semibold leading-snug" style={{ color: C.n0 }}>{photo.name}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => setCurrent((c) => (c - 1 + STUDENT_PHOTOS.length) % STUDENT_PHOTOS.length)} className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:shadow-md" style={{ border: `1.5px solid ${C.n200}`, backgroundColor: C.n0 }}>
          <ChevronLeft size={20} style={{ color: C.n700 }} />
        </button>
        <div className="flex gap-2">
          {STUDENT_PHOTOS.map((_, i) => (
            <button key={i} type="button" onClick={() => setCurrent(i)} aria-label={`Shko te fotoja ${i + 1}`} className="relative after:absolute after:content-[''] after:-inset-[18px] transition-all rounded-full" style={{ width: i === current ? 24 : 8, height: 8, backgroundColor: i === current ? C.brand : C.n300 }} />
          ))}
        </div>
        <button onClick={() => setCurrent((c) => (c + 1) % STUDENT_PHOTOS.length)} className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:shadow-md" style={{ border: `1.5px solid ${C.n200}`, backgroundColor: C.n0 }}>
          <ChevronRight size={20} style={{ color: C.n700 }} />
        </button>
      </div>
    </div>
  );
}
