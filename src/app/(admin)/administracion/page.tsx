import { LoyaltyDashboard } from "@/features/management/components/dashboard";
import { getCustomers, getDashboard } from "@/features/management/server/reads";
import { defaultPeriod } from "@/features/management/services/dates";
import { requireStaffPage } from "@/features/staff/server/access";

export const metadata = { title: "Resumen de fidelización | Fuego y Brasas", robots: { index: false, follow: false } };

export default async function AdministrationPage() {
  const access = await requireStaffPage(true);
  if (!access.ok) return <p role="alert">{access.error.message}</p>;
  const [dashboard, customers] = await Promise.all([getDashboard(defaultPeriod()), getCustomers({})]);
  if (!dashboard.ok || !customers.ok) return <p role="alert">No pudimos consultar el resumen. Vuelve a intentar; un fallo del servicio no significa que no haya clientes.</p>;
  return <LoyaltyDashboard initial={dashboard.data} customers={customers.data} />;
}
