import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { APPLICATION_FORM_SLUG } from "../../marketing/lib/forms.config";
import {
  PublicApiError,
  getPublicForm,
  submitPublicForm,
  type PublicForm,
  type PublicFormField,
} from "../../marketing/lib/public-api";
import { PHONE_ERROR, isValidPhone, sanitizePhone } from "../lib/phone";
import { C } from "../theme";
import { ApplyFieldShell } from "./ApplyFieldShell";
import {
  EMPTY_CONTACT,
  TEXT_INPUT_TYPES,
  blankAnswers,
  indexErrorDetails,
  isBlank,
  type AnswerValue,
} from "./answers";


export function HorizontalApplicationBand({ preselected = "" }: { preselected?: string }) {
  const [form, setForm] = useState<PublicForm | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  /** Bumped to re-run the fetch when the visitor presses "Provo përsëri". */
  const [reloadKey, setReloadKey] = useState(0);

  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  /** Anti-spam honeypot: hidden from humans, irresistible to bots. */
  const [website, setWebsite] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Ignore a resolution that lands after unmount or after a newer fetch started.
    let active = true;
    setIsLoading(true);
    setLoadError("");

    getPublicForm(APPLICATION_FORM_SLUG)
      .then((loaded) => {
        if (!active) return;
        setForm(loaded);
        setAnswers(blankAnswers(loaded.fields, preselected));
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message =
          error instanceof PublicApiError && error.isNotFound
            ? "Formulari i aplikimit nuk është aktiv për momentin."
            : "Formulari nuk mund të ngarkohet për momentin.";
        setLoadError(message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [preselected, reloadKey]);

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

  /**
   * Client-side required checks exist for fast feedback only — the server re-validates
   * every answer against the same field definitions and is the source of truth.
   */
  function findMissingRequired(): Record<string, string> {
    const missing: Record<string, string> = {};

    if (!contact.name.trim()) missing.name = "Emri është i detyrueshëm.";
    if (!contact.email.trim()) missing.email = "Email-i është i detyrueshëm.";
    if (!contact.phone.trim()) missing.phone = "Numri i telefonit është i detyrueshëm.";
    else if (!isValidPhone(contact.phone)) missing.phone = PHONE_ERROR;

    for (const field of form?.fields ?? []) {
      if (field.required && isBlank(answers[field.name] ?? "")) {
        missing[field.name] = `${field.label} është i detyrueshëm.`;
      } else if (field.type === "phone") {
        const answer = answers[field.name];
        if (typeof answer === "string" && answer.trim() && !isValidPhone(answer)) {
          missing[field.name] = PHONE_ERROR;
        }
      }
    }

    return missing;
  }

  /** Drop blanks so an untouched optional field is absent rather than an empty string. */
  function buildData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    for (const field of form?.fields ?? []) {
      const value = answers[field.name];
      if (value === undefined || isBlank(value)) continue;
      data[field.name] = value;
    }

    return data;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || isSubmitting) return;

    const missing = findMissingRequired();

    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      setSubmitError("Ju lutemi plotësoni fushat e detyrueshme.");
      return;
    }

    setFieldErrors({});
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(form.slug, {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        data: buildData(),
        website,
      });

      setContact(EMPTY_CONTACT);
      setAnswers(blankAnswers(form.fields, preselected));
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
    height: 52,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.3)",
    backgroundColor: "#fff",
    color: C.n900,
    padding: "0 16px",
    fontSize: 14,
    outline: "none",
    width: "100%",
  };

  const errorStyle: React.CSSProperties = { border: "1.5px solid #FFD9D9" };

  function renderField(field: PublicFormField) {
    const id = `apliko-${field.name}`;
    const invalid = Boolean(fieldErrors[field.name]);
    const style = invalid ? { ...inputStyle, ...errorStyle } : inputStyle;
    const value = answers[field.name];

    if (field.type === "checkbox") {
      return (
        <ApplyFieldShell
          key={field.name}
          name={field.name}
          label={field.label}
          required={field.required}
          helpText={field.helpText}
          error={fieldErrors[field.name]}
          wide
        >
          <label
            htmlFor={id}
            className="inline-flex items-center gap-2.5 text-sm text-white cursor-pointer"
          >
            <input
              id={id}
              type="checkbox"
              checked={value === true}
              onChange={(e) => setAnswer(field.name, e.target.checked)}
              className="w-4 h-4 rounded accent-white"
            />
            <span className="text-white/85">{field.placeholder || "Po"}</span>
          </label>
        </ApplyFieldShell>
      );
    }

    if (field.type === "multiselect") {
      const selected = Array.isArray(value) ? value : [];
      return (
        <ApplyFieldShell
          key={field.name}
          name={field.name}
          label={field.label}
          required={field.required}
          helpText={field.helpText}
          error={fieldErrors[field.name]}
          wide
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {field.options.map((option) => (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 text-sm text-white/85 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={(e) => toggleMultiselect(field.name, option.value, e.target.checked)}
                  className="w-4 h-4 rounded accent-white"
                />
                {option.label}
              </label>
            ))}
          </div>
        </ApplyFieldShell>
      );
    }

    if (field.type === "radio") {
      return (
        <ApplyFieldShell
          key={field.name}
          name={field.name}
          label={field.label}
          required={field.required}
          helpText={field.helpText}
          error={fieldErrors[field.name]}
          wide
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {field.options.map((option) => (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 text-sm text-white/85 cursor-pointer"
              >
                <input
                  type="radio"
                  name={id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => setAnswer(field.name, e.target.value)}
                  className="w-4 h-4 accent-white"
                />
                {option.label}
              </label>
            ))}
          </div>
        </ApplyFieldShell>
      );
    }

    if (field.type === "select") {
      const selected = typeof value === "string" ? value : "";
      return (
        <ApplyFieldShell
          key={field.name}
          name={field.name}
          label={field.label}
          required={field.required}
          helpText={field.helpText}
          error={fieldErrors[field.name]}
        >
          <select
            id={id}
            value={selected}
            onChange={(e) => setAnswer(field.name, e.target.value)}
            style={{ ...style, color: selected ? C.n900 : "#999", appearance: "none" }}
          >
            <option value="">{field.placeholder || "Zgjidh..."}</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </ApplyFieldShell>
      );
    }

    if (field.type === "textarea") {
      return (
        <ApplyFieldShell
          key={field.name}
          name={field.name}
          label={field.label}
          required={field.required}
          helpText={field.helpText}
          error={fieldErrors[field.name]}
          wide
        >
          <textarea
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            style={{ ...style, height: "auto", padding: "14px 16px", resize: "vertical" }}
          />
        </ApplyFieldShell>
      );
    }

    return (
      <ApplyFieldShell
        key={field.name}
        name={field.name}
        label={field.label}
        required={field.required}
        helpText={field.helpText}
        error={fieldErrors[field.name]}
      >
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
      </ApplyFieldShell>
    );
  }

  function renderContactField(
    name: "name" | "email" | "phone",
    label: string,
    type: string,
    placeholder: string,
  ) {
    const invalid = Boolean(fieldErrors[name]);
    return (
      <ApplyFieldShell name={name} label={label} required error={fieldErrors[name]}>
        <input
          id={`apliko-${name}`}
          type={type}
          value={contact[name]}
          onChange={(e) =>
            setContact({
              ...contact,
              [name]: name === "phone" ? sanitizePhone(e.target.value) : e.target.value,
            })
          }
          placeholder={placeholder}
          autoComplete={name === "name" ? "name" : name === "email" ? "email" : "tel"}
          style={invalid ? { ...inputStyle, ...errorStyle } : inputStyle}
        />
      </ApplyFieldShell>
    );
  }

  const sortedFields = [...(form?.fields ?? [])].sort((a, b) => a.order - b.order);

  return (
    <section id="apliko" className="py-16">
      <div className="max-w-[1400px] mx-auto px-5">
        <div
          className="rounded-3xl px-10 md:px-16 py-14"
          style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}
        >
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20"><Check size={28} className="text-white" /></div>
              <h3 className="text-2xl font-bold text-white">Faleminderit! Aplikimi u dërgua.</h3>
              <p className="text-white/70">Do të të kontaktojmë brenda 48 orëve.</p>
              <button onClick={() => setSubmitted(false)} className="mt-2 px-6 py-2 rounded-full text-sm font-semibold text-white" style={{ border: "1.5px solid rgba(255,255,255,0.6)" }}>Mbyll</button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">
              {/* Left */}
              <div className="lg:w-[32%] shrink-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                  {form?.title || "Fillo rrugëtimin tënd sot"}
                </h2>
                <p className="text-white/70 text-sm">Apliko tani dhe stafi ynë do të të kontaktojë brenda 48 orëve.</p>
              </div>

              {/* Right — inputs, rendered from the form configured in the dashboard */}
              <div className="flex-1 w-full">
                {isLoading && (
                  <div className="flex flex-col gap-3" aria-live="polite">
                    <p className="text-white/70 text-sm">Duke ngarkuar formularin...</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="rounded-xl bg-white/20 animate-pulse" style={{ height: 52 }} />
                      ))}
                    </div>
                  </div>
                )}

                {!isLoading && loadError && (
                  <div className="flex flex-col items-start gap-3" role="alert">
                    <p className="text-white font-medium">{loadError}</p>
                    <p className="text-white/60 text-sm">
                      Na kontakto në <span className="font-medium text-white/80">+383 (0)38 600 237</span> ose provo përsëri.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReloadKey((key) => key + 1)}
                      className="px-6 py-2 rounded-full text-sm font-semibold text-white transition-all hover:bg-white/10"
                      style={{ border: "1.5px solid rgba(255,255,255,0.6)" }}
                    >
                      Provo përsëri
                    </button>
                  </div>
                )}

                {!isLoading && !loadError && form && (
                  <form onSubmit={handleSubmit} noValidate>
                    {/*
                      The submit button is a CELL of this grid, not a row beneath it, so it
                      lands beside Telefoni on a wide screen and wraps with the fields on a
                      narrow one — one set of breakpoints governs the whole row.

                      `items-start` and the spacer above the button are what line it up.
                      Every field cell is label-then-input; the button has no label, so
                      without a stand-in for one it would ride up to the labels' line. A
                      spacer with the label's exact box (`text-xs` + `mb-1.5`) reserves that
                      height, which is steadier than bottom-aligning the row: a validation
                      message appearing under one field grows that cell, and an `items-end`
                      button would slide down with it.
                    */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-start mb-3">
                      {renderContactField("name", "Emri dhe mbiemri", "text", "Emri dhe mbiemri")}
                      {renderContactField("email", "Email", "email", "Email-i juaj")}
                      {renderContactField("phone", "Telefoni", "tel", "Numri i telefonit")}
                      {sortedFields.map(renderField)}

                      <div className="flex flex-col">
                        <span aria-hidden="true" className="hidden md:block text-xs font-medium mb-1.5 invisible">
                          &nbsp;
                        </span>
                        {/*
                          On hover the button dissolves INTO the panel it sits on: white
                          fill → the panel's own brand purple, purple label → white. The
                          border is what keeps it from disappearing altogether at that
                          point — without it the shape would simply stop existing against
                          an identical background. 300ms so it reads as a blend rather
                          than a flick, and `brightness-110` is gone: brightening a colour
                          that is mid-transition fights the transition.
                        */}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full px-8 font-semibold text-sm rounded-xl transition-colors duration-300 ease-out active:scale-95 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
                          style={{
                            height: 52,
                            backgroundColor: "#fff",
                            color: C.brand,
                            border: "1.5px solid #fff",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = C.brand;
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#fff";
                            e.currentTarget.style.color = C.brand;
                          }}
                        >
                          {isSubmitting ? "Duke dërguar..." : "Apliko këtu"}
                        </button>
                      </div>
                    </div>

                    {/* Honeypot: off-screen, not tabbable, invisible to assistive tech. */}
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
                      <p className="text-sm font-medium mb-3" style={{ color: "#FFD9D9" }} role="alert">
                        {submitError}
                      </p>
                    )}

                    {/*
                      Left on its own line now that the button has moved up into the grid.
                      Trying to keep it beside the button would put a paragraph of text in
                      a quarter-width cell; full width under the row reads far better and
                      needs no breakpoint of its own.
                    */}
                    <p className="text-white/50 text-xs">
                      Duke dërguar formularin, pranon kushtet e privatësisë. Do të kontaktohesh brenda 48 orëve.
                    </p>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
