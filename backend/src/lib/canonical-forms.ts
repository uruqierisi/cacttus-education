/**
 * The three marketing forms whose SLUGS AND FIELD KEYS ARE COMPILED INTO THE SITE.
 *
 * `/kontakti`, `/biznese/trajnime`, `/biznese/talente` and `/biznese/klasa` are
 * hand-built React, not rendered from a form definition, so these records are the
 * server-side half of a contract the client already assumes. Without them every one of
 * those pages 404s the moment a visitor presses submit. Slugs and option values are
 * mirrored in `cacttus-edu-front/src/marketing/lib/forms.config.ts`.
 *
 * WHY THIS LIVES IN src/ AND NOT IN prisma/. It first shipped inside `prisma/seed.ts`,
 * which meant it only ever ran when somebody typed `npm run db:seed` — production does
 * not, so production never got the forms. `tsc -p tsconfig.json` compiles `src/**` and
 * nothing else, so a module outside src is absent from `dist/` and unreachable from the
 * compiled server no matter who calls it. Anything the RUNTIME needs belongs here.
 *
 * NOT the application forms. `aplikim-zhvam` and `aplikim-siguria-kibernetike` are
 * editorial content staff own — the apply band renders whatever fields they declare — so
 * creating them from code would fight the dashboard rather than support it.
 *
 * EXISTENCE ONLY. If a slug is already present the record is left completely alone: no
 * field sync, no `isActive` flip, no `updatedAt` bump. Staff customise these — adding a
 * question to `kontakt-biznesi` is a supported thing to do — and a routine that
 * "restored" the canonical shape on every boot would silently undo their work. That is
 * also why this reads and creates rather than calling `upsert` with an empty update:
 * Prisma stamps `@updatedAt` on any update it issues, so even a no-op upsert would
 * rewrite the row and make an untouched form look edited.
 */
