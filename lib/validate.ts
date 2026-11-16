import type { Diluente, Medicamento } from "./types";

const DILUENTES: Diluente[] = ["SF 0,9%", "SG 5%", "Água para injetáveis"];
const MODOS = ["adicionar", "completar"];
const ARRED = ["nenhum", "frasco", "frasco_tolerancia"];

const pos = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;
const posOuVazio = (n: unknown) => n === undefined || n === null || pos(n);
const texto = (s: unknown, max: number): s is string =>
  typeof s === "string" && s.trim().length > 0 && s.length <= max;
const textoOpc = (s: unknown, max: number) =>
  s === undefined || s === null || (typeof s === "string" && s.length <= max);

/** Valida a lista de medicamentos recebida do /admin. Retorna a lista limpa ou um erro legível. */
export function validarMedicamentos(
  entrada: unknown,
): { ok: true; valor: Medicamento[] } | { ok: false; erro: string } {
  if (!Array.isArray(entrada)) return { ok: false, erro: "Formato inválido." };
  if (entrada.length > 300) return { ok: false, erro: "Medicamentos demais." };

  const ids = new Set<string>();
  const saida: Medicamento[] = [];

  for (const [i, raw] of entrada.entries()) {
    const m = raw as Partial<Medicamento> | null;
    const nome = typeof m?.nome === "string" ? m.nome.trim() : "";
    const rot = `Medicamento ${i + 1}${nome ? ` (${nome})` : ""}`;
    if (!m || typeof m !== "object") return { ok: false, erro: `${rot}: inválido.` };

    if (!texto(m.id, 80) || !/^[a-z0-9-]+$/.test(m.id))
      return { ok: false, erro: `${rot}: identificador inválido (use letras minúsculas, números e hífen).` };
    if (ids.has(m.id)) return { ok: false, erro: `${rot}: identificador repetido.` };
    ids.add(m.id);

    if (!texto(m.nome, 120)) return { ok: false, erro: `${rot}: informe o nome.` };
    if (!textoOpc(m.descricao, 300)) return { ok: false, erro: `${rot}: descrição muito longa.` };

    if (!pos(m.apresentacao?.mgPorFrasco) || !pos(m.apresentacao?.mlPorFrasco))
      return { ok: false, erro: `${rot}: informe mg e mL por frasco (maiores que zero).` };

    const d = m.diluicao;
    if (!d || !DILUENTES.includes(d.diluente) || !MODOS.includes(d.modo) || !pos(d.volumeBolsaMl))
      return { ok: false, erro: `${rot}: diluição incompleta (diluente, modo e volume da bolsa).` };
    if (!posOuVazio(d.concentracaoFinalMinMgMl) || !posOuVazio(d.concentracaoFinalMaxMgMl))
      return { ok: false, erro: `${rot}: limites de concentração inválidos.` };

    if (m.reconstituicao) {
      const r = m.reconstituicao;
      if (!DILUENTES.includes(r.diluente) || !pos(r.volumeMl) || !textoOpc(r.instrucao, 500))
        return { ok: false, erro: `${rot}: reconstituição inválida.` };
    }

    if (!Array.isArray(m.dosesUsuais) || m.dosesUsuais.length > 20)
      return { ok: false, erro: `${rot}: doses usuais inválidas.` };
    for (const du of m.dosesUsuais) {
      if (!texto(du?.rotulo, 100) || !pos(du?.mgPorKg))
        return { ok: false, erro: `${rot}: toda dose usual precisa de rótulo e mg/kg maior que zero.` };
    }

    if (!posOuVazio(m.doseMinMgKg) || !posOuVazio(m.doseMaxMgKg) || !posOuVazio(m.doseMaxMg) || !posOuVazio(m.tempoInfusaoMin))
      return { ok: false, erro: `${rot}: limites de dose ou tempo de infusão inválidos.` };
    if (!textoOpc(m.observacoes, 1000)) return { ok: false, erro: `${rot}: observações muito longas.` };

    const a = m.arredondamento;
    if (!a || !ARRED.includes(a.tipo))
      return { ok: false, erro: `${rot}: regra de arredondamento inválida.` };
    if (a.tipo === "frasco_tolerancia" && !(pos(a.toleranciaPercent) && a.toleranciaPercent <= 50))
      return { ok: false, erro: `${rot}: informe a tolerância (%) entre 0 e 50.` };

    if (typeof m.revisado !== "boolean") return { ok: false, erro: `${rot}: campo "revisado" inválido.` };

    saida.push({
      id: m.id,
      nome: m.nome.trim(),
      descricao: m.descricao?.trim() || undefined,
      apresentacao: { mgPorFrasco: m.apresentacao!.mgPorFrasco, mlPorFrasco: m.apresentacao!.mlPorFrasco },
      reconstituicao: m.reconstituicao
        ? {
            diluente: m.reconstituicao.diluente,
            volumeMl: m.reconstituicao.volumeMl,
            instrucao: m.reconstituicao.instrucao?.trim() || undefined,
          }
        : undefined,
      diluicao: {
        diluente: d.diluente,
        volumeBolsaMl: d.volumeBolsaMl,
        modo: d.modo,
        concentracaoFinalMinMgMl: d.concentracaoFinalMinMgMl || undefined,
        concentracaoFinalMaxMgMl: d.concentracaoFinalMaxMgMl || undefined,
      },
      dosesUsuais: m.dosesUsuais.map((x) => ({ rotulo: x.rotulo.trim(), mgPorKg: x.mgPorKg })),
      doseMinMgKg: m.doseMinMgKg || undefined,
      doseMaxMgKg: m.doseMaxMgKg || undefined,
      doseMaxMg: m.doseMaxMg || undefined,
      tempoInfusaoMin: m.tempoInfusaoMin || undefined,
      observacoes: m.observacoes?.trim() || undefined,
      arredondamento: {
        tipo: a.tipo,
        toleranciaPercent: a.tipo === "frasco_tolerancia" ? a.toleranciaPercent : undefined,
      },
      revisado: m.revisado,
      atualizadoEm: new Date().toISOString(),
    });
  }

  saida.sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR"));
  return { ok: true, valor: saida };
}
