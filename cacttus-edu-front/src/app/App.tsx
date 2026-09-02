import React, { useState, useEffect, useRef, useCallback } from "react";
/* Hero photo for /rreth-nesh, replacing the Bursa_Redesign.png placeholder that column
   borrowed. Shot 3:2 (8192x5464) and dropped into a 4:3 frame, so the crop is real:
   RRETH_AMBIENT_IMG_POSITION decides which band of it survives. */
import rrethNeshStafi from "../imports/rrethNeshStafi.jpeg";
import { BrowserRouter, Routes, Route, Link, useLocation, useParams } from "react-router";
import {
  submitPublicForm,
  getPublicPosts,
  getPublicPost,
  PublicApiError,
  type PostCard as PostCardData,
  type PostDetail,
} from "../marketing/lib/public-api";
import { CONTACT_FORM_SLUG } from "../marketing/lib/forms.config";
import { C, globalStyle } from "./theme";
import { formatPostDate } from "./lib/dates";
import { PHONE_ERROR, isValidPhone, sanitizePhone } from "./lib/phone";
import { renderSafeHtml } from "./lib/sanitize";
import { ApplyPopupContext } from "./hooks/apply-popup";
import { ABOUT_MISSION_POINTS, ABOUT_VALUES } from "./data/about";
import { LIGJËRUEIT } from "./data/lecturers";
import { PROJECTS, PROJECT_FALLBACK_GALLERY } from "./data/projects";
import { PROJEKTET_LIST } from "./data/projektet-list";
import { CONTACT_SOCIALS } from "./data/socials";
import { TEAM_MEMBERS } from "./data/team";
import { Check, MapPin, Phone, Mail, Clock, TrendingUp, GraduationCap } from "lucide-react";
import { Breadcrumb } from "./ui/Breadcrumb";
import { GhostBtn, PrimaryBtn, SecondaryBtn } from "./ui/buttons";
import { FormField, FormSelect } from "./ui/FormField";
import { PageWrapper } from "./ui/PageWrapper";
import { Footer } from "./layout/Footer";
import { MobileMenu } from "./layout/MobileMenu";
import { Navbar } from "./layout/Navbar";
import { TopBanner } from "./layout/TopBanner";
import { HorizontalApplicationBand } from "./forms/HorizontalApplicationBand";
import { ScrollPopupForm } from "./forms/ScrollPopupForm";
import { ArticleCard } from "./cards/ArticleCard";
import { PersonCard } from "./cards/PersonCard";
import { ProjectCard } from "./cards/ProjectCard";
import { AboutStatsBand } from "./sections/AboutStatsBand";
import { PartnerLogoGrid } from "./sections/PartnerLogoGrid";
import { PageBallina } from "./pages/PageBallina";
import { PageForma } from "./pages/PageForma";
import { PageTrajnimiDetal } from "./pages/PageTrajnimiDetal";
import { PageProgramim } from "./pages/PageProgramim";
import { PageSiguria } from "./pages/PageSiguria";
import { PageTrajnime } from "./pages/PageTrajnime";
import { PageBiznese } from "./pages/PageBiznese";
import { PageBizneseBursa } from "./pages/PageBizneseBursa";
import { PageBizneseTalente } from "./pages/PageBizneseTalente";
import { PageBizneseTrajnime } from "./pages/PageBizneseTrajnime";
import { PageBiznestKlasa } from "./pages/PageBiznestKlasa";


function PageProjektet() {
  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {/*
            Two tracks so the logo grid fills the empty right half instead of the copy
            running the full width. `520px` is a fixed track rather than a fraction: the
            grid inside it is four fixed-ratio cards, and letting the track flex would
            resize the cards on every breakpoint for no reason. `items-center` lines the
            grid up against the middle of the text rather than its top.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-12 items-center">
            <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Projektet</h1>
          {/*
            `text-lg`, not `text-1g` — the old class was a typo (digit one for the letter
            l), so Tailwind emitted nothing and this paragraph had been rendering at the
            default body size all along. The `<br />` is gone too: the two sentences are
            one paragraph and should wrap naturally rather than break at a fixed point
            that only looks right at one window width.
          */}
          <p className="text-lg mb-8 max-w-2xl" style={{ color: C.muted }}>
            Ne ndërtojmë projekte që fuqizojnë shkathtësitë digjitale të së nesërmes.
            Përmes bashkëpunimeve strategjike dhe metodologjive bashkëkohore, sjellim
            transformim teknologjik dhe zhvillim të qëndrueshëm në Kosovë e rajon.
          </p>
          {/* `gap-x-16` (64px), up from `gap-10` (40px); wraps rather than squeezing on narrow screens. */}
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            {[["5000+", "Pjesëmarrës"], ["6", "Partnerë ndërkombëtarë"], ["2000+", "Përfitues"]].map(([num, label]) => (
              <div key={label}><p className="text-3xl font-bold" style={{ color: C.brand }}>{num}</p><p className="text-sm mt-0.5" style={{ color: C.n500 }}>{label}</p></div>
            ))}
          </div>
            </div>

            <PartnerLogoGrid />
          </div>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROJECTS.map((p) => <ProjectCard key={p.title} project={p} to={p.path} />)}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

