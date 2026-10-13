"use client";

import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { TextField } from "@/components/ui/text-field";
import type { OpeningPeriod, ScheduleEditorProps } from "@/features/business-config/types/config";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const SELECT_CLASSES = "min-h-12 w-full rounded-field border border-brand-control-border bg-brand-surface px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action";

export function ScheduleEditor({ periods, disabled, onChange }: ScheduleEditorProps) {
  function changePeriod(index: number, patch: Partial<OpeningPeriod>) {
    onChange(periods.map((period, current) => current === index ? { ...period, ...patch } : period));
  }
  return <fieldset disabled={disabled} className="space-y-4">
    <legend className="text-xl font-semibold">Horario semanal</legend>
    <p className="text-sm text-brand-muted">Conserva vacío mientras el horario esté pendiente. Puedes agregar turnos separados.</p>
    {periods.map((period, index) => <div key={index} className="space-y-4 rounded-card border border-brand-border p-4">
      <label className="block space-y-2">Día del turno {index + 1}
        <select aria-label={`Día del turno ${index + 1}`} value={period.day} onChange={(event) => changePeriod(index, { day: Number(event.target.value) })} className={SELECT_CLASSES}>
          {DAYS.map((day, dayIndex) => <option key={day} value={dayIndex + 1}>{day}</option>)}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField id={`start-${index}`} label="Apertura" type="time" value={period.opensAt} onChange={(event) => changePeriod(index, { opensAt: event.target.value })} />
        <TextField id={`end-${index}`} label="Cierre" type="time" value={period.closesAt} onChange={(event) => changePeriod(index, { closesAt: event.target.value })} />
      </div>
      <CheckboxField id={`overnight-${index}`} label="Cierra al día siguiente" checked={period.closesNextDay} onChange={(event) => changePeriod(index, { closesNextDay: event.target.checked })} />
      <Button variant="secondary" onClick={() => onChange(periods.filter((_, current) => current !== index))}>Quitar turno {index + 1}</Button>
    </div>)}
    <Button variant="secondary" disabled={disabled || periods.length >= 28} onClick={() => onChange([...periods, { day: 1, opensAt: "12:00", closesAt: "22:00", closesNextDay: false }])}>Agregar turno</Button>
  </fieldset>;
}
