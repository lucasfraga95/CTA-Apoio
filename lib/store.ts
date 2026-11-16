import "server-only";
import { get } from "@vercel/edge-config";
import { MEDICAMENTOS_SEED } from "./seed";
import type { EntradaHistorico, Medicamento } from "./types";

export type OrigemDados = "edge-config" | "exemplo" | "erro";

export interface LeituraMedicamentos {
  lista: Medicamento[];
  origem: OrigemDados;
}

const CHAVE_MEDS = "medicamentos";
const CHAVE_HIST = "historico";

/** Lê a base. Sem Edge Config conectado (ou vazio), devolve os dados de exemplo. */
export async function lerMedicamentos(): Promise<LeituraMedicamentos> {
  if (!process.env.EDGE_CONFIG) {
    return { lista: MEDICAMENTOS_SEED, origem: "exemplo" };
  }
  try {
    const valor = await get<Medicamento[]>(CHAVE_MEDS);
    if (!Array.isArray(valor)) return { lista: MEDICAMENTOS_SEED, origem: "exemplo" };
    return { lista: valor, origem: "edge-config" };
  } catch {
    return { lista: MEDICAMENTOS_SEED, origem: "erro" };
  }
}

export async function lerHistorico(): Promise<EntradaHistorico[]> {
  if (!process.env.EDGE_CONFIG) return [];
  try {
    const valor = await get<EntradaHistorico[]>(CHAVE_HIST);
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

export function gravacaoConfigurada(): boolean {
  return Boolean(process.env.EDGE_CONFIG && process.env.VERCEL_API_TOKEN);
}

function idEdgeConfig(): string | null {
  try {
    const conexao = process.env.EDGE_CONFIG;
    if (!conexao) return null;
    const id = new URL(conexao).pathname.replace(/^\//, "");
    return id.startsWith("ecfg_") ? id : null;
  } catch {
    return null;
  }
}

/** Grava medicamentos + histórico no Edge Config via API da Vercel (somente servidor). */
export async function gravarMedicamentos(
  lista: Medicamento[],
  acao: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const id = idEdgeConfig();
  const token = process.env.VERCEL_API_TOKEN;
  if (!id || !token) {
    return {
      ok: false,
      erro: "Gravação não configurada: faltam EDGE_CONFIG e/ou VERCEL_API_TOKEN nas variáveis de ambiente.",
    };
  }

  const historicoAtual = await lerHistorico();
  const historico: EntradaHistorico[] = [
    { em: new Date().toISOString(), acao },
    ...historicoAtual,
  ].slice(0, 100);

  const params = new URLSearchParams();
  if (process.env.VERCEL_TEAM_ID) params.set("teamId", process.env.VERCEL_TEAM_ID);
  const url = `https://api.vercel.com/v1/edge-config/${id}/items${params.size ? `?${params}` : ""}`;

  const resp = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        { operation: "upsert", key: CHAVE_MEDS, value: lista },
        { operation: "upsert", key: CHAVE_HIST, value: historico },
      ],
    }),
    cache: "no-store",
  });

  if (!resp.ok) {
    const detalhe = await resp.text().catch(() => "");
    console.error("Falha ao gravar no Edge Config", resp.status, detalhe.slice(0, 300));
    return {
      ok: false,
      erro:
        resp.status === 401 || resp.status === 403
          ? "A Vercel recusou o token (VERCEL_API_TOKEN). Confira o token e, se for o caso, o VERCEL_TEAM_ID."
          : `Falha ao gravar na Vercel (HTTP ${resp.status}).`,
    };
  }
  return { ok: true };
}
