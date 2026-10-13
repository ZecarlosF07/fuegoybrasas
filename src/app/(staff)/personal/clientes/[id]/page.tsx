import Link from "next/link";
import { z } from "zod";

import { StaffCardView } from "@/features/loyalty/components/staff-card";
import { getStaffCard } from "@/features/loyalty/server/read";
import { requireStaffPage } from "@/features/staff/server/access";

export const dynamic = "force-dynamic";
export default async function StaffCustomerPage({ params }: PageProps<"/personal/clientes/[id]">) {
  const access = await requireStaffPage();
  if (!access.ok) return <p role="alert">{access.error.message}</p>;
  const id = z.uuid().safeParse((await params).id);
  const result = id.success ? await getStaffCard(id.data) : null;
  return <>{result?.ok ? <StaffCardView initial={result.data} actorUserId={access.data.authUserId} /> : <p role="alert">{result?.error.message ?? "No encontramos el recurso solicitado."}</p>}
    <Link className="mt-6 inline-flex min-h-12 items-center text-brand-action underline" href="/personal">Volver a buscar tarjeta</Link></>;
}
