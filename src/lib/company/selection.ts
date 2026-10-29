const KEY = "aicfo.company";

export function storedCompanyId(): string | null {
  try { return window.localStorage.getItem(KEY); } catch { return null; }
}
export function storeCompanyId(id: string) {
  try { window.localStorage.setItem(KEY, id); } catch { /* storage unavailable */ }
}

/** Picks the active company: the stored choice if still valid, the only company, or none (user must choose). */
export function resolveCompany<T extends { id: string }>(companies: T[], stored: string | null): T | "setup" | "select" {
  if (companies.length === 0) return "setup";
  const match = companies.find((c) => c.id === stored);
  if (match) return match;
  return companies.length === 1 ? companies[0]! : "select";
}
