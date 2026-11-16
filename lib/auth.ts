import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE_ADMIN = "cta_admin";
const DURACAO_MS = 8 * 60 * 60 * 1000; // 8 horas

export function adminConfigurado(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function segredo(): string {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function assinar(valor: string): string {
  return createHmac("sha256", segredo()).update(valor).digest("hex");
}

function iguais(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function senhaCorreta(tentativa: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  return iguais(tentativa, real);
}

export function criarToken(): { valor: string; maxAgeSeg: number } {
  const exp = Date.now() + DURACAO_MS;
  return { valor: `${exp}.${assinar(String(exp))}`, maxAgeSeg: DURACAO_MS / 1000 };
}

function tokenValido(token: string | undefined): boolean {
  if (!token || !adminConfigurado()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (!iguais(sig, assinar(exp))) return false;
  return Number(exp) > Date.now();
}

export async function estaLogado(): Promise<boolean> {
  const store = await cookies();
  return tokenValido(store.get(COOKIE_ADMIN)?.value);
}
