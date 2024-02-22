export function toCamelCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) return "";
    return index == 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export function hexToDecimal(hex: string): number {
  return parseInt(hex.replace(/^#/, ""), 16);
}

export function decimalToHex(decimal: number): string {
  return `#${decimal.toString(16)}`;
}

export function checkHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}
