import "server-only";
import { createClient } from "@vercel/edge-config";
import { MEDICAMENTOS_SEED } from "./seed";
import type { EntradaHistorico, Medicamento } from "./types";

export type OrigemDados = "edge-config" | "exemplo" | "erro";

export interface LeituraMedicamentos {
  lista: Medicamento[];
  origem: OrigemDados;
}

const CHAVE_MEDS = "medicamentos";
const CHAVE_HIST = "historico";

/** A Vercel chama a variável de EDGE_CONFIG ou GLOBAL_CONFIG, conforme a versão da interface. */
function conexao(): string | undefined {
  return process.env.EDGE_CONFIG || process.env.GLOBAL_CONFIG || undefined;
}

async function lerChave<T>(chave: string): Promise<T | undefined> {
  const c = conexao();
  if (!c) return undefined;
  return createClient(c).get<T>(chave);
}

/** Lê a base. Sem Edge Config conectado (ou vazio), devolve os dados de exemplo. */
export async function lerMedicamentos(): Promise<LeituraMedicamentos> {
  if (!conexao()) {
    return { lista: MEDICAMENTOS_SEED, origem: "exemplo" };
  }
  try {
    const valor = await lerChave<Medicamento[]>(CHAVE_MEDS);
    if (!Array.isArray(valor)) return { lista: MEDICAMENTOS_SEED, origem: "exemplo" };
    return { lista: valor, origem: "edge-config" };
  } catch {
    return { lista: MEDICAMENTOS_SEED, origem: "erro" };
  }
}

export async function lerHistorico(): Promise<EntradaHistorico[]> {
  if (!conexao()) return [];
  try {
    const valor = await lerChave<EntradaHistorico[]>(CHAVE_HIST);
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

export function gravacaoConfigurada(): boolean {
  return Boolean(conexao() && process.env.VERCEL_API_TOKEN);
}

function idEdgeConfig(): string | null {
  try {
    const c = conexao();
    if (!c) return null;
    const id = new URL(c).pathname.replace(/^\//, "");
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
      erro: "Gravação não configurada: faltam EDGE_CONFIG (ou GLOBAL_CONFIG) e/ou VERCEL_API_TOKEN nas variáveis de ambiente.",
    };
  }

  const historicoAtual = await lerHistorico();
  const historico: EntradaHistorico[] = [
    { em: new Date().toISOString(), acao },
    ...historicoAtual,
  ].slice(0, 100);

  const params = new URLSearchParams();
  if (process.env.VERCEL_TEAM_ID) params.set("teamId", process.env.VERCEL_TEAM_ID.trim());
  const query = params.size ? `?${params}` : "";
  const base = `https://api.vercel.com/v1/edge-config/${id}/items${query}`;
  const cabecalhos = {
    Authorization: `Bearer ${token.trim()}`,
    "Content-Type": "application/json",
  };

  // A API exige "create" para chaves novas e "update" para as existentes
  // (o "upsert" falha com "Item not found" quando a chave ainda não existe).
  // A existência é checada pela leitura do Edge Config (não precisa de permissão extra do token).
  const [jaTemMeds, jaTemHist] = await Promise.all([
    lerChave(CHAVE_MEDS).then((v) => v !== undefined).catch(() => false),
    lerChave(CHAVE_HIST).then((v) => v !== undefined).catch(() => false),
  ]);

  const enviar = (meds: "create" | "update", hist: "create" | "update") =>
    fetch(base, {
      method: "PATCH",
      headers: cabecalhos,
      body: JSON.stringify({
        items: [
          { operation: meds, key: CHAVE_MEDS, value: lista },
          { operation: hist, key: CHAVE_HIST, value: historico },
        ],
      }),
      cache: "no-store",
    });

  const op = (existe: boolean) => (existe ? "update" : "create") as "create" | "update";
  let resp = await enviar(op(jaTemMeds), op(jaTemHist));

  // A leitura pode estar poucos segundos atrasada; se a operação não casar com o
  // estado real da chave, tenta uma vez com a operação oposta.
  if (!resp.ok && (resp.status === 404 || resp.status === 409)) {
    resp = await enviar(op(!jaTemMeds), op(!jaTemHist));
  }

  if (!resp.ok) return erroVercel("gravar", resp);
  return { ok: true };
}

async function erroVercel(
  etapa: string,
  resp: Response,
): Promise<{ ok: false; erro: string }> {
  const bruto = await resp.text().catch(() => "");
  console.error(`Falha ao ${etapa} no Edge Config`, resp.status, bruto.slice(0, 300));
  let detalhe = "";
  try {
    detalhe = JSON.parse(bruto)?.error?.message ?? "";
  } catch {
    /* sem detalhe */
  }
  const base =
    resp.status === 401 || resp.status === 403
      ? "A Vercel recusou o token (VERCEL_API_TOKEN). Confira o token e, se for o caso, o VERCEL_TEAM_ID."
      : resp.status === 404
        ? "A Vercel não encontrou o Edge Config ou o item. Confira o VERCEL_TEAM_ID e o escopo do token."
        : `Falha ao ${etapa} na Vercel (HTTP ${resp.status}).`;
  return { ok: false, erro: detalhe ? `${base} Detalhe: ${detalhe}` : base };
}
