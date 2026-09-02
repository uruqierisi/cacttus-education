import { Link } from "react-router";
import { C } from "../theme";


export function Breadcrumb({ items }: { items: { label: string; path?: string }[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-6 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span style={{ color: C.n400 }}>/</span>}
          {item.path ? (
            <Link to={item.path} className="hover:underline transition-colors" style={{ color: C.brand }}>{item.label}</Link>
          ) : (
            <span style={{ color: C.n500 }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
