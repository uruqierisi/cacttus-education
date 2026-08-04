/**
 * Password hashing.
 *
 * `bcryptjs` (pure JS, same algorithm and hash format as the native `bcrypt`
 * binding) is used so the project installs cleanly on Windows dev machines and in
 * slim Docker images without node-gyp / build tooling.
 */
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

/**
 * A constant-cost hash compared against when the supplied email does not exist.
 * Comparing against it keeps failed-login latency identical whether or not the
 * account is real, which removes the timing side channel used to enumerate users.
 */
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.7Q3qBYlj4S7WhVOoUAsdWzUJv6xX3zK';

export function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, env.BCRYPT_ROUNDS);
}

export function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/** Burn the same amount of CPU as a real comparison, then always fail. */
export async function verifyAgainstDummyHash(plaintext: string): Promise<false> {
  await bcrypt.compare(plaintext, DUMMY_HASH);
  return false;
}
