/**
 * "Pikat e Forta" — the training detail page's bullet list.
 *
 * Same shape and same conventions as `forms/field-list-editor.tsx`: fully controlled,
 * every mutation returns a NEW array so the parent's dirty tracking stays honest, and
 * reordering is move-up / move-down BUTTONS rather than drag-and-drop — keyboard
 * reachable, screen-reader operable, touch friendly, no extra dependency.
 *
 * Simpler than the field editor in one way that matters: a strength is a plain string,
 * not a record. There is no machine name, no type and no options, so it is a list of
 * text inputs rather than a list of cards.
 */
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Matches `MAX_STRENGTHS` in the API's training schema. */
const MAX_STRENGTHS = 20;
/** Matches `MAX_STRENGTH_LENGTH`. */
const MAX_LENGTH = 300;

type StrengthListEditorProps = {
  readonly strengths: readonly string[];
  readonly onChange: (strengths: readonly string[]) => void;
  readonly disabled?: boolean;
};

function replaceAt(list: readonly string[], index: number, value: string): string[] {
  return list.map((item, position) => (position === index ? value : item));
}

function swap(list: readonly string[], a: number, b: number): string[] {
  const first = list[a];
  const second = list[b];

  if (first === undefined || second === undefined) {
    return [...list];
  }

  return list.map((item, index) => {
    if (index === a) {
      return second;
    }
    if (index === b) {
      return first;
    }
    return item;
  });
}

export function StrengthListEditor({
  strengths,
  onChange,
  disabled = false,
}: StrengthListEditorProps): JSX.Element {
  const move = (index: number, direction: -1 | 1): void => {
    const target = index + direction;
    if (target < 0 || target >= strengths.length) {
      return;
    }
    onChange(swap(strengths, index, target));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Pikat e Forta</h3>
          <p className="text-sm text-muted-foreground">
            Shfaqen si listë në faqen e trajnimit. Lëri bosh nëse nuk të duhen.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || strengths.length >= MAX_STRENGTHS}
          onClick={() => onChange([...strengths, ''])}
        >
          <Plus />
          Shto pikë
        </Button>
      </div>

      {strengths.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Asnjë pikë e fortë. Kjo pjesë nuk do të shfaqet fare në faqen e trajnimit.
        </p>
      ) : null}

      {strengths.map((strength, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={strength}
            maxLength={MAX_LENGTH}
            disabled={disabled}
            placeholder="p.sh. Laborator praktik me raste reale"
            aria-label={`Pika e fortë ${index + 1}`}
            onChange={(event) => onChange(replaceAt(strengths, index, event.target.value))}
          />
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Zhvendos pikën ${index + 1} lart`}
              disabled={disabled || index === 0}
              onClick={() => move(index, -1)}
            >
              <ChevronUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Zhvendos pikën ${index + 1} poshtë`}
              disabled={disabled || index === strengths.length - 1}
              onClick={() => move(index, 1)}
            >
              <ChevronDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Hiq pikën ${index + 1}`}
              disabled={disabled}
              onClick={() => onChange(strengths.filter((_, position) => position !== index))}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
