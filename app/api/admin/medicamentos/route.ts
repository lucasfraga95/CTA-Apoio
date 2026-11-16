import { NextResponse } from "next/server";
import { estaLogado } from "@/lib/auth";
import { gravarMedicamentos, lerMedicamentos } from "@/lib/store";
import { validarMedicamentos } from "@/lib/validate";
import type { Medicamento } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Conteúdo clínico do cadastro, sem a data, para saber se algo mudou de verdade. */
function conteudo(m: Medicamento): string {
  const { atualizadoEm: _ignorado, ...resto } = m;
  return JSON.stringify(resto);
}

export async function PUT(req: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ erro: "Sessão expirada. Entre novamente." }, { status: 401 });
  }

  let corpo: { medicamentos?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const validacao = validarMedicamentos(corpo.medicamentos);
  if (!validacao.ok) {
    return NextResponse.json({ erro: validacao.erro }, { status: 400 });
  }

  // Preserva a data de atualização dos medicamentos que não mudaram.
  const { lista: antigos } = await lerMedicamentos();
  const porId = new Map(antigos.map((m) => [m.id, m]));
  const novos = validacao.valor.map((m) => {
    const antigo = porId.get(m.id);
    return antigo && conteudo(antigo) === conteudo(m)
      ? { ...m, atualizadoEm: antigo.atualizadoEm }
      : m;
  });

  const idsNovos = new Set(novos.map((m) => m.id));
  const alterados = novos.filter((m) => {
    const antigo = porId.get(m.id);
    return !antigo || conteudo(antigo) !== conteudo(m);
  });
  const removidos = antigos.filter((m) => !idsNovos.has(m.id));

  const partes: string[] = [];
  if (alterados.length) partes.push(`alterados/criados: ${alterados.map((m) => m.nome).join(", ")}`);
  if (removidos.length) partes.push(`removidos: ${removidos.map((m) => m.nome).join(", ")}`);
  if (!partes.length) {
    return NextResponse.json({ ok: true, medicamentos: novos, mensagem: "Nada mudou." });
  }

  const resultado = await gravarMedicamentos(novos, partes.join(" | "));
  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: 502 });
  }
  return NextResponse.json({ ok: true, medicamentos: novos });
}
