import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { C, globalStyle } from "./theme";
import { ApplyPopupContext } from "./hooks/apply-popup";
import { PROJECTS } from "./data/projects";
import { Footer } from "./layout/Footer";
import { MobileMenu } from "./layout/MobileMenu";
import { Navbar } from "./layout/Navbar";
import { TopBanner } from "./layout/TopBanner";
import { ScrollPopupForm } from "./forms/ScrollPopupForm";
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
import { PageArtikulli } from "./pages/PageArtikulli";
import { PageEkipi } from "./pages/PageEkipi";
import { PageKontakti } from "./pages/PageKontakti";
import { PageLajme } from "./pages/PageLajme";
import { PageLigjërueit } from "./pages/PageLigjerueit";
import { PageProjektet } from "./pages/PageProjektet";
import { PageRrethNesh } from "./pages/PageRrethNesh";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";


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
