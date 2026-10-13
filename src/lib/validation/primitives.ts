import { z } from "zod";

export const UUID_SCHEMA = z.uuid();
export const UTC_TIMESTAMP_SCHEMA = z.iso.datetime({ offset: false });
export const MONEY_CENTS_SCHEMA = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const DELETE_REASON_SCHEMA = z.string().trim().min(10).max(500);
