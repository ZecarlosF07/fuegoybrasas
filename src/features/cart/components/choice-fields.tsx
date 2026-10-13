import type { ChoiceFieldsProps } from "../types/cart";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { formatPen } from "@/lib/money/utils";

export function ChoiceFields({ item, selected, disabled, prefix = "purchase" }: ChoiceFieldsProps) {
  return <>{item.optionGroups.map((group) => <fieldset key={group.id} className="space-y-2"><legend className="font-semibold">{group.name}</legend><p className="text-sm text-brand-muted">Elige entre {group.minChoices} y {group.maxChoices} opciones.</p>{group.choices.map((choice) => <CheckboxField key={choice.id} id={`${prefix}-${choice.id}`} name="choiceIds" value={choice.id} label={`${choice.label}${choice.extraPriceCents ? ` (+${formatPen(choice.extraPriceCents)})` : ""}`} defaultChecked={selected.includes(choice.id)} disabled={disabled} />)}</fieldset>)}</>;
}
