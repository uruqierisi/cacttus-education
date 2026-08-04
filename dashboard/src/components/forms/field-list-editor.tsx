/**
 * Editor for a form's `fields` JSON array — the dynamic form builder.
 *
 * Fully controlled and immutable: every mutation returns a new array, which keeps the
 * parent's dirty tracking honest and avoids the stale-render bugs that come with
 * editing nested arrays in place.
 *
 * REORDERING IS BUTTONS, NOT DRAG-AND-DROP. Deliberate: move-up / move-down works with
 * a keyboard, works with a screen reader, works on a touch screen without a long-press,
 * and needs no extra dependency. A drag handle would look more modern and would exclude
 * every one of those users from reordering a form at all.
 */
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CHOICE_FIELD_TYPES,
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  type FieldType,
} from '@/lib/constants';
import { slugify } from '@/lib/format';
import type { FieldDefinition, FieldOption } from '@/api/types';

/** Matches the API's `FIELD_LIMITS.FORM_FIELDS_MAX`. */
const MAX_FIELDS = 60;

type FieldListEditorProps = {
  readonly fields: readonly FieldDefinition[];
  readonly onChange: (fields: readonly FieldDefinition[]) => void;
};

function createEmptyField(order: number): FieldDefinition {
  return {
    name: `fusha_${order + 1}`,
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    helpText: '',
    order,
    options: [],
  };
}

/** The API requires snake_case keys; convert whatever the admin types. */
function toFieldName(raw: string): string {
  return slugify(raw).replace(/-/g, '_').replace(/^[^a-z]+/, '') || 'fusha';
}

function replaceAt<T>(list: readonly T[], index: number, value: T): T[] {
  return list.map((item, position) => (position === index ? value : item));
}

function swap<T>(list: readonly T[], a: number, b: number): T[] {
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

/** Re-stamp `order` so it always matches array position after a move or delete. */
function reindex(list: readonly FieldDefinition[]): FieldDefinition[] {
  return list.map((field, index) => ({ ...field, order: index }));
}

function OptionEditor({
  fieldIndex,
  options,
  onChange,
}: {
  readonly fieldIndex: number;
  readonly options: readonly FieldOption[];
  readonly onChange: (options: readonly FieldOption[]) => void;
}): JSX.Element {
  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-3">
      <Label>Opsionet</Label>

      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Kjo fushë kërkon të paktën një opsion për t&apos;u shfaqur te aplikuesi.
        </p>
      ) : null}

      {options.map((option, index) => (
        <div key={index} className="flex flex-wrap gap-2">
          <Input
            className="min-w-[8rem] flex-1"
            placeholder="Vlera e ruajtur"
            value={option.value}
            onChange={(event) =>
              onChange(replaceAt(options, index, { ...option, value: event.target.value }))
            }
            aria-label={`Fusha ${fieldIndex + 1}, opsioni ${index + 1}: vlera`}
          />
          <Input
            className="min-w-[8rem] flex-1"
            placeholder="Teksti që sheh aplikuesi"
            value={option.label}
            onChange={(event) =>
              onChange(replaceAt(options, index, { ...option, label: event.target.value }))
            }
            aria-label={`Fusha ${fieldIndex + 1}, opsioni ${index + 1}: etiketa`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Hiq opsionin ${index + 1}`}
            onClick={() => onChange(options.filter((_, position) => position !== index))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...options, { value: '', label: '' }])}
      >
        <Plus />
        Shto opsion
      </Button>
    </div>
  );
}

export function FieldListEditor({ fields, onChange }: FieldListEditorProps): JSX.Element {
  const updateField = (index: number, patch: Partial<FieldDefinition>): void => {
    const current = fields[index];
    if (!current) {
      return;
    }
    onChange(replaceAt(fields, index, { ...current, ...patch }));
  };

  const removeField = (index: number): void => {
    onChange(reindex(fields.filter((_, position) => position !== index)));
  };

  const moveField = (index: number, direction: -1 | 1): void => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) {
      return;
    }
    onChange(reindex(swap(fields, index, target)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Fushat e formës</h2>
          <p className="text-sm text-muted-foreground">
            Emri, emaili dhe telefoni mblidhen gjithmonë — shto këtu vetëm pyetjet shtesë.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={fields.length >= MAX_FIELDS}
          onClick={() => onChange([...fields, createEmptyField(fields.length)])}
        >
          <Plus />
          Shto fushë
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Asnjë fushë shtesë. Forma do të kërkojë vetëm emrin, emailin dhe telefonin.
        </p>
      ) : null}

      {fields.map((field, index) => (
        <div
          key={index}
          className="space-y-4 rounded-xl border border-border bg-background p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <GripVertical className="h-4 w-4" aria-hidden />
              Fusha {index + 1}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Zhvendos fushën ${index + 1} lart`}
                disabled={index === 0}
                onClick={() => moveField(index, -1)}
              >
                <ChevronUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Zhvendos fushën ${index + 1} poshtë`}
                disabled={index === fields.length - 1}
                onClick={() => moveField(index, 1)}
              >
                <ChevronDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Hiq fushën ${index + 1}`}
                onClick={() => removeField(index)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`field-label-${index}`}>Pyetja</Label>
              <Input
                id={`field-label-${index}`}
                value={field.label}
                placeholder="p.sh. Në cilën shkollë je?"
                onChange={(event) => {
                  const label = event.target.value;
                  // Keep the machine name in sync until the admin edits it directly.
                  const shouldSyncName =
                    field.name === '' || field.name === toFieldName(field.label);
                  updateField(index, {
                    label,
                    ...(shouldSyncName ? { name: toFieldName(label) } : {}),
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`field-type-${index}`}>Lloji</Label>
              <Select
                value={field.type}
                onValueChange={(value) => updateField(index, { type: value as FieldType })}
              >
                <SelectTrigger id={`field-type-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {FIELD_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`field-name-${index}`}>Çelësi i ruajtjes</Label>
              <Input
                id={`field-name-${index}`}
                className="font-mono text-xs"
                value={field.name}
                onChange={(event) => updateField(index, { name: toFieldName(event.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Përdoret në CSV dhe në bazën e të dhënave.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`field-placeholder-${index}`}>Teksti ndihmës në fushë</Label>
              <Input
                id={`field-placeholder-${index}`}
                value={field.placeholder ?? ''}
                onChange={(event) => updateField(index, { placeholder: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`field-help-${index}`}>Shpjegim nën fushë</Label>
            <Input
              id={`field-help-${index}`}
              value={field.helpText ?? ''}
              onChange={(event) => updateField(index, { helpText: event.target.value })}
            />
          </div>

          {CHOICE_FIELD_TYPES.includes(field.type) ? (
            <OptionEditor
              fieldIndex={index}
              options={field.options}
              onChange={(options) => updateField(index, { options })}
            />
          ) : null}

          <div className="flex items-center gap-2">
            <Switch
              id={`field-required-${index}`}
              checked={field.required}
              onCheckedChange={(checked) => updateField(index, { required: checked })}
            />
            <Label htmlFor={`field-required-${index}`}>E detyrueshme</Label>
          </div>
        </div>
      ))}
    </div>
  );
}
