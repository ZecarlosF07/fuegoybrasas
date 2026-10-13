import { mediaResponse } from "@/features/catalog-admin/server/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) { return mediaResponse(request); }
export async function DELETE(request: Request) { return mediaResponse(request, true); }
export async function GET(request: Request) { return mediaResponse(request); }
