import Link from "next/link";
import { z } from "zod";

import { StaffCardView } from "@/features/loyalty/components/staff-card";
import { getStaffCard } from "@/features/loyalty/server/read";
import { requireStaffPage } from "@/features/staff/server/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Atender tarjeta | Fuego y Brasas", robots: { index: false, follow: false } };

export default async function StaffCustomerPage({ params }: PageProps<"/personal/clientes/[id]">) {
  const access = await requireStaffPage();
  if (!access.ok) return <p role="alert">{access.error.message}</p>;
  const id = z.uuid().safeParse((await params).id);
  const result = id.success ? await getStaffCard(id.data) : null;
  return <>
    <Link className="mb-4 inline-flex min-h-12 items-center gap-2 font-semibold text-brand-action underline" href="/personal"><span aria-hidden="true">←</span> Volver a buscar tarjeta</Link>
    {result?.ok ? <StaffCardView initial={result.data} actorUserId={access.data.authUserId} /> : <p role="alert">{result?.error.message ?? "No encontramos el recurso solicitado."}</p>}
  </>;
}
