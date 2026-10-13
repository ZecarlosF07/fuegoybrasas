import type { Catalog } from "../types/catalog";

export const catalogFixture: Catalog = {
  serverNow: "2026-10-08T17:00:00+00:00",
  configuration: {
    revision: 1, displayName: "Fuego y Brasas", whatsappE164: "+51982042493", timezone: "America/Lima",
    orderingEnabled: false, loyaltyEnabled: false, locationVerified: false, address: null, mapsUrl: null,
    scheduleConfirmed: false, openingPeriods: [], pickupChargesVerified: false, pickupExtraCents: null,
    paymentMethods: [], deliveryZones: [], paymentsReady: false, deliveryZonesReady: false,
  },
  categories: [{ id: "11111111-1111-4111-8111-000000000001", slug: "promociones", name: "Promociones", revision: 1 }],
  items: [{
    id: "22222222-2222-4222-8222-000000000105", categoryId: "11111111-1111-4111-8111-000000000001",
    slug: "gran-promocion", name: "Gran Promoción", kind: "promotion", portionLabel: "1 pollo entero + ½ pollo",
    inclusions: ["Papas", "Chaufa", "Ensalada", "Cremas", "Gaseosa de 1,5 L"], description: null, imagePath: null,
    availability: "available", revision: 1, prices: [{ mode: "delivery", priceCents: 8990, revision: 1 }],
    optionGroups: [], promotion: { startsAt: null, endsAt: null, weekdays: null, previousPriceCents: 11000 },
  }],
};
