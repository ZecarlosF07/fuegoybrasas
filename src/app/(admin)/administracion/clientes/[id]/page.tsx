import { z } from "zod";

import { getStaffCard } from "@/features/loyalty/server/read";
import { CustomerManagement } from "@/features/management/components/customer-management";
import { getHistory } from "@/features/management/server/reads";
import type { CustomerAdministrationPageProps } from "@/features/management/types/management";
import { requireStaffPage } from "@/features/staff/server/access";

export default async function CustomerAdministrationPage({ params }: CustomerAdministrationPageProps) {
  const access = await requireStaffPage(true);
  if (!access.ok) return <p role="alert">{access.error.message}</p>;
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return <p role="alert">No encontramos la tarjeta solicitada.</p>;
  const [card, history] = await Promise.all([getStaffCard(id.data), getHistory({ customerId: id.data })]);
  if (!card.ok || !history.ok) return <p role="alert">No pudimos consultar esta tarjeta y su historial. Intenta nuevamente.</p>;
  return <CustomerManagement card={card.data} history={history.data} actorUserId={access.data.authUserId} />;
}
