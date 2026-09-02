import { useState } from "react";
import { PublicApiError, submitPublicForm } from "../../marketing/lib/public-api";
import { BUSINESS_FORM_SLUG } from "../../marketing/lib/forms.config";
import { PHONE_ERROR, isValidPhone } from "../lib/phone";


/* ══════════════════════════════════════════
   PART 5 — CUSTOM BIZNESE SUBPAGES
══════════════════════════════════════════ */

/* ── 5.1 TRAJNIME TË PERSONALIZUARA ── */
/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
/**
 * Submit state and POST for the /biznese lead boxes.
 *
 * The three boxes ask for different things but do the same job, so the transport,
 * validation and error wording live here once. `requestType` is the ONLY thing that
 * differs at the API level: it becomes `tipi_kerkeses`, which is how the inbox tells a
 * trainings enquiry from a partnership one from a room booking.
 *
 * `extra` holds that page's optional answers. Empty ones are sent as-is and dropped
 * server-side (an unanswered optional field is simply absent from the stored data), so a
 * caller does not have to prune them.
 */
export function useBusinessLead(requestType: string) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(
    contact: { name: string; email: string; phone: string },
    extra: Record<string, string>,
  ) {
    // The buttons stay enabled, so a double click would otherwise send the lead twice.
    if (isSubmitting) return;

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
      await submitPublicForm(BUSINESS_FORM_SLUG, {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        data: { tipi_kerkeses: requestType, ...extra },
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
