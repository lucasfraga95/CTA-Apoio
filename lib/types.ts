export type Diluente = "SF 0,9%" | "SG 5%" | "Água para injetáveis";

/** Unidade em que o medicamento é dosado. */
export type Unidade = "mg" | "g" | "U" | "UI";

/** "adicionar": aspira-se o medicamento e injeta-se na bolsa (volume final = bolsa + medicamento).
 *  "completar": retira-se da bolsa o volume do medicamento antes de adicioná-lo (volume final = bolsa). */
export type ModoDiluicao = "adicionar" | "completar";

export type TipoArredondamento = "nenhum" | "frasco" | "frasco_tolerancia";

export interface DoseUsual {
  rotulo: string; // ex.: "Artrite reumatoide"
  mgPorKg: number; // quantidade por kg, na unidade do medicamento
}

/** Regra de volume de bolsa por peso. Vale se o peso atender ao(s) limite(s) informado(s). */
export interface RegraBolsaPorPeso {
  /** peso < abaixoDeKg */
  abaixoDeKg?: number;
  /** peso <= ateKg */
  ateKg?: number;
  volumeMl: number;
}

export interface Diluicao {
  diluente: Diluente;
  modo: ModoDiluicao;

  /** Volume fixo da bolsa (ou o padrão quando há regras por peso). */
  volumeBolsaMl?: number;
  /** Regras por peso, avaliadas em ordem; se nenhuma valer, usa volumeBolsaMl. */
  volumeBolsaPorPeso?: RegraBolsaPorPeso[];

  /** Diluir até uma faixa de concentração final (unidade/mL); calcula a faixa de volume final. */
  faixaConcentracao?: { min: number; max: number };
  /** Diluir até uma faixa de volume final (mL), sem volume de bolsa único. */
  faixaVolumeFinalMl?: { min?: number; max?: number };
  /** Sem regra no cadastro: "seguir recomendação do fabricante". */
  seguirFabricante?: boolean;

  /** Frase adicional de preparo (ex.: lavar a linha ao final). */
  instrucaoExtra?: string;

  /** Limites opcionais de concentração final (unidade/mL), usados só para alertar. */
  concentracaoFinalMinMgMl?: number;
  concentracaoFinalMaxMgMl?: number;
}

export interface Medicamento {
  id: string;
  nome: string;
  /** Observação curta exibida ao lado do nome (opcional). */
  descricao?: string;

  /** Unidade de dosagem; ausente = "mg". */
  unidade?: Unidade;

  apresentacao: {
    /** Quantidade por frasco, na unidade do medicamento. */
    mgPorFrasco: number;
    /** mL por frasco (já reconstituído, se liofilizado). Ausente = varia conforme o produto. */
    mlPorFrasco?: number;
  };

  /** Só para liofilizados: reconstituição antes da diluição. */
  reconstituicao?: {
    diluente: Diluente;
    volumeMl: number;
    instrucao?: string;
  };

  diluicao: Diluicao;

  dosesUsuais: DoseUsual[];
  doseMinMgKg?: number;
  doseMaxMgKg?: number;
  /** Dose máxima por infusão, na unidade do medicamento. Teto rígido: no cálculo por kg a dose é
   *  limitada a esse valor; em dose em mg ou frascos, passar do teto é recusado. */
  doseMaxMg?: number;

  /** Tempo fixo de infusão em minutos (quando for um número simples). */
  tempoInfusaoMin?: number;
  /** Texto livre de infusão (velocidades, etapas). Se existir, substitui o tempo fixo na nota. */
  infusaoTexto?: string;
  estabilidade?: string;
  /** Alertas práticos que vão na nota (filtro, bomba, etc.). */
  observacoes?: string;
  /** Anotações internas: pontos pendentes de confirmação (só aparecem no /admin). */
  pendencias?: string;

  arredondamento: {
    tipo: TipoArredondamento;
    /** Só para "frasco_tolerancia": % máxima de diferença aceita ao arredondar. */
    toleranciaPercent?: number;
  };

  /** false = dados não validados; a tela pública e a nota mostram um aviso. */
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
  /** true quando a dose calculada passou do máximo por infusão e foi limitada a ele. */
  limitadaAoMaximo?: boolean;
  frascosNecessarios: number; // frascos (inclusive parciais) abertos
  frascosInteiros: number; // frascos completos usados
  sobraMg: number; // desperdício do último frasco
  /** Volume a usar do último frasco (parcial), em mL. Indefinido se não há frasco parcial ou mL/frasco. */
  mlUltimoFrasco?: number;
  /** Volume que sobra (descarte) do último frasco, em mL. */
  sobraMl?: number;
  /** Indefinido quando o cadastro não informa mL por frasco. */
  volumeAspirarMl?: number;
  volumeReconstituicaoTotalMl?: number;
  /** Volume da bolsa de diluente, quando a regra é de bolsa fixa. */
  bolsaMl?: number;
  volumeDiluenteMl?: number; // volume de diluente a usar/adicionar
  /** Indefinido quando a regra é uma faixa. */
  volumeFinalMl?: number;
  volumeFinalFaixaMl?: { min?: number; max?: number };
  concentracaoFinalMgMl?: number;
  mgPorKgEquivalente?: number;
  alertas: string[];
}
