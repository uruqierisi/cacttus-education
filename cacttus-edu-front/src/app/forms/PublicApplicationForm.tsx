import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  PublicApiError,
  getPublicForm,
  submitPublicForm,
  type PublicForm,
  type PublicFormField,
} from "../../marketing/lib/public-api";
import { PHONE_ERROR, isValidPhone, sanitizePhone } from "../lib/phone";
import { C } from "../theme";
import { PrimaryBtn, SecondaryBtn } from "../ui/buttons";
import { PublicFormFieldShell } from "./PublicFormFieldShell";
import {
  EMPTY_CONTACT,
  TEXT_INPUT_TYPES,
  blankAnswers,
  indexErrorDetails,
  isBlank,
  type AnswerValue,
} from "./answers";


/* ══════════════════════════════════════════
   PUBLIC APPLICATION FORM (light card)

   Used by the training detail page and by /forma/:slug. Fetches its own field
   definitions from the slug it is given, so a caller only has to know WHICH form.

   RELATIONSHIP TO `HorizontalApplicationBand`: both render the same dynamic field
   contract, but they are not one component with two skins. The band is a four-column
   strip inside a purple gradient on the home page; this is a single-column card on a
   white page. Merging them would mean a component whose every rule is conditional on a
   variant flag, which is harder to read than two focused ones.
══════════════════════════════════════════ */
export function PublicApplicationForm({
  slug,
  trainingId,
  title,
}: {
  slug: string;
  /** Provenance, set only by a training's detail page. */
  trainingId?: string;
  title?: string;
}) {
  const [form, setForm] = useState<PublicForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [website, setWebsite] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError("");

    getPublicForm(slug)
      .then((loaded) => {
        if (!active) return;
        setForm(loaded);
        setAnswers(blankAnswers(loaded.fields, ""));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(
          error instanceof PublicApiError && error.isNotFound
            ? "Kjo formë nuk është aktive për momentin."
            : "Forma nuk mund të ngarkohet për momentin.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, reloadKey]);

  const setAnswer = (name: string, value: AnswerValue) =>
    setAnswers((previous) => ({ ...previous, [name]: value }));

  const toggleMultiselect = (name: string, optionValue: string, checked: boolean) =>
    setAnswers((previous) => {
      const current = Array.isArray(previous[name]) ? (previous[name] as string[]) : [];
      return {
        ...previous,
        [name]: checked
          ? [...current, optionValue]
          : current.filter((value) => value !== optionValue),
      };
    });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || isSubmitting) return;

    const missing: Record<string, string> = {};
    if (!contact.name.trim()) missing.name = "Emri është i detyrueshëm.";
    if (!contact.email.trim()) missing.email = "Email-i është i detyrueshëm.";
    if (!contact.phone.trim()) missing.phone = "Numri i telefonit është i detyrueshëm.";
    else if (!isValidPhone(contact.phone)) missing.phone = PHONE_ERROR;
    for (const field of form.fields) {
      if (field.required && isBlank(answers[field.name] ?? "")) {
        missing[field.name] = `${field.label} është i detyrueshëm.`;
      } else if (field.type === "phone") {
        const answer = answers[field.name];
        if (typeof answer === "string" && answer.trim() && !isValidPhone(answer)) {
          missing[field.name] = PHONE_ERROR;
        }
      }
    }

    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      setSubmitError("Ju lutemi plotësoni fushat e detyrueshme.");
      return;
    }

    const data: Record<string, unknown> = {};
    for (const field of form.fields) {
      const value = answers[field.name];
      if (value === undefined || isBlank(value)) continue;
      data[field.name] = value;
    }

    setFieldErrors({});
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(form.slug, {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        data,
        website,
        // Omitted entirely when absent, so /forma/:slug keeps the original contract.
        ...(trainingId ? { trainingId } : {}),
      });

      setContact(EMPTY_CONTACT);
      setAnswers(blankAnswers(form.fields, ""));
      setWebsite("");
      setSubmitted(true);
    } catch (error: unknown) {
      if (error instanceof PublicApiError) {
        setFieldErrors(indexErrorDetails(error.details));
        setSubmitError(
          error.isValidation
            ? "Disa përgjigje nuk janë të vlefshme. Kontrollo fushat e shënuara."
            : error.message,
        );
      } else {
        setSubmitError("Diçka shkoi keq. Provo përsëri.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 52,
    borderRadius: 12,
    border: `1px solid ${C.n300}`,
    backgroundColor: C.n0,
    color: C.n900,
    padding: "0 16px",
    fontSize: 14,
    outline: "none",
  };
  const errorBorder: React.CSSProperties = { border: `1.5px solid ${C.danger}` };

  function renderField(field: PublicFormField) {
    const id = `f-${field.name}`;
    const value = answers[field.name];
    const style = fieldErrors[field.name] ? { ...inputStyle, ...errorBorder } : inputStyle;
    const shell = {
      name: field.name,
      label: field.label,
      required: field.required,
      helpText: field.helpText,
      error: fieldErrors[field.name],
    };

    if (field.type === "checkbox") {
      return (
        <PublicFormFieldShell key={field.name} {...shell}>
          <label htmlFor={id} className="inline-flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: C.n700 }}>
            <input
              id={id}
              type="checkbox"
              checked={value === true}
              onChange={(e) => setAnswer(field.name, e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: C.brand }}
            />
            {field.placeholder || "Po"}
          </label>
        </PublicFormFieldShell>
      );
    }

    if (field.type === "multiselect" || field.type === "radio") {
      const selected = Array.isArray(value) ? value : [];
      return (
        <PublicFormFieldShell key={field.name} {...shell}>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {field.options.map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm cursor-pointer" style={{ color: C.n700 }}>
                <input
                  type={field.type === "radio" ? "radio" : "checkbox"}
                  name={id}
                  /* Carried on the element, not just in the closure: without it the
                     rendered DOM has no value, which breaks native form semantics and
                     any assistive tech or test that selects an option by value. */
                  value={option.value}
                  checked={field.type === "radio" ? value === option.value : selected.includes(option.value)}
                  onChange={(e) =>
                    field.type === "radio"
                      ? setAnswer(field.name, option.value)
                      : toggleMultiselect(field.name, option.value, e.target.checked)
                  }
                  className="w-4 h-4"
                  style={{ accentColor: C.brand }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </PublicFormFieldShell>
      );
    }

    if (field.type === "select") {
      const selected = typeof value === "string" ? value : "";
      return (
        <PublicFormFieldShell key={field.name} {...shell}>
          <select
            id={id}
            value={selected}
            onChange={(e) => setAnswer(field.name, e.target.value)}
            style={{ ...style, color: selected ? C.n900 : C.n400 }}
          >
            <option value="">{field.placeholder || "Zgjidh..."}</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </PublicFormFieldShell>
      );
    }

    if (field.type === "textarea") {
      return (
        <PublicFormFieldShell key={field.name} {...shell}>
          <textarea
            id={id}
            rows={5}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(field.name, e.target.value)}
            placeholder={field.placeholder}
            style={{ ...style, height: "auto", padding: "14px 16px", resize: "vertical" }}
          />
        </PublicFormFieldShell>
      );
    }

    return (
      <PublicFormFieldShell key={field.name} {...shell}>
        <input
          id={id}
          type={TEXT_INPUT_TYPES[field.type] ?? "text"}
          value={typeof value === "string" ? value : ""}
          // An admin-defined `phone` question is validated server-side by the very same
          // rule as the built-in contact number, so it gets the same typing guard.
          onChange={(e) =>
            setAnswer(
              field.name,
              field.type === "phone" ? sanitizePhone(e.target.value) : e.target.value,
            )
          }
          placeholder={field.placeholder}
          style={style}
        />
      </PublicFormFieldShell>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl p-8" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }} aria-live="polite">
        <p className="text-sm" style={{ color: C.n500 }}>Duke ngarkuar formularin...</p>
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl animate-pulse" style={{ height: 52, backgroundColor: C.n100 }} />
          ))}
        </div>
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="rounded-2xl p-8" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }} role="alert">
        <p className="font-medium mb-1" style={{ color: C.n900 }}>{loadError}</p>
        <p className="text-sm mb-4" style={{ color: C.n500 }}>
          Na kontakto në +383 (0)38 600 237 ose provo përsëri.
        </p>
        <SecondaryBtn onClick={() => setReloadKey((k) => k + 1)}>Provo përsëri</SecondaryBtn>
      </div>
    );
  }

  /*
    TERMINAL by design — there is deliberately no way back to a blank form from here.
    A "send another" button on a success screen invites the same person to apply twice,
    and every accidental double-tap lands in the dashboard inbox as a lead an operator
    then has to recognise as a duplicate and dismiss. Someone who genuinely needs to
    apply a second time can reload the page; that is a deliberate act, not a stray click.
  */
  if (submitted) {
    return (
      <div className="rounded-2xl p-10 flex flex-col items-center text-center gap-3" style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.brandSoft }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: C.brand }}>
          <Check size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-bold" style={{ color: C.n900 }}>Faleminderit! Aplikimi u dërgua.</h3>
        <p className="text-sm" style={{ color: C.muted }}>Do të të kontaktojmë brenda 48 orëve.</p>
      </div>
    );
  }

  const sorted = [...form.fields].sort((a, b) => a.order - b.order);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl p-6 md:p-8"
      style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.n0 }}
    >
      <h3 className="text-xl font-bold mb-1" style={{ color: C.n900 }}>{title ?? form.title}</h3>
      <p className="text-sm mb-6" style={{ color: C.n500 }}>
        Plotëso të dhënat dhe stafi ynë do të të kontaktojë brenda 48 orëve.
      </p>

      <div className="flex flex-col gap-4">
        <PublicFormFieldShell name="name" label="Emri dhe mbiemri" required error={fieldErrors.name}>
          <input
            id="f-name"
            type="text"
            autoComplete="name"
            value={contact.name}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
            style={fieldErrors.name ? { ...inputStyle, ...errorBorder } : inputStyle}
          />
        </PublicFormFieldShell>
        <PublicFormFieldShell name="email" label="Email" required error={fieldErrors.email}>
          <input
            id="f-email"
            type="email"
            autoComplete="email"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            style={fieldErrors.email ? { ...inputStyle, ...errorBorder } : inputStyle}
          />
        </PublicFormFieldShell>
        <PublicFormFieldShell name="phone" label="Numri i telefonit" required error={fieldErrors.phone}>
          <input
            id="f-phone"
            type="tel"
            autoComplete="tel"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: sanitizePhone(e.target.value) })}
            style={fieldErrors.phone ? { ...inputStyle, ...errorBorder } : inputStyle}
          />
        </PublicFormFieldShell>

        {sorted.map(renderField)}
      </div>

      {/* Honeypot: off-screen, not tabbable, hidden from assistive tech. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      {submitError && (
        <p className="text-sm font-medium mt-4" style={{ color: C.danger }} role="alert">
          {submitError}
        </p>
      )}

      <div className="mt-6">
        <PrimaryBtn type="submit" className={isSubmitting ? "opacity-70" : ""}>
          {isSubmitting ? "Duke dërguar..." : "Dërgo aplikimin"}
        </PrimaryBtn>
        <p className="text-xs mt-3" style={{ color: C.n400 }}>
          Duke dërguar formularin, pranon kushtet e privatësisë.
        </p>
      </div>
    </form>
  );
}
