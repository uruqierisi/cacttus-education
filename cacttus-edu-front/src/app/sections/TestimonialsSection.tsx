import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { TESTIMONIALS } from "../data/testimonials";
import { C } from "../theme";


/**
 * The reviews as a carousel.
 *
 * Driven by `embla-carousel-react`, which the project already depends on — it is what
 * `components/ui/carousel.tsx` wraps, though that shadcn wrapper is imported nowhere and
 * its default button styling is not this site's. So the hook is used directly and the
 * controls below are the ones `SuccessCarousel` already puts on the homepage: the same
 * 44px round arrows and the same dot that stretches when active. New library: none.
 *
 * Embla rather than the index-counter `SuccessCarousel` uses, because five reviews want
 * dragging: embla gives touch-swipe and trackpad scroll for free, and a counter cannot.
 */
export function TestimonialsSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true, containScroll: "trimSnaps" });
  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const sync = () => setSelected(emblaApi.selectedScrollSnap());
    setSnapCount(emblaApi.scrollSnapList().length);
    sync();
    emblaApi.on("select", sync);
    emblaApi.on("reInit", sync);
    return () => {
      emblaApi.off("select", sync);
      emblaApi.off("reInit", sync);
    };
  }, [emblaApi]);

  return (
    <section className="py-20" style={{ backgroundColor: C.n0 }}>
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="text-3xl font-bold mb-3" style={{ color: C.n900 }}>Çfarë thonë pjesëmarrësit</h2>
        <p className="text-lg mb-10" style={{ color: C.n500 }}>
          Përvoja të vërteta nga njerëz që kanë përfunduar trajnimet tona.
        </p>

        {/*
          `overflow-hidden` on the viewport and a flex track inside is embla's required
          shape — it moves the track, and the viewport is what crops it. The negative
          `-ml-5` plus `pl-5` on each slide is the standard way to gap slides without the
          first one starting indented.
        */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                /* `basis-*` is what decides how many are on screen; `min-w-0` stops a long
                   quote from forcing a slide wider than its share. */
                className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/3 pl-5"
              >
                <figure
                  className="h-full rounded-2xl p-6 flex flex-col gap-4"
                  style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.brandSoft }}
                >
                  {/*
                    The rating is spelled out for screen readers rather than left as five
                    decorative glyphs; the stars themselves are then hidden from them.
                  */}
                  <div className="flex gap-0.5" role="img" aria-label={`${t.stars} nga 5 yje`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={16}
                        aria-hidden="true"
                        style={{ color: i <= t.stars ? C.brand : C.n300 }}
                        fill={i <= t.stars ? C.brand : "none"}
                      />
                    ))}
                  </div>
                  <blockquote className="text-sm leading-relaxed grow" style={{ color: C.n700 }}>
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption>
                    <p className="text-sm font-semibold" style={{ color: C.n900 }}>{t.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.n500 }}>{t.role}</p>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>

        {/* Controls, styled exactly as SuccessCarousel's on the homepage. */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Dëshmia e mëparshme"
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:shadow-md"
            style={{ border: `1.5px solid ${C.n200}`, backgroundColor: C.n0 }}
          >
            <ChevronLeft size={20} style={{ color: C.n700 }} />
          </button>

          {/* Dots come from embla's snap list, not from TESTIMONIALS.length: at three
              slides per view the last snaps stop short, so the counts differ. */}
          <div className="flex gap-2">
            {Array.from({ length: snapCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Shko te dëshmia ${i + 1}`}
                className="relative after:absolute after:content-[''] after:-inset-[18px] transition-all rounded-full"
                style={{ width: i === selected ? 24 : 8, height: 8, backgroundColor: i === selected ? C.brand : C.n300 }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Dëshmia tjetër"
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:shadow-md"
            style={{ border: `1.5px solid ${C.n200}`, backgroundColor: C.n0 }}
          >
            <ChevronRight size={20} style={{ color: C.n700 }} />
          </button>
        </div>
      </div>
    </section>
  );
}
