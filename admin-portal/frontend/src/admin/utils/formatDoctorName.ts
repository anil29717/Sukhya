/** Avoid "Dr. Dr. Name" when the API already includes the salutation. */
export function formatDoctorName(name: string | null | undefined, fallback = 'Physician'): string {
  if (!name?.trim()) return fallback;
  const trimmed = name.trim();
  if (/^dr\.?\s/i.test(trimmed)) return trimmed;
  return `Dr. ${trimmed}`;
}
