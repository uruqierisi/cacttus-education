import { BrowserRouter, Routes, Route } from "react-router";
import { PROJECTS } from "./data/projects";
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
import { Layout } from "./Layout";


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
