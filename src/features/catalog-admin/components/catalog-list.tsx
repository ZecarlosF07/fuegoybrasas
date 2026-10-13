"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { selectEntity } from "@/features/catalog-admin/services/selection";
import type { CatalogListProps } from "@/features/catalog-admin/types/catalog-admin";

export function CatalogList({ catalog, disabled, showDeleted, onSelect }: CatalogListProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const categories = catalog.categories.filter((entry) => showDeleted || !entry.deleted_at);
  const items = catalog.items.filter((entry) => (showDeleted || !entry.deleted_at) && (!categoryId || entry.category_id === categoryId) && entry.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));
  return <section className="min-w-0 space-y-4" aria-label="Registros de la carta">
    <h2 className="text-xl font-bold">Productos y categorías</h2>
    <TextField id="catalog-search" label="Buscar producto" value={query} onChange={(event) => setQuery(event.target.value)} />
    <SelectField id="category-filter" label="Filtrar por categoría" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Todas las categorías</option>{categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{entry.deleted_at ? " · retirada" : ""}</option>)}</SelectField>
    <details><summary className="min-h-12 cursor-pointer py-3 font-semibold">Editar categorías</summary><ul className="space-y-3">{categories.map((entry) => <li key={entry.id}><Button variant="secondary" disabled={disabled} onClick={() => onSelect(selectEntity("category", entry))}>{entry.name} · {entry.deleted_at ? "Retirada" : entry.active ? "Activa" : "Inactiva"}</Button></li>)}</ul></details>
    <p className="text-sm text-brand-muted">{items.length} productos en este filtro.</p>
    <ul className="space-y-3">{items.map((entry) => <li key={entry.id} className="rounded-card border border-brand-border bg-brand-surface p-4">
      <p className="font-semibold">{entry.name}</p><p className="mt-2 text-sm text-brand-muted">{entry.source_ref && `${entry.source_ref} · `}{entry.deleted_at ? "Retirado" : entry.publication_status === "published" ? "Publicado" : entry.publication_status === "archived" ? "Archivado" : "Borrador"} · {entry.availability === "sold_out" ? "Agotado" : "Disponible"}</p>
      <Button className="mt-3" variant="secondary" disabled={disabled} onClick={() => onSelect(selectEntity("catalog_item", entry))}>Editar {entry.name}</Button>
    </li>)}</ul>
    {!items.length && <p>No hay productos con estos filtros. Puedes cambiarlos o crear un registro.</p>}
  </section>;
}
