/**
 * Lajme / blog editor. Available to BOTH roles — writing is the editor's job.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { FormActions } from '@/components/common/form-actions';
import { ErrorState, LoadingRows } from '@/components/common/state-views';
import { RichTextEditor } from '@/components/posts/rich-text-editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryManagerDialog } from '@/components/posts/category-manager-dialog';
import { listPostCategories } from '@/api/post-categories.api';
import { createPost, getPost, updatePost, type PostPayload } from '@/api/posts.api';
import { queryKeys } from '@/api/query-keys';
import { ROUTES } from '@/lib/constants';
import { slugify } from '@/lib/format';
import { describeApiError } from '@/lib/api-error';
import { CoverImageField } from '@/components/posts/cover-image-field';
import { useDocumentTitle } from '@/hooks/use-document-title';

/**
 * `NO_CATEGORY` stands in for null inside the `<Select>`.
 *
 * Radix treats the empty string as "no value chosen" and refuses it as an item value, so
 * the absence of a category needs a sentinel of its own — mapped back to null on save.
 * Filing an article is optional and every post that predates the taxonomy is in exactly
 * this state, so it has to be a first-class choice rather than a missing one.
 */
const NO_CATEGORY = '__none__';

type EditorState = {
  slug: string;
  title: string;
  coverImage: string;
  content: string;
  published: boolean;
  /** A category row id, or `NO_CATEGORY`. */
  categoryId: string;
};

const INITIAL_STATE: EditorState = {
  slug: '',
  title: '',
  coverImage: '',
  content: '',
  categoryId: NO_CATEGORY,
  published: false,
};

const HTTP_URL = /^https?:\/\//i;

function validate(state: EditorState): string | null {
  if (state.title.trim().length === 0) {
    return 'Titulli është i detyrueshëm.';
  }
  if (state.slug.trim().length === 0) {
    return 'Slug-u është i detyrueshëm.';
  }
  if (state.content.trim().length === 0) {
    return 'Përmbajtja nuk mund të jetë bosh.';
  }
  if (state.coverImage.trim() !== '' && !HTTP_URL.test(state.coverImage.trim())) {
    return 'Fotoja e ballinës duhet të jetë një adresë http(s).';
  }
  return null;
}

