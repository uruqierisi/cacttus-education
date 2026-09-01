/**
 * Tiptap rich-text editor for blog posts.
 *
 * Output is HTML, which is what the API stores — and the API runs `sanitize-html` over
 * it on save. That server-side pass is the real defence: this toolbar only limits what
 * is convenient to produce, and a determined editor can paste anything. Never treat the
 * restricted toolbar as a security boundary.
 *
 * BODY IMAGES go through the same `/api/admin/uploads` endpoint as the cover image — same
 * `uploadImage` helper, same 5 MB cap, same magic-byte sniff and sharp re-encode on the
 * server. Nothing about an inline image is a second upload path; the only difference is
 * where the returned URL lands: an `<img>` node inside `Post.content` instead of the
 * `coverImage` column. Both sanitiser passes (server-side `sanitizeRichText` on write,
 * DOMPurify on the marketing site before render) already allow `img` with `src`/`alt`, so
 * inserting one needs no widening of either allowlist.
 *
 * The component is CONTROLLED from the outside but does not re-render on every
 * keystroke: `onChange` pushes HTML up, and the effect below only pushes content back
 * DOWN when the incoming value genuinely differs from what the editor already holds.
 * Without that guard the round-trip would reset the cursor to the top of the document
 * on every character typed.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImageIcon,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { describeApiError } from '@/lib/api-error';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, uploadImage } from '@/api/uploads.api';

/** Schemes allowed in a link or image URL. Anything else is dropped. */
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:'];

const MEGABYTE = 1024 * 1024;

/**
 * Alt text derived from the file name — `foto-e-diplomimit.jpg` becomes
 * "foto e diplomimit".
 *
 * A weak default, deliberately: an empty `alt` on a body image is worse for a screen
 * reader than an imperfect one, and the editor can always retype it. Returns '' when the
 * name carries nothing usable, which Tiptap renders as no attribute at all.
 */
