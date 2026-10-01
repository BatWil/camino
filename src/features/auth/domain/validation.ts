/** Matches supabase/config.toml `minimum_password_length` (set the same value in the dashboard). */
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

export function passwordProblem(value: string): string | null {
  if (value.length < MIN_PASSWORD_LENGTH) return `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (value.length > 72) return "Usa como máximo 72 caracteres.";
  return null;
}

export function nameProblem(value: string): string | null {
  const v = value.trim();
  if (!v) return "¿Cómo te llamas?";
  if (v.length > 80) return "Usa como máximo 80 caracteres.";
  return null;
}
