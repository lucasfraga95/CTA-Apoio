import { unidadeDe } from "./calc";
import { dataBR, num, plural } from "./format";
import type { EntradaCalculo, Medicamento, ResultadoCalculo } from "./types";

function descricaoDose(
  med: Medicamento,
  e: EntradaCalculo,
  r: ResultadoCalculo,
): string {
  const un = unidadeDe(med);
  const { mgPorFrasco } = med.apresentacao;
  switch (e.modo) {
    case "mgkg": {
      const base = `${num(e.doseMgPorKg ?? 0)} ${un}/kg × ${num(e.pesoKg ?? 0)} kg = ${num(r.doseCalculadaMg)} ${un}`;
      return r.arredondada
        ? `${base}; arredondada para ${num(r.doseMg)} ${un} (${r.frascosInteiros} ${plural(r.frascosInteiros, "frasco inteiro", "frascos inteiros")})`
        : base;
    }
    case "frascos":
      return `${e.frascos} ${plural(e.frascos ?? 0, "frasco", "frascos")} × ${num(mgPorFrasco)} ${un}`;
    case "mg":
      return r.arredondada
        ? `dose prescrita ${num(r.doseCalculadaMg)} ${un}; arredondada para ${num(r.doseMg)} ${un}`
        : "dose fixa prescrita";
  }
}

function faixaTexto(f: { min?: number; max?: number }): string {
  if (f.min !== undefined && f.max !== undefined) return `entre ${num(f.min, 1)} e ${num(f.max, 1)} mL`;
  if (f.max !== undefined) return `até ${num(f.max, 1)} mL`;
  if (f.min !== undefined) return `a partir de ${num(f.min, 1)} mL`;
  return "";
}

/**
 * Gera a nota de preparo (texto simples) para colar na prescrição.
 * Retorna as linhas separadas; use .join("\n") para copiar.
 */
export function gerarNota(
  med: Medicamento,
  entrada: EntradaCalculo,
  r: ResultadoCalculo,
): string[] {
  if (!r.ok) return [];

  const un = unidadeDe(med);
  const { mgPorFrasco, mlPorFrasco } = med.apresentacao;
  const d = med.diluicao;
  const linhas: string[] = [];

  linhas.push(
    `${med.nome.toUpperCase()} ${num(r.doseMg)} ${un} IV (${descricaoDose(med, entrada, r)})`,
  );

  const totalFrascos = `${r.frascosNecessarios} ${plural(r.frascosNecessarios, "frasco", "frascos")}`;
  const sobra =
    r.sobraMg > 0
      ? ` (o último frasco é parcial: usar ${num(mgPorFrasco - r.sobraMg)} ${un} e descartar ${num(r.sobraMg)} ${un}).`
      : " (frascos inteiros, sem sobra).";
  linhas.push(
    mlPorFrasco !== undefined
      ? `Apresentação: frasco de ${num(mgPorFrasco)} ${un}/${num(mlPorFrasco)} mL (${num(mgPorFrasco / mlPorFrasco, 3)} ${un}/mL). Total: ${totalFrascos}${sobra}`
      : `Apresentação: frasco de ${num(mgPorFrasco)} ${un} (volume conforme o produto/fabricante). Total: ${totalFrascos}${sobra}`,
  );

  if (med.reconstituicao) {
    const rec = med.reconstituicao;
    linhas.push(
      `Reconstituição: reconstituir cada frasco com ${num(rec.volumeMl)} mL de ${rec.diluente}` +
        ` (total de ${num(r.volumeReconstituicaoTotalMl ?? 0)} mL para ${totalFrascos}).` +
        (rec.instrucao ? ` ${rec.instrucao}` : ""),
    );
  }

  // ---- Preparo / diluição ----
  const aspirar =
    r.volumeAspirarMl !== undefined ? `aspirar ${num(r.volumeAspirarMl)} mL do medicamento` : "";

  if (r.bolsaMl !== undefined && r.volumeFinalMl !== undefined) {
    if (d.modo === "completar") {
      linhas.push(
        `Preparo: ${aspirar ? aspirar + " e " : ""}completar com ${d.diluente} até o volume final de ${num(r.volumeFinalMl)} mL ` +
          `(bolsa de ${num(r.bolsaMl)} mL${r.volumeAspirarMl !== undefined ? `, retirando antes ${num(r.volumeAspirarMl)} mL do soro` : ""}).`,
      );
    } else {
      linhas.push(
        `Preparo: ${aspirar ? aspirar + " e " : ""}adicionar a uma bolsa de ${num(r.bolsaMl)} mL de ${d.diluente}. ` +
          `Volume final: ${num(r.volumeFinalMl)} mL.`,
      );
    }
    if (r.concentracaoFinalMgMl !== undefined) {
      linhas.push(`Concentração final: ${num(r.concentracaoFinalMgMl, 3)} ${un}/mL.`);
    }
  } else if (d.faixaConcentracao && r.volumeFinalFaixaMl) {
    linhas.push(
      `Preparo: ${aspirar ? aspirar + " e " : ""}diluir em ${d.diluente} para concentração final de ` +
        `${num(d.faixaConcentracao.min, 3)} a ${num(d.faixaConcentracao.max, 3)} ${un}/mL ` +
        `(volume final ${faixaTexto(r.volumeFinalFaixaMl)}).`,
    );
  } else if (d.faixaVolumeFinalMl && r.volumeFinalFaixaMl) {
    linhas.push(
      `Preparo: ${aspirar ? aspirar + " e " : ""}diluir em ${d.diluente} até volume final ${faixaTexto(r.volumeFinalFaixaMl)}.`,
    );
  } else if (d.seguirFabricante) {
    linhas.push("Preparo: diluir conforme a recomendação do fabricante.");
  }
  if (d.instrucaoExtra?.trim()) linhas.push(d.instrucaoExtra.trim());

  if (med.infusaoTexto?.trim()) {
    linhas.push(`Infusão: ${med.infusaoTexto.trim()}`);
  } else if (med.tempoInfusaoMin) {
    linhas.push(`Infundir em ${num(med.tempoInfusaoMin, 0)} minutos.`);
  }
  if (med.estabilidade?.trim()) linhas.push(`Estabilidade: ${med.estabilidade.trim()}`);
  if (med.observacoes?.trim()) linhas.push(`Obs.: ${med.observacoes.trim()}`);
  if (r.alertas.length > 0) linhas.push(`ATENÇÃO: ${r.alertas.join(" ")}`);
  if (!med.revisado) {
    linhas.push("ATENÇÃO: cadastro deste medicamento ainda NÃO foi revisado.");
  }

  const data = dataBR(med.atualizadoEm);
  linhas.push(
    `Cálculo de apoio${data ? ` (base atualizada em ${data})` : ""}. Conferir com a farmácia antes do preparo.`,
  );

  return linhas;
}
