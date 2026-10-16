const SENSITIVE_KEY = /secret|token|password|authorization|api[_-]?key/i;

export function redactForLog(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length > 12 && /^[A-Za-z0-9_\-./+=]+$/.test(value)) return "[redacted]";
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => redactForLog(item, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : redactForLog(val, depth + 1);
    }
    return out;
  }
  return value;
}
