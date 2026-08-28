/**
 * "Rolet e punës që mund t'i fitosh" — the job titles a training prepares for.
 *
 * A CHIP input rather than the row-of-text-inputs shape `strength-list-editor.tsx` uses,
 * and the difference is deliberate. A strength is a sentence that wants a full-width
 * field and an explicit order; a job role is a two-word token that the public page draws
 * as a pill in a wrapping row. Making the editor look like the output is what stops an
 * admin wondering why their carefully ordered list came out as a paragraph. Reordering
 * buttons are omitted for the same reason: a wrapping row has no meaningful sequence.
 *
 * Everything else follows the sibling editor's conventions so this reads as native to
 * the dashboard: fully controlled, every mutation returns a NEW array so the parent's
 * dirty tracking stays honest, and the same Button/Input primitives.
 */
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Matches `MAX_JOB_ROLES` in the API's training schema. */
const MAX_JOB_ROLES = 12;
/** Matches `MAX_JOB_ROLE_LENGTH`. */
const MAX_LENGTH = 80;

type JobRoleTagInputProps = {
  readonly jobRoles: readonly string[];
  readonly onChange: (jobRoles: readonly string[]) => void;
  readonly disabled?: boolean;
};

export function JobRoleTagInput({
  jobRoles,
  onChange,
  disabled = false,
}: JobRoleTagInputProps): JSX.Element {
  const [draft, setDraft] = useState('');

  const isFull = jobRoles.length >= MAX_JOB_ROLES;
  const trimmed = draft.trim();
  /* Case-insensitive, mirroring the dedupe the API applies — so the button disables for
     exactly the input the server would have dropped, rather than accepting it and
     silently losing it on save. */
  const isDuplicate = jobRoles.some((role) => role.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
  const canAdd = !disabled && !isFull && trimmed !== '' && !isDuplicate;

  const commit = (): void => {
    if (!canAdd) {
      return;
    }
    onChange([...jobRoles, trimmed]);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Rolet e punës që mund t'i fitosh</h3>
        <p className="text-sm text-muted-foreground">
          Shkruaj një rol dhe shtyp Enter. Shfaqen si etiketa në faqen e trajnimit. Lëri
          bosh nëse nuk të duhen.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          maxLength={MAX_LENGTH}
          disabled={disabled || isFull}
          placeholder="p.sh. Front-End Developer"
          aria-label="Shto rol pune"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              /* This input lives inside the training <form>; without this, Enter would
                 submit the whole editor instead of adding a chip. */
              event.preventDefault();
              commit();
              return;
            }
            /* Backspace on an empty box removes the last chip — the behaviour anyone who
               has used a tag field expects, and the only way to undo without reaching
               for the mouse. */
            if (event.key === 'Backspace' && draft === '' && jobRoles.length > 0) {
              onChange(jobRoles.slice(0, -1));
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={!canAdd} onClick={commit}>
          <Plus />
          Shto
        </Button>
      </div>

      {/* Only ever one message, and only when the admin has typed something worth
          explaining — an always-present hint would be noise. */}
      {isFull ? (
        <p className="text-sm text-muted-foreground">
          Ke arritur kufirin prej {MAX_JOB_ROLES} rolesh.
        </p>
      ) : isDuplicate && trimmed !== '' ? (
        <p className="text-sm text-muted-foreground">Ky rol është shtuar tashmë.</p>
      ) : null}

      {jobRoles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Asnjë rol pune. Kjo pjesë nuk do të shfaqet fare në faqen e trajnimit.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {jobRoles.map((role, index) => (
            <li key={role}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted py-1 pl-3 pr-1 text-sm">
                {role}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-5 rounded-full"
                  aria-label={`Hiq rolin ${role}`}
                  disabled={disabled}
                  onClick={() => onChange(jobRoles.filter((_, position) => position !== index))}
                >
                  <X />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
