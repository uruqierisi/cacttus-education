import { usePageMeta } from "../hooks/usePageMeta";
import React, { useState } from "react";
import { Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import { CONTACT_FORM_SLUG } from "../../marketing/lib/forms.config";
import { PublicApiError, submitPublicForm } from "../../marketing/lib/public-api";
import { CONTACT_SOCIALS } from "../data/socials";
import { PHONE_ERROR, isValidPhone, sanitizePhone } from "../lib/phone";
import { C } from "../theme";
import { FormField, FormSelect } from "../ui/FormField";
import { PageWrapper } from "../ui/PageWrapper";
import { PrimaryBtn } from "../ui/buttons";


export function PageKontakti() {
  usePageMeta(
    "Kontakti — Cacttus Education",
    "Na shkruaj ose na vizito — jemi këtu për çdo pyetje rreth studimeve dhe trajnimeve. Do të të përgjigjemi sa më shpejt.",
  );
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ emri: "", email: "", telefon: "", subjekti: "", mesazhi: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Posts to the generic form engine every other public form on this site already uses.
   *
   * This page does NOT render the form's fields from the API the way the application
   * band does — its inputs are laid out by hand, and only the SUBMIT travels through
   * `submitPublicForm`. The consequence is that the `data` keys below are a contract
   * with the form record's field names, not something the server infers: it drops any
   * key the form does not declare, so a rename in the dashboard silently empties the
   * message unless CONTACT_FORM_SLUG's fields are renamed to match.
   *
   * `submitted` flips only after the POST resolves. A rejection leaves the form on
   * screen with every value still in it, so nothing has to be retyped.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // The button stays enabled, so a second Enter press before the first POST settles
    // would otherwise send the message twice.
    if (isSubmitting) return;

    if (!form.emri.trim() || !form.email.trim() || !form.telefon.trim() || !form.subjekti || !form.mesazhi.trim()) {
      setError("Ju lutemi plotësoni të gjitha fushat.");
      return;
    }
    if (!isValidPhone(form.telefon)) {
      setError(PHONE_ERROR);
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(CONTACT_FORM_SLUG, {
        // name/email/phone are promoted to real Submission columns server-side; every
        // other answer travels in `data`, keyed by the form's field names.
        name: form.emri.trim(),
        email: form.email.trim(),
        phone: form.telefon.trim(),
        data: { subjekti: form.subjekti, mesazhi: form.mesazhi.trim() },
      });
      setSubmitted(true);
    } catch (cause: unknown) {
      // Same branches as the application band, so both forms fail the same way.
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

  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Kontakti</h1>
          <p className="text-lg" style={{ color: C.muted }}>Na shkruaj ose na vizito — jemi këtu për çdo pyetje rreth studimeve dhe trajnimeve.</p>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-8">
            <div className="p-8 rounded-2xl" style={{ backgroundColor: C.n0, boxShadow: "0 4px 12px rgba(45,22,55,0.08)", border: `1px solid ${C.n200}` }}>
              <h3 className="text-xl font-semibold mb-6" style={{ color: C.n900 }}>Na dërgo mesazh</h3>
              {submitted ? (
                <div className="flex flex-col items-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: C.brandLight }}><Check size={32} style={{ color: C.brand }} /></div>
                  <h3 className="text-xl font-bold" style={{ color: C.n900 }}>Mesazhi u dërgua.</h3>
                  <p style={{ color: C.n500 }}>Do të të përgjigjemi sa më shpejt.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <FormField label="Emri dhe mbiemri" type="text" value={form.emri} onChange={(v) => setForm({ ...form, emri: v })} />
                  <FormField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                  <FormField label="Numri i telefonit" type="tel" value={form.telefon} onChange={(v) => setForm({ ...form, telefon: sanitizePhone(v) })} />
                  <FormSelect label="Subjekti" value={form.subjekti} onChange={(v) => setForm({ ...form, subjekti: v })} options={["Studime profesionale", "Trajnime profesionale", "Për biznese", "Tjetër"]} />
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: C.n700 }}>Mesazhi</label>
                    <textarea rows={5} value={form.mesazhi} onChange={(e) => setForm({ ...form, mesazhi: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none" style={{ border: `1px solid ${C.n300}`, backgroundColor: C.n0, color: C.n800 }} onFocus={(e) => (e.target.style.borderColor = C.brand)} onBlur={(e) => (e.target.style.borderColor = C.n300)} />
                  </div>
                  {error && <p className="text-sm font-medium" style={{ color: "#D64545" }}>{error}</p>}
                  <PrimaryBtn type="submit">{isSubmitting ? "Duke dërguar…" : "Dërgo mesazhin"}</PrimaryBtn>
                </form>
              )}
            </div>
            <div className="p-8 rounded-2xl flex flex-col gap-5" style={{ backgroundColor: C.brandSoft, border: `1px solid ${C.cardBorder}` }}>
              <h3 className="text-xl font-semibold mb-2" style={{ color: C.n900 }}>Të dhënat e kontaktit</h3>
              {[[MapPin, "Rr. Bashkim Fehmiu, Arbëria 3, BC2/14 nr.4"], [MapPin, "10000 Prishtinë, Kosovë"], [Phone, "+383 (0)38 600 237"], [Mail, "info@cacttus.education"], [Clock, "E hënë – E premte, 09:00 – 17:00"]].map(([Icon, text], i) => (
                <div key={i} className="flex items-start gap-3"><Icon size={18} className="mt-0.5 shrink-0" style={{ color: C.brand }} /><span className="text-sm" style={{ color: C.n700 }}>{text as string}</span></div>
              ))}
              <div className="mt-4">
                <p className="text-sm font-semibold mb-3" style={{ color: C.n700 }}>Na ndiq</p>
                <div className="flex gap-3">
                  {CONTACT_SOCIALS.map(({ Icon, label, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }}><Icon size={16} style={{ color: C.n600 }} /></a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/*
            `overflow-hidden` is the one class added to this box: the grey placeholder it
            replaced had nothing square inside it, so `rounded-2xl` alone was enough. An
            iframe is a rectangle that would otherwise poke through the rounded corners.

            Keyless `/maps/embed?pb=…`, NOT the Embed API — nothing here can expire or
            leak, and no billing account is involved.

            THE LONG `pb` IS LOAD-BEARING. Two shorter spellings look equivalent and are
            not: `maps.google.com/maps?q=<address>&output=embed` 301-redirects to a
            MINIMAL pb (`!1m3!2m1!1s<query>!6i16`), and that minimal form renders nothing
            but Google's grey "Open in Maps" fallback — verified in-browser, twice. The
            full viewport pb below draws real tiles. If this ever needs repointing, take
            the string from Google Maps' own Share → "Embed a map" dialog rather than
            hand-shortening it.

            Coordinates and place id are the real ones behind the address, resolved from
            the office's Maps short link: 42.6570015, 21.147896 / place "Cacttus".

            `border: 0` rather than a `frameBorder` attribute, which is not valid React.
          */}
          <div className="mt-10 aspect-video rounded-2xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: C.n100 }}>
            <iframe
              title="Harta — Cacttus Education, Rr. Bashkim Fehmiu, Arbëria 3, Prishtinë"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2939.5!2d21.147896!3d42.6570015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13549edd669de99b%3A0x3e37c39c9f671dd5!2sCacttus!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: 0, display: "block" }}
            />
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
