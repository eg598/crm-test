export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Returns true when the value is non-empty after trimming */
export function notEmpty(v: unknown): boolean {
  return v !== undefined && v !== null && String(v).trim() !== '';
}
