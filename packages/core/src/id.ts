/**
 * Generates a work item ID in the format YYYYMMDD-XXXX
 * where XXXX is a 4-character random hex string.
 * No coordination between machines required — timestamp+random ensures uniqueness.
 */
export function generateId(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const date = `${year}${month}${day}`;
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  return `${date}-${hex}`;
}

/**
 * Returns the filename for a given work item ID.
 */
export function idToFilename(id: string): string {
  return `WI-${id}.md`;
}

/**
 * Extracts the ID from a filename like WI-20260321-a3f8.md
 */
export function filenameToId(filename: string): string | null {
  const match = filename.match(/^WI-(\d{8}-[0-9a-f]{4})\.md$/);
  return match ? match[1] : null;
}
