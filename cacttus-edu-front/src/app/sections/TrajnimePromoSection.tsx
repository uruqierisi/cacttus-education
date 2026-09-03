import { useEffect, useState } from "react";
import {
  BookOpen,
  Briefcase,
  Code,
  Laptop,
  Monitor,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";
import {
  getPublicTrainings,
  type TrainingCard as TrainingCardData,
} from "../../marketing/lib/public-api";
import { TRAINING_FORMAT_LABELS } from "../lib/training-labels";
import { C } from "../theme";
import { Overline } from "../ui/Overline";
import { GhostBtn, PrimaryBtn } from "../ui/buttons";


/* 2.2 — Trajnime promo, live from the catalogue API */

/*
  A home card carries an ICON; the API carries no such field, and `category` is the only
  thing on the payload that could reasonably pick one. Hence this map. Every icon in it is
  already imported for use elsewhere in the file, so naming them here costs no bundle.

  Read through `?? BookOpen` at the call site rather than indexed straight — `category`
  arrives over the network, so a category added server-side before this file learns its
  icon would hand us `undefined`, and React throws on rendering that as a component,
  taking the whole band down over a missing 18px glyph. Same guard `TrainingStatusBadge`
  applies to an unknown status.
*/
export const TRAINING_CATEGORY_ICONS: Record<string, LucideIcon> = {
  programim: Code,
  administrim: Monitor,
  "siguri-kibernetike": Shield,
  "marketing-dizajn": Laptop,
  "menaxhim-i-projekteve": Briefcase,
  "aftesi-te-buta": Users,
};


/*
  How many cards the band shows. The API already returns the operator's OWN ordering
  (`order` asc, then newest first — see listPublicTrainings), so slicing the front off
  that list means the four shown are the four the dashboard was told to put first. This
  deliberately does not re-sort: sorting here would silently override an ordering an
  admin set by hand.
*/
export const HOME_TRAININGS_LIMIT = 4;


/* Shared by the real card and its loading placeholder, so the two can never drift out of
   the same box. */
export const HOME_TRAINING_CARD_STYLE = {
  backgroundColor: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
} as const;


export const HOME_SKELETON_BAR = { backgroundColor: "rgba(255,255,255,0.10)" } as const;


export function TrajnimePromoSection() {
  const [trainings, setTrainings] = useState<readonly TrainingCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);

  /*
    The same fetch shape /trajnime uses, minus the filters call — this band has no chips
    to derive. The `active` flag is what makes it safe: a visitor who clicks away mid
    request unmounts this component, and without the guard the `.then` would still write
    state into it.

    `status: "ACTIVE"` narrows SERVER-side, so a finished training never travels to the
    landing page at all. That is the split: the home band is a short "you can still join
    this" list, while /trajnime stays the full catalogue and badges COMPLETED rather than
    hiding it.
  */
  useEffect(() => {
    let active = true;

    getPublicTrainings({ status: "ACTIVE" })
      .then((items) => {
        if (active) setTrainings(items.slice(0, HOME_TRAININGS_LIMIT));
      })
      .catch(() => {
        // No error message and no retry button, unlike the catalogue. This is a promo
        // band on the landing page: a visitor who cannot see it has lost a shortcut, not
        // the content, and "Shiko të gjitha trajnimet" below still works. Shouting about
        // a backend fault on the front page would cost more than it explains.
        if (active) setHasFailed(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  /* Nothing to show and nothing still coming means the grid is dropped entirely — the
     heading, the paragraph and the button stay. A grid of empty boxes reads as broken;
     a section with no grid just reads as a section. */
  const showGrid = isLoading || (!hasFailed && trainings.length > 0);

  return (
    <section className="py-24" style={{ backgroundColor: C.p900 }}>
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="mb-10">
          <Overline>TRAJNIME PROFESIONALE</Overline>
          <h2 className="text-4xl font-bold mb-3 text-white" style={{ letterSpacing: "-0.01em" }}>
            Trajnime profesionale për karrierën që synoni!
          </h2>
          <p className="text-lg max-w-x2" style={{ color: "rgba(255,255,255,0.65)" }}>
            Zhvilloni aftësitë që kërkon tregu i punës përmes kurrikulave bashkëkohore, mësimit praktik dhe instruktorëve me përvojë nga industria.
          Zgjidhni trajnime intensive në programim, siguri kibernetike, dizajn dhe menaxhim projektesh, online, në klasë ose në format hibrid.
          </p>
        </div>

        {/* 4-column grid (2×2 tablet, 1col mobile). Fewer than four live trainings simply
            fills fewer tracks — the grid is not padded out with empties. */}
        {showGrid && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {isLoading
              ? /* Placeholders, not a spinner: the band keeps its height while the request
                   is in flight, so the page below does not jump when cards land.
                   `aria-hidden` because there is nothing here to read out yet. */
                Array.from({ length: HOME_TRAININGS_LIMIT }, (_, i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    className="p-5 rounded-2xl flex flex-col gap-3 animate-pulse"
                    style={HOME_TRAINING_CARD_STYLE}
                  >
                    <div className="w-10 h-10 rounded-xl" style={HOME_SKELETON_BAR} />
                    <div>
                      <div className="h-3.5 rounded w-2/3" style={HOME_SKELETON_BAR} />
                      <div className="h-3 rounded w-full mt-2" style={HOME_SKELETON_BAR} />
                    </div>
                    <div className="h-3 rounded w-1/2 mt-auto" style={HOME_SKELETON_BAR} />
                    <div className="h-3 rounded w-1/3" style={HOME_SKELETON_BAR} />
                  </div>
                ))
              : trainings.map((t) => {
                  const Icon = TRAINING_CATEGORY_ICONS[t.category.slug] ?? BookOpen;

                  /* The slot the hard-coded version filled with a marketing sentence. A
                     card payload carries no description — that field lives on the DETAIL
                     endpoint, and fetching it would mean four extra round-trips on the
                     landing page for one line of text. So the line shows two facts the
                     card already has, with the same "—" the catalogue card uses for an
                     unset field. */
                  /* Joined from the parts that EXIST: an online training has no city, and
                     "Enes Sermaxhaj · —" reads as missing data rather than as a training
                     that simply has no location. The format is already on the meta line. */
                  const desc = [t.instructor, t.city].filter(Boolean).join(" · ") || "—";
                  const meta = `${t.hours === null ? "—" : t.hours} orë · ${TRAINING_FORMAT_LABELS[t.format]}`;

                  return (
                    <div
                      key={t.slug}
                      className="p-5 rounded-2xl flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-lg"
                      style={HOME_TRAINING_CARD_STYLE}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.brand }}>
                        <Icon size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{t.title}</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{desc}</p>
                      </div>
                      <p className="text-xs mt-auto" style={{ color: "rgba(255,255,255,0.4)" }}>{meta}</p>
                      {/* `applyUrl` comes from the API rather than being built here, so the
                          /trajnime/:slug path shape stays owned by one side. Until now this
                          button had no onClick and navigated nowhere. */}
                      <Link to={t.applyUrl}>
                        <GhostBtn className="text-white/70 hover:text-white">Shiko trajnimin</GhostBtn>
                      </Link>
                    </div>
                  );
                })}
          </div>
        )}

        <Link to="/trajnime"><PrimaryBtn>Shiko të gjitha trajnimet</PrimaryBtn></Link>
      </div>
    </section>
  );
}
