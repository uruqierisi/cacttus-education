/**
 * Renders a submission's `data` JSON as a readable Albanian answer sheet.
 *
 * The blob is keyed by `FormFieldDefinition.name` — machine keys like `data_lindjes` —
 * so when the parent has the form's field definitions they are used to recover the
 * real question text and the original field ORDER. Without them the key is humanised
 * as a fallback, which is still far better than dumping raw JSON at an admin.
 *
 * Answers whose key no longer exists on the form are still shown, listed after the
 * known ones: a question removed from a form last month must not silently erase the
 * answers people already gave to it.
 */
import { useMemo } from 'react';
import { humanizeKey } from '@/lib/format';
import type { FieldDefinition } from '@/api/types';

const EM_DASH = '—';

/** Render any JSON answer value as readable text. */
export function renderAnswer(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return EM_DASH;
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? EM_DASH : value.map(String).join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Po' : 'Jo';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

type AnswerRow = {
  readonly key: string;
  readonly label: string;
  readonly value: string;
};

function buildRows(
  data: Record<string, unknown>,
  fields: readonly FieldDefinition[],
): readonly AnswerRow[] {
  const entries = Object.entries(data);
  const byName = new Map(entries);

  // Known fields first, in the order the form defines them.
  const known = [...fields]
    .sort((a, b) => a.order - b.order)
    .filter((field) => byName.has(field.name))
    .map((field) => ({
      key: field.name,
      label: field.label || humanizeKey(field.name),
      value: renderAnswer(byName.get(field.name)),
    }));

  const knownKeys = new Set(known.map((row) => row.key));

  // Then anything the form no longer asks — kept, never dropped.
  const orphaned = entries
    .filter(([key]) => !knownKeys.has(key))
    .map(([key, value]) => ({
      key,
      label: humanizeKey(key),
      value: renderAnswer(value),
    }));

  return [...known, ...orphaned];
}

export function AnswerList({
  data,
  fields = [],
  emptyLabel = 'Kjo formë ka mbledhur vetëm të dhënat e kontaktit.',
}: {
  readonly data: Record<string, unknown>;
  readonly fields?: readonly FieldDefinition[];
  readonly emptyLabel?: string;
}): JSX.Element {
  const rows = useMemo(() => buildRows(data, fields), [data, fields]);

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <dl className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.key} className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-muted-foreground">{row.label}</dt>
          <dd className="whitespace-pre-wrap break-words text-sm sm:col-span-2">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
