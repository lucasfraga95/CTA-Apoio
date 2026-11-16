import { arred, num } from "./format";
import type {
  EntradaCalculo,
  Medicamento,
  RegraBolsaPorPeso,
  ResultadoCalculo,
} from "./types";

const EPS = 1e-9;

export const unidadeDe = (med: Medicamento): string => med.unidade ?? "mg";

function falha(erro: string): ResultadoCalculo {
  return {
    ok: false,
    erro,
    doseMg: 0,
    doseCalculadaMg: 0,
    arredondada: false,
    frascosNecessarios: 0,
    frascosInteiros: 0,
    sobraMg: 0,
    alertas: [],
  };
}

const positivo = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;

/** Aplica a regra de arredondamento do medicamento. Nunca arredonda no modo "frascos". */
function aplicarArredondamento(med: Medicamento, dose: number): number {
  const m = med.apresentacao.mgPorFrasco;
  const { tipo, toleranciaPercent } = med.arredondamento;
  if (tipo === "nenhum") return dose;

  const maisProximo = Math.max(1, Math.round(dose / m)) * m;
  if (tipo === "frasco") return maisProximo;

  // frasco_tolerancia: só arredonda se a diferença couber na tolerância
  const tol = toleranciaPercent ?? 0;
  const difPercent = (Math.abs(maisProximo - dose) / dose) * 100;
  return difPercent <= tol + EPS ? maisProximo : dose;
}

function regraVale(regra: RegraBolsaPorPeso, peso: number): boolean {
  if (positivo(regra.abaixoDeKg) && !(peso < regra.abaixoDeKg)) return false;
  if (positivo(regra.ateKg) && !(peso <= regra.ateKg)) return false;
  return true;
}

