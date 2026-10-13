export const LOYALTY_TERMS_VERSION = "fyb-loyalty-v1";
export const CARD_ACCESS_COOKIE = "fyb-card-access";
export const CARD_ACCESS_SECONDS = 365 * 24 * 60 * 60;
export { STAFF_JOURNAL_KEY as LOYALTY_JOURNAL_KEY } from "@/features/identity/constants";
export const LOYALTY_TARGET = 10;
export const LOYALTY_FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action";
export const LOYALTY_EVENT_LABELS = {
  stamp_credited: "Visita acreditada", stamp_reversed: "Sello corregido", reward_issued: "Premio obtenido",
  reward_redeemed: "Canje registrado", reward_voided: "Premio anulado", reward_restored: "Premio recuperado",
  reward_reinstated: "Premio restituido por falta de entrega",
} as const;
