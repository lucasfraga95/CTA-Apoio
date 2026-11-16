import { arred, num } from "./format";
import type {
  EntradaCalculo,
  Medicamento,
  ResultadoCalculo,
} from "./types";

const EPS = 1e-9;

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
    volumeAspirarMl: 0,
    volumeDiluenteMl: 0,
    volumeFinalMl: 0,
    concentracaoFinalMgMl: 0,
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

export function calcular(
  med: Medicamento,
  entrada: EntradaCalculo,
): ResultadoCalculo {
  const { mgPorFrasco: m, mlPorFrasco } = med.apresentacao;
  if (!positivo(m) || !positivo(mlPorFrasco)) {
    return falha("Apresentação do medicamento inválida. Avise o administrador.");
  }

  let doseCalc: number;
  let permiteArredondar = true;

  switch (entrada.modo) {
    case "mgkg":
      if (!positivo(entrada.pesoKg)) return falha("Informe o peso do paciente.");
      if (!positivo(entrada.doseMgPorKg)) return falha("Informe a dose em mg/kg.");
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
      if (!positivo(entrada.doseMg)) return falha("Informe a dose em mg.");
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

  const volumeAspirarMl = (dose * mlPorFrasco) / m;

  const { volumeBolsaMl, modo } = med.diluicao;
  let volumeDiluenteMl: number;
  let volumeFinalMl: number;
  if (modo === "completar") {
    if (volumeAspirarMl > volumeBolsaMl + EPS) {
      return falha(
        `O volume do medicamento (${num(volumeAspirarMl)} mL) é maior que a bolsa de ${num(volumeBolsaMl)} mL. Ajuste o volume da bolsa no cadastro.`,
      );
    }
    volumeDiluenteMl = volumeBolsaMl - volumeAspirarMl;
    volumeFinalMl = volumeBolsaMl;
  } else {
    volumeDiluenteMl = volumeBolsaMl;
    volumeFinalMl = volumeBolsaMl + volumeAspirarMl;
  }

  const concentracaoFinalMgMl = dose / volumeFinalMl;
  const mgPorKgEquivalente = positivo(entrada.pesoKg) ? dose / entrada.pesoKg : undefined;

  // ---- Alertas de segurança ----
  const alertas: string[] = [];
  if (positivo(entrada.pesoKg) && (entrada.pesoKg < 3 || entrada.pesoKg > 250)) {
    alertas.push(`Peso incomum (${num(entrada.pesoKg)} kg). Confira se está em kg.`);
  }
  if (mgPorKgEquivalente !== undefined) {
    if (positivo(med.doseMaxMgKg) && mgPorKgEquivalente > med.doseMaxMgKg + EPS) {
      alertas.push(
        `Dose de ${num(mgPorKgEquivalente)} mg/kg acima do máximo cadastrado (${num(med.doseMaxMgKg)} mg/kg).`,
      );
    }
    if (positivo(med.doseMinMgKg) && mgPorKgEquivalente < med.doseMinMgKg - EPS) {
      alertas.push(
        `Dose de ${num(mgPorKgEquivalente)} mg/kg abaixo do mínimo cadastrado (${num(med.doseMinMgKg)} mg/kg).`,
      );
    }
  }
  if (positivo(med.doseMaxMg) && dose > med.doseMaxMg + EPS) {
    alertas.push(
      `Dose de ${num(dose)} mg acima do teto por infusão cadastrado (${num(med.doseMaxMg)} mg).`,
    );
  }
  const { concentracaoFinalMinMgMl: cMin, concentracaoFinalMaxMgMl: cMax } = med.diluicao;
  if (positivo(cMin) && concentracaoFinalMgMl < cMin - EPS) {
    alertas.push(
      `Concentração final (${num(concentracaoFinalMgMl, 3)} mg/mL) abaixo do mínimo cadastrado (${num(cMin, 3)} mg/mL).`,
    );
  }
  if (positivo(cMax) && concentracaoFinalMgMl > cMax + EPS) {
    alertas.push(
      `Concentração final (${num(concentracaoFinalMgMl, 3)} mg/mL) acima do máximo cadastrado (${num(cMax, 3)} mg/mL).`,
    );
  }

  return {
    ok: true,
    doseMg: arred(dose, 2),
    doseCalculadaMg: arred(doseCalc, 2),
    arredondada,
    frascosNecessarios,
    frascosInteiros,
    sobraMg: arred(sobraMg, 2),
    volumeAspirarMl: arred(volumeAspirarMl, 2),
    volumeReconstituicaoTotalMl: med.reconstituicao
      ? arred(frascosNecessarios * med.reconstituicao.volumeMl, 2)
      : undefined,
    volumeDiluenteMl: arred(volumeDiluenteMl, 2),
    volumeFinalMl: arred(volumeFinalMl, 2),
    concentracaoFinalMgMl: arred(concentracaoFinalMgMl, 4),
    mgPorKgEquivalente:
      mgPorKgEquivalente !== undefined ? arred(mgPorKgEquivalente, 2) : undefined,
    alertas,
  };
}
