/**
 * "Shkarko planprogramin" — the syllabus PDF upload.
 *
 * Mirrors `posts/cover-image-field.tsx`: the field's value is a plain URL string, so an
 * uploaded file and a pasted link are the same shape by the time they reach
 * `syllabusPdf`. Client-side type/size checks are a COURTESY for instant feedback — the
 * server re-validates by magic bytes (`lib/pdf-type.ts`) and ignores what the browser
 * claims.
 *
 * No preview thumbnail, unlike the image field: rendering the PDF would mean embedding
 * it, and the whole delivery design says a syllabus is DOWNLOADED, never rendered
 * in-page (`Content-Disposition: attachment`). The link opens in a new tab, which
 * triggers that download.
 */
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileText, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { describeApiError } from '@/lib/api-error';
import { ACCEPTED_PDF_TYPES, MAX_PDF_BYTES, uploadPdf } from '@/api/uploads.api';

type SyllabusPdfFieldProps = {
  readonly value: string;
  readonly onChange: (url: string) => void;
  readonly disabled?: boolean;
};

const MEGABYTE = 1024 * 1024;
const HTTP_URL = /^https?:\/\//i;

export function SyllabusPdfField({
  value,
  onChange,
  disabled = false,
}: SyllabusPdfFieldProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const isUploading = progress !== null;
  const trimmed = value.trim();
  const hasFile = trimmed !== '' && HTTP_URL.test(trimmed);

  const handleFile = async (file: File): Promise<void> => {
    if (!(ACCEPTED_PDF_TYPES as readonly string[]).includes(file.type)) {
      toast.error('Lejohet vetëm PDF.');
      return;
    }

    if (file.size > MAX_PDF_BYTES) {
      const size = (file.size / MEGABYTE).toFixed(1);
      toast.error(`Skeda është ${size} MB. Maksimumi i lejuar është 10 MB.`);
      return;
    }

    setProgress(0);

    try {
      const uploaded = await uploadPdf(file, setProgress);
      onChange(uploaded.url);
      toast.success('Planprogrami u ngarkua.');
    } catch (error: unknown) {
      // Surfaces the server's Albanian message (not a PDF, too large) rather than a
      // generic failure string.
      toast.error(describeApiError(error));
    } finally {
      setProgress(null);
      // Clearing the input lets the SAME file be picked again after a failure.
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="training-syllabus">Shkarko planprogramin (PDF)</Label>

      <input
        ref={inputRef}
        id="training-syllabus-file"
        type="file"
        accept="application/pdf"
        className="sr-only"
        disabled={disabled || isUploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
      />

      {hasFile ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
          <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm text-primary underline underline-offset-2"
          >
            Shiko planprogramin e ngarkuar
          </a>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => onChange('')}
          >
            <Trash2 />
            Hiq
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          {isUploading ? `Duke ngarkuar… ${progress}%` : hasFile ? 'Zëvendëso skedën' : 'Ngarko PDF'}
        </Button>
        <span className="text-xs text-muted-foreground">Maksimum 10 MB.</span>
      </div>

      <Input
        id="training-syllabus"
        value={value}
        disabled={disabled || isUploading}
        placeholder="…ose ngjit një link të drejtpërdrejtë drejt PDF-së"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
