import crypto from "crypto";

export type ABVariant = "A" | "B";

export function getABVariant(key: string): ABVariant {
  const hash = crypto.createHash("sha256").update(key).digest();
  return hash[0] < 128 ? "A" : "B";
}
