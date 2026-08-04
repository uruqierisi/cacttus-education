/**
 * The training editor — create and edit.
 *
 * Laid out in the three groups an admin actually thinks in, not in schema order:
 *   1. the CARD (what shows in the catalogue grid),
 *   2. the DETAIL PAGE (everything optional — fill in what this training needs),
 *   3. the APPLICATION FORM it points at.
 *
 * On a successful CREATE the page shows the generated slug and a link to the live page
 * before doing anything else, the same way the form builder shows its public URL: that
 * link is the product of this screen.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState, LoadingRows } from '@/components/common/state-views';
import { StrengthListEditor } from '@/components/trainings/strength-list-editor';
import { SyllabusPdfField } from '@/components/trainings/syllabus-pdf-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createTraining,
  getFormOptions,
  getTraining,
  updateTraining,
  type TrainingPayload,
} from '@/api/trainings.api';
import { queryKeys } from '@/api/query-keys';
import type { Training, TrainingCategory, TrainingFormat } from '@/api/types';
import {
  ROUTES,
  TRAINING_CATEGORIES,
  TRAINING_CATEGORY_LABELS,
  TRAINING_FORMATS,
  TRAINING_FORMAT_LABELS,
  publicTrainingUrl,
} from '@/lib/constants';
import { describeApiError } from '@/lib/api-error';
import { useDocumentTitle } from '@/hooks/use-document-title';

type EditorState = {
  title: string;
  category: TrainingCategory;
  startDate: string;
  format: TrainingFormat;
  hours: string;
  instructor: string;
  city: string;
  description: string;
  strengths: readonly string[];
  syllabusPdf: string;
  formSlug: string;
  isActive: boolean;
  order: string;
};

const INITIAL_STATE: EditorState = {
  title: '',
  category: 'PROGRAMIM',
  startDate: '',
  format: 'KLASE',
  hours: '',
  instructor: '',
  city: '',
  description: '',
  strengths: [],
  syllabusPdf: '',
  formSlug: '',
  isActive: true,
  order: '0',
};

/** `<input type="date">` wants `YYYY-MM-DD`; the API returns an ISO instant. */
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

/**
 * Empty text inputs become `null`, not `''`.
 *
 * The column is nullable and the public page hides sections with no content, so an empty
 * string would be a third state meaning "present but blank" — a syllabus link that is
 * there and broken instead of absent.
 */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function toPayload(state: EditorState): TrainingPayload {
  return {
    title: state.title.trim(),
    category: state.category,
    startDate: orNull(state.startDate),
    format: state.format,
    hours: state.hours.trim() === '' ? null : Number(state.hours),
    instructor: orNull(state.instructor),
    city: orNull(state.city),
    description: orNull(state.description),
    // Blank rows are the add-button's doing, not the admin's intent; the API strips
    // them too, but sending them would make the saved count disagree with what is typed.
    strengths: state.strengths.map((entry) => entry.trim()).filter((entry) => entry !== ''),
    syllabusPdf: orNull(state.syllabusPdf),
    formSlug: state.formSlug,
    isActive: state.isActive,
    order: state.order.trim() === '' ? 0 : Number(state.order),
  };
}

/** Client-side pre-flight only — the API validates all of this again. */
function validate(state: EditorState): string | null {
  if (state.title.trim().length === 0) {
    return 'Titulli është i detyrueshëm.';
  }
  if (state.formSlug.trim().length === 0) {
    return 'Zgjidh formën e aplikimit.';
  }
  if (state.hours.trim() !== '' && !Number.isFinite(Number(state.hours))) {
    return 'Orët duhet të jenë numër.';
  }
  if (state.order.trim() !== '' && !Number.isFinite(Number(state.order))) {
    return 'Radha duhet të jetë numër.';
  }
  return null;
}