function ProjectDetailPage({ project }: { project: typeof PROJECTS[0] }) {
  /*
    The funder's mark, looked up from PROJEKTET_LIST — the navbar dropdown's array — by
    path, rather than copied into PROJECTS as a second `logo` field. One mapping, one place
    to change it: a project whose logo is corrected in the dropdown is corrected here too,
    and there is no way for the two to drift into showing different marks for the same
    project. Both arrays already key on the same `/projektet/...` paths.

    `?? null` rather than a non-null assertion: a project added to PROJECTS but not yet to
    the dropdown should render without a logo, not crash the page.
  */
  const logo = PROJEKTET_LIST.find((p) => p.path === project.path)?.icon ?? null;

  /*
    The strip's photos, resolved ONCE so the column count and the cells read the same
    list. Hoisted out of the JSX because the grid needs `.length` before it can decide
    how many tracks to draw, and inlining the fallback twice is how the two drift apart.
  */
  const shots = project.gallery ?? PROJECT_FALLBACK_GALLERY;

  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Projektet", path: "/projektet" }, { label: project.title }]} />
          <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>{project.title}</h1>
          <div className="inline-flex items-center px-3 h-8 rounded-lg mb-4" style={{ border: `1px solid ${C.n300}` }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.n600, letterSpacing: "0.08em" }}>{project.partner}</span>
          </div>
          {/*
            Description and logo share a row. `items-center` keeps the mark level with the
            middle of the paragraph rather than pinned to its first line, which matters
            because these descriptions run anywhere from two to five lines.

            Stacks below `md`, logo first — on a phone the mark reads as a header for the
            text rather than an orphan trailing it.
          */}
          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-8">
            {/*
              Capped at 640px of the 1200px container. Full-bleed body text at this size ran
              past a comfortable measure — roughly 140 characters a line, where ~75 is where
              the eye starts losing its place returning to the next line.
            */}
            <p className="text-lg max-w-[640px]" style={{ color: C.muted }}>{project.desc}</p>
            {logo && (
              /*
                White card, as every other logo on the site is presented — these marks were
                drawn for white and several carry near-white detail that would disappear
                straight onto the section's `brandSoft`. Fixed box, `object-contain` inside:
                the frame is the constant, so a wide USAID wordmark and a square VIC glyph
                give the same footprint instead of one dwarfing the other.

                SIZE: roughly doubled, to ~360x220. The card steps down to 260x160 below
                `lg` rather than holding one fixed width — the description beside it is a
                `max-w`, so it absorbs the difference, but at the `md` breakpoint a 360px
                card would squeeze it to under 350px and the paragraph would go ragged.
                Padding scales with the box so the mark keeps its breathing room instead of
                growing tight against a bigger frame.

                ┌────────────────────────────────────────────────────────────────────────┐
                │  VERTICAL POSITION — `md:mt-[-110px]` is the knob to turn.             │
                │  MORE negative lifts the card, less negative / positive drops it.      │
                └────────────────────────────────────────────────────────────────────────┘

                The logo is already dead-centre inside this frame (equal padding above and
                below), and the frame already starts at the top of its row — so nothing
                could be gained by re-aligning either. What reads as "too low" is the whole
                card sitting beside the description instead of up level with the title, and
                a negative top margin is what lifts it there.

                Margin, not `translate`: a transform is purely visual, so the row would go
                on reserving the card's full height and leave ~110px of dead space under it.
                A negative margin shrinks the card's margin box too, so the row closes up.
                Paired with `md:self-start` the maths stays linear — the card's top is
                always `row top + this value`, so turning the knob by 10px moves it 10px.
                Under `md:` the layout stacks and this is deliberately not applied, or the
                logo would be dragged up over the badge.
              */
              <div
                className="shrink-0 self-start md:self-start md:mt-[-110px] w-[260px] h-[160px] lg:w-[360px] lg:h-[220px] rounded-2xl flex items-center justify-center p-6 lg:p-8"
                style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}
              >
                {/* Decorative: the title and partner badge above already name the project. */}
                <img src={logo} alt="" aria-hidden="true" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-8" style={{ color: C.n900 }}>Rreth projektit</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* One <p> per entry in this project's own `about`, not two fixed paragraphs. */}
            <div className="flex flex-col gap-4">
              {project.about.map((paragraph, i) => (
                <p key={i} className="text-base leading-relaxed" style={{ color: C.muted }}>{paragraph}</p>
              ))}
            </div>
            {/* Frame untouched — only the source is per project. The `??` now catches SDC
                alone: it is the last project with no `mainImg`, so it keeps the stock photo
                it always showed. */}
            <div className="aspect-video rounded-2xl overflow-hidden" style={{ backgroundColor: C.n100 }}>
              <img
                src={project.mainImg ?? "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=720&h=405&fit=crop&auto=format"}
                alt={project.title}
                className="w-full h-full object-cover"
                style={{ objectPosition: project.mainImgPosition }}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {/*
            RESPONSIVE GAP. `gap-50` is 200px — fine inside a 1200px container, fatal below
            it: measured at 375px the row had 320px of width against 400px of gaps, so all
            three cells computed to ZERO width and their text spilled 158px off the page.

            `lg:gap-50` keeps the desktop spacing exactly as it was; the smaller steps only
            apply where the old value could never fit. One column below `sm` because three
            90px tracks turn "Trajnime Të Personalizuara" into six wrapped lines.
          */}
          {/*
            Compact on a phone, unchanged from `sm` up. This was `grid-cols-1` with `gap-8`,
            so three 36px figures stacked into a tall column that pushed the gallery far
            below the fold. A wrapping flex row lets the three sit side by side at 375px and
            re-wrap only if a label is long; the `sm:`/`lg:` grid classes are untouched, so
            tablet and desktop render exactly as before.
          */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-center sm:grid sm:grid-cols-3 sm:gap-10 lg:gap-50">
            {/*
              `project.stats`, not a literal. This strip used to hold one hard-coded array
              INSIDE the shared detail component, so all eight projects rendered the same
              three numbers — the figures belonged to no project in particular and were
              wrong on every page. They live on each project in PROJECTS now.

              Keyed by INDEX, not by label: two projects still have blank placeholders, and
              three empty-string labels in one strip are three duplicate keys, which React
              cannot tell apart. Index is stable here because the array is static and never
              reordered.
            */}
            {project.stats.map(([num, label], i) => (
              <div key={i}><p className="text-2xl sm:text-4xl font-bold mb-0.5 sm:mb-1" style={{ color: C.brand }}>{num}</p><p className="text-xs sm:text-sm" style={{ color: C.n500 }}>{label}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {/*
            Column count follows the number of photos: two shots make a two-up row that
            fills the width, three keep the original three-up. A fixed `grid-cols-3` left
            SDC's two photos in the first two tracks with a visibly empty third.

            Both class names are written out in full rather than built as
            `grid-cols-${n}`. Tailwind generates CSS by scanning the source for COMPLETE
            class names, so an interpolated one matches nothing and produces no rule at
            all — the same trap as the `object-[...]` note further up this file.
          */}
          <div className={`grid gap-4 ${shots.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
            {shots.map(({ url, imgPosition }, i) => (
              <div key={i} className="aspect-video rounded-2xl overflow-hidden" style={{ backgroundColor: C.n100 }}><img src={url} alt="" className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: imgPosition }} /></div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: C.p900 }}>
        <div className="max-w-[1200px] mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <h3 className="text-2xl font-semibold text-white">Dëshiron të bashkëpunosh me ne?</h3>
          <Link to="/kontakti"><PrimaryBtn>Na kontakto</PrimaryBtn></Link>
        </div>
      </section>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   LAJME — the blog, /lajme and /lajme/:slug

   Backed by `GET /api/public/posts`, which only ever returns `published = true` rows.
   Until this was wired the two pages rendered a hard-coded `ARTICLES` array and every
   card linked to a single static `/lajme/artikull` mock, so a post published in the
   dashboard could never appear here no matter how correct the backend was.

   NO CATEGORY CHIPS. The mock had "Lajmet / Teknologji / Karriera / Projekte", but `Post`
   has no category column (see schema.prisma), so those filters cannot be backed by data.
   Inventing one per post would make the filter lie; the chips are gone until the model
   grows a field to support them.
══════════════════════════════════════════ */
function PageLajme() {
  const [posts, setPosts] = useState<readonly PostCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError("");

    getPublicPosts()
      .then((data) => {
        if (active) setPosts(data);
      })
      .catch(() => {
        if (active) setLoadError("Lajmet nuk mund të ngarkohen për momentin.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // The newest post gets the wide treatment; the rest fill the grid beneath it.
  const [featured, ...rest] = posts;

  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Lajme</h1>
          <p className="text-lg" style={{ color: C.muted }}>Njoftime, histori dhe risi nga Cacttus Education.</p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {isLoading ? (
            <div aria-live="polite">
              <div className="rounded-2xl animate-pulse mb-12" style={{ height: 280, backgroundColor: C.n100 }} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl animate-pulse" style={{ height: 300, backgroundColor: C.n100 }} />
                ))}
              </div>
            </div>
          ) : loadError ? (
            <div className="py-16 text-center flex flex-col items-center gap-4" role="alert">
              <p className="text-lg font-medium" style={{ color: C.n900 }}>{loadError}</p>
              <p className="text-sm" style={{ color: C.n500 }}>Provo përsëri pas pak.</p>
              <SecondaryBtn onClick={() => setReloadKey((k) => k + 1)}>Provo përsëri</SecondaryBtn>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg" style={{ color: C.n700 }}>Ende nuk ka lajme të publikuara</p>
              <p className="text-sm mt-2" style={{ color: C.n500 }}>Kthehu së shpejti — po punojmë në përmbajtje të re.</p>
            </div>
          ) : (
            <>
              {featured && (
                <Link to={`/lajme/${featured.slug}`} className="block mb-12">
                  <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-8 p-6 rounded-2xl hover:shadow-md transition-all" style={{ border: `1px solid ${C.n200}` }}>
                    <div className="aspect-video rounded-xl overflow-hidden" style={{ backgroundColor: C.n100 }}>
                      {featured.coverImage ? (
                        <img src={featured.coverImage} alt={featured.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundColor: C.brandSoft }} />
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <h2 className="text-2xl font-bold mb-3 leading-snug" style={{ color: C.n900 }}>{featured.title}</h2>
                      {featured.excerpt && (
                        <p className="text-sm mb-4 leading-relaxed line-clamp-4" style={{ color: C.muted }}>{featured.excerpt}</p>
                      )}
                      <p className="text-xs mb-4" style={{ color: C.n400 }}>
                        {formatPostDate(featured.createdAt)} · {featured.author.name}
                      </p>
                      <GhostBtn>Lexo artikullin</GhostBtn>
                    </div>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rest.map((post) => <ArticleCard key={post.slug} post={post} />)}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   /lajme/:slug — one article

   The body is operator-authored HTML from the Tiptap editor. It is sanitised server-side
   on write AND again by `renderSafeHtml` here, immediately before it reaches
   `dangerouslySetInnerHTML` — the reasoning for both passes is on that function.
══════════════════════════════════════════ */
function PageArtikulli() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [related, setRelated] = useState<readonly PostCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setIsLoading(true);
    setNotFound(false);
    setLoadError("");

    getPublicPost(slug)
      .then((data) => {
        if (active) setPost(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof PublicApiError && error.isNotFound) {
          setNotFound(true);
        } else {
          setLoadError("Artikulli nuk mund të ngarkohet për momentin.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  // "Artikuj të ngjashëm" is simply the newest few, minus this one. A failure here must
  // not cost the reader the article, so it degrades to an empty list in silence.
  useEffect(() => {
    let active = true;

    getPublicPosts()
      .then((data) => {
        if (active) setRelated(data.filter((entry) => entry.slug !== slug).slice(0, 3));
      })
      .catch(() => {
        if (active) setRelated([]);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <PageWrapper>
        <section className="py-24" aria-live="polite">
          <div className="max-w-[760px] mx-auto px-5 flex flex-col gap-4">
            <div className="rounded-xl animate-pulse" style={{ height: 44, width: "70%", backgroundColor: C.n100 }} />
            <div className="rounded-2xl animate-pulse" style={{ height: 320, backgroundColor: C.n100 }} />
            <div className="rounded-xl animate-pulse" style={{ height: 160, backgroundColor: C.n100 }} />
          </div>
        </section>
      </PageWrapper>
    );
  }

  if (notFound || loadError || !post) {
    return (
      <PageWrapper>
        <section className="py-24">
          <div className="max-w-[900px] mx-auto px-5 text-center flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold" style={{ color: C.n900 }}>
              {notFound ? "Ky artikull nuk u gjet" : loadError}
            </h1>
            <p style={{ color: C.n500 }}>
              {notFound ? "Ndoshta është hequr ose linku është i vjetër." : "Provo përsëri pas pak."}
            </p>
            <Link to="/lajme"><PrimaryBtn>Shiko të gjitha lajmet</PrimaryBtn></Link>
          </div>
        </section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-[1200px] mx-auto px-5 py-16">
        <div className="max-w-[760px] mx-auto">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Lajme", path: "/lajme" }, { label: post.title }]} />
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-5 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full overflow-hidden" style={{ backgroundColor: C.brandLight }}>
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-bold text-sm" style={{ color: C.brand }}>CE</span>
              </div>
            </div>
            <span className="text-sm" style={{ color: C.muted }}>{post.author.name}</span>
            <span style={{ color: C.n300 }}>·</span>
            <span className="text-sm" style={{ color: C.n500 }}>{formatPostDate(post.createdAt)}</span>
          </div>
        </div>

        {post.coverImage && (
          <div className="aspect-video rounded-2xl overflow-hidden mb-10" style={{ backgroundColor: C.n100 }}>
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="max-w-[700px] mx-auto">
          {/*
            Sanitised on the line above the injection, not somewhere upstream where a later
            refactor could route around it. Styling lives in styles/post-body.css because
            this markup arrives without utility classes.
          */}
          <div className="post-body" dangerouslySetInnerHTML={renderSafeHtml(post.content)} />

          <div className="flex items-center gap-3 py-6 mt-10" style={{ borderTop: `1px solid ${C.n200}` }}>
            <Link to="/lajme" className="text-sm font-semibold" style={{ color: C.brand }}>
              ← Kthehu te lajmet
            </Link>
          </div>
        </div>

        {related.length > 0 && (
          <div className="max-w-[1160px] mx-auto mt-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: C.n900 }}>Artikuj të ngjashëm</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((entry) => <ArticleCard key={entry.slug} post={entry} />)}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function PageKontakti() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ emri: "", email: "", telefon: "", subjekti: "", mesazhi: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Posts to the generic form engine every other public form on this site already uses.
   *
   * This page does NOT render the form's fields from the API the way the application
   * band does — its inputs are laid out by hand, and only the SUBMIT travels through
   * `submitPublicForm`. The consequence is that the `data` keys below are a contract
   * with the form record's field names, not something the server infers: it drops any
   * key the form does not declare, so a rename in the dashboard silently empties the
   * message unless CONTACT_FORM_SLUG's fields are renamed to match.
   *
   * `submitted` flips only after the POST resolves. A rejection leaves the form on
   * screen with every value still in it, so nothing has to be retyped.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // The button stays enabled, so a second Enter press before the first POST settles
    // would otherwise send the message twice.
    if (isSubmitting) return;

    if (!form.emri.trim() || !form.email.trim() || !form.telefon.trim() || !form.subjekti || !form.mesazhi.trim()) {
      setError("Ju lutemi plotësoni të gjitha fushat.");
      return;
    }
    if (!isValidPhone(form.telefon)) {
      setError(PHONE_ERROR);
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(CONTACT_FORM_SLUG, {
        // name/email/phone are promoted to real Submission columns server-side; every
        // other answer travels in `data`, keyed by the form's field names.
        name: form.emri.trim(),
        email: form.email.trim(),
        phone: form.telefon.trim(),
        data: { subjekti: form.subjekti, mesazhi: form.mesazhi.trim() },
      });
      setSubmitted(true);
    } catch (cause: unknown) {
      // Same branches as the application band, so both forms fail the same way.
      if (cause instanceof PublicApiError) {
        setError(
          cause.isValidation
            ? "Disa fusha nuk janë të vlefshme. Kontrollo të dhënat dhe provo përsëri."
            : cause.message,
        );
      } else {
        setError("Diçka shkoi keq. Provo përsëri.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Kontakti</h1>
          <p className="text-lg" style={{ color: C.muted }}>Na shkruaj ose na vizito — jemi këtu për çdo pyetje rreth studimeve dhe trajnimeve.</p>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-8">
            <div className="p-8 rounded-2xl" style={{ backgroundColor: C.n0, boxShadow: "0 4px 12px rgba(45,22,55,0.08)", border: `1px solid ${C.n200}` }}>
              <h3 className="text-xl font-semibold mb-6" style={{ color: C.n900 }}>Na dërgo mesazh</h3>
              {submitted ? (
                <div className="flex flex-col items-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: C.brandLight }}><Check size={32} style={{ color: C.brand }} /></div>
                  <h3 className="text-xl font-bold" style={{ color: C.n900 }}>Mesazhi u dërgua.</h3>
                  <p style={{ color: C.n500 }}>Do të të përgjigjemi sa më shpejt.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <FormField label="Emri dhe mbiemri" type="text" value={form.emri} onChange={(v) => setForm({ ...form, emri: v })} />
                  <FormField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                  <FormField label="Numri i telefonit" type="tel" value={form.telefon} onChange={(v) => setForm({ ...form, telefon: sanitizePhone(v) })} />
                  <FormSelect label="Subjekti" value={form.subjekti} onChange={(v) => setForm({ ...form, subjekti: v })} options={["Studime profesionale", "Trajnime profesionale", "Për biznese", "Tjetër"]} />
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: C.n700 }}>Mesazhi</label>
                    <textarea rows={5} value={form.mesazhi} onChange={(e) => setForm({ ...form, mesazhi: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none" style={{ border: `1px solid ${C.n300}`, backgroundColor: C.n0, color: C.n800 }} onFocus={(e) => (e.target.style.borderColor = C.brand)} onBlur={(e) => (e.target.style.borderColor = C.n300)} />
                  </div>
                  {error && <p className="text-sm font-medium" style={{ color: "#D64545" }}>{error}</p>}
                  <PrimaryBtn type="submit">{isSubmitting ? "Duke dërguar…" : "Dërgo mesazhin"}</PrimaryBtn>
                </form>
              )}
            </div>
            <div className="p-8 rounded-2xl flex flex-col gap-5" style={{ backgroundColor: C.brandSoft, border: `1px solid ${C.cardBorder}` }}>
              <h3 className="text-xl font-semibold mb-2" style={{ color: C.n900 }}>Të dhënat e kontaktit</h3>
              {[[MapPin, "Rr. Bashkim Fehmiu, Arbëria 3, BC2/14 nr.4"], [MapPin, "10000 Prishtinë, Kosovë"], [Phone, "+383 (0)38 600 237"], [Mail, "info@cacttus.education"], [Clock, "E hënë – E premte, 09:00 – 17:00"]].map(([Icon, text], i) => (
                <div key={i} className="flex items-start gap-3"><Icon size={18} className="mt-0.5 shrink-0" style={{ color: C.brand }} /><span className="text-sm" style={{ color: C.n700 }}>{text as string}</span></div>
              ))}
              <div className="mt-4">
                <p className="text-sm font-semibold mb-3" style={{ color: C.n700 }}>Na ndiq</p>
                <div className="flex gap-3">
                  {CONTACT_SOCIALS.map(({ Icon, label, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }}><Icon size={16} style={{ color: C.n600 }} /></a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/*
            `overflow-hidden` is the one class added to this box: the grey placeholder it
            replaced had nothing square inside it, so `rounded-2xl` alone was enough. An
            iframe is a rectangle that would otherwise poke through the rounded corners.

            Keyless `/maps/embed?pb=…`, NOT the Embed API — nothing here can expire or
            leak, and no billing account is involved.

            THE LONG `pb` IS LOAD-BEARING. Two shorter spellings look equivalent and are
            not: `maps.google.com/maps?q=<address>&output=embed` 301-redirects to a
            MINIMAL pb (`!1m3!2m1!1s<query>!6i16`), and that minimal form renders nothing
            but Google's grey "Open in Maps" fallback — verified in-browser, twice. The
            full viewport pb below draws real tiles. If this ever needs repointing, take
            the string from Google Maps' own Share → "Embed a map" dialog rather than
            hand-shortening it.

            Coordinates and place id are the real ones behind the address, resolved from
            the office's Maps short link: 42.6570015, 21.147896 / place "Cacttus".

            `border: 0` rather than a `frameBorder` attribute, which is not valid React.
          */}
          <div className="mt-10 aspect-video rounded-2xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: C.n100 }}>
            <iframe
              title="Harta — Cacttus Education, Rr. Bashkim Fehmiu, Arbëria 3, Prishtinë"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2939.5!2d21.147896!3d42.6570015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13549edd669de99b%3A0x3e37c39c9f671dd5!2sCacttus!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: 0, display: "block" }}
            />
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
const RRETH_AMBIENT_IMG_POSITION = "center 50%";

/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
const RRETH_TEAM_IMG_POSITION = "center 50%";

function PageRrethNesh() {
  return (
    <PageWrapper>
      {/* 1 — who we are, text left / image right */}
      <section className="py-16 md:py-24" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Rreth Nesh" }]} />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
                Rreth Cacttus Education
              </h1>
              {/* The opening paragraph only. The two that used to follow it moved out to
                  their own section below — three stacked paragraphs beside the artwork
                  read as a wall of text, and they were what made this hero so tall.
                  `mb-8` here is the margin the last of the three used to carry, so the
                  gap down to the buttons is unchanged. */}
              <p className="text-lg leading-relaxed mb-8" style={{ color: C.muted }}>
                Me rrënjë në edukimin profesional që nga viti 2003, Cacttus Education vepron që nga viti 2015 si institucioni i parë privat profesional i Nivelit 5 në Kosovë, i specializuar në Teknologjinë e Informacionit dhe Komunikimit. Institucioni është i akredituar nga Autoriteti Kombëtar i Kualifikimeve dhe i licencuar nga MASHTI.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/ekipi"><PrimaryBtn>Njihu me ekipin</PrimaryBtn></Link>
                <Link to="/ligjërueit"><SecondaryBtn>Ligjëruesit tanë</SecondaryBtn></Link>
              </div>
            </div>

            {/*
              The real staff photo, in place of the Bursa_Redesign.png this column used to
              borrow from the homepage. `studimePhoto` still serves that homepage section,
              so its import stays — this page simply no longer shares it.

              A 3:2 photo in a 4:3 frame: `object-cover` fills the box and throws away the
              overflow, and RRETH_AMBIENT_IMG_POSITION is what chooses which slice is kept.
            */}
            <div className="aspect-[4/3] rounded-3xl overflow-hidden" style={{ backgroundColor: C.brandLight }}>
              <img
                src={rrethNeshStafi}
                alt="Stafi i Cacttus Education"
                className="w-full h-full object-cover"
                style={{ objectPosition: RRETH_AMBIENT_IMG_POSITION }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/*
        2 — what we teach, and how.

        The two paragraphs lifted out of the hero. Two cards rather than two more stacked
        paragraphs: they are already a natural pair — one answers WHAT is offered, the
        other HOW it is taught and where it leads — so splitting them side by side turns a
        block of prose into a comparison the eye can take in at a glance.

        Deliberately the calm section on this page. The mosaic directly below it is the
        visually loud one (photo scrim, gradient card, bullet list), and two sections
        competing back to back would flatten both. Icon tile, heading, paragraph — the same
        three-part card the /biznese and Bursa pages use, so it is a shape the site already
        speaks.

        Background is `brandLight`. `brandSoft` above and `n0` below are both taken, and a
        third tint keeps every boundary on this page a real colour change rather than two
        same-coloured bands running together.
      */}
      <section className="py-16 md:py-20" style={{ backgroundColor: C.brandLight }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: GraduationCap,
                title: "Programet tona",
                /* Paragraph 2, verbatim from the hero. */
                body: "Ofrojmë studime profesionale dyvjeçare në Zhvillimin e Uebit dhe Aplikacioneve Mobile dhe Siguri Kibernetike, si dhe trajnime të specializuara në programim, rrjete kompjuterike, cloud, siguri kibernetike, të dhëna, dizajn dhe marketing digjital. Programet tona kombinojnë teorinë me mësimin praktik, laboratorët dhe projektet reale.",
              },
              {
                icon: TrendingUp,
                title: "Ligjëruesit dhe karriera",
                /* Paragraph 3, verbatim from the hero. */
                body: "Përmes ligjëruesve nga industria, teknologjisë bashkëkohore dhe mbështetjes së Qendrës së Karrierës, studentët zhvillojnë aftësitë teknike dhe profesionale që kërkon tregu i punës. Cacttus Education është zgjedhja e besueshme për të gjithë ata që synojnë të ndërtojnë dhe avancojnë karrierën e tyre në teknologji.",
              },
            ].map(({ icon: Icon, title, body }) => (
              /* `h-full` on a grid child makes both cards the height of the taller one, so
                 the two blocks line up at the bottom instead of stepping. */
              <div
                key={title}
                className="h-full rounded-3xl p-8 md:p-9"
                style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: C.brandLight }}
                >
                  <Icon size={22} style={{ color: C.brand }} />
                </div>
                <h2 className="text-xl font-bold mb-3" style={{ color: C.n900 }}>{title}</h2>
                <p className="text-base leading-relaxed" style={{ color: C.muted }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*
        3 — story, mission and vision as one mosaic.

        Layout mirrors the supplied reference: a tall image on the left carrying its
        caption over a scrim, and two stacked cards on the right, the upper one light and
        the lower one solid. The reference's green is replaced throughout by the brand
        purple — `brandLight` for the light card, the brand→secondary gradient for the
        dark one — so the light/dark pairing survives the palette swap.

        The image column has no fixed height: it stretches to whatever the two cards on
        the right add up to. That is why the mission card can keep all three of its bullet
        points without the row falling out of proportion.
      */}
      <section className="py-20 md:py-24" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-5 items-stretch">
            {/* Story — caption sits on the photo */}
            <div className="relative rounded-3xl overflow-hidden min-h-[380px]">
              {/*
                PLACEHOLDER IMAGE, same status as the one in the section above: an Unsplash
                URL so this column is not empty. Swap it for a real photo of a classroom or
                the team. Kept as a remote URL rather than a bundled import precisely so it
                is obvious it is temporary.
              */}
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1000&h=1200&fit=crop&auto=format"
                alt="Ekipi i Cacttus Education"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: RRETH_TEAM_IMG_POSITION }}
                loading="lazy"
              />
              {/*
                Bottom-weighted scrim. A flat overlay would grey out the whole photo; a
                gradient keeps the top of the image readable and only darkens where the
                text actually sits.
              */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(36,16,40,0.94) 0%, rgba(36,16,40,0.72) 30%, rgba(36,16,40,0.10) 65%, rgba(36,16,40,0) 100%)",
                }}
              />
              <div className="relative h-full flex flex-col justify-end p-8 md:p-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Historia jonë</h2>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.86)" }}>
                  Cacttus Education u themelua në vitin 2015 si vazhdimësi e departamentit të trajnimeve profesionale të kompanisë CACTTUS, i cili vepron që nga viti 2003. Sot, ofrojmë arsim profesional të orientuar drejt praktikës dhe nevojave të industrisë.
                </p>
              </div>
            </div>

            {/* Mission (light) above Vision (dark) */}
            <div className="flex flex-col gap-5">
              <div className="rounded-3xl p-8 md:p-9" style={{ backgroundColor: C.brandLight }}>
                <h2 className="text-2xl font-bold mb-3" style={{ color: C.n900 }}>Misioni ynë</h2>
                <p className="text-xl font-semibold mb-3" style={{ color: C.brand }}>
                  &ldquo;Arsim cilësor. Mundësi reale për sukses.&rdquo;
                </p>
              
                <ul className="flex flex-col gap-3">
                  {ABOUT_MISSION_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span
                        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: C.brand }}
                      >
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </span>
                      <span className="text-sm leading-relaxed" style={{ color: C.n700 }}>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="relative rounded-3xl p-8 md:p-9 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}
              >
                <div
                  aria-hidden="true"
                  className="absolute -bottom-16 -right-16 w-52 h-52 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                />
                <div className="relative">
                  <h2 className="text-2xl font-bold mb-3 text-white">Vizioni ynë</h2>
                  <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
                    Të jemi institucioni udhëheqës në Arsimin dhe Aftësimin Profesional dhe zgjedhja e parë për studentët që kërkojnë arsim praktik e cilësor në Kosovë dhe rajon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
        4 — the seven values.

        Three tracks, so seven cards fall 3 + 3 + 1. Wider tracks mean each card gets more
        room for the same sentence, which is why the padding goes up with the column count
        rather than the cards simply being stretched.
      */}
      <section className="py-20 md:py-24" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-2" style={{ color: C.n900 }}>Vlerat tona</h2>
          <p className="text-lg mb-10" style={{ color: C.n500 }}>Shtatë parime që i mbajmë në çdo vendim.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ABOUT_VALUES.map(({ title, body }, i) => (
              <div
                key={title}
                className="rounded-2xl p-7 md:p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.n0 }}
              >
                <span
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold mb-5"
                  style={{ backgroundColor: C.brandLight, color: C.brand }}
                >
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold mb-2" style={{ color: C.n900 }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — the numbers, as evidence for everything above */}
      <section className="py-20 md:py-24" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-2" style={{ color: C.n900 }}>Në shifra</h2>
          <p className="text-lg mb-10" style={{ color: C.n500 }}>Ku jemi sot, pas nëntë vitesh.</p>
          <AboutStatsBand />
        </div>
      </section>

      {/* 5 — the same apply band every other page ends on */}
      <HorizontalApplicationBand />
    </PageWrapper>
  );
}

function PageEkipi() {
  const [activeCity, setActiveCity] = useState("Të gjitha");
  const cities = ["Të gjitha", "Prishtinë", "Prizren", "Kamenicë"];
  const members = activeCity === "Të gjitha" ? TEAM_MEMBERS : TEAM_MEMBERS.filter((m) => m.city === activeCity);
  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Rreth nesh" }, { label: "Ekipi" }]} />
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Ekipi</h1>
          <p className="text-lg" style={{ color: C.muted }}>Njihu me njerëzit që qëndrojnë prapa Cacttus Education.</p>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex gap-2 flex-wrap justify-center mb-10">
            {cities.map((c) => <button key={c} onClick={() => setActiveCity(c)} className="px-5 py-2 rounded-full text-sm font-medium transition-all" style={{ backgroundColor: activeCity === c ? C.brand : C.n100, color: activeCity === c ? "#fff" : C.n700, border: activeCity === c ? `1px solid ${C.brand}` : `1px solid ${C.n200}` }}>{c}</button>)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {members.map((m) => <PersonCard key={m.name} person={m} />)}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

function PageLigjërueit() {
  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Rreth nesh" }, { label: "Ligjëruesit" }]} />
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Ligjëruesit</h1>
          <p className="text-0.5g" style={{ color: C.muted }}>Njihuni me ligjëruesit, profesionistë të industrisë që sjellin njohuri praktike dhe ju përgatisin për tregun e punës.</p>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-16">
            {/* `nameOnly` here and NOT on /ekipi, which keeps its role, city and LinkedIn. */}
            {LIGJËRUEIT.map((l) => <PersonCard key={l.name} person={l} nameOnly />)}
          </div>
          <div className="py-16 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 px-8" style={{ backgroundColor: C.p900 }}>
            <h3 className="text-2xl font-semibold text-white">Dëshiron të ligjërosh te ne?</h3>
            <Link to="/kontakti"><SecondaryBtn className="border-white/50 text-white">Na kontakto</SecondaryBtn></Link>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   ROOT LAYOUT + ROUTING
══════════════════════════════════════════ */
function Layout({ children }: { children: React.ReactNode }) {
  const [showBanner] = useState(true); /* TopBanner has no close button, so no setter */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  /* Owned here, not in the popup: the banner and Navbar buttons need it too. */
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  /* In-memory only: stops the auto-trigger re-firing, but dies on refresh. */
  const popupShownThisLoad = useRef(false);

  /* useCallback keeps one stable identity across renders, so the popup's effects
     do not tear themselves down and rebuild every time Layout re-renders. */
  const openPopup = useCallback(() => {
    popupShownThisLoad.current = true;
    setIsPopupOpen(true);
  }, []);
  const closePopup = useCallback(() => setIsPopupOpen(false), []);

  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  /* ─── Auto-trigger: two downward scroll bursts, homepage only ─── */
  useEffect(() => {
    if (location.pathname !== "/") return;   // every other route: no listener at all
    if (isPopupOpen || popupShownThisLoad.current) return; // already had its turn

    let lastY = window.scrollY;
    let bursts = 0;
    let idleTimer: number | undefined;

    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      lastY = y;
      if (!goingDown) return;               // scrolling back up never counts

      window.clearTimeout(idleTimer);       // still moving: this burst isn't over
      idleTimer = window.setTimeout(() => { // 300ms of stillness ends the burst
        bursts += 1;
        if (bursts >= 2) openPopup();       // the same door the buttons use
      }, 300);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {                          // cleanup: never leave a listener behind
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(idleTimer);
    };
  }, [isPopupOpen, openPopup, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "Inter, sans-serif", backgroundColor: C.n0, color: C.n700 }}>
      <style>{globalStyle}</style>
      {showBanner && <TopBanner onApplyClick={openPopup} />}
      <Navbar showBanner={showBanner} setMobileMenuOpen={setMobileMenuOpen} onApplyClick={openPopup} />
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      {/* Every page below can now call `useApplyPopup()` and get THIS opener. */}
      <ApplyPopupContext.Provider value={openPopup}>
        <main className="flex-1">{children}</main>
      </ApplyPopupContext.Provider>
      {/* Chrome, like the navbar: rendered here so no route can be missing it. */}
      <Footer onApplyClick={openPopup} />
      {/* Lives in Layout so it is available on every route, not just the homepage. */}
      <ScrollPopupForm isOpen={isPopupOpen} onClose={closePopup} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<PageBallina />} />
                <Route path="/programim" element={<PageProgramim />} />
                <Route path="/siguria" element={<PageSiguria />} />
                <Route path="/trajnime" element={<PageTrajnime />} />
                {/* Detail page. Declared after the exact "/trajnime" so the catalogue
                    keeps its own route; React Router ranks static over dynamic anyway. */}
                <Route path="/trajnime/:slug" element={<PageTrajnimiDetal />} />
                {/* Social-media intake: the link an admin copies out of the dashboard. */}
                <Route path="/forma/:slug" element={<PageForma />} />
                <Route path="/biznese" element={<PageBiznese />} />
                <Route path="/biznese/trajnime" element={<PageBizneseTrajnime />} />
                <Route path="/biznese/talente" element={<PageBizneseTalente />} />
                <Route path="/biznese/bursa" element={<PageBizneseBursa />} />
                <Route path="/biznese/klasa" element={<PageBiznestKlasa />} />
                <Route path="/projektet" element={<PageProjektet />} />
                {PROJECTS.map((p) => (
                  <Route key={p.path} path={p.path} element={<ProjectDetailPage project={p} />} />
                ))}
                <Route path="/lajme" element={<PageLajme />} />
                {/* Detail page. Declared after the exact "/lajme" so the feed keeps that
                    path, exactly as /trajnime/:slug is declared after /trajnime. This
                    replaces the old static "/lajme/artikull" mock route — that path now
                    resolves here as a slug and 404s honestly, which is correct: it never
                    named a real post. */}
                <Route path="/lajme/:slug" element={<PageArtikulli />} />
                <Route path="/kontakti" element={<PageKontakti />} />
                <Route path="/rreth-nesh" element={<PageRrethNesh />} />
                <Route path="/ekipi" element={<PageEkipi />} />
                <Route path="/ligjërueit" element={<PageLigjërueit />} />
                <Route path="*" element={<PageBallina />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
