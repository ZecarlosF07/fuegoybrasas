"use server";

import { createHash } from "node:crypto";

import { invitationContextSchema, invitationStageSchema, managedStaffSchema } from "../validation/dto";
import { invitationSchema } from "../validation/schemas";
import { failure } from "@/contracts/services/result";
import { getStaffAccess } from "@/features/staff/server/access";
import { mutationSchema, operationSchema } from "@/features/staff/validation/schemas";
import { getSiteEnvironment } from "@/lib/env/server";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createAdminAuthClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getManagedStaffAction() {
  return runServerWork(async (requestId) => {
    const client = await createServerSupabaseClient();
    return rpcResult(await client.rpc("get_managed_staff"), managedStaffSchema, requestId);
  });
}
export async function inviteStaffAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = invitationSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const access = await getStaffAccess();
    if (!access.ok) return access;
    if (access.data.role !== "manager") return failure({ code: "FORBIDDEN", message: "Solo el responsable puede invitar personal." }, requestId);
    const value = parsed.data;
    const client = await createServerSupabaseClient("action");
    const args = { p_email: value.email, p_role: value.role, p_operation_id: value.operationId };
    const reserved = rpcResult(await client.rpc("prepare_staff_invitation", args), mutationSchema, requestId, true);
    if (!reserved.ok) return reserved;
    const context = rpcResult(await client.rpc("get_staff_invitation_context", args), invitationContextSchema, requestId);
    if (!context.ok) return context;
    if (["sent", "ready"].includes(context.data.state)) return getCompletedInvitation(client, value.operationId, requestId);
    const admin = createAdminAuthClient();
    let userId = context.data.userId;
    if (!userId) {
      const created = await admin.createUser({ email: value.email, email_confirm: false, app_metadata: { fybInvitation: context.data.staffId } });
      if (created.error || !created.data.user) return uncertainInvitation(requestId);
      userId = created.data.user.id;
    }
    const staged = rpcResult(await client.rpc("stage_staff_invitation", { ...args, p_user_id: userId }), invitationStageSchema, requestId, true);
    if (!staged.ok) return staged;
    if (!staged.data.alreadyInvited) {
      if (!staged.data.sendAllowed) return uncertainInvitation(requestId);
      const sent = await admin.inviteUserByEmail(value.email, { redirectTo: new URL("/auth/confirm", getSiteEnvironment().APP_SITE_URL).href });
      if (sent.error || sent.data.user?.id !== userId) return uncertainInvitation(requestId);
    }
    const completed = await client.rpc("complete_staff_invitation", { p_email: value.email, p_role: value.role, p_reservation_id: value.operationId, p_operation_id: invitationCompletionId(value.operationId) });
    return rpcResult(completed, mutationSchema, requestId, true);
  }, true);
}

function uncertainInvitation(requestId: string) {
  return failure({ code: "OPERATION_UNCERTAIN", message: "La invitación necesita conciliación. No anuncies acceso listo ni envíes otra invitación: consulta y reintenta la misma referencia." }, requestId);
}
function invitationCompletionId(operationId: string) {
  const hash = createHash("sha256").update("fyb:invite-complete:" + operationId).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

// El tipo del cliente se deriva de su fábrica y permanece en types/.
async function getCompletedInvitation(client: import("../types/server").ManagementClient, operationId: string, requestId: string) {
  const response = await client.rpc("get_operation", { p_operation_id: operationId });
  const parsed = importResult(response.data);
  if (!parsed) return uncertainInvitation(requestId);
  return rpcResult({ data: parsed, error: response.error }, mutationSchema, requestId, true);
}
function importResult(data: unknown) {
  const parsed = operationSchema.safeParse(data);
  return parsed.success && parsed.data.status === "recorded" ? parsed.data.result : null;
}
