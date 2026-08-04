/**
 * Përdoruesit — staff accounts. ADMIN only.
 *
 * THE 409 GUARDRAILS ARE THE POINT OF THIS SCREEN'S ERROR HANDLING. The API refuses to:
 *   - delete or demote the LAST active administrator,
 *   - delete a user who has authored posts (the byline would be orphaned),
 *   - let an admin delete or deactivate their own account.
 *
 * Each of those comes back as a 409 with a precise, actionable message. Those messages
 * are surfaced VERBATIM as toasts rather than being replaced with a generic "Veprimi
 * dështoi" — the server's sentence explains what to do instead ("promote another user
 * to ADMIN first"), and a generic string would throw that away. The UI additionally
 * disables the buttons it can predict will fail, so the toast is the backstop, not the
 * primary feedback.
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, Trash2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingRows } from '@/components/common/state-views';
import { PaginationControls } from '@/components/common/pagination-controls';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  updateUser,
} from '@/api/users.api';
import { queryKeys } from '@/api/query-keys';
import type { AdminUser } from '@/api/types';
import { DEFAULT_PAGE_SIZE, ROLES, ROLE_LABELS, type Role } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { describeApiError } from '@/lib/api-error';
import { useAuth } from '@/hooks/use-auth';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useDocumentTitle } from '@/hooks/use-document-title';

/** Mirrors the API's `MIN_PASSWORD_LENGTH`; the server validates it again. */
const MIN_PASSWORD_LENGTH = 12;

type CreateState = {
  email: string;
  name: string;
  password: string;
  role: Role;
};

const EMPTY_CREATE: CreateState = {
  email: '',
  name: '',
  password: '',
  // The lower privilege by default: a forgotten dropdown must never mint an admin.
  role: 'EDITOR',
};

