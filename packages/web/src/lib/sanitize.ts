/**
 * Sanitize user text input to prevent XSS.
 * Strips script tags, event handlers, and javascript: URIs.
 * MiniPay flags raw JS in text fields as risky.
 */
export function sanitizeInput(input: string): string {
  return input
    // Remove <script>...</script> tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove all HTML tags
    .replace(/<\/?[^>]+(>|$)/g, "")
    // Remove javascript: protocol
    .replace(/javascript\s*:/gi, "")
    // Remove on* event handlers (onerror, onclick, etc.)
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "")
    // Remove data: URIs that could execute code
    .replace(/data\s*:\s*text\/html/gi, "")
    // Trim whitespace
    .trim();
}

/**
 * Check if input contains potentially dangerous code patterns.
 * Returns true if suspicious content detected.
 */
export function containsCode(input: string): boolean {
  const codePatterns = [
    /<script/i,
    /javascript\s*:/i,
    /\bon\w+\s*=/i,
    /eval\s*\(/i,
    /document\.\w/i,
    /window\.\w/i,
    /\bfetch\s*\(/i,
    /\bXMLHttpRequest/i,
    /\bimport\s*\(/i,
  ];
  return codePatterns.some((pattern) => pattern.test(input));
}
