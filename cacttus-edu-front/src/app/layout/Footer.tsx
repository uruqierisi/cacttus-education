import { ArrowUp } from "lucide-react";
import { Link } from "react-router";
import { FOOTER_LINKS, FOOTER_SOCIALS } from "../data/socials";
import { C } from "../theme";


export function Footer({ onApplyClick }: { onApplyClick?: () => void }) {
  return (
    <footer style={{ backgroundColor: C.p800 }} className="pt-20 pb-8">
      <div className="max-w-[1200px] mx-auto px-5">
        {/*
          `1.4fr` on the first track: the tagline is prose and needs more room than three
          columns of short lines, which would otherwise all be given an equal quarter and
          leave the paragraph wrapping every four words.
        */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1fr_1fr] gap-10 lg:gap-12 pb-12 border-b"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          {/* 1 — identity */}
          <div>
            {/*
              The white lockup, straight onto the purple with no patch behind it.

              THIS USES education-white.svg, NOT logowhitenobgCE.svg, and the difference
              is not cosmetic. Despite its name, `logowhitenobgCE.svg` has no transparency
              of its own: it is a single 709x251 PNG that is 100% OPAQUE with solid black
              corners (verified by rasterising it), turned white and see-through only by an
              feColorMatrix + <mask> chain at render time. Engines that skip that chain —
              older Safari, Android WebView, some in-app browsers — paint the raw bitmap,
              which is exactly the "white logo in a black box" that was reported on a phone.

              education-white.svg is true vector: 12 <path> elements filled #ffffff, no
              rasters, no filters, no masks. There is nothing in it that can fail to a
              black rectangle. It is the same lockup the dashboard sidebar uses.

              `width`/`height` are the viewBox numbers (710.096 x 199.759, ~3.55:1) so the
              browser reserves the right box before load — no layout shift — and only the
              height is constrained, which makes stretching impossible.
            */}
            <img
              src="/brand/education-white.svg"
              width={710}
              height={200}
              alt="Cacttus Education"
              decoding="async"
              className="block mb-5"
              style={{ height: 38, width: "auto" }}
            />
            <p className="text-sm leading-relaxed max-w-[34ch]" style={{ color: "rgba(255,255,255,0.65)" }}>
              Cacttus Education është lider në Kosovë në ofrimin e edukimit profesional në
              fushën e teknologjisë informative.
            </p>
          </div>

          {/* 2 — contact */}
          <div>
            <p
              className="text-xs font-semibold text-white mb-4 uppercase"
              style={{ letterSpacing: "0.08em" }}
            >
              Kontakti
            </p>
            <div className="flex flex-col gap-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="text-white/85">Cacttus Education LLC</span>
              <span className="leading-relaxed">
                Rr. Bashkim Fehmiu, Arbëria 3, BC2/14 nr.4, 10000 Prishtinë, Kosovë
              </span>
              {/* A tel: link, not plain text — on a phone this is the difference between
                  reading the number and calling it. */}
              <a
                href="tel:+38338600237"
                className="py-3 lg:py-0 transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Tel: +383 (0)38 600 237
              </a>
            </div>
          </div>

          {/* 3 — navigation */}
          <div>
            <p
              className="text-xs font-semibold text-white mb-4 uppercase"
              style={{ letterSpacing: "0.08em" }}
            >
              Navigimi
            </p>
            <nav className="flex flex-col gap-2.5">
              {FOOTER_LINKS.map(([label, path]) => (
                <Link
                  key={path}
                  to={path}
                  className="text-sm py-3 lg:py-0 transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* 4 — social + CTA */}
          <div>
            <p
              className="text-xs font-semibold text-white mb-4 uppercase"
              style={{ letterSpacing: "0.08em" }}
            >
              Rrjetet Sociale
            </p>
            <div className="flex gap-3 mb-6">
              {FOOTER_SOCIALS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-11 h-11 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Icon size={18} style={{ color: "rgba(255,255,255,0.7)" }} aria-hidden="true" />
                </a>
              ))}
            </div>

            {/*
              Outline pill rather than the site's filled PrimaryBtn: on this dark panel a
              solid brand-purple button would nearly disappear, the same reason the apply
              band's button is white rather than purple.
            */}
            <button
              type="button"
              onClick={onApplyClick}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs font-semibold uppercase transition-colors duration-200"
              style={{
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.5)",
                letterSpacing: "0.08em",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.color = C.p900;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#fff";
              }}
            >
              Apliko tani
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-6 gap-3">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Cacttus Education 2026. Të gjitha drejtat e rezervuara.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Ndërtuar me ♥ në Prishtinë
            </p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Kthehu në krye"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <ArrowUp size={16} style={{ color: "rgba(255,255,255,0.75)" }} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
