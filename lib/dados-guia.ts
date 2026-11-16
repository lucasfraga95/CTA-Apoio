import type { Medicamento } from "./types";

/**
 * Medicamentos atendidos hoje (infliximabe, vedolizumabe, tocilizumabe), transcritos do
 * "Guia de medicamentos do Centro de Infusão". Pré-medicação não faz parte do site.
 * Tudo entra como `revisado: false`: só o administrador marca como revisado depois de conferir.
 * Trechos que estavam em vermelho no guia ficam registrados em `pendencias`.
 * O guia não traz doses usuais em mg/kg (exceto infliximabe), então `dosesUsuais` fica vazio.
 */
const DATA = "2026-11-16T12:00:00.000Z";
const SEM_ARRED = { tipo: "nenhum" as const };

export const MEDICAMENTOS_GUIA: Medicamento[] = [
  {
    id: "infliximabe",
    nome: "Infliximabe",
    descricao: "Pó liofilizado para solução injetável, 100 mg.",
    apresentacao: { mgPorFrasco: 100, mlPorFrasco: 10 },
    reconstituicao: {
      diluente: "Água para injetáveis",
      volumeMl: 10,
      instrucao:
        "Girar suavemente, sem agitar; deixar a solução em repouso por 5 minutos.",
    },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "completar",
      volumeBolsaMl: 250,
      concentracaoFinalMinMgMl: 0.4,
      concentracaoFinalMaxMgMl: 4,
    },
    dosesUsuais: [
      { rotulo: "Artrite reumatoide (infusão inicial)", mgPorKg: 3 },
      { rotulo: "Espondilite, A. psoriásica, psoríase, Crohn, RCU", mgPorKg: 5 },
    ],
    infusaoTexto:
      "Mínimo de 2 h na infusão inicial. Na artrite reumatoide, se as 3 primeiras infusões foram toleradas em 2 h, as seguintes podem durar no mínimo 1 h. Nas demais indicações (5 mg/kg): mínimo de 2 h.",
    estabilidade:
      "Sem conservantes: iniciar a infusão em até 3 h após a reconstituição e a diluição. Após diluição: 24 h sob refrigeração.",
    observacoes:
      "Usar bomba de infusão com filtro de 0,2 µm. Não administrar em infecção ativa clinicamente importante. Evitar agitação vigorosa (forma espuma). Observar por pelo menos 1 h após a infusão.",
    pendencias:
      "A diluição estava em vermelho no guia. A retirada de SF da bolsa aparece no guia como opção ('pode ser realizado'); o cadastro usa essa forma (volume final de 250 mL). Confirmar.",
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "tocilizumabe",
    nome: "Tocilizumabe",
    descricao: "Solução injetável 20 mg/mL, frasco de 4 mL.",
    apresentacao: { mgPorFrasco: 80, mlPorFrasco: 4 },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "completar",
      volumeBolsaMl: 100,
      volumeBolsaPorPeso: [{ abaixoDeKg: 30, volumeMl: 50 }],
      instrucaoExtra: "Inverter suavemente a bolsa para misturar, sem agitar.",
    },
    dosesUsuais: [],
    tempoInfusaoMin: 60,
    estabilidade: "Após diluição: 24 h sob refrigeração.",
    observacoes:
      "Compatível com bolsas de PP, PE, PVC e vidro. Só infundir soluções translúcidas a opalescentes, incolores a amarelo pálido, sem partículas.",
    pendencias:
      "A diluição (50 mL abaixo de 30 kg; 100 mL a partir de 30 kg) estava em vermelho no guia e descreve 'volume final'; o cadastro usa 'completar até o volume da bolsa'. Confirmar.",
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "vedolizumabe",
    nome: "Vedolizumabe",
    descricao: "Pó liofilizado para solução injetável, 300 mg.",
    apresentacao: { mgPorFrasco: 300, mlPorFrasco: 5 },
    reconstituicao: {
      diluente: "Água para injetáveis",
      volumeMl: 4.8,
      instrucao:
        "Direcionar o jato para a parede do frasco; girar suavemente por pelo menos 15 s, sem agitar vigorosamente; deixar em repouso até 20 min (se não dissolver, mais 10 min; não usar se não dissolver em 30 min).",
    },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "adicionar",
      volumeBolsaMl: 250,
    },
    dosesUsuais: [],
    tempoInfusaoMin: 30,
    estabilidade:
      "Após reconstituição: 8 h sob refrigeração. Após diluição: 24 h (até 12 h em temperatura ambiente de 20 a 25 °C e o restante a 2 a 8 °C).",
    observacoes:
      "Ao final da infusão, lavar a linha com 30 mL de SF 0,9%. Observar sinais de hipersensibilidade por cerca de 2 h após as 2 primeiras infusões e por cerca de 1 h nas seguintes.",
    pendencias:
      "O guia diz 'concentração 60 mg/mL' após injetar 5 mL em 250 mL, o que não bate (seria cerca de 1,2 mg/mL); 60 mg/mL é a concentração do frasco reconstituído. A diluição estava em vermelho no guia. Confirmar.",
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
];
