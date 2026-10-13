import type { BusinessConfig, OpeningPeriod } from "../types/config";

export function configFormPatch(form: FormData, periods: OpeningPeriod[], initial: BusinessConfig) {
  const cents = form.get("pickupExtraCents");
  return {
    displayName: form.get("displayName"), whatsappE164: form.get("whatsappE164"), timezone: initial.timezone,
    address: form.get("address") || null, mapsUrl: form.get("mapsUrl") || null,
    locationVerified: form.has("locationVerified"), scheduleConfirmed: form.has("scheduleConfirmed"),
    openingPeriods: periods, pickupExtraCents: cents === "" || cents === null ? null : Number(cents),
    pickupChargesVerified: form.has("pickupChargesVerified"), orderingEnabled: form.has("orderingEnabled"), loyaltyEnabled: form.has("loyaltyEnabled"),
  };
}
