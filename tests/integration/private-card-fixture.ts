import { createHash, randomBytes, randomInt } from "node:crypto";

import { staffPool } from "./staff-fixture";
import type { PrivateCustomerFixture } from "./types/loyalty-fixture";

import { LOYALTY_TERMS_VERSION } from "@/features/loyalty/constants";
import { cardSchema } from "@/features/loyalty/validation/dto";

export async function privateCardQuery(sql: string, values: unknown[] = []) {
  const connection = await staffPool.connect();
  try {
    await connection.query("begin");
    await connection.query("set local role service_role");
    const result = await connection.query<Record<string, unknown>>(sql, values);
    await connection.query("commit");
    return result;
  } catch (error) {
    await connection.query("rollback");
    throw error;
  } finally {
    connection.release();
  }
}

export async function createPrivateCustomerFixture(activate = true): Promise<PrivateCustomerFixture> {
  const identity = {
    keyHash: createHash("sha256").update(randomBytes(32)).digest("hex"),
    phone: "+519" + randomInt(10000000, 99999999),
    customerId: "",
    cardId: "",
  };
  if (!activate) return identity;
  const response = await privateCardQuery(
    "select public.ensure_card_by_key($1,'Cliente sintético',$2,$3,true) data",
    [identity.keyHash, identity.phone, LOYALTY_TERMS_VERSION],
  );
  const card = cardSchema.parse(response.rows[0].data);
  return { ...identity, customerId: card.customerId, cardId: card.cardId };
}

export async function readPrivateCard(customer: PrivateCustomerFixture) {
  const response = await privateCardQuery("select public.get_card_by_key($1) data", [customer.keyHash]);
  return cardSchema.parse(response.rows[0].data);
}