export function calcular(
  med: Medicamento,
  entrada: EntradaCalculo,
): ResultadoCalculo {
  const un = unidadeDe(med);
  const { mgPorFrasco: m, mlPorFrasco } = med.apresentacao;
  if (!positivo(m) || (mlPorFrasco !== undefined && !positivo(mlPorFrasco))) {
    return falha("Apresentação do medicamento inválida. Avise o administrador.");
  }

  let doseCalc: number;
  let permiteArredondar = true;

  switch (entrada.modo) {
    case "mgkg":
      if (!positivo(entrada.pesoKg)) return falha("Informe o peso do paciente.");
      if (!positivo(entrada.doseMgPorKg)) return falha(`Informe a dose em ${un}/kg.`);
      doseCalc = entrada.pesoKg * entrada.doseMgPorKg;
      break;
    case "frascos":
      if (!positivo(entrada.frascos) || !Number.isInteger(entrada.frascos)) {
        return falha("Informe o número de frascos completos (número inteiro).");
      }
      doseCalc = entrada.frascos * m;
      permiteArredondar = false;
      break;
    case "mg":
      if (!positivo(entrada.doseMg)) return falha(`Informe a dose em ${un}.`);
      doseCalc = entrada.doseMg;
      break;
    default:
      return falha("Modo de cálculo inválido.");
  }

  const dose = permiteArredondar ? aplicarArredondamento(med, doseCalc) : doseCalc;
  const arredondada = Math.abs(dose - doseCalc) > EPS;

  const frascosNecessarios = Math.ceil(dose / m - EPS);
  const frascosInteiros = Math.floor(dose / m + EPS);
  const sobraMg = Math.max(0, frascosNecessarios * m - dose);

  const volumeAspirarMl =
    mlPorFrasco !== undefined ? (dose * mlPorFrasco) / m : undefined;

  // Frasco parcial em mL (é como a enfermagem trabalha).
  const restoMg = dose - frascosInteiros * m;
  const temParcial = mlPorFrasco !== undefined && restoMg > EPS;
  const mlUltimoFrasco = temParcial ? (restoMg / m) * mlPorFrasco : undefined;
  const sobraMl = temParcial ? mlPorFrasco - (mlUltimoFrasco as number) : undefined;

  const alertas: string[] = [];
  const d = med.diluicao;
  const pesoInformado = positivo(entrada.pesoKg) ? entrada.pesoKg : undefined;

  // ---- Volume da bolsa (fixo ou por peso) ----
  let bolsaMl: number | undefined;
  if (d.volumeBolsaPorPeso && d.volumeBolsaPorPeso.length > 0) {
    if (pesoInformado === undefined) {
      return falha(
        "O volume da bolsa de diluição depende do peso do paciente. Informe o peso para continuar.",
      );
    } else {
      const regra = d.volumeBolsaPorPeso.find((r) => regraVale(r, pesoInformado));
      bolsaMl = regra ? regra.volumeMl : d.volumeBolsaMl;
    }
  } else {
    bolsaMl = d.volumeBolsaMl;
  }

  let volumeDiluenteMl: number | undefined;
  let volumeFinalMl: number | undefined;
  let volumeFinalFaixaMl: { min?: number; max?: number } | undefined;

  if (positivo(bolsaMl)) {
    const v = volumeAspirarMl ?? 0;
    if (d.modo === "completar") {
      if (v > bolsaMl + EPS) {
        return falha(
          `O volume do medicamento (${num(v)} mL) é maior que a bolsa de ${num(bolsaMl)} mL. Ajuste o volume da bolsa no cadastro.`,
        );
      }
      volumeDiluenteMl = bolsaMl - v;
      volumeFinalMl = bolsaMl;
    } else {
      volumeDiluenteMl = bolsaMl;
      volumeFinalMl = bolsaMl + v;
    }
  } else if (d.faixaConcentracao) {
    const { min, max } = d.faixaConcentracao;
    volumeFinalFaixaMl = { min: dose / max, max: dose / min };
  } else if (d.faixaVolumeFinalMl) {
    volumeFinalFaixaMl = d.faixaVolumeFinalMl;
  }

  const concentracaoFinalMgMl =
    volumeFinalMl !== undefined && volumeAspirarMl !== undefined ? dose / volumeFinalMl : undefined;
  const mgPorKgEquivalente = pesoInformado !== undefined ? dose / pesoInformado : undefined;

  // ---- Alertas de segurança ----
  if (pesoInformado !== undefined && (pesoInformado < 3 || pesoInformado > 250)) {
    alertas.push(`Peso incomum (${num(pesoInformado)} kg). Confira se está em kg.`);
  }
  if (mgPorKgEquivalente !== undefined) {
    if (positivo(med.doseMaxMgKg) && mgPorKgEquivalente > med.doseMaxMgKg + EPS) {
      alertas.push(
        `Dose de ${num(mgPorKgEquivalente)} ${un}/kg acima do máximo cadastrado (${num(med.doseMaxMgKg)} ${un}/kg).`,
      );
    }
    if (positivo(med.doseMinMgKg) && mgPorKgEquivalente < med.doseMinMgKg - EPS) {
      alertas.push(
        `Dose de ${num(mgPorKgEquivalente)} ${un}/kg abaixo do mínimo cadastrado (${num(med.doseMinMgKg)} ${un}/kg).`,
      );
    }
  }
  if (positivo(med.doseMaxMg) && dose > med.doseMaxMg + EPS) {
    alertas.push(
      `Dose de ${num(dose)} ${un} acima do teto por infusão cadastrado (${num(med.doseMaxMg)} ${un}).`,
    );
  }
  const { concentracaoFinalMinMgMl: cMin, concentracaoFinalMaxMgMl: cMax } = d;
  if (concentracaoFinalMgMl !== undefined) {
    if (positivo(cMin) && concentracaoFinalMgMl < cMin - EPS) {
      alertas.push(
        `Concentração final (${num(concentracaoFinalMgMl, 3)} ${un}/mL) abaixo do mínimo cadastrado (${num(cMin, 3)} ${un}/mL).`,
      );
    }
    if (positivo(cMax) && concentracaoFinalMgMl > cMax + EPS) {
      alertas.push(
        `Concentração final (${num(concentracaoFinalMgMl, 3)} ${un}/mL) acima do máximo cadastrado (${num(cMax, 3)} ${un}/mL).`,
      );
    }
  }

  return {
    ok: true,
    doseMg: arred(dose, 2),
    doseCalculadaMg: arred(doseCalc, 2),
    arredondada,
    frascosNecessarios,
    frascosInteiros,
    sobraMg: arred(sobraMg, 2),
    mlUltimoFrasco: mlUltimoFrasco !== undefined ? arred(mlUltimoFrasco, 2) : undefined,
    sobraMl: sobraMl !== undefined ? arred(sobraMl, 2) : undefined,
    volumeAspirarMl: volumeAspirarMl !== undefined ? arred(volumeAspirarMl, 2) : undefined,
    volumeReconstituicaoTotalMl: med.reconstituicao
      ? arred(frascosNecessarios * med.reconstituicao.volumeMl, 2)
      : undefined,
    bolsaMl,
    volumeDiluenteMl: volumeDiluenteMl !== undefined ? arred(volumeDiluenteMl, 2) : undefined,
    volumeFinalMl: volumeFinalMl !== undefined ? arred(volumeFinalMl, 2) : undefined,
    volumeFinalFaixaMl: volumeFinalFaixaMl
      ? {
          min: volumeFinalFaixaMl.min !== undefined ? arred(volumeFinalFaixaMl.min, 1) : undefined,
          max: volumeFinalFaixaMl.max !== undefined ? arred(volumeFinalFaixaMl.max, 1) : undefined,
        }
      : undefined,
    concentracaoFinalMgMl:
      concentracaoFinalMgMl !== undefined ? arred(concentracaoFinalMgMl, 4) : undefined,
    mgPorKgEquivalente:
      mgPorKgEquivalente !== undefined ? arred(mgPorKgEquivalente, 2) : undefined,
    alertas,
  };
}
