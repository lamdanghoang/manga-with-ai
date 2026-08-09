import assert from "node:assert/strict";
import test from "node:test";
import { signAccessToken, verifyAccessToken } from "../src/lib/auth";

test("access token retains subject and token version", () => {
  const token = signAccessToken("user-1", 3);
  assert.deepEqual(verifyAccessToken(token), { userId: "user-1", tokenVersion: 3 });
});

test("tampered access token is rejected", () => {
  const token = signAccessToken("user-1", 0);
  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
  assert.throws(() => verifyAccessToken(tampered));
});
