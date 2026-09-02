import { Button } from '@/components/ui/button';

/**
 * The save/cancel pair every editor page ends with.
 *
 * WHY THIS IS A COMPONENT AND NOT THREE COPIES
 * --------------------------------------------
 * The three editors (training, post, form) previously rendered their own pair, and they
 * had already drifted: the form editor carried one in the page header AND a second at the
 * bottom, while the other two had only the header pair, so "Ruaj" was in a different place
 * depending on which editor you were in. One component means the order — cancel left,
 * primary right — and the disabled behaviour cannot diverge again.
 *
 * PLACEMENT
 * ---------
 * At the BOTTOM of the form, after every field. On a long editor the header pair scrolls
 * out of view exactly when a user finishes filling the last field and wants to save, which
 * is the moment the button needs to be reachable. The page title stays in `PageHeader`;
 * only the actions moved.
 */
type FormActionsProps = {
  /** Where "Anulo" goes back to. */
  readonly onCancel: () => void;
  /** Disables both buttons and swaps the primary label while a save is in flight. */
  readonly isSaving: boolean;
  /** Primary label at rest — "Ruaj", "Ruaj artikullin", "Ruaj formën". */
  readonly saveLabel: string;
};

export function FormActions({ onCancel, isSaving, saveLabel }: FormActionsProps): JSX.Element {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}>
        Anulo
      </Button>
      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Duke ruajtur…' : saveLabel}
      </Button>
    </div>
  );
}
