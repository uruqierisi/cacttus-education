import { usePageMeta } from "../hooks/usePageMeta";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  getPublicPosts,
  getPublicPostCategories,
  type PostCard as PostCardData,
  type PostCategory,
} from "../../marketing/lib/public-api";
import { FilterRow } from "../sections/FilterRow";
import { Pagination } from "../sections/Pagination";
import { ALL_FILTER } from "./PageTrajnime";
import { ArticleCard } from "../cards/ArticleCard";
import { formatPostDate } from "../lib/dates";
import { C } from "../theme";
import { PageWrapper } from "../ui/PageWrapper";
import { GhostBtn, SecondaryBtn } from "../ui/buttons";


/* ══════════════════════════════════════════
   LAJME — the blog, /lajme and /lajme/:slug

   Backed by `GET /api/public/posts`, which only ever returns `published = true` rows.
   Until this was wired the two pages rendered a hard-coded `ARTICLES` array and every
   card linked to a single static `/lajme/artikull` mock, so a post published in the
   dashboard could never appear here no matter how correct the backend was.

   CATEGORY CHIPS, at last. This comment used to explain their ABSENCE: the mock had
   "Lajmet / Teknologji / Karriera / Projekte" but `Post` had no category column, so the
   filters could not be backed by data and inventing one per post would have made them
   lie. The model has the field now, so the chips are real — and they still come from the
   DATA, never from a hard-coded list: the endpoint returns only categories that have a
   published post, so a chip can never lead to an empty page.

   PAGINATION, AND WHY IT IS CLIENT-SIDE. `GET /api/public/posts` does support
   `page`/`pageSize` and returns `{ page, pageSize, total, totalPages }` — that was
   checked before any of this was written, which is why the backend is untouched. It is
   still not used here, for one concrete reason: the hero is counted OUTSIDE the six, so
   page 1 covers items 0–6 and page 2 items 7–12. The API addresses rows as
   `(page - 1) * pageSize`, and no constant pageSize produces a window starting at 7.
   Serving that would need an `offset` parameter the endpoint does not have.

   Paginating in the browser costs nothing extra today because this page ALREADY fetches
   every published post and always has — the filter above works the same way. What
   changes is only what is drawn. That trade stops being right once the archive outgrows
   a single response worth downloading; at roughly a hundred posts, add `offset` to the
   endpoint and move both the filter and the paging behind it.
══════════════════════════════════════════ */

/** Posts per page, hero excluded. */
const POSTS_PER_PAGE = 6;

