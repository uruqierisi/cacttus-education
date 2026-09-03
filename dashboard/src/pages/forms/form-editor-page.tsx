/**
 * The dynamic form builder — create and edit.
 *
 * On a successful CREATE the page shows the generated public URL with a copy button
 * before doing anything else. That link is the entire product of this screen; making
 * the admin hunt for it back on the list page would be the one obvious way to get this
 * wrong.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { FormActions } from '@/components/common/form-actions';
import { ErrorState, LoadingRows } from '@/components/common/state-views';
import { FieldListEditor } from '@/components/forms/field-list-editor';
import { CopyUrlButton } from '@/components/forms/copy-url-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createForm, getForm, updateForm, type FormPayload } from '@/api/forms.api';
import { queryKeys } from '@/api/query-keys';
import type { FieldDefinition, Form } from '@/api/types';
import {
  CHOICE_FIELD_TYPES,
  FORM_TYPES,
  FORM_TYPE_LABELS,
  ROUTES,
  publicFormUrl,
  type FormType,
} from '@/lib/constants';
import { slugify } from '@/lib/format';
import { describeApiError } from '@/lib/api-error';
import { useDocumentTitle } from '@/hooks/use-document-title';

type EditorState = {
  slug: string;
  title: string;
  type: FormType;
  isActive: boolean;
  fields: readonly FieldDefinition[];
};

const INITIAL_STATE: EditorState = {
  slug: '',
  title: '',
  type: 'TRAINING',
  isActive: true,
  fields: [],
};

/**
 * Client-side pre-flight only. The API validates all of this again — this exists to
 * turn a round-trip and a red toast into an instant inline message.
 */
function validate(state: EditorState): string | null {
  if (state.title.trim().length === 0) {
    return 'Titulli është i detyrueshëm.';
  }
  if (state.slug.trim().length === 0) {
    return 'Slug-u është i detyrueshëm.';
  }
  if (state.fields.some((field) => field.label.trim().length === 0)) {
    return 'Çdo fushë duhet të ketë një pyetje.';
  }
  if (state.fields.some((field) => field.name.trim().length === 0)) {
    return 'Çdo fushë duhet të ketë një çelës ruajtjeje.';
  }

  const names = state.fields.map((field) => field.name);
  if (new Set(names).size !== names.length) {
    return 'Dy fusha nuk mund të kenë të njëjtin çelës ruajtjeje.';
  }

  const brokenChoice = state.fields.find(
    (field) =>
      CHOICE_FIELD_TYPES.includes(field.type) &&
      field.options.filter((option) => option.value.trim() !== '').length === 0,
  );
  if (brokenChoice) {
    return `Fusha «${brokenChoice.label}» kërkon të paktën një opsion.`;
  }

  return null;
}

