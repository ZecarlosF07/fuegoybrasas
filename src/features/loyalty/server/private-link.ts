import QRCode from "qrcode";
import "server-only";

import { cardKeySchema } from "../validation/schemas";
import { getSiteEnvironment } from "@/lib/env/server";

export async function createPrivateCardLink(key: string) {
  const link = new URL("/mi-tarjeta/acceso", getSiteEnvironment().APP_SITE_URL);
  link.hash = "tarjeta=" + cardKeySchema.parse(key);
  const qr = await QRCode.toDataURL(link.href, { errorCorrectionLevel: "M", margin: 4, width: 256 });
  return { link: link.href, qr };
}
