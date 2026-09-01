/**
 * "Fotoja e ballinës" — upload from disk, with URL paste kept as a fallback.
 *
 * The field's value is still a plain URL string, exactly as before, so nothing about the
 * post create/update flow changes: an uploaded file and a pasted link are the same shape
 * by the time they reach `coverImage`. That is why upload could be added without
 * touching the Post model, its schema, or the public feed.
 *
 * Client-side type/size checks below are a COURTESY, not a control — they give instant
 * feedback instead of a round trip. The server re-validates by magic bytes and re-encodes
 * every image regardless of what the browser claims.
 */
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { describeApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  uploadImage,
  type UploadedImage,
} from '@/api/uploads.api';

type CoverImageFieldProps = {
  readonly value: string;
  readonly onChange: (url: string) => void;
  readonly disabled?: boolean;
  /**
   * Both default to the post-cover wording this field was written for, so every existing
   * call site is unchanged. They exist because the upload/paste/preview behaviour is
   * identical wherever an image URL is edited — the training editor's trainer portrait
   * reuses it verbatim — and only the label and the alt text are ever page-specific.
   * A duplicated copy of this component would be the same code with two strings changed.
   */
  readonly inputId?: string;
  readonly previewAlt?: string;
};

const MEGABYTE = 1024 * 1024;
const HTTP_URL = /^https?:\/\//i;

function isAcceptedType(file: File): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

export function CoverImageField({
  value,
  onChange,
  disabled = false,
  inputId = 'post-cover',
  previewAlt = 'Pamje paraprake e ballinës',
}: CoverImageFieldProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const [dimensions, setDimensions] = useState<Pick<UploadedImage, 'width' | 'height'> | null>(null);

  const isUploading = progress !== null;
  const trimmed = value.trim();
  const hasPreview = trimmed !== '' && HTTP_URL.test(trimmed);

  const handleFile = async (file: File): Promise<void> => {
    if (!isAcceptedType(file)) {
      toast.error('Formati i fotos nuk lejohet. Përdor PNG, JPG, WEBP ose GIF.');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      const size = (file.size / MEGABYTE).toFixed(1);
      toast.error(`Fotoja është ${size} MB. Maksimumi i lejuar është 5 MB.`);
      return;
    }

    setProgress(0);
    setIsBroken(false);

    try {
      const uploaded = await uploadImage(file, setProgress);
      onChange(uploaded.url);
      setDimensions({ width: uploaded.width, height: uploaded.height });
      toast.success('Fotoja u ngarkua.');
    } catch (error: unknown) {
      // describeApiError surfaces the server's Albanian message (wrong type, too large,
      // corrupt file) rather than a generic failure string.
      toast.error(describeApiError(error));
    } finally {
      setProgress(null);
      // Reset so re-picking the SAME file fires `change` again.
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) {
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const clear = (): void => {
    onChange('');
    setDimensions(null);
    setIsBroken(false);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
      />

      {hasPreview ? (
        <div className="space-y-2">
          {isBroken ? (
            <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              Fotoja nuk u ngarkua. Kontrollo adresën.
            </p>
          ) : (
            <img
              src={trimmed}
              alt={previewAlt}
              loading="lazy"
              onError={() => setIsBroken(true)}
              className="aspect-video w-full rounded-md border object-cover"
            />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              onClick={() => inputRef.current?.click()}
            >
              Zëvendëso
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isUploading}
              onClick={clear}
            >
              Hiq foton
            </Button>
            {dimensions ? (
              <span className="ml-auto text-xs text-muted-foreground">
                {dimensions.width}×{dimensions.height}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled && !isUploading) {
              setIsDragging(true);
            }
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-input',
            (disabled || isUploading) && 'opacity-60',
          )}
        >
          <p className="text-sm text-muted-foreground">Tërhiq foton këtu</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? 'Duke ngarkuar…' : 'Ngarko foto'}
          </Button>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP ose GIF — deri në 5 MB</p>
        </div>
      )}

      {isUploading ? (
        <div className="space-y-1" role="status" aria-live="polite">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Duke ngarkuar… {progress}%</p>
        </div>
      ) : null}

      <div className="space-y-1 border-t pt-3">
        <Label htmlFor={inputId} className="text-xs text-muted-foreground">
          ose ngjit një URL
        </Label>
        <Input
          id={inputId}
          type="url"
          placeholder="https://…"
          value={value}
          disabled={disabled || isUploading}
          onChange={(event) => {
            setIsBroken(false);
            setDimensions(null);
            onChange(event.target.value);
          }}
        />
      </div>
    </div>
  );
}