export default function UsersPage(): JSX.Element {
  useDocumentTitle('Përdoruesit');

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createState, setCreateState] = useState<CreateState | null>(null);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const filters = {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    search: debouncedSearch || undefined,
    sort: 'createdAt' as const,
    order: 'desc' as const,
  };

  const usersQuery = useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => listUsers(filters),
  });

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  };

  /** Every mutation reports the API's own message — see the file header. */
  const onMutationError = (error: unknown): void => {
    toast.error(describeApiError(error));
  };

  const createMutation = useMutation({
    mutationFn: (state: CreateState) => createUser(state),
    onSuccess: (user) => {
      toast.success(`Përdoruesi ${user.email} u krijua.`);
      setCreateState(null);
      invalidate();
    },
    onError: onMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string; role?: Role; isActive?: boolean }) =>
      updateUser(id, payload),
    onSuccess: () => {
      toast.success('Përdoruesi u përditësua.');
      setEditTarget(null);
      invalidate();
    },
    onError: onMutationError,
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetUserPassword(id, password),
    onSuccess: () => {
      toast.success('Fjalëkalimi u rivendos. Sesionet ekzistuese u mbyllën.');
      setResetTarget(null);
      setResetPasswordValue('');
      invalidate();
    },
    onError: onMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success('Përdoruesi u fshi.');
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error: unknown) => {
      // Keep the dialog open: the 409 usually says what to do first, and closing it
      // would hide the row the admin needs to act on.
      onMutationError(error);
    },
  });

  const isSelf = (user: AdminUser): boolean => user.id === currentUser?.id;

  return (
    <>
      <PageHeader
        title="Përdoruesit"
        description="Llogaritë e stafit që kanë qasje në panel."
        actions={
          <Button onClick={() => setCreateState(EMPTY_CREATE)}>
            <Plus />
            Shto përdorues
          </Button>
        }
      />

      <Input
        className="mb-5 sm:max-w-xs"
        placeholder="Kërko sipas emrit ose emailit…"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        aria-label="Kërko përdorues"
      />

      {usersQuery.isPending ? (
        <LoadingRows />
      ) : usersQuery.isError ? (
        <ErrorState error={usersQuery.error} onRetry={() => void usersQuery.refetch()} />
      ) : usersQuery.data.items.length === 0 ? (
        <EmptyState
          title="Asnjë përdorues nuk përputhet"
          description="Pastroni kërkimin ose shtoni një llogari të re."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emri</TableHead>
                  <TableHead>Roli</TableHead>
                  <TableHead>Statusi</TableHead>
                  <TableHead className="hidden lg:table-cell">Artikuj</TableHead>
                  <TableHead className="hidden sm:table-cell">Krijuar</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.data.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium">
                        {user.name}
                        {isSelf(user) ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (ju)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'muted'}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="success">Aktiv</Badge>
                      ) : (
                        <Badge variant="warning">Joaktiv</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden tabular-nums lg:table-cell">
                      {user.postCount}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditTarget(user)}>
                          <UserCog />
                          <span className="hidden sm:inline">Ndrysho</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setResetTarget(user);
                            setResetPasswordValue('');
                          }}
                        >
                          <KeyRound />
                          <span className="hidden sm:inline">Fjalëkalimi</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          // Predictable refusals are disabled up front; the server
                          // still enforces all three rules regardless.
                          disabled={isSelf(user) || user.postCount > 0}
                          title={
                            isSelf(user)
                              ? 'Nuk mund të fshini llogarinë tuaj.'
                              : user.postCount > 0
                                ? 'Ky përdorues ka artikuj — çaktivizojeni në vend të fshirjes.'
                                : undefined
                          }
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            meta={usersQuery.data.meta}
            onPageChange={setPage}
            isDisabled={usersQuery.isFetching}
          />
        </>
      )}

      {/* ------------------------------------------------------------ create */}
      <Dialog
        open={createState !== null}
        onOpenChange={(open) => (open ? undefined : setCreateState(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shto përdorues</DialogTitle>
            <DialogDescription>
              Roli fillon si «Redaktor». Ngrijeni në administrator vetëm kur duhet.
            </DialogDescription>
          </DialogHeader>

          {createState ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-user-name">Emri</Label>
                <Input
                  id="new-user-name"
                  value={createState.name}
                  onChange={(event) =>
                    setCreateState({ ...createState, name: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-email">Email</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  autoComplete="off"
                  value={createState.email}
                  onChange={(event) =>
                    setCreateState({ ...createState, email: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-password">Fjalëkalimi</Label>
                <Input
                  id="new-user-password"
                  type="password"
                  autoComplete="new-password"
                  value={createState.password}
                  onChange={(event) =>
                    setCreateState({ ...createState, password: event.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Së paku {MIN_PASSWORD_LENGTH} karaktere.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-role">Roli</Label>
                <Select
                  value={createState.role}
                  onValueChange={(value) =>
                    setCreateState({ ...createState, role: value as Role })
                  }
                >
                  <SelectTrigger id="new-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateState(null)}>
              Anulo
            </Button>
            <Button
              disabled={
                createMutation.isPending ||
                !createState?.email ||
                !createState.name ||
                (createState?.password.length ?? 0) < MIN_PASSWORD_LENGTH
              }
              onClick={() => {
                if (createState) {
                  createMutation.mutate(createState);
                }
              }}
            >
              {createMutation.isPending ? 'Duke krijuar…' : 'Krijo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------- edit */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => (open ? undefined : setEditTarget(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ndrysho përdoruesin</DialogTitle>
            <DialogDescription>
              Emaili nuk ndryshohet — është identifikuesi i kyçjes.
            </DialogDescription>
          </DialogHeader>

          {editTarget ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Emri</Label>
                <Input
                  id="edit-user-name"
                  value={editTarget.name}
                  onChange={(event) =>
                    setEditTarget({ ...editTarget, name: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-role">Roli</Label>
                <Select
                  value={editTarget.role}
                  onValueChange={(value) =>
                    setEditTarget({ ...editTarget, role: value as Role })
                  }
                >
                  <SelectTrigger id="edit-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-user-active"
                  checked={editTarget.isActive}
                  disabled={isSelf(editTarget)}
                  onCheckedChange={(checked) =>
                    setEditTarget({ ...editTarget, isActive: checked })
                  }
                />
                <Label htmlFor="edit-user-active">Llogari aktive</Label>
              </div>
              {isSelf(editTarget) ? (
                <p className="text-xs text-muted-foreground">
                  Nuk mund ta çaktivizoni llogarinë tuaj.
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Anulo
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                if (editTarget) {
                  updateMutation.mutate({
                    id: editTarget.id,
                    name: editTarget.name,
                    role: editTarget.role,
                    isActive: editTarget.isActive,
                  });
                }
              }}
            >
              {updateMutation.isPending ? 'Duke ruajtur…' : 'Ruaj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- reset password */}
      <Dialog
        open={resetTarget !== null}
        onOpenChange={(open) => (open ? undefined : setResetTarget(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rivendos fjalëkalimin</DialogTitle>
            <DialogDescription>
              Të gjitha sesionet e <strong>{resetTarget?.email}</strong> do të mbyllen menjëherë.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reset-password">Fjalëkalimi i ri</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={resetPasswordValue}
              onChange={(event) => setResetPasswordValue(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Së paku {MIN_PASSWORD_LENGTH} karaktere.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Anulo
            </Button>
            <Button
              disabled={
                resetMutation.isPending || resetPasswordValue.length < MIN_PASSWORD_LENGTH
              }
              onClick={() => {
                if (resetTarget) {
                  resetMutation.mutate({ id: resetTarget.id, password: resetPasswordValue });
                }
              }}
            >
              {resetMutation.isPending ? 'Duke rivendosur…' : 'Rivendos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------ delete */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Ta fshijmë këtë përdorues?"
        description={
          <>
            Llogaria e <strong>{deleteTarget?.email}</strong> do të hiqet përfundimisht. Nëse
            doni ta ruani historikun, çaktivizojeni në vend që ta fshini.
          </>
        }
        confirmLabel="Fshi përdoruesin"
        isDestructive
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </>
  );
}
