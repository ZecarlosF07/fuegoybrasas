import { LOYALTY_EVENT_LABELS } from "../constants";
import type { CardProps } from "../types/loyalty";

export function CardSummary({ card }: CardProps) {
  return <section className="space-y-6 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6" aria-label="Progreso y premios de la tarjeta">
    <div><p className="text-sm font-semibold text-brand-gold-ink">Fuego y Brasas</p><h2 className="mt-2 font-brand text-3xl font-bold">{card.displayName}</h2><p className="mt-2 text-brand-muted">{card.phoneMasked ?? "Identidad en revisión"}</p></div>
    <div><p className="text-2xl font-bold">{card.progress} de {card.target} sellos</p>
      <ol className="mt-4 grid grid-cols-5 gap-2 sm:gap-3" aria-label="Posiciones del ciclo actual">
        {Array.from({ length: card.target }, (_, index) => <li key={index} aria-label={"Sello " + (index + 1) + (index < card.progress ? " acreditado" : " pendiente")} className={"flex aspect-square w-full items-center justify-center rounded-full border-2 " + (index < card.progress ? "border-brand-primary-border bg-brand-primary font-bold text-brand-on-primary" : "border-brand-control-border bg-brand-subtle font-semibold text-brand-muted")}>{index + 1}</li>)}
      </ol>
      <p className="mt-4 text-brand-muted">{card.netStamps === 0 ? "Tu tarjeta comienza aquí. El personal acredita cada visita válida después de entregar tu compra." : "Este es tu ciclo actual. Los premios ganados se conservan por separado."}</p>
    </div>
    {!card.programEnabled && <p role="status">El programa está pausado. Conservas tu progreso y premios; por ahora no se registran sellos ni canjes.</p>}
    {card.cardStatus === "suspended" && <p role="status">Tu tarjeta está suspendida. Consulta al responsable para revisar su estado.</p>}
    <div className="space-y-4 border-t border-brand-border pt-6"><h3 className="text-xl font-bold">Premios disponibles · {card.availableRewards.length}</h3>
      {card.availableRewards.length === 0 && <p className="text-brand-muted">Al completar diez sellos obtendrás un Mostrito de ⅛.</p>}
      {card.availableRewards.map((reward) => <article key={reward.id} className="rounded-card border border-brand-control-border p-4"><p className="mb-3 inline-flex rounded-field border border-brand-primary-border bg-brand-primary px-3 py-1 text-sm font-semibold text-brand-on-primary">Premio ganado</p><h4 className="font-semibold">{reward.name}</h4><p className="mt-2">{reward.contents.join(" · ")}</p><p className="mt-2 text-sm text-brand-muted">Premio {reward.ordinal}. Canje en una visita posterior, sin compra obligatoria.</p></article>)}
      {card.availableRewards.length > 0 && !card.rewardProductAvailable && <p>El premio sigue disponible en tu tarjeta; consulta cuándo podemos entregarlo.</p>}
    </div>
    <details><summary className="flex min-h-12 cursor-pointer items-center font-semibold text-brand-action">Últimos movimientos</summary>
      <ul className="space-y-3 pt-4">{card.recentEvents.map((event, index) => <li key={index}>{LOYALTY_EVENT_LABELS[event.type]} · {new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeZone: "America/Lima" }).format(new Date(event.date))}</li>)}</ul>
      {card.recentEvents.length === 0 && <p>Aún no hay movimientos.</p>}
    </details>
  </section>;
}
