import { unidadeDe } from "./calc";
import { num, plural } from "./format";
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
      const base = `${num(e.doseMgPorKg ?? 0)} ${un}/kg x ${num(e.pesoKg ?? 0)} kg = ${num(r.doseCalculadaMg)} ${un}`;
      return r.arredondada
        ? `${base}; arredondada para ${num(r.doseMg)} ${un} (${r.frascosInteiros} ${plural(r.frascosInteiros, "frasco inteiro", "frascos inteiros")})`
        : base;
    }
    case "frascos":
      return `${e.frascos} ${plural(e.frascos ?? 0, "frasco", "frascos")} x ${num(mgPorFrasco)} ${un}`;
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

const cap = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);
const ponto = (t: string) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);

/**
 * Gera a nota de preparo (texto curto) para colar na prescrição:
 * cabeçalho com a dose + um parágrafo com frascos, reconstituição, diluição e concentração final.
 * Infusão, estabilidade e observações ficam só no cadastro (não vão na nota).
 */
export function gerarNota(
  med: Medicamento,
  entrada: EntradaCalculo,
  r: ResultadoCalculo,
): string[] {
  if (!r.ok) return [];

  const un = unidadeDe(med);
  const { mgPorFrasco } = med.apresentacao;
  const d = med.diluicao;
  const linhas: string[] = [];

  linhas.push(
    `${med.nome.toUpperCase()} ${num(r.doseMg)} ${un} IV (${descricaoDose(med, entrada, r)})`,
  );

  const frases: string[] = [];

  const totalFrascos = `${r.frascosNecessarios} ${plural(r.frascosNecessarios, "frasco", "frascos")}`;
  frases.push(
    r.sobraMg > 0
      ? `Total: ${totalFrascos} (o último é parcial: usar ${num(mgPorFrasco - r.sobraMg)} ${un} e descartar ${num(r.sobraMg)} ${un}).`
      : `Total: ${totalFrascos} (frascos inteiros, sem sobra).`,
  );

  if (med.reconstituicao) {
    const rec = med.reconstituicao;
    frases.push(`Reconstituir cada frasco com ${num(rec.volumeMl)} mL de ${rec.diluente}.`);
    if (rec.instrucao?.trim()) frases.push(ponto(rec.instrucao));
  }

  // ---- Preparo / diluição ----
  const aspirar =
    r.volumeAspirarMl !== undefined ? `aspirar ${num(r.volumeAspirarMl)} mL do medicamento` : "";
  const inicio = (texto: string) => (med.reconstituicao ? `Após, ${texto}` : cap(texto));

  if (r.bolsaMl !== undefined && r.volumeFinalMl !== undefined) {
    if (d.modo === "completar") {
      frases.push(
        inicio(
          `${aspirar ? aspirar + " e " : ""}completar com ${d.diluente} até o volume final de ${num(r.volumeFinalMl)} mL ` +
            `(bolsa de ${num(r.bolsaMl)} mL${r.volumeAspirarMl !== undefined ? `, retirando antes ${num(r.volumeAspirarMl)} mL do soro` : ""}).`,
        ),
      );
    } else {
      frases.push(
        inicio(
          `${aspirar ? aspirar + " e " : ""}adicionar a uma bolsa de ${num(r.bolsaMl)} mL de ${d.diluente}. ` +
            `Volume final: ${num(r.volumeFinalMl)} mL.`,
        ),
      );
    }
  } else if (d.faixaConcentracao && r.volumeFinalFaixaMl) {
    frases.push(
      inicio(
        `${aspirar ? aspirar + " e " : ""}diluir em ${d.diluente} para concentração final de ` +
          `${num(d.faixaConcentracao.min, 3)} a ${num(d.faixaConcentracao.max, 3)} ${un}/mL ` +
          `(volume final ${faixaTexto(r.volumeFinalFaixaMl)}).`,
      ),
    );
  } else if (d.faixaVolumeFinalMl && r.volumeFinalFaixaMl) {
    frases.push(
      inicio(
        `${aspirar ? aspirar + " e " : ""}diluir em ${d.diluente} até volume final ${faixaTexto(r.volumeFinalFaixaMl)}.`,
      ),
    );
  } else if (d.seguirFabricante) {
    frases.push("Diluir conforme a recomendação do fabricante.");
  }
  if (d.instrucaoExtra?.trim()) frases.push(ponto(d.instrucaoExtra));
  if (r.bolsaMl !== undefined && r.concentracaoFinalMgMl !== undefined) {
    frases.push(`Concentração final: ${num(r.concentracaoFinalMgMl, 3)} ${un}/mL.`);
  }
  linhas.push(frases.join(" "));

  if (r.alertas.length > 0) linhas.push(`ATENÇÃO: ${r.alertas.join(" ")}`);
  if (!med.revisado) linhas.push("ATENÇÃO: cadastro ainda NÃO revisado.");

  return linhas;
}
