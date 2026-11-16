import { dataBR, num, plural } from "./format";
import type { EntradaCalculo, Medicamento, ResultadoCalculo } from "./types";

function descricaoDose(
  med: Medicamento,
  e: EntradaCalculo,
  r: ResultadoCalculo,
): string {
  const { mgPorFrasco } = med.apresentacao;
  switch (e.modo) {
    case "mgkg": {
      const base = `${num(e.doseMgPorKg ?? 0)} mg/kg × ${num(e.pesoKg ?? 0)} kg = ${num(r.doseCalculadaMg)} mg`;
      return r.arredondada
        ? `${base}; arredondada para ${num(r.doseMg)} mg (${r.frascosInteiros} ${plural(r.frascosInteiros, "frasco inteiro", "frascos inteiros")})`
        : base;
    }
    case "frascos":
      return `${e.frascos} ${plural(e.frascos ?? 0, "frasco", "frascos")} × ${num(mgPorFrasco)} mg`;
    case "mg":
      return r.arredondada
        ? `dose prescrita ${num(r.doseCalculadaMg)} mg; arredondada para ${num(r.doseMg)} mg`
        : "dose fixa prescrita";
  }
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

  const { mgPorFrasco, mlPorFrasco } = med.apresentacao;
  const { diluente, volumeBolsaMl, modo } = med.diluicao;
  const concFrasco = mgPorFrasco / mlPorFrasco;
  const linhas: string[] = [];

  linhas.push(
    `${med.nome.toUpperCase()} ${num(r.doseMg)} mg IV (${descricaoDose(med, entrada, r)})`,
  );

  linhas.push(
    `Apresentação: frasco de ${num(mgPorFrasco)} mg/${num(mlPorFrasco)} mL (${num(concFrasco, 3)} mg/mL). ` +
      `Total: ${r.frascosNecessarios} ${plural(r.frascosNecessarios, "frasco", "frascos")}` +
      (r.sobraMg > 0
        ? ` (o último frasco é parcial: usar ${num(mgPorFrasco - r.sobraMg)} mg e descartar ${num(r.sobraMg)} mg).`
        : " (frascos inteiros, sem sobra)."),
  );

  if (med.reconstituicao) {
    const rec = med.reconstituicao;
    linhas.push(
      `Reconstituição: reconstituir cada frasco com ${num(rec.volumeMl)} mL de ${rec.diluente}` +
        ` (total de ${num(r.volumeReconstituicaoTotalMl ?? 0)} mL para ${r.frascosNecessarios} ${plural(r.frascosNecessarios, "frasco", "frascos")}).` +
        (rec.instrucao ? ` ${rec.instrucao}` : ""),
    );
  }

  if (modo === "completar") {
    linhas.push(
      `Preparo: aspirar ${num(r.volumeAspirarMl)} mL do medicamento e completar com ${diluente} ` +
        `até o volume final de ${num(r.volumeFinalMl)} mL ` +
        `(bolsa de ${num(volumeBolsaMl)} mL, com ${num(r.volumeAspirarMl)} mL retirados antes; restam ${num(r.volumeDiluenteMl)} mL de ${diluente}).`,
    );
  } else {
    linhas.push(
      `Preparo: aspirar ${num(r.volumeAspirarMl)} mL do medicamento e adicionar a uma bolsa de ${num(volumeBolsaMl)} mL de ${diluente}. ` +
        `Volume final: ${num(r.volumeFinalMl)} mL.`,
    );
  }

  linhas.push(`Concentração final: ${num(r.concentracaoFinalMgMl, 3)} mg/mL.`);

  if (med.tempoInfusaoMin) {
    linhas.push(`Infundir em ${num(med.tempoInfusaoMin, 0)} minutos.`);
  }
  if (med.observacoes?.trim()) {
    linhas.push(`Obs.: ${med.observacoes.trim()}`);
  }
  if (r.alertas.length > 0) {
    linhas.push(`ATENÇÃO: ${r.alertas.join(" ")}`);
  }
  if (!med.revisado) {
    linhas.push("ATENÇÃO: cadastro deste medicamento ainda NÃO foi revisado.");
  }

  const data = dataBR(med.atualizadoEm);
  linhas.push(
    `Cálculo de apoio${data ? ` (base atualizada em ${data})` : ""}. Conferir com a farmácia antes do preparo.`,
  );

  return linhas;
}