export default function FormEditorPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  useDocumentTitle(isEditing ? 'Ndrysho formën' : 'Formë e re');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [state, setState] = useState<EditorState>(INITIAL_STATE);
  const [validationError, setValidationError] = useState<string | null>(null);
  /** Set only after a CREATE, to show the "here is your link" panel. */
  const [createdForm, setCreatedForm] = useState<Form | null>(null);

  const formQuery = useQuery({
    queryKey: queryKeys.forms.detail(id ?? ''),
    queryFn: () => getForm(id as string),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!formQuery.data) {
      return;
    }
    const { slug, title, type, isActive, fields } = formQuery.data;
    setState({ slug, title, type, isActive, fields });
  }, [formQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: FormPayload) =>
      isEditing ? updateForm(id as string, payload) : createForm(payload),
    onSuccess: (form) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });

      if (isEditing) {
        toast.success('Forma u ruajt.');
        return;
      }

      toast.success('Forma u krijua.');
      setCreatedForm(form);
      // `replace` so the browser back button does not land on an empty "new form".
      navigate(ROUTES.FORM_EDIT(form.id), { replace: true });
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
      type: state.type,
      isActive: state.isActive,
      fields: state.fields,
    });
  };

  /*
   * Renaming a field's STORAGE KEY is supported, but it is not a rename in the data:
   * answers already collected live in `Submission.data` under the old key and nothing
   * migrates them. Renaming the QUESTION TEXT has no such cost. The builder cannot know
   * which the admin meant, so it says so instead of guessing — silently orphaning past
   * answers is the failure this exists to prevent.
   *
   * Compared against the SERVER's copy, not against a local snapshot, so the warning
   * tracks what is actually persisted.
   */
  const renamedKeys = (() => {
    const original = formQuery.data?.fields;

    if (!isEditing || !original) {
      return [];
    }

    return state.fields
      .map((field, index) => ({ from: original[index]?.name, to: field.name }))
      .filter(
        (change): change is { from: string; to: string } =>
          change.from !== undefined && change.from !== change.to,
      );
  })();

  if (isEditing && formQuery.isPending) {
    return <LoadingRows rows={6} />;
  }

  if (isEditing && formQuery.isError) {
    return <ErrorState error={formQuery.error} onRetry={() => void formQuery.refetch()} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={isEditing ? 'Ndrysho formën' : 'Krijo formë të re'}
        description="Fushat ruhen si konfigurim — ndryshimi hyn në fuqi menjëherë."
      />

      {createdForm ? (
        <div
          role="status"
          className="mb-6 rounded-xl border border-success/30 bg-success/5 p-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
            <p className="text-sm font-semibold">Forma u krijua. Ky është linku publik:</p>
          </div>
          <CopyUrlButton url={publicFormUrl(createdForm.slug)} />
        </div>
      ) : null}

      {renamedKeys.length > 0 ? (
        <div
          role="status"
          className="mb-6 rounded-xl border border-warning/40 bg-warning/5 p-5 text-sm"
        >
          <p className="font-semibold">Ke ndryshuar çelësin e ruajtjes te disa fusha</p>
          <p className="mt-1 text-muted-foreground">
            Përgjigjet e mëparshme janë ruajtur nën çelësin e vjetër dhe nuk zhvendosen
            automatikisht — te aplikimet e vjetra ato do të duken si përgjigje pa fushë.
            Ndryshimi i tekstit të pyetjes është gjithmonë i sigurt; ky paralajmërim vlen
            vetëm për çelësin.
          </p>
          <ul className="mt-2 list-inside list-disc font-mono text-xs text-muted-foreground">
            {renamedKeys.map((change) => (
              <li key={change.from}>
                {change.from} → {change.to}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {validationError ? (
        <p role="alert" className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {validationError}
        </p>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Të dhënat e formës</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="form-title">Titulli</Label>
            <Input
              id="form-title"
              value={state.title}
              placeholder="p.sh. Aplikimi për Shkollë"
              onChange={(event) => {
                const title = event.target.value;
                setState((previous) => ({
                  ...previous,
                  title,
                  // Auto-slug only while creating; editing a live slug breaks the
                  // public URL people have already been given.
                  slug: isEditing ? previous.slug : slugify(title),
                }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-type">Programi</Label>
            <Select
              value={state.type}
              onValueChange={(value) =>
                setState((previous) => ({ ...previous, type: value as FormType }))
              }
            >
              <SelectTrigger id="form-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {FORM_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="form-slug">Slug-u publik</Label>
            <Input
              id="form-slug"
              className="font-mono text-xs"
              value={state.slug}
              onChange={(event) =>
                setState((previous) => ({ ...previous, slug: slugify(event.target.value) }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Linku publik: <code>{publicFormUrl(state.slug || 'slug-i-yt')}</code>
            </p>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch
              id="form-active"
              checked={state.isActive}
              onCheckedChange={(checked) =>
                setState((previous) => ({ ...previous, isActive: checked }))
              }
            />
            <Label htmlFor="form-active">Pranon aplikime</Label>
          </div>
        </CardContent>
      </Card>

      <FieldListEditor
        fields={state.fields}
        onChange={(fields) => setState((previous) => ({ ...previous, fields }))}
      />

      <FormActions
        onCancel={() => navigate(ROUTES.FORMS)}
        isSaving={saveMutation.isPending}
        saveLabel="Ruaj formën"
      />
    </form>
  );
}
