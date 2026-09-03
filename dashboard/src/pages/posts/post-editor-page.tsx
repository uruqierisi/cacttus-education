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
import { createPost, getPost, updatePost, type PostPayload } from '@/api/posts.api';
import { queryKeys } from '@/api/query-keys';
import { ROUTES } from '@/lib/constants';
import { slugify } from '@/lib/format';
import { describeApiError } from '@/lib/api-error';
import { CoverImageField } from '@/components/posts/cover-image-field';
import { useDocumentTitle } from '@/hooks/use-document-title';

type EditorState = {
  slug: string;
  title: string;
  coverImage: string;
  content: string;
  published: boolean;
};

const INITIAL_STATE: EditorState = {
  slug: '',
  title: '',
  coverImage: '',
  content: '',
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

  const postQuery = useQuery({
    queryKey: queryKeys.posts.detail(id ?? ''),
    queryFn: () => getPost(id as string),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!postQuery.data) {
      return;
    }
    const { slug, title, coverImage, content, published } = postQuery.data;
    setState({ slug, title, coverImage: coverImage ?? '', content, published });
  }, [postQuery.data]);

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
    </form>
  );
}
