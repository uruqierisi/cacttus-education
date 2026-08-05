/**
 * Lajme / Blogs — the post list. BOTH roles may read and write posts.
 *
 * Delete stays ADMIN-only in the UI to match the fact that it is irreversible (unlike
 * a form, a post is hard-deleted), even though the API allows an editor to call it.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingRows } from '@/components/common/state-views';
import { PaginationControls } from '@/components/common/pagination-controls';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deletePost, listPosts } from '@/api/posts.api';
import { queryKeys } from '@/api/query-keys';
import type { Post } from '@/api/types';
import { DEFAULT_PAGE_SIZE, ROUTES } from '@/lib/constants';
import { formatDate, truncate } from '@/lib/format';
import { describeApiError } from '@/lib/api-error';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useAuth } from '@/hooks/use-auth';

const EXCERPT_LENGTH = 90;

export default function PostsListPage(): JSX.Element {
  useDocumentTitle('Lajme');

  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const filters = {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    sort: 'updatedAt' as const,
    order: 'desc' as const,
  };

  const postsQuery = useQuery({
    queryKey: queryKeys.posts.list(filters),
    queryFn: () => listPosts(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      toast.success('Artikulli u fshi.');
      setPendingDelete(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
    onError: (error: unknown) => toast.error(describeApiError(error)),
  });

  return (
    <>
      <PageHeader
        title="Lajme & Blogs"
        description="Artikujt e publikuar shkojnë automatikisht te faqja publike."
        actions={
          <Button asChild>
            <Link to={ROUTES.POST_NEW}>
              <Plus />
              Shto artikull
            </Link>
          </Button>
        }
      />

      <Input
        className="mb-5 sm:max-w-xs"
        placeholder="Kërko artikuj…"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        aria-label="Kërko artikuj"
      />

      {postsQuery.isPending ? (
        <LoadingRows />
      ) : postsQuery.isError ? (
        <ErrorState error={postsQuery.error} onRetry={() => void postsQuery.refetch()} />
      ) : postsQuery.data.items.length === 0 ? (
        <EmptyState
          title="Ende nuk ka artikuj"
          description="Shkruaj artikullin e parë për të mbushur faqen publike të lajmeve."
          action={
            <Button asChild>
              <Link to={ROUTES.POST_NEW}>Shto artikull</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulli</TableHead>
                  <TableHead className="hidden lg:table-cell">Autori</TableHead>
                  <TableHead>Statusi</TableHead>
                  <TableHead className="hidden sm:table-cell">Përditësuar</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postsQuery.data.items.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Link
                        to={ROUTES.POST_EDIT(post.id)}
                        className="font-medium hover:underline"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                        {truncate(post.excerpt, EXCERPT_LENGTH)}
                      </p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{post.author.name}</TableCell>
                    <TableCell>
                      {post.published ? (
                        <Badge variant="success">Publikuar</Badge>
                      ) : (
                        <Badge variant="muted">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                      {formatDate(post.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={ROUTES.POST_EDIT(post.id)}>
                            <Pencil />
                            <span className="hidden sm:inline">Ndrysho</span>
                          </Link>
                        </Button>
                        {isAdmin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingDelete(post)}
                          >
                            <Trash2 />
                            <span className="hidden sm:inline">Fshij</span>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            meta={postsQuery.data.meta}
            onPageChange={setPage}
            isDisabled={postsQuery.isFetching}
          />
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        title="Ta fshijmë këtë artikull?"
        description={
          <>
            <strong>{pendingDelete?.title}</strong> do të hiqet përfundimisht dhe do të zhduket
            nga faqja publike. Ky veprim nuk mund të zhbëhet.
          </>
        }
        confirmLabel="Fshi artikullin"
        isDestructive
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (pendingDelete) {
            deleteMutation.mutate(pendingDelete.id);
          }
        }}
      />
    </>
  );
}
