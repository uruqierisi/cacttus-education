import { C } from "../theme";


export function FormField({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: C.n700 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{ border: `1px solid ${C.n300}`, backgroundColor: C.n0, color: C.n800, height: 52 }}
        onFocus={(e) => (e.target.style.borderColor = C.brand)}
        onBlur={(e) => (e.target.style.borderColor = C.n300)}
      />
    </div>
  );
}


export function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: C.n700 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all appearance-none"
        style={{ border: `1px solid ${C.n300}`, backgroundColor: C.n0, color: value ? C.n800 : C.n400, height: 52 }}
        onFocus={(e) => (e.target.style.borderColor = C.brand)}
        onBlur={(e) => (e.target.style.borderColor = C.n300)}
      >
        <option value="" disabled>Zgjidh...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
