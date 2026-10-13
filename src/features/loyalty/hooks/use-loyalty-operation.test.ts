import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { useLoyaltyOperation } from "./use-loyalty-operation";

const mocks = vi.hoisted(() => ({ dispatch: vi.fn(), read: vi.fn(), write: vi.fn(), clear: vi.fn(), check: vi.fn() }));
vi.mock("../services/journal", () => ({ readLoyaltyJournal: mocks.read, writeLoyaltyJournal: mocks.write, clearLoyaltyJournal: mocks.clear, journalTimestamp: () => 1, loyaltyFingerprint: async () => "a".repeat(64) }));
vi.mock("../services/operations", () => ({ dispatchLoyaltyOperation: mocks.dispatch }));
vi.mock("@/features/staff/server/actions", () => ({ getOperationAction: mocks.check }));
const actor = "60000000-0000-4000-8000-000000000001";
const input = { customerId: actor, operationId: "60000000-0000-4000-8000-000000000002", paidConfirmed: true, deliveredConfirmed: true };
beforeEach(() => { vi.resetAllMocks(); mocks.read.mockReturnValue(null); });
it("no envía RPC si el diario no puede guardarse", async () => {
  const { result } = renderHook(() => useLoyaltyOperation(actor, vi.fn()));
  await waitFor(() => expect(result.current.ready).toBe(true));
  mocks.write.mockImplementation(() => { throw new Error("storage bloqueado"); });
  await act(async () => { await result.current.run("credit", { ...input, paidConfirmed: true, deliveredConfirmed: true }); });
  expect(mocks.dispatch).not.toHaveBeenCalled(); expect(result.current.error?.code).toBe("OPERATION_UNCERTAIN");
});
it("resultado incierto bloquea otra escritura hasta consultar el recibo", async () => {
  const reload = vi.fn(); const { result } = renderHook(() => useLoyaltyOperation(actor, reload));
  await waitFor(() => expect(result.current.ready).toBe(true));
  mocks.dispatch.mockResolvedValue({ ok: false, error: { code: "OPERATION_UNCERTAIN", message: "Respuesta perdida" } });
  await act(async () => { await result.current.run("credit", { ...input, paidConfirmed: true, deliveredConfirmed: true }); });
  expect(mocks.write.mock.invocationCallOrder[0]).toBeLessThan(mocks.dispatch.mock.invocationCallOrder[0]);
  await act(async () => { await result.current.run("credit", { ...input, paidConfirmed: true, deliveredConfirmed: true }); });
  expect(mocks.dispatch).toHaveBeenCalledOnce();
  mocks.check.mockResolvedValue({ ok: true, data: { status: "recorded" } });
  await act(async () => { await result.current.check(); });
  expect(mocks.check).toHaveBeenCalledWith(input.operationId); expect(reload).toHaveBeenCalledOnce();
  expect(mocks.clear).toHaveBeenCalledOnce(); expect(result.current.journal).toBeNull();
});
it("un resultado confirmado con recarga fallida bloquea nuevas operaciones", async () => {
  const reload = vi.fn().mockRejectedValue(new Error("lectura fallida"));
  const { result } = renderHook(() => useLoyaltyOperation(actor, reload));
  await waitFor(() => expect(result.current.ready).toBe(true));
  mocks.dispatch.mockResolvedValue({ ok: true, data: {} });
  await act(async () => { await result.current.run("credit", { ...input, paidConfirmed: true, deliveredConfirmed: true }); });
  expect(result.current.ready).toBe(false);
  await act(async () => { await result.current.run("credit", { ...input, paidConfirmed: true, deliveredConfirmed: true }); });
  expect(mocks.dispatch).toHaveBeenCalledOnce();
});
it("la ausencia de recibo conserva el UUID para reintentar la misma operación", async () => {
  const journal = { actorUserId: actor, operationId: input.operationId, customerId: actor, programId: null, rewardId: null, kind: "credit", fingerprint: "a".repeat(64), createdAt: 1 };
  mocks.read.mockReturnValue(journal);
  const { result } = renderHook(() => useLoyaltyOperation(actor, vi.fn()));
  await waitFor(() => expect(result.current.ready).toBe(true));
  mocks.check.mockResolvedValue({ ok: true, data: { status: "not_found" } });
  await act(async () => { await result.current.check(); });
  expect(result.current.journal?.operationId).toBe(input.operationId); expect(mocks.clear).not.toHaveBeenCalled();
  mocks.dispatch.mockResolvedValue({ ok: false, error: { code: "OPERATION_UNCERTAIN", message: "En curso" } });
  await act(async () => { await result.current.run("credit", { ...input, operationId: actor, paidConfirmed: true, deliveredConfirmed: true }); });
  expect(mocks.dispatch).toHaveBeenCalledWith("credit", expect.objectContaining({ operationId: input.operationId }));
});
