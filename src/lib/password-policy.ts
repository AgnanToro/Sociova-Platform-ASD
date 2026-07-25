/** Client-safe password rules (no bcrypt). Server re-checks in register API. */
export function isPasswordStrong(plain: string): boolean {
  return plain.length >= 8 && /[A-Z]/.test(plain) && /[0-9]/.test(plain);
}

export function getPasswordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}
