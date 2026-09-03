import { usePageMeta, metaSummary } from "../hooks/usePageMeta";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  PublicApiError,
  getPublicPost,
  getPublicPosts,
  type PostCard as PostCardData,
  type PostDetail,
} from "../../marketing/lib/public-api";
import { ArticleCard } from "../cards/ArticleCard";
import { formatPostDate } from "../lib/dates";
import { renderSafeHtml } from "../lib/sanitize";
import { C } from "../theme";
import { Breadcrumb } from "../ui/Breadcrumb";
import { PageWrapper } from "../ui/PageWrapper";
import { PrimaryBtn } from "../ui/buttons";


/* ══════════════════════════════════════════
   /lajme/:slug — one article

   The body is operator-authored HTML from the Tiptap editor. It is sanitised server-side
   on write AND again by `renderSafeHtml` here, immediately before it reaches
   `dangerouslySetInnerHTML` — the reasoning for both passes is on that function.
══════════════════════════════════════════ */
export function PageArtikulli() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [related, setRelated] = useState<readonly PostCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  usePageMeta(
    post ? `${post.title} — Cacttus Education` : "Lajme — Cacttus Education",
    post ? metaSummary(post.excerpt, "Lajme nga Cacttus Education.") : "Lajme nga Cacttus Education.",
  );

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
