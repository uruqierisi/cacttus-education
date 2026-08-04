/**
 * Minimal structured logger.
 *
 * A dependency-free JSON logger keeps the container output machine-parseable on
 * Railway without pulling in pino/winston for what is a handful of log lines.
 */
import { env } from '../config/env';
import { REDACTED_PLACEHOLDER, isDeniedKey, looksLikeSecretValue } from './redact';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: LogLevel = env.isProduction ? 'info' : 'debug';

/**
 * Redaction depth.
 *
 * The previous implementation was SHALLOW — it only inspected top-level keys — so
 * `logger.error('login failed', { input })` printed the whole login body, password
 * included. It also compared raw `toLowerCase()` keys against a list written in
 * squashed form, so `password_hash` and `x-access-token` never matched anything. Both
 * holes are closed by walking the object and by matching through `redact.ts`'s
 * normalising `isDeniedKey`.
 *
 * The walk is depth-bounded rather than cycle-tracked: a log context is a small,
 * hand-built object, and a bound is cheaper and harder to get wrong than a WeakSet.
 */
const MAX_REDACT_DEPTH = 4;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function redactValue(value: unknown, depth: number): unknown {
  if (typeof value === 'string') {
    return looksLikeSecretValue(value) ? REDACTED_PLACEHOLDER : value;
  }

  // Both satisfy `isPlainObject` but have no useful own enumerable keys, so walking
  // them would flatten a Date to `{}` and an Error to `{}`. Handled before the walk.
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (depth >= MAX_REDACT_DEPTH) {
    return isPlainObject(value) || Array.isArray(value) ? '[truncated]' : value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, depth + 1));
  }

  if (isPlainObject(value)) {
    return redact(value, depth + 1);
  }

  return value;
}

function redact(context: Record<string, unknown>, depth = 0): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) =>
      isDeniedKey(key) ? [key, REDACTED_PLACEHOLDER] : [key, redactValue(value, depth)],
    ),
  );
}

function write(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[MIN_LEVEL]) {
    return;
  }

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...redact(context),
  };

  const line = env.isProduction ? JSON.stringify(entry) : JSON.stringify(entry, null, 2);

  if (level === 'error') {
    process.stderr.write(`${line}\n`);
    return;
  }
  process.stdout.write(`${line}\n`);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => write('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => write('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => write('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => write('error', message, context),
};
