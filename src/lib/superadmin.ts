/**
 * Superadmin allowlist. Any email here is elevated to `admin` (and `active`) on
 * every sign-in, so it can reach every role area — admin, vendor, courier — and
 * still use the normal client ordering flow. admin is a role superset
 * (see hasRole), so one elevated account exercises all roles.
 *
 * Configure extra emails with the SUPERADMIN_EMAILS env var (comma-separated);
 * the default below is kept so the project owner always has access.
 */
const DEFAULT_SUPERADMINS = ["emmanueljessequarcoo@gmail.com"];

export function superadminEmails(): string[] {
  const fromEnv = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_SUPERADMINS, ...fromEnv]));
}

export function isSuperadminEmail(email?: string | null): boolean {
  if (!email) return false;
  return superadminEmails().includes(email.toLowerCase());
}
