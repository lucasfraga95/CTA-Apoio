import { NextResponse } from "next/server";
import { COOKIE_ADMIN } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const resp = NextResponse.json({ ok: true });
  resp.cookies.set(COOKIE_ADMIN, "", { path: "/", maxAge: 0 });
  return resp;
}
