import type { Diluente, Medicamento, RegraBolsaPorPeso, Unidade } from "./types";

const DILUENTES: Diluente[] = ["SF 0,9%", "SG 5%", "Água para injetáveis"];
const UNIDADES: Unidade[] = ["mg", "g", "U", "UI"];
const MODOS = ["adicionar", "completar"];
const ARRED = ["nenhum", "frasco", "frasco_tolerancia"];

const pos = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;
const vazio = (n: unknown) => n === undefined || n === null;
const posOuVazio = (n: unknown) => vazio(n) || pos(n);
const texto = (s: unknown, max: number): s is string =>
  typeof s === "string" && s.trim().length > 0 && s.length <= max;
const textoOpc = (s: unknown, max: number) =>
  vazio(s) || (typeof s === "string" && s.length <= max);
const limpo = (s: string | undefined | null) => s?.trim() || undefined;

type Resultado = { ok: true; valor: Medicamento[] } | { ok: false; erro: string };

/** Valida a lista de medicamentos recebida do /admin. Retorna a lista limpa ou um erro legível. */
export function validarMedicamentos(entrada: unknown): Resultado {
  if (!Array.isArray(entrada)) return { ok: false, erro: "Formato inválido." };
  if (entrada.length > 300) return { ok: false, erro: "Medicamentos demais." };

  const ids = new Set<string>();
  const saida: Medicamento[] = [];

  for (const [i, raw] of entrada.entries()) {
    const m = raw as Partial<Medicamento> | null;
    const nome = typeof m?.nome === "string" ? m.nome.trim() : "";
    const rot = `Medicamento ${i + 1}${nome ? ` (${nome})` : ""}`;
    if (!m || typeof m !== "object") return { ok: false, erro: `${rot}: inválido.` };
    const erro = (msg: string): Resultado => ({ ok: false, erro: `${rot}: ${msg}` });

    if (!texto(m.id, 80) || !/^[a-z0-9-]+$/.test(m.id))
      return erro("identificador inválido (use letras minúsculas, números e hífen).");
    if (ids.has(m.id)) return erro("identificador repetido.");
    ids.add(m.id);

    if (!texto(m.nome, 120)) return erro("informe o nome.");
    if (!textoOpc(m.descricao, 300)) return erro("descrição muito longa.");
    if (!vazio(m.unidade) && !UNIDADES.includes(m.unidade as Unidade)) return erro("unidade inválida.");

    if (!pos(m.apresentacao?.mgPorFrasco) || !posOuVazio(m.apresentacao?.mlPorFrasco))
      return erro("informe a quantidade por frasco (maior que zero); os mL por frasco são opcionais.");

    const d = m.diluicao;
    if (!d || !DILUENTES.includes(d.diluente) || !MODOS.includes(d.modo))
      return erro("diluição incompleta (diluente e modo).");
    if (!posOuVazio(d.volumeBolsaMl)) return erro("volume da bolsa inválido.");
    if (!posOuVazio(d.concentracaoFinalMinMgMl) || !posOuVazio(d.concentracaoFinalMaxMgMl))
      return erro("limites de concentração inválidos.");
    if (!textoOpc(d.instrucaoExtra, 500)) return erro("instrução extra muito longa.");

    const regras: RegraBolsaPorPeso[] = [];
    if (!vazio(d.volumeBolsaPorPeso)) {
      if (!Array.isArray(d.volumeBolsaPorPeso) || d.volumeBolsaPorPeso.length > 5)
        return erro("regras de bolsa por peso inválidas.");
      for (const r of d.volumeBolsaPorPeso) {
        if (!pos(r?.volumeMl) || !posOuVazio(r?.abaixoDeKg) || !posOuVazio(r?.ateKg) || (vazio(r?.abaixoDeKg) && vazio(r?.ateKg)))
          return erro("cada regra por peso precisa de um limite de peso e de um volume.");
        regras.push({
          abaixoDeKg: r.abaixoDeKg || undefined,
          ateKg: r.ateKg || undefined,
          volumeMl: r.volumeMl,
        });
      }
    }
    if (d.faixaConcentracao) {
      const f = d.faixaConcentracao;
      if (!pos(f.min) || !pos(f.max) || f.min > f.max) return erro("faixa de concentração inválida.");
    }
    if (d.faixaVolumeFinalMl) {
      const f = d.faixaVolumeFinalMl;
      if (!posOuVazio(f.min) || !posOuVazio(f.max) || (vazio(f.min) && vazio(f.max)))
        return erro("faixa de volume final inválida.");
      if (pos(f.min) && pos(f.max) && f.min > f.max) return erro("faixa de volume final inválida.");
    }
    const temRegraDiluicao =
      pos(d.volumeBolsaMl) || regras.length > 0 || d.faixaConcentracao || d.faixaVolumeFinalMl || d.seguirFabricante;
    if (!temRegraDiluicao)
      return erro("defina como diluir (volume da bolsa, faixa de concentração, faixa de volume ou 'seguir fabricante').");

    if (m.reconstituicao) {
      const r = m.reconstituicao;
      if (!DILUENTES.includes(r.diluente) || !pos(r.volumeMl) || !textoOpc(r.instrucao, 500))
        return erro("reconstituição inválida.");
    }

    if (!Array.isArray(m.dosesUsuais) || m.dosesUsuais.length > 20) return erro("doses usuais inválidas.");
    for (const du of m.dosesUsuais) {
      if (!texto(du?.rotulo, 100) || !pos(du?.mgPorKg))
        return erro("toda dose usual precisa de rótulo e valor por kg maior que zero.");
    }

    if (!posOuVazio(m.doseMinMgKg) || !posOuVazio(m.doseMaxMgKg) || !posOuVazio(m.doseMaxMg) || !posOuVazio(m.tempoInfusaoMin))
      return erro("limites de dose ou tempo de infusão inválidos.");
    if (!textoOpc(m.observacoes, 1500) || !textoOpc(m.infusaoTexto, 1500) || !textoOpc(m.estabilidade, 800) || !textoOpc(m.pendencias, 1500))
      return erro("algum texto está longo demais.");

    const a = m.arredondamento;
    if (!a || !ARRED.includes(a.tipo)) return erro("regra de arredondamento inválida.");
    if (a.tipo === "frasco_tolerancia" && !(pos(a.toleranciaPercent) && a.toleranciaPercent <= 50))
      return erro("informe a tolerância (%) entre 0 e 50.");

    if (typeof m.revisado !== "boolean") return erro('campo "revisado" inválido.');

    saida.push({
      id: m.id,
      nome: m.nome.trim(),
      descricao: limpo(m.descricao),
      unidade: m.unidade && m.unidade !== "mg" ? m.unidade : undefined,
      apresentacao: {
        mgPorFrasco: m.apresentacao!.mgPorFrasco,
        mlPorFrasco: m.apresentacao!.mlPorFrasco || undefined,
      },
      reconstituicao: m.reconstituicao
        ? {
            diluente: m.reconstituicao.diluente,
            volumeMl: m.reconstituicao.volumeMl,
            instrucao: limpo(m.reconstituicao.instrucao),
          }
        : undefined,
      diluicao: {
        diluente: d.diluente,
        modo: d.modo,
        volumeBolsaMl: d.volumeBolsaMl || undefined,
        volumeBolsaPorPeso: regras.length ? regras : undefined,
        faixaConcentracao: d.faixaConcentracao
          ? { min: d.faixaConcentracao.min, max: d.faixaConcentracao.max }
          : undefined,
        faixaVolumeFinalMl: d.faixaVolumeFinalMl
          ? { min: d.faixaVolumeFinalMl.min || undefined, max: d.faixaVolumeFinalMl.max || undefined }
          : undefined,
        seguirFabricante: d.seguirFabricante ? true : undefined,
        instrucaoExtra: limpo(d.instrucaoExtra),
        concentracaoFinalMinMgMl: d.concentracaoFinalMinMgMl || undefined,
        concentracaoFinalMaxMgMl: d.concentracaoFinalMaxMgMl || undefined,
      },
      dosesUsuais: m.dosesUsuais.map((x) => ({ rotulo: x.rotulo.trim(), mgPorKg: x.mgPorKg })),
      doseMinMgKg: m.doseMinMgKg || undefined,
      doseMaxMgKg: m.doseMaxMgKg || undefined,
      doseMaxMg: m.doseMaxMg || undefined,
      tempoInfusaoMin: m.tempoInfusaoMin || undefined,
      infusaoTexto: limpo(m.infusaoTexto),
      estabilidade: limpo(m.estabilidade),
      observacoes: limpo(m.observacoes),
      pendencias: limpo(m.pendencias),
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
