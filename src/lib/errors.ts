/** Extract a human-readable error message from Convex errors */
export function extractError(e: unknown): string {
  if (e instanceof Error) {
    // Convex wraps errors — the message may contain our Hindi text
    const msg = e.message;
    // Strip Convex wrapper prefix if present
    if (msg.includes("Uncaught Error:")) {
      return msg.split("Uncaught Error:").pop()?.trim() ?? msg;
    }
    // If it contains Hindi text, it's our error
    if (/[\u0900-\u097F]/.test(msg)) {
      return msg;
    }
    // Generic Convex "Server Error" — show a friendly fallback
    if (msg.includes("Server Error")) {
      return "कुछ गलत हुआ। कृपया दोबारा कोशिश करें।";
    }
    return msg;
  }
  if (typeof e === "object" && e !== null) {
    // ConvexError may have a data property
    const obj = e as Record<string, unknown>;
    if (typeof obj.data === "string") return obj.data;
    if (typeof obj.message === "string") return obj.message;
  }
  return "त्रुटि हुई";
}