import { FormType, Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { logger } from './logger';

const LOG_PREFIX = '[canonical-forms]';

type CanonicalField = {
  readonly name: string;
  readonly label: string;
  readonly type: string;
  readonly required: boolean;
  readonly placeholder: string;
  readonly helpText: string;
  readonly order: number;
  readonly options: readonly { readonly value: string; readonly label: string }[];
};

type CanonicalForm = {
  readonly slug: string;
  readonly title: string;
  readonly type: FormType;
  readonly isActive: boolean;
  readonly fields: readonly CanonicalField[];
};

/**
 * Shape a field the way the dashboard's form editor emits one, so a created form opens
 * in that editor with nothing missing. `createEmptyField` there sets `placeholder` and
 * `helpText` to empty strings and `order` to the array index — both reproduced here, and
 * `order` is 0-based for the same reason: the editor re-stamps it from array position
 * whenever a field is moved or deleted.
 */
function field(
  order: number,
  name: string,
  label: string,
  type: string,
  required: boolean,
  options: readonly string[] = [],
): CanonicalField {
  return {
    name,
    label,
    type,
    required,
    placeholder: '',
    helpText: '',
    order,
    // The marketing pages send the VALUE, and for these three the value IS the label —
    // `BUSINESS_REQUEST_TYPES` and `CLASS_BOOKING_ROOMS` are literal display strings, so
    // splitting them would mean two things to keep in step instead of one.
    options: options.map((option) => ({ value: option, label: option })),
  };
}

export const CANONICAL_FORMS: readonly CanonicalForm[] = [
  {
    slug: 'kontakt',
    title: 'Kontakt',
    type: FormType.SCHOOL,
    isActive: true,
    fields: [
      field(0, 'subjekti', 'Subjekti', 'text', true),
      field(1, 'mesazhi', 'Mesazhi', 'textarea', true),
    ],
  },
  {
    slug: 'kontakt-biznesi',
    title: 'Kontakt biznesi',
    type: FormType.SCHOOL,
    isActive: true,
    fields: [
      // One form serves every /biznese lead box; `tipi_kerkeses` is what tells them apart
      // in the inbox. Its options must equal `BUSINESS_REQUEST_TYPES` exactly — the pages
      // send those strings and the server validates a select answer against the option
      // values character for character.
      field(0, 'tipi_kerkeses', 'Tipi i kërkesës', 'select', true, [
        'Trajnime të personalizuara',
        'Partneritet / Punëdhënës',
        'Rezervim klase',
      ]),
      // OPTIONAL, and that is the point: no single page sends both. /biznese/trajnime
      // sends `kompania`, /biznese/talente sends `kompania` and `fusha_interesit`. A key
      // the form does not DECLARE is dropped server-side, so an undeclared answer would
      // vanish silently rather than fail loudly — declaring them optional is what keeps
      // each page's data.
      field(1, 'kompania', 'Kompania', 'text', false),
      field(2, 'fusha_interesit', 'Fusha e interesit', 'text', false),
    ],
  },
  {
    slug: 'rezervo-klase',
    title: 'Rezervo klasë',
    type: FormType.SCHOOL,
    isActive: true,
    fields: [
      // Must equal `CLASS_BOOKING_ROOMS` byte for byte, diacritics included: the room
      // card's button sends the string straight through as the select answer.
      field(0, 'klasa', 'Klasa', 'select', true, [
        'Klasa Portokalli',
        'Klasa Rozë',
        'Klasa e verdhë',
        'Klasa e gjelbër',
        'Klasa e kuqe',
        'Hapsira e përbashkët',
      ]),
      field(1, 'data_deshiruar', 'Data e dëshiruar', 'text', true),
      field(2, 'nr_personave', 'Numri i personave', 'text', true),
      field(3, 'shenime', 'Shënime', 'textarea', false),
    ],
  },
];

/** Postgres unique-constraint violation, as Prisma reports it. */
const UNIQUE_VIOLATION = 'P2002';

async function ensureForm(form: CanonicalForm): Promise<void> {
  const existing = await prisma.form.findUnique({
    where: { slug: form.slug },
    select: { id: true, isActive: true, deletedAt: true },
  });

  if (existing) {
    logger.info(`${LOG_PREFIX} ${form.slug} exists, skipped`);

    /*
     * Not a modification — a warning. This routine guarantees the ROW exists; it does
     * not guarantee the form is REACHABLE, and the public endpoint serves neither a
     * soft-deleted nor an inactive form. Staying silent here would hide exactly the
     * outage this module exists to prevent.
     */
    if (existing.deletedAt !== null) {
      logger.warn(`${LOG_PREFIX} ${form.slug} is soft-deleted — the public endpoint will 404 it`);
    } else if (!existing.isActive) {
      logger.warn(`${LOG_PREFIX} ${form.slug} is inactive — the public endpoint will 404 it`);
    }
    return;
  }

  try {
    await prisma.form.create({
      data: {
        slug: form.slug,
        title: form.title,
        type: form.type,
        isActive: form.isActive,
        fields: form.fields as unknown as Prisma.InputJsonValue,
      },
    });
    logger.info(`${LOG_PREFIX} ${form.slug} created`);
  } catch (error: unknown) {
    /*
     * Two replicas booting together both see "absent" and both create. One wins, the
     * other gets a unique violation on `slug` — which means the row now exists, which is
     * the outcome this function is for. Anything else is a real failure and rethrows.
     */
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION) {
      logger.info(`${LOG_PREFIX} ${form.slug} created concurrently by another instance`);
      return;
    }
    throw error;
  }
}

/**
 * Ensure all three exist. Called from the process entry point before the port is bound,
 * and from the seed.
 *
 * DOES NOT THROW. An unreachable database at boot is a transient condition the platform
 * retries on its own, and killing the process over it turns a thirty-second blip into a
 * crash loop — while the API itself has plenty it can still answer once the database
 * returns. The failure is logged at error level with this module's prefix, never
 * swallowed: the whole reason this code exists is that a silent absence went unnoticed.
 */
export async function upsertCanonicalForms(): Promise<void> {
  try {
    for (const form of CANONICAL_FORMS) {
      await ensureForm(form);
    }
  } catch (error: unknown) {
    logger.error(`${LOG_PREFIX} could not ensure the canonical forms`, {
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}
