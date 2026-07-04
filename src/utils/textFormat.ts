// Older records were saved through a backend routine that HTML-entity-encoded
// text fields (e.g. "bo'lim" -> "bo&#x27;lim"). Decode on display so legacy
// records read correctly; harmless no-op for already-clean text.
export function decodeLegacyEntities(value?: string): string | undefined {
  if (!value) return value;
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
