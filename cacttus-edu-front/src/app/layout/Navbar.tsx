import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { Link } from "react-router";
import { C } from "../theme";
import { PrimaryBtn } from "../ui/buttons";
import {
  DropdownBiznese,
  DropdownProjektet,
  DropdownRreth,
  DropdownStudime,
} from "./dropdowns";



/* ─── SHARED TYPES ─── */
export type DropdownId = "studime" | "projektet" | "biznese" | "rreth" | null;


/* 1.2 — NAVBAR: Rreth Nesh moved BEFORE Kontakti */
export function Navbar({
  showBanner,
  setMobileMenuOpen,
  onApplyClick,
}: {
  showBanner: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  onApplyClick: () => void;
}) {
  const [activeDropdown, setActiveDropdown] = useState<DropdownId>(null);
  const [sticky, setSticky] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY > (showBanner ? 40 : 0));
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showBanner]);

  /* Every nav link goes through this one string, so `nav-underline` reaches all seven —
     the six inside <nav> and Kontakti, which sits in its own group to the right. See the
     rule in `globalStyle`. */
  const navLinkClass =
    "nav-underline px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-purple-700";
  const navLinkStyle = { color: C.n700 };

  return (
    <div
      ref={navRef}
      className={`w-full z-40 transition-shadow duration-200 ${sticky ? "sticky top-0 shadow-md" : ""}`}
      style={{ backgroundColor: C.n0, borderBottom: `1px solid ${C.n200}` }}
    >
      <div
        className="max-w-[1200px] mx-auto px-5 flex items-center justify-between"
        style={{ height: 64 }}
      >
        {/* Logo */}
        {/*
          The true-vector lockup, replacing `logo-180px.png`. That raster was a 180x180
          SQUARE of the mark, forced to height:130 and then cropped back to 52px by an
          overflow-hidden box with -39px margins top and bottom, with mixBlendMode
          "multiply" knocking out its white background. Three hacks stacked to make a
          square icon behave like a wordmark, and it still rendered soft — 180px of source
          for a slot that needs 2x its display width.

          education-black.svg is the dark lockup for light surfaces (the navbar and the
          drawer are both white), 12 real <path> elements, no raster, no blend mode. It
          needs no crop, no negative margins and no overflow box: height alone sizes it,
          and `width`/`height` carry the viewBox ratio (710.096 x 199.759, ~3.55:1) so the
          browser reserves the correct box before load.
        */}
        <Link to="/" className="shrink-0 flex items-center">
          <img
            src="/brand/education-black.svg"
            width={710}
            height={200}
            alt="Cacttus Education"
            decoding="async"
            className="block"
            style={{ height: 36, width: "auto" }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {/* Studime profesionale */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("studime")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button className={navLinkClass} style={navLinkStyle}>
              Studime profesionale{" "}
              <ChevronDown size={13} className={`inline ml-0.5 transition-transform ${activeDropdown === "studime" ? "rotate-180" : ""}`} />
            </button>
            {activeDropdown === "studime" && <DropdownStudime onClose={() => setActiveDropdown(null)} />}
          </div>

          <Link to="/trajnime" className={navLinkClass} style={navLinkStyle}>
            Trajnime profesionale
          </Link>

          {/* Projektet */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("projektet")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <Link to="/projektet" className={navLinkClass} style={navLinkStyle}>
              Projektet{" "}
              <ChevronDown size={13} className={`inline ml-0.5 transition-transform ${activeDropdown === "projektet" ? "rotate-180" : ""}`} />
            </Link>
            {activeDropdown === "projektet" && <DropdownProjektet onClose={() => setActiveDropdown(null)} />}
          </div>

          {/* Për biznese */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("biznese")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <Link to="/biznese" className={navLinkClass} style={navLinkStyle}>
              Për biznese{" "}
              <ChevronDown size={13} className={`inline ml-0.5 transition-transform ${activeDropdown === "biznese" ? "rotate-180" : ""}`} />
            </Link>
            {activeDropdown === "biznese" && <DropdownBiznese onClose={() => setActiveDropdown(null)} />}
          </div>

          <Link to="/lajme" className={navLinkClass} style={navLinkStyle}>
            Lajme
          </Link>

          {/* Rreth Nesh — BEFORE Kontakti */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("rreth")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            {/*
              A Link, not a button: the label now navigates to /rreth-nesh while hovering
              still opens the dropdown, matching "Studime profesionale" and "Për biznese"
              above, which have behaved this way all along. The dropdown itself and its
              two entries are untouched.
            */}
            <Link to="/rreth-nesh" className={navLinkClass} style={navLinkStyle}>
              Rreth Nesh{" "}
              <ChevronDown size={13} className={`inline ml-0.5 transition-transform ${activeDropdown === "rreth" ? "rotate-180" : ""}`} />
            </Link>
            {activeDropdown === "rreth" && <DropdownRreth onClose={() => setActiveDropdown(null)} />}
          </div>
        </nav>

        {/*
          Kontakti + Apliko tani, deliberately OUTSIDE the <nav> above and carrying their
          own divider. The six links to the left are "where do I read about you"; these
          two are "how do I reach you" — a different job, so they read as their own group
          rather than as the tail of a list of six.
        */}
        <div className="hidden lg:flex items-center gap-5 pl-6" style={{ borderLeft: `1px solid ${C.n200}` }}>
          <Link to="/kontakti" className={navLinkClass} style={navLinkStyle}>
            Kontakti
          </Link>
          {/* Link removed: this opens the popup, it no longer navigates. */}
          <PrimaryBtn onClick={onApplyClick}>Apliko tani</PrimaryBtn>
        </div>

        <button
          className="lg:hidden p-2 rounded-md"
          style={{ color: C.n700 }}
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Hap menunë"
        >
          <Menu size={24} />
        </button>
      </div>
    </div>
  );
}
