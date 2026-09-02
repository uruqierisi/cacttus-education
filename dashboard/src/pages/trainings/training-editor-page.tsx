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
import { AlertTriangle, CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { FormActions } from '@/components/common/form-actions';
import { ErrorState, LoadingRows } from '@/components/common/state-views';
import { CoverImageField } from '@/components/posts/cover-image-field';
import { JobRoleTagInput } from '@/components/trainings/job-role-tag-input';
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
import type { Training, TrainingFormat } from '@/api/types';
import { listTrainingCategories } from '@/api/training-categories.api';
import { CategoryManagerDialog } from '@/components/trainings/category-manager-dialog';
import {
  ROUTES,
  TRAINING_CITIES,
  TRAINING_STATUSES,
  TRAINING_STATUS_LABELS,
  type TrainingStatusValue,
  TRAINING_FORMATS,
  TRAINING_FORMAT_LABELS,
  publicTrainingUrl,
} from '@/lib/constants';
import { describeApiError } from '@/lib/api-error';
import { useDocumentTitle } from '@/hooks/use-document-title';

/**
 * Matches the API's `FIELD_LIMITS.INSTRUCTOR_BIO_MAX`.
 *
 * Duplicated rather than imported because the dashboard has no build-time dependency on
 * the backend package. The two must be changed together; the API is the one that actually
 * rejects, this only stops the textarea accepting what the API will refuse.
 */
const INSTRUCTOR_BIO_MAX = 5_000;

type EditorState = {
  title: string;
  /**
   * A category ROW ID, not an enum member. Empty until the categories have loaded (on
   * create) or the training has (on edit) — `<Select>` treats '' as "nothing chosen",
   * which is exactly the state a brand-new editor is in before the list arrives.
   */
  categoryId: string;
  startDate: string;
  format: TrainingFormat;
  hours: string;
  instructor: string;
  instructorPhoto: string;
  instructorBio: string;
  city: string;
  price: string;
  description: string;
  strengths: readonly string[];
  jobRoles: readonly string[];
  status: TrainingStatusValue;
  syllabusPdf: string;
  formSlug: string;
  isActive: boolean;
  order: string;
};

const INITIAL_STATE: EditorState = {
  title: '',
  categoryId: '',
  startDate: '',
  format: 'KLASE',
  hours: '',
  instructor: '',
  instructorPhoto: '',
  instructorBio: '',
  city: '',
  price: '',
  description: '',
  strengths: [],
  jobRoles: [],
  status: 'ACTIVE',
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
/**
 * The <Select> value standing in for "no city".
 *
 * Radix refuses "" as an item value, so the empty choice needs a token. It never leaves
 * this file: it maps to `''` in state, which `orNull` turns into `null` on save, so the
 * API still receives null and the column keeps its two states (a city, or nothing).
 */
const NO_CITY_VALUE = '__no_city__';

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function toPayload(state: EditorState): TrainingPayload {
  return {
    title: state.title.trim(),
    categoryId: state.categoryId,
    startDate: orNull(state.startDate),
    format: state.format,
    hours: state.hours.trim() === '' ? null : Number(state.hours),
    instructor: orNull(state.instructor),
    instructorPhoto: orNull(state.instructorPhoto),
    instructorBio: orNull(state.instructorBio),
    city: orNull(state.city),
    price: state.price.trim() === '' ? null : Number(state.price),
    description: orNull(state.description),
    // Blank rows are the add-button's doing, not the admin's intent; the API strips
    // them too, but sending them would make the saved count disagree with what is typed.
    strengths: state.strengths.map((entry) => entry.trim()).filter((entry) => entry !== ''),
    // Always sent, even when empty: the column is a scalar list with no null state, so
    // `[]` is how an admin removes the last role.
    jobRoles: state.jobRoles,
    status: state.status,
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
  if (state.price.trim() !== '' && !Number.isFinite(Number(state.price))) {
    return 'Çmimi duhet të jetë numër.';
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

  const categoriesQuery = useQuery({
    queryKey: queryKeys.trainingCategories.all,
    queryFn: listTrainingCategories,
  });

  const [isCategoryManagerOpen, setCategoryManagerOpen] = useState(false);

  /*
   * Preselect the first category on a NEW training once the list lands.
   *
   * `state.categoryId === ''` guards it, so it fires once and never overwrites a choice
   * the admin has already made — including the one the manager dialog hands back after
   * creating a category. On an EDIT the training's own category has already been written
   * into state by the effect above, so this is a no-op there too.
   */
  useEffect(() => {
    const first = categoriesQuery.data?.[0];
    if (!first) {
      return;
    }
    setState((previous) =>
      previous.categoryId === '' ? { ...previous, categoryId: first.id } : previous,
    );
  }, [categoriesQuery.data]);

  useEffect(() => {
    const training = trainingQuery.data;
    if (!training) {
      return;
    }

    setState({
      title: training.title,
      categoryId: training.category.id,
      startDate: toDateInput(training.startDate),
      format: training.format,
      hours: training.hours === null ? '' : String(training.hours),
      instructor: training.instructor ?? '',
      instructorPhoto: training.instructorPhoto ?? '',
      instructorBio: training.instructorBio ?? '',
      city: training.city ?? '',
      price: training.price === null ? '' : String(training.price),
      description: training.description ?? '',
      strengths: training.strengths,
      jobRoles: training.jobRoles,
      status: training.status,
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
  /*
    "" means the admin chose "Pa qytet"; anything on TRAINING_CITIES is a normal choice.
    Anything ELSE is a legacy row saved while this field was free text — the select then
    shows nothing selected and the stored text is surfaced beneath it, rather than the
    control silently presenting a value the record does not hold.
  */
  const isKnownCity =
    state.city === '' || (TRAINING_CITIES as readonly string[]).includes(state.city);
  const formOptions = formOptionsQuery.data ?? [];
  /* The dropdown now lists inactive forms too, so a missing entry means the form was
     soft-deleted — the one case where the link really is broken and must be repointed. */
  const linkedFormMissing =
    isEditing &&
    state.formSlug !== '' &&
    formOptionsQuery.isSuccess &&
    !formOptions.some((option) => option.slug === state.formSlug);
  /* Selected but closed: the training still publishes, the apply box just shows the
     closed-applications notice until the form is switched back on. Not an error. */
  const linkedFormInactive = formOptions.some(
    (option) => option.slug === state.formSlug && !option.isActive,
  );

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title={isEditing ? 'Ndrysho trajnimin' : 'Krijo trajnim të ri'}
        description="Kartela shfaqet në listën e trajnimeve; pjesa tjetër ndërton faqen e trajnimit."
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
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="training-category">Kategoria</Label>
                {/*
                  The manager opens from HERE rather than from Cilësimet because that
                  page is ADMIN_ONLY while the API lets an EDITOR create and rename a
                  category — and because the moment you discover a category is missing is
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
                onValueChange={(value) => update('categoryId', value)}
                disabled={categoriesQuery.isPending || (categoriesQuery.data?.length ?? 0) === 0}
              >
                <SelectTrigger id="training-category">
                  <SelectValue placeholder="Zgjidh kategorinë" />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoriesQuery.data?.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Ende asnjë kategori — shtoni një para se ta ruani trajnimin.
                </p>
              ) : null}
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
              <Select
                value={isKnownCity ? (state.city === '' ? NO_CITY_VALUE : state.city) : undefined}
                onValueChange={(value) => update('city', value === NO_CITY_VALUE ? '' : value)}
              >
                <SelectTrigger id="training-city">
                  <SelectValue placeholder="Zgjidh qytetin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CITY_VALUE}>— Pa qytet —</SelectItem>
                  {TRAINING_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/*
                A training saved before this was a select can hold a city that is not on the
                list ("Kamenice", say). The select shows NOTHING selected in that case rather
                than quietly snapping to the nearest option, and the stored text is printed
                underneath so it is visible. `state.city` still holds it, so saving without
                touching this field preserves it — the value only changes if an option is
                actually picked.
              */}
              {!isKnownCity && (
                <p className="text-xs text-muted-foreground">
                  Vlera e ruajtur: {state.city} — zgjidh një opsion për ta ndryshuar.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Opsionale. Trajnimet online mund të lihen pa qytet.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-price">Çmimi (€)</Label>
              <Input
                id="training-price"
                type="number"
                min={0}
                value={state.price}
                disabled={isSaving}
                placeholder="p.sh. 250"
                onChange={(event) => update('price', event.target.value)}
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

            <JobRoleTagInput
              jobRoles={state.jobRoles}
              disabled={isSaving}
              onChange={(jobRoles) => update('jobRoles', jobRoles)}
            />

            <SyllabusPdfField
              value={state.syllabusPdf}
              disabled={isSaving}
              onChange={(url) => update('syllabusPdf', url)}
            />

            {/*
              The trainer block. Grouped here rather than beside "Ligjëruesi" in the card
              section because these two only ever render on the DETAIL page — the
              catalogue card shows the name alone. The name itself stays above, where the
              card that uses it is edited.
            */}
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-1">
                <Label>Fotoja e ligjëruesit</Label>
                <p className="text-xs text-muted-foreground">
                  Shfaqet majtas biografisë në fund të faqes së trajnimit.
                </p>
              </div>

              <CoverImageField
                value={state.instructorPhoto}
                disabled={isSaving}
                inputId="training-instructor-photo"
                previewAlt="Pamje paraprake e fotos së ligjëruesit"
                onChange={(url) => update('instructorPhoto', url)}
              />

              <div className="space-y-2">
                <Label htmlFor="training-instructor-bio">Biografia e ligjëruesit</Label>
                <Textarea
                  id="training-instructor-bio"
                  rows={4}
                  maxLength={INSTRUCTOR_BIO_MAX}
                  value={state.instructorBio}
                  disabled={isSaving}
                  placeholder="Dy-tri fjali: përvoja, ku punon, çfarë e bën të veçantë…"
                  onChange={(event) => update('instructorBio', event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {state.instructorBio.trim().length}/{INSTRUCTOR_BIO_MAX} karaktere.
                </p>
              </div>
            </div>
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
                      {option.isActive ? option.title : `${option.title} (e mbyllur)`}
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
                  Forma e lidhur («{state.formSlug}») është fshirë. Zgjidh një tjetër,
                  përndryshe aplikimi nga kjo faqe nuk do të funksionojë.
                </p>
              ) : null}

              {linkedFormInactive ? (
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Kjo formë është e mbyllur për momentin. Trajnimi publikohet normalisht;
                  te faqja e tij shfaqet njoftimi që aplikimet janë mbyllur, derisa forma
                  të rihapet.
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

            {/*
              Lifecycle. A two-option group rather than a Switch, because a switch reads
              as on/off and these are two NAMED states — "off" is not a fair description
              of a training that finished. Sits above the publish switch so the pair reads
              as "what stage is it in" then "is it visible", which are different questions.
            */}
            <div className="space-y-2 pt-8">
              <Label>Statusi</Label>
              <div
                role="group"
                aria-label="Statusi i trajnimit"
                className="grid grid-cols-2 gap-2"
              >
                {TRAINING_STATUSES.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={state.status === value ? 'default' : 'outline'}
                    size="sm"
                    disabled={isSaving}
                    aria-pressed={state.status === value}
                    onClick={() => update('status', value)}
                  >
                    {TRAINING_STATUS_LABELS[value]}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                «Përfunduar» e shënon trajnimin si të mbaruar. Mbetet i dukshëm në faqen
                publike, vetëm me etiketë tjetër.
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

      <FormActions
        onCancel={() => navigate(ROUTES.TRAININGS)}
        isSaving={isSaving}
        saveLabel="Ruaj"
      />

      {/*
        Rendered inside the form only in the JSX tree — Radix portals the dialog to
        document.body, so the create/rename inputs inside it never become nested form
        controls of this one, and Enter in them cannot submit the training.

        `onCreated` selects what was just added: an admin who opens this because the
        category they wanted is missing should not then have to find it in the dropdown.
      */}
      <CategoryManagerDialog
        open={isCategoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        onCreated={(category) => update('categoryId', category.id)}
      />
    </form>
  );
}
