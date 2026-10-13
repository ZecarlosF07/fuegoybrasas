import { CENTS_PER_SOL, PRICE_DECIMALS, UNKNOWN_PRICE_LABEL } from "./constants";
import { MONEY_CENTS_SCHEMA } from "@/lib/validation/primitives";


export function parseSolesToCents(value: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error("Importe inválido; usar hasta dos decimales.");
  const [soles, fraction = ""] = value.split(".");
  const cents = BigInt(soles) * BigInt(CENTS_PER_SOL) + BigInt(fraction.padEnd(PRICE_DECIMALS, "0"));
  return MONEY_CENTS_SCHEMA.parse(Number(cents));
}

export function formatPen(cents: number | null): string {
  if (cents === null) return UNKNOWN_PRICE_LABEL;
  MONEY_CENTS_SCHEMA.parse(cents);
  const soles = Math.floor(cents / CENTS_PER_SOL);
  const fraction = String(cents % CENTS_PER_SOL).padStart(PRICE_DECIMALS, "0");
  return `S/${soles}.${fraction}`;
}
