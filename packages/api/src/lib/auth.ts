import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";
const configuredSecret = process.env.JWT_SECRET;

if (isProduction && !configuredSecret) {
  throw new Error("JWT_SECRET is required in production");
}

export const JWT_SECRET = configuredSecret || "dev-secret-change-me";
export const JWT_ISSUER = "manga-with-ai-api";
export const JWT_AUDIENCE = "manga-with-ai-web";

export function signAccessToken(userId: string, tokenVersion = 0): string {
  return jwt.sign({ tokenVersion }, JWT_SECRET, {
    subject: userId,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string): { userId: string; tokenVersion: number } {
  const payload = jwt.verify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  if (typeof payload === "string" || !payload.sub) throw new Error("Invalid token subject");
  const tokenVersion = (payload as { tokenVersion?: unknown }).tokenVersion;
  if (!Number.isInteger(tokenVersion)) throw new Error("Invalid token version");
  return { userId: payload.sub, tokenVersion: tokenVersion as number };
}
