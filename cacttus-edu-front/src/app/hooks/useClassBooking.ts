import { useState } from "react";
import { PublicApiError, submitPublicForm } from "../../marketing/lib/public-api";
import { CLASS_BOOKING_FORM_SLUG } from "../../marketing/lib/forms.config";
import { PHONE_ERROR, isValidPhone } from "../lib/phone";


/**
 * Submit state and POST for the /biznese/klasa room booking band.
 *
 * A sibling of `useBusinessLead` rather than a parameter on it: this posts to a different
 * form (CLASS_BOOKING_FORM_SLUG) with a different answer shape, and folding both into one
 * hook would mean every caller passing a slug plus a field map to satisfy the other one.
 *
 * `klasa` is REQUIRED by the form, so it is validated here too — the visitor gets an
 * Albanian sentence instead of a 400 from the server.
 */
export function useClassBooking() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(
    contact: { name: string; email: string; phone: string },
    answers: { klasa: string; data_deshiruar: string; nr_personave: string; shenime: string },
  ) {
    if (isSubmitting) return;

    if (!answers.klasa) {
      setError("Ju lutemi zgjidhni klasën që doni të rezervoni.");
      return;
    }
    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      setError("Ju lutemi plotësoni emrin, email-in dhe numrin e telefonit.");
      return;
    }
    if (!isValidPhone(contact.phone)) {
      setError(PHONE_ERROR);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(CLASS_BOOKING_FORM_SLUG, {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        data: answers,
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
  }

  return { sent, error, isSubmitting, submit };
}
