export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-().]{7,20}$/.test(phone.trim());
}

/** Returns true when the value is non-empty after trimming */
export function notEmpty(v: unknown): boolean {
  return v !== undefined && v !== null && String(v).trim() !== '';
}