export default function PostEditorPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  useDocumentTitle(isEditing ? 'Ndrysho artikullin' : 'Shto artikull');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [state, setState] = useState<EditorState>(INITIAL_STATE);
  const [validationError, setValidationError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.postCategories.all,
    queryFn: listPostCategories,
  });

  const [isCategoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const postQuery = useQuery({
    queryKey: queryKeys.posts.detail(id ?? ''),
    queryFn: () => getPost(id as string),
    enabled: isEditing,
  });

  /*
   * SEEDS THE FORM ONCE PER POST, keyed on the post's ID rather than on the query object.
   *
   * `postQuery.data` gets a new identity on every refetch, and something as ordinary as
   * creating a category invalidates `posts.all` — which prefix-matches this detail query.
   * Keyed on the object, this effect re-ran on that refetch and reset every field to the
   * last SAVED values, silently discarding whatever the writer had typed since. The
   * category select made it visible (a just-picked category snapped back to
   * "— Pa kategori —"), but the same reset was throwing away title and body edits too.
   *
   * The id only changes when a different post is opened, which is exactly when the form
   * should be re-seeded.
   */
  const loadedPostId = postQuery.data?.id;

  useEffect(() => {
    if (!postQuery.data) {
      return;
    }
    const { slug, title, coverImage, content, published, category } = postQuery.data;
    setState({
      slug,
      title,
      coverImage: coverImage ?? '',
      content,
      published,
      categoryId: category?.id ?? NO_CATEGORY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see the note above: seeding
    // is deliberately per-post, not per-fetch.
  }, [loadedPostId]);

  const selectedCategoryLabel =
    state.categoryId === NO_CATEGORY
      ? '— Pa kategori —'
      : ((categoriesQuery.data ?? []).find((category) => category.id === state.categoryId)?.name ??
        '— Pa kategori —');

  const saveMutation = useMutation({
    mutationFn: (payload: PostPayload) =>
      isEditing ? updatePost(id as string, payload) : createPost(payload),
    onSuccess: (post) => {
      toast.success(isEditing ? 'Artikulli u ruajt.' : 'Artikulli u krijua.');
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      navigate(ROUTES.POST_EDIT(post.id), { replace: true });
    },
    onError: (error: unknown) => toast.error(describeApiError(error)),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const problem = validate(state);
    setValidationError(problem);

    if (problem) {
      return;
    }

    saveMutation.mutate({
      slug: state.slug,
      title: state.title,
      coverImage: state.coverImage.trim() === '' ? null : state.coverImage.trim(),
      content: state.content,
      published: state.published,
      // The sentinel maps back to a real null: "no category" is a value the API stores,
      // not a field to omit — on PATCH an omitted key means "leave alone".
      categoryId: state.categoryId === NO_CATEGORY ? null : state.categoryId,
    });
  };

  if (isEditing && postQuery.isPending) {
    return <LoadingRows rows={6} />;
  }

  if (isEditing && postQuery.isError) {
    return <ErrorState error={postQuery.error} onRetry={() => void postQuery.refetch()} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={isEditing ? 'Ndrysho artikullin' : 'Shto artikull'}
        description="Përmbajtja pastrohet në server para se të ruhet."
      />

      {validationError ? (
        <p role="alert" className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {validationError}
        </p>
      ) : null}

      {/*
        7/3 rather than 2/3–1/3: the writing surface is the screen, and the publishing
        controls are a short checklist that does not need a quarter of a 1920px display.
      */}
      <div className="grid gap-6 xl:grid-cols-10">
        <div className="space-y-6 xl:col-span-7">
          <div className="space-y-2">
            <Label htmlFor="post-title">Titulli</Label>
            <Input
              id="post-title"
              className="h-12 text-lg font-medium"
              placeholder="Titulli i artikullit"
              value={state.title}
              onChange={(event) => {
                const title = event.target.value;
                setState((previous) => ({
                  ...previous,
                  title,
                  slug: isEditing ? previous.slug : slugify(title),
                }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-content">Përmbajtja</Label>
            <RichTextEditor
              value={state.content}
              onChange={(content) => setState((previous) => ({ ...previous, content }))}
            />
            <p id="post-content" className="text-xs text-muted-foreground">
              Lejohen tituj, paragrafë, lista, linqe, foto dhe kod. Çdo gjë tjetër hiqet gjatë
              ruajtjes.
            </p>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publikimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="post-published"
                    checked={state.published}
                    onCheckedChange={(checked) =>
                      setState((previous) => ({ ...previous, published: checked }))
                    }
                  />
                  <Label htmlFor="post-published">Publikuar</Label>
                </div>
                {state.published ? (
                  <Badge variant="success">Publik</Badge>
                ) : (
                  <Badge variant="muted">Draft</Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="post-category">Kategoria</Label>
                  {/*
                    The manager opens from HERE rather than from Cilësimet because that
                    page is ADMIN_ONLY while the API lets an EDITOR create and rename a
                    category — and because the moment you notice a category is missing is
                    the moment you are filling in this field. Deleting lives inside the
                    dialog, behind a confirmation, and only for an ADMIN.
                  */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategoryManagerOpen(true)}
                  >
                    <Plus />
                    Shto kategori
                  </Button>
                </div>
                <Select
                  value={state.categoryId}
                  onValueChange={(value) =>
                    setState((previous) => ({ ...previous, categoryId: value }))
                  }
                >
                  <SelectTrigger id="post-category">
                    {/*
                      The label is rendered as a CHILD rather than left to `<SelectValue />`
                      to resolve. Radix derives that label from the `SelectItem` registry,
                      and items only register while the dropdown content is mounted — so a
                      value set programmatically for a category the writer has never opened
                      the list to see (the one the "Shto kategori" dialog just created)
                      resolves to a blank trigger. Passing children bypasses the registry.
                    */}
                    <SelectValue>{selectedCategoryLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {/* Optional by design — an unfiled article is valid and shows under
                        "Të gjitha" on the public feed. */}
                    <SelectItem value={NO_CATEGORY}>— Pa kategori —</SelectItem>
                    {(categoriesQuery.data ?? []).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-slug">Slug-u</Label>
                <Input
                  id="post-slug"
                  className="font-mono text-xs"
                  value={state.slug}
                  onChange={(event) =>
                    setState((previous) => ({ ...previous, slug: slugify(event.target.value) }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fotoja e ballinës</CardTitle>
            </CardHeader>
            <CardContent>
              {/*
                Upload-first, with URL paste kept as the fallback. The field's value is
                still a plain URL string either way, so the save path below is unchanged.
              */}
              <CoverImageField
                value={state.coverImage}
                disabled={saveMutation.isPending}
                onChange={(url) => setState((previous) => ({ ...previous, coverImage: url }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <FormActions
        onCancel={() => navigate(ROUTES.POSTS)}
        isSaving={saveMutation.isPending}
        saveLabel="Ruaj artikullin"
      />
    
      {/*
        Inside the form in the JSX tree. Radix portals the dialog out of the DOM, so its
        inputs never become nested form CONTROLS of this one — but React dispatches events
        through the React tree, so a submit inside the dialog still reaches this form's
        onSubmit. The dialog stops propagation itself; see the note there.

        `onCreated` selects what was just added: someone who opens this because the
        category they wanted is missing should not then have to find it in the dropdown.
      */}
      <CategoryManagerDialog
        open={isCategoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        onCreated={(category) =>
          setState((previous) => ({ ...previous, categoryId: category.id }))
        }
      />
    </form>
  );
}
