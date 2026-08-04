/**
 * Delete-a-form dialog, with the CSV backup offer.
 *
 * THE ORDER OF OPERATIONS IS THE WHOLE POINT. "Ruaj CSV dhe fshi" must:
 *
 *   1. await the per-form export, and
 *   2. only then issue the soft delete.
 *
 * If step 1 throws, step 2 MUST NOT RUN. A backup that silently failed followed by a
 * successful delete is strictly worse than never offering the backup — the admin
 * believes the data is safe on their disk when it is not. So the export is awaited, its
 * failure aborts the sequence, and the dialog stays open with an Albanian toast so the
 * user can retry or consciously choose "Fshi pa ruajtur".
 *
 * (The delete is a SOFT delete server-side and an ADMIN can restore it from "Të
 * arkivuara" — but the dialog does not lean on that, because the CSV is what protects
 * the submissions if the restore path is ever lost.)
 */
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { downloadFormSubmissionsCsv } from '@/api/forms.api';
import { describeApiError } from '@/lib/api-error';
import { formatNumber } from '@/lib/format';
import type { Form } from '@/api/types';

type DeleteFormDialogProps = {
  /** The form pending deletion. `null` closes the dialog. */
  readonly form: Form | null;
  readonly onOpenChange: (open: boolean) => void;
  /** Performs the actual soft delete. Rejects on failure. */
  readonly onDelete: (form: Form) => Promise<void>;
};

type Phase = 'idle' | 'exporting' | 'deleting';

export function DeleteFormDialog({
  form,
  onOpenChange,
  onDelete,
}: DeleteFormDialogProps): JSX.Element {
  const [phase, setPhase] = useState<Phase>('idle');
  const isBusy = phase !== 'idle';

  const runDelete = async (target: Form): Promise<void> => {
    setPhase('deleting');
    try {
      await onDelete(target);
      onOpenChange(false);
    } catch (error) {
      toast.error(describeApiError(error));
    } finally {
      setPhase('idle');
    }
  };

  const handleBackupAndDelete = async (): Promise<void> => {
    if (!form) {
      return;
    }

    setPhase('exporting');

    try {
      const result = await downloadFormSubmissionsCsv(form.id, form.slug);
      toast.success(`Ruajtur si ${result.filename}.`);

      if (result.isTruncated) {
        // Deleting now would drop the rows that did not fit into the file. Stop and
        // let the admin decide, rather than "finishing the job" on their behalf.
        toast.warning(
          'Eksporti u shkurtua në kufirin maksimal — jo të gjitha aplikimet janë në skedar. Forma NUK u fshi.',
        );
        setPhase('idle');
        return;
      }
    } catch (error) {
      // The abort that matters: no backup, so no delete.
      toast.error(`Eksporti dështoi, forma NUK u fshi. ${describeApiError(error)}`);
      setPhase('idle');
      return;
    }

    await runDelete(form);
  };

  return (
    <Dialog open={form !== null} onOpenChange={(open) => (isBusy ? undefined : onOpenChange(open))}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Dëshiron ta ruash si CSV para se me fshi?</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>Kështu nuk humbin të dhënat e aplikimeve.</p>
              <p className="text-foreground">
                Forma <strong>{form?.title}</strong> ka{' '}
                <strong>{formatNumber(form?.submissionCount ?? 0)}</strong> aplikime. Pas
                fshirjes, linku publik nuk pranon më aplikime të reja.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
            className="sm:order-first"
          >
            Anulo
          </Button>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="destructive"
              disabled={isBusy}
              onClick={() => {
                if (form) {
                  void runDelete(form);
                }
              }}
            >
              {phase === 'deleting' ? 'Duke fshirë…' : 'Fshi pa ruajtur'}
            </Button>
            <Button disabled={isBusy} onClick={() => void handleBackupAndDelete()}>
              {phase === 'exporting' ? 'Duke ruajtur…' : 'Ruaj CSV dhe fshi'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
