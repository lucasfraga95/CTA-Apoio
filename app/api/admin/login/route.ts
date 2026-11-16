import { NextResponse } from "next/server";
import { adminConfigurado, COOKIE_ADMIN, criarToken, senhaCorreta } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!adminConfigurado()) {
    return NextResponse.json(
      { erro: "Área administrativa não configurada (falta ADMIN_PASSWORD)." },
      { status: 503 },
    );
  }

  let senha = "";
  try {
    const corpo = await req.json();
    senha = typeof corpo?.senha === "string" ? corpo.senha : "";
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  if (!senhaCorreta(senha)) {
    // Atraso fixo para dificultar tentativas em sequência.
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  const { valor, maxAgeSeg } = criarToken();
  const resp = NextResponse.json({ ok: true });
  resp.cookies.set(COOKIE_ADMIN, valor, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeSeg,
  });
  return resp;
}
