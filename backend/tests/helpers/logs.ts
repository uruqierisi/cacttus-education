/**
 * Capture the application logger's output instead of letting it flood the reporter.
 *
 * `src/lib/logger.ts` writes a JSON blob straight to `process.stdout` / `process.stderr`
 * for every request, and in non-production it pretty-prints. Left alone that buries the
 * vitest reporter under thousands of lines.
 *
 * The interception is surgical: only chunks that are recognisably a logger entry are
 * swallowed; everything else (the reporter, prisma's own notices) is passed through
 * untouched. Captured entries are kept so tests can assert on them — in particular that
 * a submitted password never reaches the logs.
 */
type WriteFn = typeof process.stdout.write;

export type CapturedLog = {
  readonly stream: 'stdout' | 'stderr';
  readonly raw: string;
  readonly entry: Record<string, unknown> | null;
};

const captured: CapturedLog[] = [];

let originalStdout: WriteFn | null = null;
let originalStderr: WriteFn | null = null;

function looksLikeLoggerEntry(text: string): boolean {
  return text.trimStart().startsWith('{') && text.includes('"level"');
}

function parse(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    // A chunk that failed to parse is still recorded verbatim above; returning null
    // here just means "no structured view of it". Nothing is hidden.
    return null;
  }
}

function intercept(stream: 'stdout' | 'stderr', original: WriteFn): WriteFn {
  const wrapped = ((chunk: unknown, ...rest: unknown[]): boolean => {
    const text =
      typeof chunk === 'string'
        ? chunk
        : Buffer.isBuffer(chunk)
          ? chunk.toString('utf8')
          : '';

    if (text.length > 0 && looksLikeLoggerEntry(text)) {
      captured.push({ stream, raw: text, entry: parse(text) });

      const callback = rest.find((argument) => typeof argument === 'function');
      if (typeof callback === 'function') {
        (callback as () => void)();
      }
      return true;
    }

    return (original as (...args: unknown[]) => boolean).call(
      process[stream],
      chunk,
      ...rest,
    );
  }) as unknown as WriteFn;

  return wrapped;
}

export function installLogCapture(): void {
  if (originalStdout !== null) {
    return;
  }

  originalStdout = process.stdout.write.bind(process.stdout) as WriteFn;
  originalStderr = process.stderr.write.bind(process.stderr) as WriteFn;

  process.stdout.write = intercept('stdout', originalStdout);
  process.stderr.write = intercept('stderr', originalStderr);
}

export function restoreLogCapture(): void {
  if (originalStdout !== null) {
    process.stdout.write = originalStdout;
    originalStdout = null;
  }
  if (originalStderr !== null) {
    process.stderr.write = originalStderr;
    originalStderr = null;
  }
}

export function clearCapturedLogs(): void {
  captured.length = 0;
}

export function capturedLogs(): readonly CapturedLog[] {
  return captured;
}

/** Everything the logger has emitted since the last clear, as one searchable string. */
export function capturedLogText(): string {
  return captured.map((log) => log.raw).join('\n');
}