function toAltText(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

function isAcceptedType(file: File): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

/**
 * Reject `javascript:` and `data:` URLs before they reach the document.
 *
 * Tiptap's Link extension has its own protocol allowlist, but the image URL below is
 * inserted by hand from a prompt, so the check lives here where BOTH paths use it.
 */
function toSafeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    return SAFE_PROTOCOLS.includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

type ToolbarButtonProps = {
  readonly icon: typeof Bold;
  readonly label: string;
  readonly isActive?: boolean;
  readonly isDisabled?: boolean;
  readonly onClick: () => void;
};

function ToolbarButton({
  icon: Icon,
  label,
  isActive = false,
  isDisabled = false,
  onClick,
}: ToolbarButtonProps): JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', isActive && 'bg-accent text-accent-foreground')}
      // `aria-pressed` is what tells a screen reader the mark is currently ON —
      // the background tint alone communicates nothing.
      aria-pressed={isActive}
      aria-label={label}
      title={label}
      disabled={isDisabled}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

function Toolbar({ editor }: { editor: Editor }): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const isUploading = uploadPercent !== null;

  const setLink = useCallback(() => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const input = window.prompt('Adresa e linkut (http, https ose mailto):', previous ?? 'https://');

    if (input === null) {
      return;
    }

    if (input.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    const safe = toSafeUrl(input);
    if (!safe) {
      window.alert('Linku nuk është i vlefshëm. Lejohen vetëm http, https dhe mailto.');
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: safe }).run();
  }, [editor]);

  const addImageFromUrl = useCallback(() => {
    const input = window.prompt('Adresa e fotos (https):', 'https://');

    if (input === null) {
      return;
    }

    const safe = toSafeUrl(input);
    if (!safe) {
      window.alert('Adresa e fotos nuk është e vlefshme.');
      return;
    }

    editor.chain().focus().setImage({ src: safe }).run();
  }, [editor]);

  /**
   * Upload a picked file through the SAME `/api/admin/uploads` endpoint the cover image
   * uses, then drop the returned URL in at the cursor as an image node.
   *
   * The type/size checks here are a courtesy that saves a round trip; the server is what
   * actually decides, by sniffing magic bytes and re-encoding through sharp. Both messages
   * therefore mirror the server's limits rather than defining them — and on rejection the
   * server's own Albanian message is what the toast shows (`describeApiError`).
   */
  const uploadAndInsertImage = useCallback(
    async (file: File): Promise<void> => {
      if (!isAcceptedType(file)) {
        toast.error('Formati i fotos nuk lejohet. Përdor PNG, JPG, WEBP ose GIF.');
        return;
      }

      if (file.size > MAX_IMAGE_BYTES) {
        const size = (file.size / MEGABYTE).toFixed(1);
        toast.error(`Fotoja është ${size} MB. Maksimumi i lejuar është 5 MB.`);
        return;
      }

      setUploadPercent(0);

      try {
        const uploaded = await uploadImage(file, setUploadPercent);

        // The editor page can be closed mid-upload; inserting into a torn-down view
        // throws. `focus()` restores the selection the toolbar click moved away from.
        if (editor.isDestroyed) {
          return;
        }

        editor
          .chain()
          .focus()
          .setImage({ src: uploaded.url, alt: toAltText(file.name) })
          .run();
        toast.success('Fotoja u shtua në artikull.');
      } catch (error: unknown) {
        toast.error(describeApiError(error));
      } finally {
        setUploadPercent(null);
        // Reset so re-picking the SAME file fires `change` again.
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [editor],
  );

  return (
    <div
      role="toolbar"
      aria-label="Formatimi i tekstit"
      className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5"
    >
      <ToolbarButton
        icon={Bold}
        label="Trash"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label="Pjerrët"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ToolbarButton
        icon={Heading2}
        label="Titull i nivelit 2"
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={Heading3}
        label="Titull i nivelit 3"
        isActive={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ToolbarButton
        icon={List}
        label="Listë me pika"
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label="Listë me numra"
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={Quote}
        label="Citat"
        isActive={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        icon={Code}
        label="Bllok kodi"
        isActive={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ToolbarButton
        icon={Link2}
        label="Vendos link"
        isActive={editor.isActive('link')}
        onClick={setLink}
      />
      <ToolbarButton
        icon={Link2Off}
        label="Hiq linkun"
        isDisabled={!editor.isActive('link')}
        onClick={() => editor.chain().focus().unsetLink().run()}
      />
      {/*
        Hidden input rather than a visible one: the toolbar is a row of icon buttons and a
        file control cannot be styled into that row. `accept` mirrors the server allowlist.
      */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void uploadAndInsertImage(file);
          }
        }}
      />
      <ToolbarButton
        icon={ImageIcon}
        label={isUploading ? 'Duke ngarkuar foton…' : 'Shto foto'}
        isDisabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      />
      <ToolbarButton
        icon={ImagePlus}
        label="Shto foto nga URL"
        isDisabled={isUploading}
        onClick={addImageFromUrl}
      />

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ToolbarButton
        icon={Undo2}
        label="Zhbëj"
        isDisabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={Redo2}
        label="Ribëj"
        isDisabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />

      {isUploading ? (
        <div className="mt-1.5 w-full space-y-1" role="status" aria-live="polite">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Duke ngarkuar foton… {uploadPercent}%</p>
        </div>
      ) : null}
    </div>
  );
}

type RichTextEditorProps = {
  readonly value: string;
  readonly onChange: (html: string) => void;
  readonly ariaLabel?: string;
};

export function RichTextEditor({
  value,
  onChange,
  ariaLabel = 'Përmbajtja e artikullit',
}: RichTextEditorProps): JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // The API's sanitiser allows h1–h3; h1 is reserved for the post title, so the
        // body starts at h2 and the toolbar offers nothing above it.
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: {
          // Defence in depth for the rendered post on the public site.
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Shkruaj artikullin këtu…' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'rich-text min-h-[22rem] w-full px-4 py-3 focus:outline-none',
        'aria-label': ariaLabel,
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      // Tiptap emits "<p></p>" for a document the user has emptied; the API treats
      // that as content, so it is normalised to a genuinely empty string here.
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Downward sync, guarded — see the header note about the cursor.
  useEffect(() => {
    if (!editor) {
      return;
    }
    const current = editor.getHTML();
    const incoming = value === '' ? '<p></p>' : value;

    if (current !== incoming) {
      editor.commands.setContent(incoming, false);
    }
    // `editor` is intentionally the only other dep: reacting to `current` would make
    // this effect fight the user's own typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  // Destroying the ProseMirror view on unmount is what prevents a detached DOM tree
  // (and its plugin listeners) leaking every time the editor page closes.
  useEffect(() => () => editor?.destroy(), [editor]);

  if (!editor) {
    return (
      <div className="min-h-[24rem] animate-pulse rounded-lg border border-border bg-muted/40" />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
