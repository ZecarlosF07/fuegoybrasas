import { businessStatus } from "../services/business-status";
import type { CatalogProps } from "../types/catalog";

export function BusinessInfo({ catalog }: CatalogProps) {
  const { configuration: config } = catalog;
  const status = businessStatus(config, catalog.serverNow);
  const statusLabels = { open: "Abierto ahora", closed: "Fuera del horario de atención", unknown: "Consulta el horario de atención con el local" };
  return (
    <div className="flex flex-col gap-2 text-sm text-brand-muted">
      <p>{statusLabels[status]}</p>
      {config.locationVerified && config.address && <p>{config.address}</p>}
      {config.locationVerified && config.mapsUrl && <a href={config.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center self-start text-base text-brand-action underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action">Ver ubicación en Google Maps</a>}
    </div>
  );
}
