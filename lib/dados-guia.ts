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
        "Agulha 21G (0,8 mm) ou menor; direcionar o jato para a parede do frasco. Girar suavemente, sem agitar (é comum formar espuma); deixar a solução em repouso por 5 minutos.",
    },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "completar",
      volumeBolsaMl: 250,
      instrucaoExtra: "Introduzir lentamente na bolsa e misturar suavemente. Diluir somente com SF 0,9%.",
      concentracaoFinalMinMgMl: 0.4,
      concentracaoFinalMaxMgMl: 4,
    },
    dosesUsuais: [
      { rotulo: "Artrite reumatoide (infusão inicial)", mgPorKg: 3 },
      { rotulo: "Espondilite, A. psoriásica, psoríase, Crohn, RCU", mgPorKg: 5 },
      { rotulo: "Ajuste de dose (máximo da bula)", mgPorKg: 10 },
    ],
    doseMaxMgKg: 10,
    infusaoTexto:
      "Mínimo de 2 h na infusão inicial (todas as indicações). Na artrite reumatoide, se as 3 primeiras infusões foram toleradas em 2 h, as seguintes podem durar no mínimo 1 h. Demais indicações: mínimo de 2 h.",
    estabilidade:
      "Sem conservantes: iniciar a infusão em até 3 h após a reconstituição e a diluição. Em condições assépticas, pode ser usada em até 24 h entre 2 e 8 °C. Não guardar a sobra da solução.",
    observacoes:
      "Usar equipo com filtro em linha estéril, apirogênico e de baixa ligação a proteínas (poro de 1,2 µm ou menor; o guia do serviço cita 0,2 µm) e bomba de infusão. Infundir lentamente, sobretudo se já houve reação à infusão. Não infundir junto com outros medicamentos no mesmo equipo. Dose máxima de 10 mg/kg (ajuste na artrite reumatoide, Crohn e colite/retocolite ulcerativa). Insuficiência cardíaca: usar com extrema cautela; a dose não deve exceder 5 mg/kg. Não administrar em infecção ativa clinicamente importante ou alergia a proteínas de camundongo. Adultos: todas as indicações; 6 a 17 anos: apenas Crohn e colite/retocolite ulcerativa. Contém sacarose (atenção em diabéticos) e 1,9 mg de sódio por frasco. Solução reconstituída: de incolor a amarelada e opalescente, pode ter partículas translúcidas finas; não usar com partículas opacas ou mudança de cor. Observar por pelo menos 1 h após a infusão. Descartar a sobra.",
    pendencias:
      "Conferido com as bulas do paciente e do profissional (Remicade): preparo, diluição em 250 mL de SF 0,9%, filtro e estabilidade batem; as doses (3 mg/kg na artrite reumatoide e 5 mg/kg nas demais indicações) e o máximo de 10 mg/kg (ajuste) vêm da bula do profissional, que não traz dose máxima absoluta em mg. Em insuficiência cardíaca a bula limita a 5 mg/kg, o que o site não controla (depende do paciente). A retirada de SF da bolsa é descrita como opção ('pode ser realizado') e é a forma usada aqui (volume final de 250 mL): confirmar a prática do serviço.",
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "tocilizumabe",
    nome: "Tocilizumabe",
    descricao: "Via intravenosa. Solução injetável 20 mg/mL, frasco de 4 mL.",
    apresentacao: { mgPorFrasco: 80, mlPorFrasco: 4 },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "completar",
      volumeBolsaMl: 100,
      volumeBolsaPorPeso: [{ abaixoDeKg: 30, volumeMl: 50 }],
      instrucaoExtra: "Inverter suavemente a bolsa para misturar, sem agitar.",
    },
    dosesUsuais: [
      { rotulo: "Dose usual (AR; AIJP e AIJS ≥ 30 kg)", mgPorKg: 8 },
      { rotulo: "AR com alteração laboratorial (dose reduzida)", mgPorKg: 4 },
      { rotulo: "AIJP < 30 kg", mgPorKg: 10 },
      { rotulo: "AIJS < 30 kg", mgPorKg: 12 },
    ],
    doseMaxMg: 800,
    infusaoTexto:
      "Em 1 hora: iniciar lentamente e, sem anormalidades, aumentar a velocidade para completar em cerca de 1 h.",
    estabilidade:
      "Após diluição: usar imediatamente; se necessário, até 24 h entre 2 e 8 °C. A solução é estável por até 24 h em temperatura ambiente (até 30 °C).",
    observacoes:
      "Dose máxima de 800 mg por infusão (bula: acima de 100 kg, doses superiores a 800 mg não são recomendadas). Contém sacarose (50 mg/mL): em diabéticos, considerar controle da glicemia após a infusão. Só infundir soluções translúcidas a opalescentes, incolores a amarelo pálido, sem partículas. Compatível com bolsas de PP, PE, PVC e vidro.",
    pendencias:
      "Diluição conferida com a bula (Actemra): 100 mL a partir de 30 kg e 50 mL abaixo de 30 kg, retirando da bolsa o volume de tocilizumabe e descartando. Dose máxima cadastrada: 800 mg, que equivale a 10 frascos de 80 mg (e não 8): confirmar. Doses AIJP/AIJS (10 e 12 mg/kg abaixo de 30 kg) vêm da bula; remover se não forem usadas.",
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
