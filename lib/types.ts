export type Diluente = "SF 0,9%" | "SG 5%" | "Água para injetáveis";

/** "adicionar": aspira-se o medicamento e injeta-se na bolsa (volume final = bolsa + medicamento).
 *  "completar": retira-se da bolsa o volume do medicamento antes de adicioná-lo (volume final = bolsa). */
export type ModoDiluicao = "adicionar" | "completar";

export type TipoArredondamento = "nenhum" | "frasco" | "frasco_tolerancia";

export interface DoseUsual {
  rotulo: string; // ex.: "Artrite reumatoide"
  mgPorKg: number;
}

export interface Medicamento {
  id: string;
  nome: string;
  /** Princípio ativo / observação curta exibida ao lado do nome (opcional). */
  descricao?: string;

  apresentacao: {
    mgPorFrasco: number;
    mlPorFrasco: number;
  };

  /** Só para liofilizados: reconstituição antes da diluição. */
  reconstituicao?: {
    diluente: Diluente;
    volumeMl: number;
    instrucao?: string;
  };

  diluicao: {
    diluente: Diluente;
    volumeBolsaMl: number;
    modo: ModoDiluicao;
    /** Limites opcionais de concentração final (mg/mL). */
    concentracaoFinalMinMgMl?: number;
    concentracaoFinalMaxMgMl?: number;
  };

  dosesUsuais: DoseUsual[];
  doseMinMgKg?: number;
  doseMaxMgKg?: number;
  /** Teto absoluto por infusão, em mg. */
  doseMaxMg?: number;

  tempoInfusaoMin?: number;
  observacoes?: string;

  arredondamento: {
    tipo: TipoArredondamento;
    /** Só para "frasco_tolerancia": % máxima de diferença aceita ao arredondar. */
    toleranciaPercent?: number;
  };

  /** false = dados de exemplo/não validados; a tela pública mostra um aviso. */
  revisado: boolean;
  atualizadoEm: string; // ISO
}

export interface EntradaHistorico {
  em: string; // ISO
  acao: string;
}

export type ModoCalculo = "mgkg" | "frascos" | "mg";

export interface EntradaCalculo {
  modo: ModoCalculo;
  pesoKg?: number;
  doseMgPorKg?: number;
  frascos?: number;
  doseMg?: number;
}

export interface ResultadoCalculo {
  ok: boolean;
  erro?: string;
  /** Dose final a infundir (após arredondamento). */
  doseMg: number;
  /** Dose bruta antes do arredondamento. */
  doseCalculadaMg: number;
  arredondada: boolean;
  frascosNecessarios: number; // frascos (inclusive parciais) abertos
  frascosInteiros: number; // frascos completos usados
  sobraMg: number; // desperdício do último frasco
  volumeAspirarMl: number;
  volumeReconstituicaoTotalMl?: number;
  volumeDiluenteMl: number; // volume de diluente a usar/adicionar
  volumeFinalMl: number;
  concentracaoFinalMgMl: number;
  mgPorKgEquivalente?: number;
  alertas: string[];
}
