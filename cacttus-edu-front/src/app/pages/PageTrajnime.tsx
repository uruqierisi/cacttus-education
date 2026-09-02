import { useEffect, useState } from "react";
import {
  getPublicTrainings,
  getTrainingFilters,
  type TrainingCard as TrainingCardData,
  type TrainingCategory,
  type TrainingStatus,
} from "../../marketing/lib/public-api";
import { TrainingCard } from "../cards/TrainingCard";
import { TRAINERS } from "../data/trainers";
import { cityKey, dedupeCities } from "../lib/cities";
import {
  TRAINING_CATEGORY_LABELS,
  TRAINING_FORMAT_LABELS,
  TRAINING_STATUS_LABELS,
} from "../lib/training-labels";
import { FilterRow } from "../sections/FilterRow";
import { InfiniteLogoMarquee } from "../sections/InfiniteLogoMarquee";
import { TestimonialsSection } from "../sections/TestimonialsSection";
import { C } from "../theme";
import { HeroStats } from "../ui/HeroStats";
import { PageWrapper } from "../ui/PageWrapper";
import { SecondaryBtn } from "../ui/buttons";


export const ALL_FILTER = "Të gjitha";


export function PageTrajnime() {
  const [trainings, setTrainings] = useState<readonly TrainingCardData[]>([]);
  const [categories, setCategories] = useState<readonly TrainingCategory[]>([]);
  const [cities, setCities] = useState<readonly string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  /*
    ONE state for the "Trajnimet:" row, which now mixes two different kinds of filter —
    lifecycle ("Aktive") and category ("Programim") — in a single group. Holding the
    chosen LABEL rather than a {kind, value} pair is what keeps `FilterRow` unchanged:
    it already speaks in labels, and one row that can only have one answer is exactly
    what one string models. `city` stays separate because it is still its own row.
  */
  const [sel, setSel] = useState(ALL_FILTER);
  const [city, setCity] = useState(ALL_FILTER);
  const [format, setFormat] = useState(ALL_FILTER);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError("");

    // The chips describe the WHOLE catalogue, so they are fetched unfiltered alongside
    // the (unfiltered) grid; narrowing happens client-side from here on, which keeps a
    // chip click instant instead of a round-trip each time.
    Promise.all([getPublicTrainings(), getTrainingFilters()])
      .then(([items, filters]) => {
        if (!active) return;
        setTrainings(items);
        setCategories(filters.categories);
        setCities(filters.cities);
      })
      .catch(() => {
        if (active) setLoadError("Trajnimet nuk mund të ngarkohen për momentin.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  /*
    Which status a label names, or undefined when it names something else. This is the
    one place the merged row's ambiguity is resolved: a status label wins over a category
    label of the same text, so if a category is ever renamed "Aktive" the row degrades to
    filtering by status rather than doing both or neither.
  */
  const statusForLabel = (label: string): TrainingStatus | undefined =>
    (Object.keys(TRAINING_STATUS_LABELS) as TrainingStatus[]).find(
      (value) => TRAINING_STATUS_LABELS[value] === label,
    );

  /* The two rows still AND together — picking Prishtinë then Përfunduar narrows to both.
     Within the merged row only one pill can be active, so there is nothing to combine
     there: a training either matches the one thing selected or it does not. */
  const filtered = trainings.filter((t) => {
    if (city !== ALL_FILTER && cityKey(t.city ?? "") !== cityKey(city)) {
      return false;
    }
    if (format !== ALL_FILTER && TRAINING_FORMAT_LABELS[t.format] !== format) {
      return false;
    }
    if (sel === ALL_FILTER) {
      return true;
    }

    const status = statusForLabel(sel);
    return status === undefined
      ? TRAINING_CATEGORY_LABELS[t.category] === sel
      : t.status === status;
  });

  /*
    Order is fixed by the spread, not by sorting: "Të gjitha", then lifecycle, then the
    categories the API reported. Both middle groups are derived from what is actually on
    the cards — a chip that could only ever empty the grid is a dead end, so a
    "Përfunduar" pill appears only once some training is.
  */
  const selOptions = [
    ALL_FILTER,
    ...(["ACTIVE", "COMPLETED"] as const)
      .filter((value) => trainings.some((t) => t.status === value))
      .map((value) => TRAINING_STATUS_LABELS[value]),
    ...categories.map((c) => TRAINING_CATEGORY_LABELS[c]),
  ];
  const cityOptions = [ALL_FILTER, ...dedupeCities(cities)];
  /*
    Derived from the loaded trainings, not from /trainings/filters — that endpoint returns
    only categories and cities, and adding formats to it would be a backend change for
    something the client already holds. Listing only the formats actually present keeps a
    chip from being a dead end, the same rule the status pills follow above.
  */
  const formatOptions = [
    ALL_FILTER,
    ...(["KLASE", "HIBRID", "ONLINE"] as const)
      .filter((value) => trainings.some((t) => t.format === value))
      .map((value) => TRAINING_FORMAT_LABELS[value]),
  ];

  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Trajnime profesionale</h1>
          <p className="text-lg mb-6 max-w-2xl" style={{ color: C.muted }}>
            Trajnime të shkurtra dhe intensive, të dizajnuara me kompanitë e teknologjisë. Zgjidh formatin që të përshtatet: online, në klasë ose hibrid — dhe merr certifikatë në përfundim.
          </p>
          {/*
            The same four figures the homepage hero shows, from the same `HeroStats`.
            They replace three chips that counted the catalogue ("3 trajnime", "2
            kategori") — numbers that shrank every time a training was unpublished and
            made the page look emptier the moment it was.
          */}
          <HeroStats className="mt-2" />
        </div>
      </section>

      {/*
        Chips stay hidden while loading rather than rendering empty and then jumping.

        A normal block in the flow, NOT pinned. It used to carry `sticky top-[76px] z-30`,
        which parked it under the navbar for the whole scroll — so it floated over the
        cards and was still there beside the footer. `z-30` went with it: a z-index does
        nothing on a static element, and it only existed to stack the bar over the
        content it was floating above.
      */}
      {!isLoading && !loadError && trainings.length > 0 && (
        <div className="py-4" style={{ backgroundColor: C.n0, borderBottom: `1px solid ${C.n200}` }}>
          <div className="max-w-[1200px] mx-auto px-5 flex flex-col gap-5">
            <FilterRow label="Trajnimet:" options={selOptions} active={sel} onSelect={setSel} />
            {cityOptions.length > 1 && (
              <FilterRow label="Qyteti:" options={cityOptions} active={city} onSelect={setCity} />
            )}
            {/* Its own guard, not the city one: an all-online catalogue has no city chips
                but still has formats worth filtering by. */}
            {formatOptions.length > 1 && (
              <FilterRow label="Formati:" options={formatOptions} active={format} onSelect={setFormat} />
            )}
          </div>
        </div>
      )}

      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-live="polite">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-2xl animate-pulse" style={{ height: 300, backgroundColor: C.n100 }} />
              ))}
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center py-20 gap-4" role="alert">
              <p className="text-lg" style={{ color: C.n700 }}>{loadError}</p>
              <SecondaryBtn onClick={() => setReloadKey((k) => k + 1)}>Provo përsëri</SecondaryBtn>
            </div>
          ) : trainings.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <p className="text-lg" style={{ color: C.n700 }}>Ende nuk ka trajnime të publikuara</p>
              <p className="text-sm" style={{ color: C.n500 }}>Kthehu së shpejti — po përgatisim grupin e radhës.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <p className="text-lg" style={{ color: C.n500 }}>Nuk ka trajnime të disponueshme për filtrat e zgjedhur</p>
              <SecondaryBtn onClick={() => { setSel(ALL_FILTER); setCity(ALL_FILTER); setFormat(ALL_FILTER); }}>Pastro filtrat</SecondaryBtn>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((t) => <TrainingCard key={t.slug} training={t} />)}
            </div>
          )}
        </div>
      </section>

      {/*
        Partner logos. `InfiniteLogoMarquee` is the same component the programme pages and
        the /biznese section use — the marquee and the scroll timing live inside it, so
        this is a reuse rather than a second implementation.

        One row here, not the default two: nine certification bodies are not enough to
        fill a second band without visibly repeating. The set is `PARTNER_LOGOS`, taken as
        the component's default — these are the bodies the trainings certify against, a
        different list from the employer logos the programme pages show.
      */}
      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-2xl font-bold text-center mb-10" style={{ color: C.n900 }}>
            Partneret tanë
          </p>
          <InfiniteLogoMarquee rows={1} />
        </div>
      </section>

      {/*
        Editorial content, not catalogue data. Kept exactly as it was: these are the
        school's lecturers as a marketing statement, unrelated to which trainings happen
        to be published this month, so it is deliberately NOT driven by the API.
      */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.n900 }}>Ligjëruesit tanë</h2>
          <p className="text-lg mb-10" style={{ color: C.n500 }}>Profesionistë aktivë në industri që ligjërojnë atë që punojnë çdo ditë.</p>
          {/*
            Four tracks, down from six. The track count was sized for a six-person list; at
            six columns four cards left two empty cells and each portrait rendered about
            180px wide. Four tracks share the same 1160px row between four cards instead,
            which is what makes each one roughly 270px — the cards got bigger by taking the
            space the removed two were holding, not by being scaled up.

            `gap-6` and the larger type follow the same logic: the spacing and labels were
            in proportion to a 180px card and would look undersized against a 270px one.

            This markup is local to /trajnime. The /ligjërueit grid renders `PersonCard`,
            a different component entirely, so nothing here reaches it.
          */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRAINERS.map((t) => (
              <div key={t.name} className="flex flex-col items-center text-center">
                <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: C.n100 }}>
                  <img src={t.imgUrl} alt={t.name} className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: t.imgPosition }} />
                </div>
                <p className="text-base font-semibold" style={{ color: C.n900 }}>{t.name}</p>
                <p className="text-sm mt-0.5" style={{ color: C.n500 }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />
    </PageWrapper>
  );
}
