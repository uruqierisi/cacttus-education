import { useNavigate } from "react-router";
import { C } from "../theme";
import { GhostBtn } from "../ui/buttons";


/* ── PROJECT CARD ── */
export function ProjectCard({ project, to }: { project: { title: string; partner: string; desc: string }; to: string }) {
  const navigate = useNavigate();
  /*
    No partner badge. It used to sit above the title as a `brandLight` pill; removing the
    element rather than hiding it is what lets the title rise into the space — the card is
    a flex column with `gap-4`, so a hidden-but-present child would still cost one gap.
    `project.partner` is still carried in the data and still shown on the detail page.
  */
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }} onClick={() => navigate(to)}>
      <h4 className="text-base font-semibold leading-snug" style={{ color: C.n900 }}>{project.title}</h4>
      <p className="text-sm flex-1 line-clamp-2" style={{ color: C.n500 }}>{project.desc}</p>
      <GhostBtn>Shiko projektin</GhostBtn>
    </div>
  );
}
