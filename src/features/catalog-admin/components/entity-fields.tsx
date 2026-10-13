import { CheckboxField } from "@/components/ui/checkbox-field";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { WEEKDAY_LABELS } from "@/features/catalog-admin/constants";
import { ENTITY_FIELDS, fieldValue } from "@/features/catalog-admin/services/fields";
import type { FieldsProps } from "@/features/catalog-admin/types/catalog-admin";

export function EntityFields({ entityType, row, disabled, errors, creating, catalog }: FieldsProps) {
  return <fieldset disabled={disabled} className="space-y-5">
    <legend className="sr-only">Datos del registro</legend>
    {creating && entityType === "catalog_item" && <SelectField id="category_id" name="category_id" label="Categoría" defaultValue={String(row.category_id ?? "")} error={errors?.category_id?.[0]}>
      <option value="">Selecciona una categoría</option>{catalog.categories.filter((category) => !category.deleted_at).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
    </SelectField>}
    {creating && entityType === "catalog_price" && <SelectField id="mode" name="mode" label="Modalidad" defaultValue="delivery"><option value="delivery">Entrega</option><option value="pickup">Recojo</option><option value="dine_in">Mesa</option></SelectField>}
    {ENTITY_FIELDS[entityType].map((field) => {
      const error = errors?.[field.name]?.[0] ?? errors?.[`patch.${field.name}`]?.[0];
      if (field.kind === "boolean") return <CheckboxField key={field.name} id={field.name} name={field.name} label={field.label} help={field.help} defaultChecked={row[field.name] === true} />;
      if (field.kind === "weekdays") return <fieldset key={field.name} className="space-y-2"><legend id="weekdays" className="font-semibold">{field.label}</legend><p className="text-sm text-brand-muted">{field.help}</p><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{WEEKDAY_LABELS.map((day, index) => <CheckboxField key={day} id={`weekday-${index + 1}`} name="weekdays" value={index + 1} label={day} defaultChecked={Array.isArray(row.weekdays) && row.weekdays.includes(index + 1)} />)}</div>{error && <p className="text-brand-danger">{error}</p>}</fieldset>;
      if (field.kind === "select") return <SelectField key={field.name} id={field.name} name={field.name} label={field.label} defaultValue={fieldValue(field, row)} error={error}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectField>;
      if (field.kind === "textarea") return <div key={field.name} className="space-y-2"><label htmlFor={field.name} className="block font-semibold">{field.label}</label><textarea id={field.name} name={field.name} rows={4} defaultValue={fieldValue(field, row)} aria-invalid={Boolean(error)} aria-describedby={error ? `${field.name}-error` : field.help ? `${field.name}-help` : undefined} className="w-full rounded-field border border-brand-control-border px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action" />{field.help && <p id={`${field.name}-help`} className="text-sm text-brand-muted">{field.help}</p>}{error && <p id={`${field.name}-error`} className="text-brand-danger">{error}</p>}</div>;
      return <TextField key={field.name} id={field.name} name={field.name} label={field.label} help={field.help} error={error} type={field.kind === "number" ? "number" : field.kind === "datetime" ? "datetime-local" : "text"} step={field.kind === "datetime" ? 1 : undefined} inputMode={field.kind === "money" ? "decimal" : field.kind === "number" ? "numeric" : undefined} defaultValue={fieldValue(field, row)} />;
    })}
  </fieldset>;
}
