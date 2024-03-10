export function splitAndTrim(string: string): string[] {
  return string
    .replace(/\n/g, ",")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
