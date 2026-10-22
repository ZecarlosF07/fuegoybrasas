"use client";

import { CheckboxField } from "@/components/ui/checkbox-field";
import { TextField } from "@/components/ui/text-field";
import type { ConfigFieldsProps } from "@/features/business-config/types/config";

export function ConfigFields({ config, disabled, errors }: ConfigFieldsProps) {
  return <fieldset disabled={disabled} className="space-y-6">
    <legend className="mb-4 text-xl font-semibold">Datos del local</legend>
    <TextField id="displayName" name="displayName" label="Nombre del local" defaultValue={config.displayName} maxLength={120} required error={errors?.["patch.displayName"]?.[0]} />
    <TextField id="whatsappE164" name="whatsappE164" label="WhatsApp de atención" type="tel" defaultValue={config.whatsappE164} help="Incluye el código de país, por ejemplo +51982042493." required error={errors?.["patch.whatsappE164"]?.[0]} />
    <TextField id="address" name="address" label="Dirección" defaultValue={config.address ?? ""} help="Deja vacío si aún no está confirmada." error={errors?.["patch.address"]?.[0]} />
    <TextField id="mapsUrl" name="mapsUrl" label="Enlace de Google Maps" type="url" defaultValue={config.mapsUrl ?? ""} error={errors?.["patch.mapsUrl"]?.[0]} />
    <CheckboxField id="locationVerified" name="locationVerified" label="Ubicación comprobada" defaultChecked={config.locationVerified} />
    <TextField id="pickupExtraCents" name="pickupExtraCents" label="Cargo adicional para recoger, en céntimos" inputMode="numeric" type="number" min={0} max={100000} step={1} defaultValue={config.pickupExtraCents ?? ""} help="Un importe pendiente se deja vacío. Cero significa un cargo confirmado de S/ 0.00." error={errors?.["patch.pickupExtraCents"]?.[0]} />
    <CheckboxField id="pickupChargesVerified" name="pickupChargesVerified" label="Cargo para recoger confirmado" defaultChecked={config.pickupChargesVerified} />
    <CheckboxField id="scheduleConfirmed" name="scheduleConfirmed" label="Horario comprobado" defaultChecked={config.scheduleConfirmed} />
    <CheckboxField id="orderingEnabled" name="orderingEnabled" label="Habilitar pedidos por WhatsApp" defaultChecked={config.orderingEnabled} help="Prepara el carrito para coordinarlo por WhatsApp. Habilitar después de revisar precios y atención; no requiere configurar pagos." />
    <CheckboxField id="loyaltyEnabled" name="loyaltyEnabled" label="Habilitar tarjeta de fidelización" defaultChecked={config.loyaltyEnabled} help="Pausar conserva progreso y premios. Reanudar exige una versión activa y condiciones operativas aprobadas." />
    <p className="text-sm text-brand-muted">Zona horaria: {config.timezone}.</p>
  </fieldset>;
}
