import { Link } from "react-router";
import type { PostCard as PostCardData } from "../../marketing/lib/public-api";
import { formatPostDate } from "../lib/dates";
import { C } from "../theme";


/* ── TRAINING CARD ── */

/* ── ARTICLE CARD ── */
/**
 * A card in the /lajme grid.
 *
 * A real `<Link>` rather than a `div` with an onClick, which is what this was while the
 * feed was mock data: the card is a navigation, so it must be middle-clickable,
 * keyboard-reachable and readable by a screen reader as a link.
 *
 * There is no category chip because `Post` has no category column — see the note on
 * PageLajme. Showing an invented one would be the card lying about the data.
 */
export function ArticleCard({ post }: { post: PostCardData }) {
  return (
    <Link
      to={`/lajme/${post.slug}`}
      className="block rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group"
      style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }}
    >
      <div className="aspect-[16/9] overflow-hidden" style={{ backgroundColor: C.n100 }}>
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: C.brandSoft }} />
        )}
      </div>
      <div className="p-5">
        <h4 className="text-sm font-semibold mb-2 leading-snug line-clamp-2" style={{ color: C.n900 }}>{post.title}</h4>
        {post.excerpt && (
          <p className="text-xs mb-3 leading-relaxed line-clamp-3" style={{ color: C.muted }}>{post.excerpt}</p>
        )}
        <p className="text-xs" style={{ color: C.n400 }}>{formatPostDate(post.createdAt)}</p>
      </div>
    </Link>
  );
}