export default function TrainingEditorPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  useDocumentTitle(isEditing ? 'Ndrysho trajnimin' : 'Trajnim i ri');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [state, setState] = useState<EditorState>(INITIAL_STATE);
  const [validationError, setValidationError] = useState<string | null>(null);
  /** Set only after a CREATE, to show the "here is your page" panel. */
  const [created, setCreated] = useState<Training | null>(null);

  const trainingQuery = useQuery({
    queryKey: queryKeys.trainings.detail(id ?? ''),
    queryFn: () => getTraining(id as string),
    enabled: isEditing,
  });

  const formOptionsQuery = useQuery({
    queryKey: queryKeys.trainings.formOptions,
    queryFn: getFormOptions,
  });

  useEffect(() => {
    const training = trainingQuery.data;
    if (!training) {
      return;
    }

    setState({
      title: training.title,
      category: training.category,
      startDate: toDateInput(training.startDate),
      format: training.format,
      hours: training.hours === null ? '' : String(training.hours),
      instructor: training.instructor ?? '',
      city: training.city ?? '',
      description: training.description ?? '',
      strengths: training.strengths,
      syllabusPdf: training.syllabusPdf ?? '',
      formSlug: training.formSlug,
      isActive: training.isActive,
      order: String(training.order),
    });
  }, [trainingQuery.data]);

  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]): void =>
    setState((previous) => ({ ...previous, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: (payload: TrainingPayload) =>
      isEditing ? updateTraining(id as string, payload) : createTraining(payload),
    onSuccess: (training) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });

      if (isEditing) {
        toast.success('Trajnimi u ruajt.');
        navigate(ROUTES.TRAININGS);
        return;
      }

      setCreated(training);
    },
    onError: (error: unknown) => toast.error(describeApiError(error)),
  });

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();

    const problem = validate(state);
    if (problem) {
      setValidationError(problem);
      return;
    }

    setValidationError(null);
    saveMutation.mutate(toPayload(state));
  };

  if (isEditing && trainingQuery.isPending) {
    return <LoadingRows />;
  }

  if (isEditing && trainingQuery.isError) {
    return (
      <ErrorState error={trainingQuery.error} onRetry={() => void trainingQuery.refetch()} />
    );
  }

  if (created) {
    const url = publicTrainingUrl(created.slug);

    return (
      <>
        <PageHeader title="Trajnimi u krijua" description={created.title} />
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Faqja e trajnimit është gati.
            </p>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Slug-u i gjeneruar</p>
              <p className="font-mono text-sm">{created.slug}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  Shiko faqen
                </a>
              </Button>
              <Button variant="outline" onClick={() => navigate(ROUTES.TRAINING_EDIT(created.id))}>
                Vazhdo ndryshimin
              </Button>
              <Button onClick={() => navigate(ROUTES.TRAININGS)}>Kthehu te trajnimet</Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const isSaving = saveMutation.isPending;
  const formOptions = formOptionsQuery.data ?? [];
  /* A form that was switched off after this training was saved is no longer offered by
     the dropdown, which would silently reset the field on the next save. Surfaced. */
  const linkedFormMissing =
    isEditing &&
    state.formSlug !== '' &&
    formOptionsQuery.isSuccess &&
    !formOptions.some((option) => option.slug === state.formSlug);

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title={isEditing ? 'Ndrysho trajnimin' : 'Krijo trajnim të ri'}
        description="Kartela shfaqet në listën e trajnimeve; pjesa tjetër ndërton faqen e trajnimit."
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => navigate(ROUTES.TRAININGS)}
            >
              Anulo
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Duke ruajtur…' : 'Ruaj'}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {validationError ? (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {validationError}
          </p>
        ) : null}

        {/* ---------- 1. Card ---------- */}
        <Card>
          <CardHeader>
            <CardTitle>Kartela e trajnimit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="training-title">Titulli</Label>
              <Input
                id="training-title"
                value={state.title}
                disabled={isSaving}
                placeholder="p.sh. Ethical Hacking & Penetration Testing"
                onChange={(event) => update('title', event.target.value)}
              />
              {!isEditing ? (
                <p className="text-xs text-muted-foreground">
                  Slug-u gjenerohet automatikisht nga titulli.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-category">Kategoria</Label>
              <Select
                value={state.category}
                onValueChange={(value) => update('category', value as TrainingCategory)}
              >
                <SelectTrigger id="training-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {TRAINING_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-format">Formati</Label>
              <Select
                value={state.format}
                onValueChange={(value) => update('format', value as TrainingFormat)}
              >
                <SelectTrigger id="training-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {TRAINING_FORMAT_LABELS[format]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-start">Fillimi</Label>
              <Input
                id="training-start"
                type="date"
                value={state.startDate}
                disabled={isSaving}
                onChange={(event) => update('startDate', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-hours">Orët</Label>
              <Input
                id="training-hours"
                type="number"
                min={1}
                value={state.hours}
                disabled={isSaving}
                placeholder="p.sh. 60"
                onChange={(event) => update('hours', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-instructor">Ligjëruesi</Label>
              <Input
                id="training-instructor"
                value={state.instructor}
                disabled={isSaving}
                onChange={(event) => update('instructor', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-city">Qyteti</Label>
              <Input
                id="training-city"
                value={state.city}
                disabled={isSaving}
                placeholder="p.sh. Prishtinë ose Online"
                onChange={(event) => update('city', event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ---------- 2. Detail page ---------- */}
        <Card>
          <CardHeader>
            <CardTitle>Faqja e trajnimit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Të gjitha janë opsionale. Pjesët që i lë bosh nuk shfaqen fare në faqe.
            </p>

            <div className="space-y-2">
              <Label htmlFor="training-description">Përshkrimi</Label>
              <Textarea
                id="training-description"
                rows={8}
                value={state.description}
                disabled={isSaving}
                placeholder="Çfarë do të mësojë pjesëmarrësi…"
                onChange={(event) => update('description', event.target.value)}
              />
            </div>

            <StrengthListEditor
              strengths={state.strengths}
              disabled={isSaving}
              onChange={(strengths) => update('strengths', strengths)}
            />

            <SyllabusPdfField
              value={state.syllabusPdf}
              disabled={isSaving}
              onChange={(url) => update('syllabusPdf', url)}
            />
          </CardContent>
        </Card>

        {/* ---------- 3. Application form + publishing ---------- */}
        <Card>
          <CardHeader>
            <CardTitle>Forma e aplikimit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="training-form">Forma</Label>
              <Select
                value={state.formSlug}
                onValueChange={(value) => update('formSlug', value)}
              >
                <SelectTrigger id="training-form">
                  <SelectValue placeholder="Zgjidh një formë…" />
                </SelectTrigger>
                <SelectContent>
                  {formOptions.map((option) => (
                    <SelectItem key={option.slug} value={option.slug}>
                      {option.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Butoni «Apliko» te faqja e trajnimit dërgon te kjo formë.
              </p>

              {linkedFormMissing ? (
                <p className="flex items-start gap-2 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Forma e lidhur («{state.formSlug}») nuk është më aktive. Zgjidh një tjetër,
                  përndryshe aplikimi nga kjo faqe nuk do të funksionojë.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-order">Radha</Label>
              <Input
                id="training-order"
                type="number"
                min={0}
                value={state.order}
                disabled={isSaving}
                onChange={(event) => update('order', event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Më e vogla shfaqet e para në listën publike.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-8">
              <Switch
                id="training-active"
                checked={state.isActive}
                disabled={isSaving}
                onCheckedChange={(checked) => update('isActive', checked)}
              />
              <Label htmlFor="training-active">Aktive</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
