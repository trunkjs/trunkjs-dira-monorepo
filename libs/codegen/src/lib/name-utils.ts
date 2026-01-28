export function toCamelCase(str: string): string {
  return str
    .replace(/[-_]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

export function stripControllerSuffix(name: string): string {
  return name.replace(/Controller$/i, '');
}
