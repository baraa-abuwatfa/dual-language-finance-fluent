// Shared helpers for the n8n monthly-report API routes.
// Auth model: n8n calls these endpoints with a dedicated API token
// (N8N_REPORT_TOKEN secret). Possession of the token IS the authorization —
// there is no end-user session on these machine-to-machine calls.

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function errorJson(message: string, status: number): Response {
  return json({ error: message }, status);
}

// Constant-time-ish token comparison: hash both sides with SHA-256 and
// compare the digests, so length and content are never short-circuited.
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function requireReportToken(req: Request): Promise<Response | null> {
  const expected = process.env["N8N_REPORT_TOKEN"];
  if (!expected) {
    console.error("[reports] N8N_REPORT_TOKEN secret is not configured");
    return errorJson("Server misconfigured", 500);
  }
  const provided = req.headers.get("x-report-token") ?? "";
  if (!provided) return errorJson("Missing report token", 401);
  if ((await sha256(provided)) !== (await sha256(expected))) {
    return errorJson("Invalid report token", 401);
  }
  return null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export async function readJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}
