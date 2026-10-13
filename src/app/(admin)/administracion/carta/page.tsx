import { AdminCatalogPanel } from "@/features/catalog-admin/components/admin-catalog-panel";
import { getAdminCatalogAction } from "@/features/catalog-admin/server/actions";
import { AccessDenied } from "@/features/staff/components/access-denied";
import { requireStaffPage } from "@/features/staff/server/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administrar carta | Fuego y Brasas", robots: { index: false, follow: false } };

export default async function AdminCatalogPage() {
  const access = await requireStaffPage(true);
  if (!access.ok) return <AccessDenied message={access.error.message} />;
  const catalog = await getAdminCatalogAction(true);
  if (!catalog.ok) return <AccessDenied message={catalog.error.message} />;
  return <AdminCatalogPanel initial={catalog.data} actorUserId={access.data.authUserId} />;
}
