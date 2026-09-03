import { usePageMeta } from "../hooks/usePageMeta";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  getPublicPosts,
  getPublicPostCategories,
  type PostCard as PostCardData,
  type PostCategory,
} from "../../marketing/lib/public-api";
import { FilterRow } from "../sections/FilterRow";
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
══════════════════════════════════════════ */
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
    The selected chip, held as the visible LABEL rather than a slug — `FilterRow` speaks
    in labels and one row that can only have one answer is exactly what one string models.
    Same shape the /trajnime row uses.
  */
  const [selected, setSelected] = useState(ALL_FILTER);

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
    Filtered CLIENT-SIDE, from the list already loaded, rather than by re-requesting with
    `?category=`. The feed is a browse-all grid of a few dozen posts that is already in
    memory, so a round trip per chip would add latency for nothing. The query parameter
    exists on the API for callers that want it — a shared link, a future paginated feed.

    An UNCATEGORISED post matches only "Të gjitha". That is the honest behaviour: it
    belongs to no category, so no category chip should claim it.
  */
  const visible =
    selected === ALL_FILTER ? posts : posts.filter((post) => post.category?.name === selected);

  const chipOptions = [ALL_FILTER, ...categories.map((category) => category.name)];

  // The newest post gets the wide treatment; the rest fill the grid beneath it.
  const [featured, ...rest] = visible;

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
              onSelect={setSelected}
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
          ) : visible.length === 0 ? (
            /* A filtered-to-nothing grid is a different state from an empty blog, and it
               needs a way back — otherwise the visitor is stuck on a blank page with no
               clue that a chip caused it. The endpoint only offers categories that have a
               published post, so this is reachable only in the seconds between an editor
               unfiling the last one and the list being refetched. */
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <p className="text-lg" style={{ color: C.n500 }}>Nuk ka lajme në këtë kategori</p>
              <SecondaryBtn onClick={() => setSelected(ALL_FILTER)}>Shfaq të gjitha</SecondaryBtn>
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
