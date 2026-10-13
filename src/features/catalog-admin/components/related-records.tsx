import { Button } from "@/components/ui/button";
import { selectEntity } from "@/features/catalog-admin/services/selection";
import type { RelatedRecordsProps } from "@/features/catalog-admin/types/catalog-admin";
import { formatPen } from "@/lib/money/utils";

export function RelatedRecords({ catalog, itemId, showDeleted, disabled, onSelect, onCreate }: RelatedRecordsProps) {
  const item = catalog.items.find((entry) => entry.id === itemId);
  const prices = catalog.prices.filter((entry) => entry.item_id === itemId && (showDeleted || !entry.deleted_at));
  const promotion = catalog.promotions.find((entry) => entry.item_id === itemId && (showDeleted || !entry.deleted_at));
  const groups = catalog.groups.filter((entry) => entry.item_id === itemId && (showDeleted || !entry.deleted_at));
  const modes = { delivery: "Entrega", pickup: "Recojo", dine_in: "Mesa" };
  return <section aria-label="Elementos del producto" className="space-y-5 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Elementos de {item?.name}</h2>
    <p className="text-brand-muted">Los cambios de precios y opciones actualizan también la versión del producto. Si está publicado, puedes guardarlo como borrador antes de cambiar su composición.</p>
    {item && <Button variant="secondary" disabled={disabled} onClick={() => onSelect(selectEntity("catalog_item", item))}>Volver al producto</Button>}
    <h3 className="font-semibold">Precios por modalidad</h3>
    <ul className="space-y-3">{prices.map((entry) => <li key={entry.id}><Button variant="secondary" disabled={disabled} onClick={() => onSelect(selectEntity("catalog_price", entry))}>{modes[entry.mode]}: {formatPen(entry.price_cents)} · {entry.deleted_at ? "Retirado" : entry.verified ? "Confirmado" : "Pendiente"}</Button></li>)}</ul>
    <Button variant="secondary" disabled={disabled || Boolean(item?.deleted_at)} onClick={() => onCreate("catalog_price", itemId)}>Agregar precio</Button>
    {item?.kind === "promotion" && <div className="space-y-3"><h3 className="font-semibold">Vigencia y comparación</h3>{promotion ? <Button variant="secondary" disabled={disabled} onClick={() => onSelect(selectEntity("promotion", promotion))}>Editar promoción · {promotion.deleted_at ? "Retirada" : promotion.enabled ? "Habilitada" : "Pausada"}</Button> : <Button disabled={disabled || Boolean(item.deleted_at)} variant="secondary" onClick={() => onCreate("promotion", itemId)}>Completar promoción</Button>}</div>}
    <h3 className="font-semibold">Grupos y opciones</h3>
    {groups.map((group) => <div key={group.id} className="space-y-3 border-t border-brand-border pt-4">
      <Button variant="secondary" disabled={disabled} onClick={() => onSelect(selectEntity("option_group", group))}>{group.name} · {group.deleted_at ? "Retirado" : group.active ? "Activo" : "Inactivo"}</Button>
      <ul className="space-y-2">{catalog.choices.filter((choice) => choice.group_id === group.id && (showDeleted || !choice.deleted_at)).map((choice) => <li key={choice.id}><Button variant="secondary" disabled={disabled} onClick={() => onSelect(selectEntity("option_choice", choice))}>{choice.label} · {choice.deleted_at ? "Retirada" : choice.available ? "Disponible" : "No disponible"}</Button></li>)}</ul>
      <Button variant="secondary" disabled={disabled || Boolean(group.deleted_at) || Boolean(item?.deleted_at)} onClick={() => onCreate("option_choice", group.id)}>Agregar opción</Button>
    </div>)}
    <Button variant="secondary" disabled={disabled || Boolean(item?.deleted_at)} onClick={() => onCreate("option_group", itemId)}>Agregar grupo de opciones</Button>
  </section>;
}
