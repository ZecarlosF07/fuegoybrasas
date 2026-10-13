import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import "server-only";

import { CARD_ACCESS_COOKIE, CARD_ACCESS_SECONDS } from "../constants";
import { cardKeySchema } from "../validation/schemas";
import { getSiteEnvironment } from "@/lib/env/server";

export function createCardKey() { return randomBytes(32).toString("hex"); }
export function hashCardKey(key: string) { return createHash("sha256").update(cardKeySchema.parse(key)).digest("hex"); }
export async function readCardKey() {
  return cardKeySchema.safeParse((await cookies()).get(CARD_ACCESS_COOKIE)?.value).data ?? null;
}
export async function saveCardKey(key: string) {
  (await cookies()).set(CARD_ACCESS_COOKIE, cardKeySchema.parse(key), {
    httpOnly: true, secure: new URL(getSiteEnvironment().APP_SITE_URL).protocol === "https:",
    sameSite: "lax", path: "/", maxAge: CARD_ACCESS_SECONDS,
  });
}
export async function clearCardKey() { (await cookies()).delete(CARD_ACCESS_COOKIE); }