/** The query parameter that carries the page. Albanian, like the rest of the URLs. */
const PAGE_PARAM = "faqja";
export function PageLajme() {
  usePageMeta(
    "Lajme dhe njoftime — Cacttus Education",
    "Njoftime, histori dhe risi nga Cacttus Education.",
  );
  const [posts, setPosts] = useState<readonly PostCardData[]>([]);
  const [categories, setCategories] = useState<readonly PostCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  /*
    THE URL IS THE STATE, for both the chip and the page. Holding either in `useState`
    would have made a filtered page 2 unshareable and the back button a no-op — the two
    things this had to get right. `?faqja=2&category=karriera` restores the exact view.

    The category travels as a SLUG, not as the visible label: a label can be renamed from
    the dashboard, and a link somebody shared should survive that.
  */
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  const requestedPage = Number.parseInt(searchParams.get(PAGE_PARAM) ?? "1", 10);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError("");

    /*
      The chips are a SEPARATE, non-fatal request. A failed feed is an error the visitor
      must see; a failed category list only costs the filter row, and taking the whole
      page down for it would be the worse trade — so it resolves to an empty list and the
      row simply does not render.
    */
    getPublicPostCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch(() => {
        if (active) setCategories([]);
      });

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

  /*
    An UNCATEGORISED post matches only "Të gjitha". That is the honest behaviour: it
    belongs to no category, so no category chip should claim it.
  */
  const filtered = categorySlug
    ? posts.filter((post) => post.category?.slug === categorySlug)
    : posts;

  /*
    THE HERO IS COUNTED OUTSIDE THE SIX, and it is removed from the paginated list on
    EVERY page, not just the one that draws it. Slicing it off only on page 1 would push
    it back into the grid on page 2 and show the newest post twice.

    It appears only unfiltered: inside a category the newest post of that category is not
    "the" lead story, and giving each filter its own hero would make the same article the
    headline of several pages at once.
  */
  const featured = categorySlug ? undefined : filtered[0];
  const paginated = featured ? filtered.slice(1) : filtered;

  const totalPages = Math.max(1, Math.ceil(paginated.length / POSTS_PER_PAGE));

  /*
    Anything outside 1..totalPages collapses to 1 — a typed `?faqja=99`, a `?faqja=abc`
    that parses to NaN, or a bookmark to a page that existed before posts were unpublished.
  */
  const isPageValid = Number.isFinite(requestedPage) && requestedPage >= 1 && requestedPage <= totalPages;
  const page = isPageValid ? requestedPage : 1;

  /*
    Rewrite the URL when it asked for a page that does not exist, so the address bar stops
    claiming otherwise. `replace` on purpose: a bad page must not become a history entry
    the back button walks the visitor into again.

    Guarded on `posts.length` because `totalPages` is 1 while the feed is still loading,
    and without that guard a legitimate `?faqja=3` would be rewritten to 1 before its
    posts ever arrived.
  */
  useEffect(() => {
    if (posts.length > 0 && !isPageValid) {
      const next = new URLSearchParams(searchParams);
      next.delete(PAGE_PARAM);
      setSearchParams(next, { replace: true });
    }
  }, [posts.length, isPageValid, searchParams, setSearchParams]);

  const pageItems = paginated.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  const showHero = Boolean(featured) && page === 1;

  const selectedCategory = categories.find((category) => category.slug === categorySlug);
  const selected = selectedCategory ? selectedCategory.name : ALL_FILTER;
  const chipOptions = [ALL_FILTER, ...categories.map((category) => category.name)];

  /* A chip always returns to page 1 — page 4 of "Të gjitha" is rarely page 4 of a
     category, and landing on an empty grid after a click reads as a broken filter. */
  const selectCategory = (label: string) => {
    const next = new URLSearchParams(searchParams);
    const match = categories.find((category) => category.name === label);
    if (match) {
      next.set("category", match.slug);
    } else {
      next.delete("category");
    }
    next.delete(PAGE_PARAM);
    setSearchParams(next);
  };

  const selectPage = (value: number) => {
    const next = new URLSearchParams(searchParams);
    if (value <= 1) {
      next.delete(PAGE_PARAM);
    } else {
      next.set(PAGE_PARAM, String(value));
    }
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Lajme</h1>
          <p className="text-lg" style={{ color: C.muted }}>Njoftime, histori dhe risi nga Cacttus Education.</p>
        </div>
      </section>

      {/*
        Rendered only when there is more than one option — a lone "Të gjitha" chip filters
        nothing and would just be furniture. That is the same guard the /trajnime rows use,
        and it is what keeps this row absent entirely until an editor files a first post.
      */}
      {chipOptions.length > 1 && (
        <section className="pt-8" style={{ backgroundColor: C.n0 }}>
          <div className="max-w-[1200px] mx-auto px-5">
            <FilterRow
              label="Kategoria:"
              options={chipOptions}
              active={selected}
              onSelect={selectCategory}
            />
          </div>
        </section>
      )}

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
          ) : filtered.length === 0 ? (
            /* A filtered-to-nothing grid is a different state from an empty blog, and it
               needs a way back — otherwise the visitor is stuck on a blank page with no
               clue that a chip caused it. The endpoint only offers categories that have a
               published post, so this is reachable only in the seconds between an editor
               unfiling the last one and the list being refetched. */
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <p className="text-lg" style={{ color: C.n500 }}>Nuk ka lajme në këtë kategori</p>
              <SecondaryBtn onClick={() => selectCategory(ALL_FILTER)}>Shfaq të gjitha</SecondaryBtn>
            </div>
          ) : (
            <>
              {showHero && featured && (
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

              {pageItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pageItems.map((post) => <ArticleCard key={post.slug} post={post} />)}
                </div>
              )}

              <Pagination page={page} totalPages={totalPages} onSelect={selectPage} />
            </>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}
