/**
 * "Menaxho kategoritë" — the catalogue taxonomy, edited in place.
 *
 * WHY IT LIVES BESIDE THE KATEGORIA SELECT AND NOT IN CILËSIMET. Settings is
 * `ADMIN_ONLY` in `nav-items.ts`, but the API lets an EDITOR create and rename a
 * category — the same split trainings themselves use, because both roles curate the
 * catalogue. Putting the only management surface behind an admin-only page would have
 * locked editors out of something the server is happy to let them do, and sent them to
 * ask an admin for a label. Here, both roles reach it from the page where the need
 * actually arises: the training they are filling in wants a category that does not
 * exist yet.
 *
 * DELETION IS DISCOVERABLE BUT NOT ACCIDENTAL. It is rendered only for an ADMIN (the
 * server returns 403 for anyone else, so showing the button to an editor would only
 * promise something it cannot deliver), it sits at the end of a row rather than in the
 * flow of adding one, and it goes through the same `ConfirmDialog` every other
 * destructive action in this dashboard uses. A category still in use is refused by the
 * API with a sentence naming the count; that message is rendered verbatim rather than
 * reworded here, so there is exactly one place the wording lives.
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  createTrainingCategory,
  deleteTrainingCategory,
  listTrainingCategories,
  updateTrainingCategory,
} from '@/api/training-categories.api';
import { queryKeys } from '@/api/query-keys';
import type { TrainingCategory } from '@/api/types';
import { useAuth } from '@/hooks/use-auth';
import { describeApiError } from '@/lib/api-error';

type Props = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Called with the new category so the editor can select what was just created. */
  readonly onCreated?: (category: TrainingCategory) => void;
};

export function CategoryManagerDialog({ open, onOpenChange, onCreated }: Props): JSX.Element {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<TrainingCategory | null>(null);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.trainingCategories.all,
    queryFn: listTrainingCategories,
    enabled: open,
  });

  /*
   * Every mutation invalidates `trainings.all` as well as the category list. A rename
   * changes the label printed on every training row and in the editor's select, and
   * those are served from a different cache entry that would otherwise keep showing the
   * old name until something else happened to refetch it.
   */
  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.trainingCategories.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => createTrainingCategory({ name }),
    /*
     * AWAITED, and the order matters. `onCreated` tells the editor to select what was
     * just added, and a Radix `Select` resolves the label for its `value` from the
     * `SelectItem` present AT THE MOMENT the value changes — set it to an id whose item
     * has not rendered yet and the trigger silently keeps showing the previous
     * category's name, with no error and no recovery when the item appears a beat later.
     * Waiting for the invalidation to settle means the new item exists first.
     */
    onSuccess: async (category) => {
      await invalidate();
      setNewName('');
      toast.success(`Kategoria «${category.name}» u krijua.`);
      onCreated?.(category);
    },
    onError: (error: unknown) => toast.error(describeApiError(error)),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateTrainingCategory(id, { name }),
    onSuccess: (category) => {
      void invalidate();
      setEditingId(null);
      toast.success(`U riemërtua në «${category.name}».`);
    },
    onError: (error: unknown) => toast.error(describeApiError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (category: TrainingCategory) => deleteTrainingCategory(category.id),
    onSuccess: () => {
      void invalidate();
      setPendingDelete(null);
      toast.success('Kategoria u fshi.');
    },
    /*
     * The in-use refusal arrives here as a 409 whose message already names the category
     * and the number of trainings. It is shown as-is and the confirm dialog is LEFT
     * OPEN, so the admin reads why it failed without the surface that explains what they
     * were doing disappearing underneath the toast.
     */
    onError: (error: unknown) => toast.error(describeApiError(error)),
  });

  const categories = categoriesQuery.data ?? [];
  const trimmedNewName = newName.trim();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Menaxho kategoritë</DialogTitle>
            <DialogDescription>
              Kategoritë shfaqen si filtra në faqen publike të trajnimeve. Emri që shkruani
              këtu është ai që lexon vizitori.
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (trimmedNewName.length > 0) {
                createMutation.mutate(trimmedNewName);
              }
            }}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="new-category-name">Kategori e re</Label>
              <Input
                id="new-category-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="p.sh. Inteligjencë Artificiale"
                maxLength={120}
              />
            </div>
            <Button type="submit" disabled={trimmedNewName.length === 0 || createMutation.isPending}>
              <Plus />
              Shto
            </Button>
          </form>

          <div className="max-h-80 space-y-1 overflow-y-auto">
            {categoriesQuery.isPending ? (
              <p className="py-4 text-sm text-muted-foreground">Duke ngarkuar…</p>
            ) : categories.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Ende asnjë kategori.</p>
            ) : (
              categories.map((category) =>
                editingId === category.id ? (
                  <form
                    key={category.id}
                    className="flex items-center gap-2 rounded-md border p-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const name = editingName.trim();
                      if (name.length > 0 && name !== category.name) {
                        renameMutation.mutate({ id: category.id, name });
                      } else {
                        setEditingId(null);
                      }
                    }}
                  >
                    <Input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      maxLength={120}
                      autoFocus
                    />
                    <Button type="submit" size="icon" variant="ghost" disabled={renameMutation.isPending}>
                      <Check />
                      <span className="sr-only">Ruaj</span>
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                      <X />
                      <span className="sr-only">Anulo</span>
                    </Button>
                  </form>
                ) : (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm"
                  >
                    <span className="flex-1 font-medium">{category.name}</span>
                    {/*
                      The usage count is what makes the delete button's behaviour
                      predictable BEFORE it is pressed: a category showing "2 trajnime"
                      is visibly one the API will refuse to remove.
                    */}
                    <Badge variant={category.trainingCount > 0 ? 'default' : 'muted'}>
                      {category.trainingCount === 1
                        ? '1 trajnim'
                        : `${category.trainingCount} trajnime`}
                    </Badge>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(category.id);
                        setEditingName(category.name);
                      }}
                    >
                      <Pencil />
                      <span className="sr-only">Riemërto {category.name}</span>
                    </Button>
                    {isAdmin ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setPendingDelete(category)}
                      >
                        <Trash2 />
                        <span className="sr-only">Fshi {category.name}</span>
                      </Button>
                    ) : null}
                  </div>
                ),
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPendingDelete(null);
          }
        }}
        title="Fshi kategorinë"
        description={
          <>
            <p>«{pendingDelete?.name}» do të hiqet përfundimisht.</p>
            {pendingDelete && pendingDelete.trainingCount > 0 ? (
              <p className="mt-2">
                Kjo kategori përdoret nga{' '}
                {pendingDelete.trainingCount === 1
                  ? '1 trajnim'
                  : `${pendingDelete.trainingCount} trajnime`}
                , prandaj fshirja do të refuzohet derisa t’i zhvendosni në një kategori tjetër.
              </p>
            ) : null}
          </>
        }
        confirmLabel="Fshi"
        isDestructive
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (pendingDelete) {
            deleteMutation.mutate(pendingDelete);
          }
        }}
      />
    </>
  );
}
