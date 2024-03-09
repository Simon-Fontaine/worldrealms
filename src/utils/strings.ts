export function splitAndTrim(string: string): string[] {
  return string
    .replace(/\s+/g, ",")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
