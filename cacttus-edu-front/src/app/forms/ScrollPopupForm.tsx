import React, { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { APPLICATION_FORM_SLUG } from "../../marketing/lib/forms.config";
import { PublicApiError, submitPublicForm } from "../../marketing/lib/public-api";
import { PHONE_ERROR, isValidPhone, sanitizePhone } from "../lib/phone";
import { C } from "../theme";
import { FormField } from "../ui/FormField";
import { PrimaryBtn } from "../ui/buttons";
import {
  POPUP_DREJTIMET,
  POPUP_ENTER_EASE,
  POPUP_ENTER_MS,
  POPUP_EXIT_MS,
  POPUP_PROGRAMME_VALUES,
  POPUP_REDUCED_MS,
  POPUP_REVEAL_FALLBACK_MS,
  POPUP_ROW_EASE,
  POPUP_ROW_MS,
  POPUP_ROW_STAGGER_MS,
  POPUP_ROW_START_MS,
} from "./popup-config";


export function ScrollPopupForm({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  /* `mounted` = present in the DOM. `visible` = in its open visual state.
     `entered` stays true through the exit, so rows leave with the card, not before it. */
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emri, setEmri] = useState("");
  const [mbiemri, setMbiemri] = useState("");
  const [drejtimi, setDrejtimi] = useState("");
  const [email, setEmail] = useState("");
  const [telefoni, setTelefoni] = useState("");

  /* A handle on the card element, so we can focus its first input on open. */
  const cardRef = useRef<HTMLDivElement>(null);

  /* ─── Mount first, animate second; on the way out, animate first, unmount second ─── */
  useEffect(() => {
    if (isOpen) {
      setMounted(true);                     // in the DOM, still in its closed look

      const reveal = () => {
        setVisible(true);
        setEntered(true);                                  // starts the row stagger
      };

      let second = 0;
      const first = requestAnimationFrame(() => {          // let the closed look paint once
        second = requestAnimationFrame(reveal);            // now flip: browser animates
      });

      /*
        The rAF pair is an OPTIMISATION, never the only way out — and that distinction is
        load-bearing here. A hidden tab (backgrounded, minimised, another window in front)
        is issued no frames at all by the browser, so neither callback ever runs. `mounted`
        would stay true with `visible` stuck false: a full-screen `z-[60]` overlay in the
        DOM at opacity 0, holding `body { overflow: hidden }`, swallowing every click and
        every attempt to focus a field ANYWHERE on the site — and surviving route changes,
        because this component lives in the app shell. The page looks alive and is
        completely inert. A timer is not throttled to a standstill the way rAF is, so it
        is the floor: whichever fires first reveals, the loser is cancelled, and calling
        `reveal` twice is a no-op because both setters write the value they already hold.
      */
      const fallback = window.setTimeout(reveal, POPUP_REVEAL_FALLBACK_MS);

      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
        window.clearTimeout(fallback);
      };
    }
    setVisible(false);                      // play the exit transition...
    const timer = window.setTimeout(() => {
      setMounted(false);                    // ...and only then leave the DOM
      setEntered(false);                    // rearm the stagger for the next open
    }, POPUP_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  /* An inline style cannot hold a media query, so the preference is read in JS. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* Escape closes. Kept separate because it depends on the parent's callback. */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* Scroll lock is its own effect: if it re-ran it would capture "hidden" as the
     value to restore, and the page would stay frozen forever. */
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  /* Focus waits on `mounted` — the card does not exist in the DOM before that. */
  useEffect(() => {
    if (!mounted) return;
    cardRef.current?.querySelector("input")?.focus();
  }, [mounted]);

  /* Reopening should ask again, not still be showing the thank-you screen. */
  useEffect(() => {
    if (isOpen) { setSent(false); setError(""); }
  }, [isOpen]);

  /**
   * Sends the lead to the SAME application form the "Apliko tani" band posts to
   * (APPLICATION_FORM_SLUG), so the popup is a second door onto one path rather than a
   * parallel one — an admin sees both in a single list.
   *
   * `sent` flips only after the POST resolves. A rejection leaves the card open with
   * every value still in it, so nothing has to be retyped.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();                     // stop the browser's default page reload
    // The button stays enabled, so a second Enter before the first POST settles would
    // otherwise send the lead twice.
    if (isSubmitting) return;

    if (!emri.trim() || !mbiemri.trim() || !drejtimi) {
      setError("Ju lutem plotësoni fushat e detyrueshme.");
      return;
    }
    // Email and phone are REQUIRED by the API — they become real Submission columns —
    // even though these two labels carry no asterisk. Checked here so the visitor gets an
    // Albanian sentence instead of a 400 from the server.
    if (!email.trim() || !telefoni.trim()) {
      setError("Email dhe numri i telefonit janë të detyrueshëm.");
      return;
    }
    if (!isValidPhone(telefoni)) {
      setError(PHONE_ERROR);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(APPLICATION_FORM_SLUG, {
        // One `name` column server-side, so the two inputs are joined for it.
        name: `${emri.trim()} ${mbiemri.trim()}`,
        email: email.trim(),
        phone: telefoni.trim(),
        // Mapped, not passed through: the dropdown's wording is not the option value.
        data: { programi: POPUP_PROGRAMME_VALUES[drejtimi] ?? drejtimi },
      });
      setSent(true);
    } catch (cause: unknown) {
      if (cause instanceof PublicApiError) {
        setError(
          cause.isValidation
            ? "Disa fusha nuk janë të vlefshme. Kontrollo të dhënat dhe provo përsëri."
            : cause.message,
        );
      } else {
        setError("Diçka shkoi keq. Provo përsëri.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;                // fully closed = nothing in the DOM

  /* Reduced motion: no travel, no scaling, no blur, no stagger — just a fade. */
  const enterMs = reduceMotion ? POPUP_REDUCED_MS : POPUP_ENTER_MS;
  const exitMs = reduceMotion ? POPUP_REDUCED_MS : POPUP_EXIT_MS;
  const blur = visible && !reduceMotion ? "blur(6px)" : "blur(0px)";

  const backdropStyle: React.CSSProperties = {
    transitionProperty: "opacity, backdrop-filter",
    transitionDuration: `${visible ? enterMs : exitMs}ms`,
    transitionTimingFunction: visible ? "ease-out" : "ease-in",
    backdropFilter: blur,                   // the one non-compositor property we animate
    WebkitBackdropFilter: blur,             // Safari still wants the prefix
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.n0,
    transitionProperty: "opacity, transform, scale, translate",
    transitionDuration: `${visible ? enterMs : exitMs}ms`,
    transitionTimingFunction: visible && !reduceMotion ? POPUP_ENTER_EASE : visible ? "ease-out" : "ease-in",
  };

  /* Two different resting looks: far away before arriving, close by when leaving. */
  const cardRest = reduceMotion
    ? "opacity-0"
    : entered
      ? "opacity-0 scale-[0.96] translate-y-2"
      : "opacity-0 scale-[0.9] translate-y-7";

  /* One formula instead of nine hand-written delays: row i waits 50ms longer than row i-1. */
  const rowStyle = (i: number): React.CSSProperties => ({
    transitionProperty: "opacity, transform, translate",
    transitionDuration: `${reduceMotion ? POPUP_REDUCED_MS : POPUP_ROW_MS}ms`,
    transitionTimingFunction: POPUP_ROW_EASE,
    transitionDelay: entered && !reduceMotion ? `${POPUP_ROW_START_MS + i * POPUP_ROW_STAGGER_MS}ms` : "0ms",
  });
  const rowClass = entered ? "opacity-100 translate-y-0" : `opacity-0 ${reduceMotion ? "" : "translate-y-3"}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      {/* Backdrop — sits behind the card and closes on click. */}
      <div
        className={`absolute inset-0 bg-black/50 ${visible ? "opacity-100" : "opacity-0"}`}
        style={backdropStyle}
        onClick={onClose}
      />

      <div
        ref={cardRef}
        className={`relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-7 shadow-2xl ${visible ? "opacity-100 scale-100 translate-y-0" : cardRest}`}
        /* Only compositor-friendly properties — never width/height/top/left. */
        style={cardStyle}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Mbyll"
          className="absolute right-4 top-4 transition-colors hover:opacity-70"
          style={{ color: C.n500 }}
        >
          <X size={20} />
        </button>

        {sent ? (
          /* Thank-you state: same card, different contents. */
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: C.brandLight, width: 56, height: 56 }}>
              <Check size={28} style={{ color: C.brand }} />
            </div>
            <h2 id="popup-title" className="text-xl font-bold mb-2" style={{ color: C.n900 }}>Faleminderit!</h2>
            <p className="text-sm mb-6" style={{ color: C.n600 }}>Aplikimi juaj u regjistrua. Do t'ju kontaktojmë së shpejti.</p>
            <PrimaryBtn onClick={onClose}>Mbyll</PrimaryBtn>
          </div>
        ) : (
          <>
            {/*
              Rows 0-8: same classes, only the delay inside rowStyle(i) differs. Row 0 was
              an "Apliko tani" overline; it is gone, and the remaining indices are left
              alone rather than shifted down — they only feed the stagger delay, so the
              entrance now begins one 50ms step later and nothing else changes.
            */}
            <h2 id="popup-title" className={`text-xl font-bold mb-1 ${rowClass}`} style={{ color: C.n900, ...rowStyle(1) }}>Fillo rrugëtimin tënd</h2>
            <p className={`text-sm mb-5 ${rowClass}`} style={{ color: C.n600, ...rowStyle(2) }}>Plotëso të dhënat dhe ekipi ynë të kontakton.</p>

            {/* noValidate: we run our own Albanian validation instead of the browser's. */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
              <div className={rowClass} style={rowStyle(3)}>
                <FormField label="Emri *" value={emri} onChange={setEmri} placeholder="Emri juaj" />
              </div>
              <div className={rowClass} style={rowStyle(4)}>
                <FormField label="Mbiemri *" value={mbiemri} onChange={setMbiemri} placeholder="Mbiemri juaj" />
              </div>

              {/* Own <select>: shared FormSelect hard-codes a different placeholder. */}
              <div className={rowClass} style={rowStyle(5)}>
                <label htmlFor="popup-drejtimi" className="block text-sm font-medium mb-1" style={{ color: C.n700 }}>Drejtimi *</label>
                <select
                  id="popup-drejtimi"
                  value={drejtimi}
                  onChange={(e) => setDrejtimi(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all appearance-none"
                  style={{ border: `1px solid ${C.n300}`, backgroundColor: C.n0, color: drejtimi ? C.n800 : C.n400, height: 52 }}
                  onFocus={(e) => (e.target.style.borderColor = C.brand)}
                  onBlur={(e) => (e.target.style.borderColor = C.n300)}
                >
                  <option value="" disabled>Zgjedh drejtimin</option>
                  {POPUP_DREJTIMET.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className={rowClass} style={rowStyle(6)}>
                <FormField label="Email" type="email" value={email} onChange={setEmail} placeholder="email@shembull.com" />
              </div>
              <div className={rowClass} style={rowStyle(7)}>
                <FormField label="Numri i telefonit" type="tel" value={telefoni} onChange={(v) => setTelefoni(sanitizePhone(v))} placeholder="+383 4X XXX XXX" />
              </div>

              {/* Renders only when `error` is a non-empty string. Not staggered:
                  it appears on submit, long after the entrance has finished. */}
              {error && <p className="text-sm" style={{ color: C.danger }}>{error}</p>}

              <div className={rowClass} style={rowStyle(8)}>
                <PrimaryBtn type="submit" className="w-full justify-center mt-1">{isSubmitting ? "Duke dërguar…" : "Apliko"}</PrimaryBtn>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
