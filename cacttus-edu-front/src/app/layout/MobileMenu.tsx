import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Link, useLocation } from "react-router";
import { PROJEKTET_LIST } from "../data/projektet-list";
import { C } from "../theme";
import { PrimaryBtn } from "../ui/buttons";


/* ─── MOBILE MENU — Rreth Nesh BEFORE Kontakti ─── */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  /*
    Every drawer sub-link already renders in brand purple, so "active = purple" would not
    distinguish anything. The current page is marked with WEIGHT and a filled left rule
    instead: same hue, unmistakably one row.
  */
  const { pathname } = useLocation();
  const subLink = (path: string) => ({
    className: `py-3 pl-4 text-sm block border-l-2 ${pathname === path ? "font-semibold" : ""}`,
    style: { color: pathname === path ? C.brandDark : C.brand, borderColor: pathname === path ? C.brand : C.p300 },
  });
  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    /*
      `overflow-hidden` is NOT cosmetic — it is the fix for a horizontal-scroll bug on iOS.

      The panel below parks itself off-canvas with `translate-x-full` when closed, which
      puts its right edge 384px (max-w-sm) past the right edge of the screen. This box is
      `fixed inset-0`, and desktop Chrome does not count overflow inside a fixed subtree
      toward document.scrollWidth — so every automated check here reported zero overflow
      while a real iPhone scrolled 384px to the right into empty space, with the banner and
      hamburger appearing cut off. iOS Safari DOES count it.

      Clipping at this wrapper kills the phantom scroll at its source. The open state is
      unaffected: at `translate-x-0` the panel sits fully inside these bounds, and it still
      slides in from the clipped edge exactly as before.
    */
    <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-sm flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ backgroundColor: C.n0 }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.n200 }}>
          {/* Same vector lockup as the navbar — the drawer header is white too. Was the
              180px raster at 32px with mixBlendMode "multiply". */}
          <img src="/brand/education-black.svg" width={710} height={200} alt="Cacttus Education" decoding="async" className="block" style={{ height: 34, width: "auto" }} />
          <button onClick={onClose} aria-label="Mbyll menunë" className="p-3 -m-3"><X size={22} style={{ color: C.n700 }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <AccordionMobile label="Studime profesionale" id="studime" expanded={expanded} toggle={toggle}>
            <Link to="/programim" onClick={onClose} {...subLink("/programim")}>Zhvillues i Ueb-it dhe Aplikacioneve Mobile</Link>
            <Link to="/siguria" onClick={onClose} {...subLink("/siguria")}>Siguria Kibernetike</Link>
          </AccordionMobile>
          <Link to="/trajnime" onClick={onClose} className="flex px-5 py-3 text-sm font-medium" style={{ color: C.n800 }}>Trajnime profesionale</Link>
          <AccordionMobile label="Projektet" id="projektet" expanded={expanded} toggle={toggle} overviewPath="/projektet" onClose={onClose}>
            {PROJEKTET_LIST.map((p) => (
              <Link key={p.path} to={p.path} onClick={onClose} {...subLink(p.path)}>{p.name}</Link>
            ))}
          </AccordionMobile>
          <AccordionMobile label="Për biznese" id="biznese" expanded={expanded} toggle={toggle} overviewPath="/biznese" onClose={onClose}>
            {[["Trajnime të personalizuara", "/biznese/trajnime"], ["Rrjeti i talentëve", "/biznese/talente"], ["Bursa e Impaktit", "/biznese/bursa"], ["Klasët me qera", "/biznese/klasa"]].map(([name, path]) => (
              <Link key={path} to={path} onClick={onClose} {...subLink(path)}>{name}</Link>
            ))}
          </AccordionMobile>
          <Link to="/lajme" onClick={onClose} className="flex px-5 py-3 text-sm font-medium" style={{ color: C.n800 }}>Lajme</Link>
          {/* Rreth Nesh BEFORE Kontakti */}
          <AccordionMobile label="Rreth Nesh" id="rreth" expanded={expanded} toggle={toggle} overviewPath="/rreth-nesh" onClose={onClose}>
            <Link to="/ekipi" onClick={onClose} {...subLink("/ekipi")}>Ekipi</Link>
            <Link to="/ligjërueit" onClick={onClose} {...subLink("/ligjërueit")}>Ligjëruesit</Link>
          </AccordionMobile>
          <Link to="/kontakti" onClick={onClose} className="flex px-5 py-3 text-sm font-medium" style={{ color: C.n800 }}>Kontakti</Link>
        </div>
        <div className="p-5 border-t" style={{ borderColor: C.n200 }}>
          <Link to="/#apliko" onClick={onClose} className="block w-full">
            <PrimaryBtn className="w-full justify-center">Apliko tani</PrimaryBtn>
          </Link>
        </div>
      </div>
    </div>
  );
}


/**
 * A drawer section whose label toggles its sub-menu.
 *
 * `overviewPath` is how the section's OWN page stays reachable. Three of these headings
 * (Projektet, Për biznese, Rreth Nesh) name a real page, but the heading is a toggle, so
 * on a phone there was no way to reach /projektet, /biznese or /rreth-nesh at all — the
 * tap only expanded the list of children.
 *
 * The fix is a "Shiko të gjitha" row at the TOP of the expanded panel rather than making
 * the heading itself a link with a separate caret. A 44px row split into a link half and a
 * caret half is a mis-tap waiting to happen on a phone, and it would have changed this
 * component's contract for the one section (Studime profesionale) that has no page to
 * point at. An extra row costs nothing and reads unambiguously.
 */
export function AccordionMobile({ label, id, expanded, toggle, overviewPath, onClose, children }: { label: string; id: string; expanded: string | null; toggle: (id: string) => void; overviewPath?: string; onClose?: () => void; children: React.ReactNode }) {
  return (
    <>
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium"
        style={{ color: C.n800 }}
        onClick={() => toggle(id)}
      >
        {label}
        <ChevronDown size={16} className={`transition-transform ${expanded === id ? "rotate-180" : ""}`} />
      </button>
      {expanded === id && (
        <div className="px-5 pb-2 flex flex-col gap-1">
          {overviewPath && (
            <Link
              to={overviewPath}
              onClick={onClose}
              className="py-3 pl-4 text-sm font-semibold block border-l-2"
              style={{ color: C.brandDark, borderColor: C.brand }}
            >
              Shiko të gjitha
            </Link>
          )}
          {children}
        </div>
      )}
    </>
  );
}
