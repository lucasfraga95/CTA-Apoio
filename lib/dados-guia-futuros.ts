import type { Medicamento } from "./types";

/**
 * NÃO CARREGADOS no site. Demais medicamentos do guia, já transcritos para uso futuro
 * (basta mover o item para dados-guia.ts). Transcrição do "Guia de medicamentos do Centro de Infusão".
 * Tudo entra como `revisado: false`: só o administrador marca como revisado depois de conferir.
 * Trechos que estavam em vermelho no guia ficam registrados em `pendencias`.
 * O guia não traz doses usuais em mg/kg (exceto infliximabe), então `dosesUsuais` fica vazio.
 */
const DATA = "2026-11-16T12:00:00.000Z";
const SEM_ARRED = { tipo: "nenhum" as const };

const PEND_PADRAO = "Trechos de diluição e pré-medicação estavam em vermelho no guia: confirmar.";

export const MEDICAMENTOS_GUIA_FUTUROS: Medicamento[] = [
  {
    id: "alfa-alglicosidase",
    nome: "Alfa-alglicosidase",
    descricao: "Pó liofilizado para solução injetável, 50 mg.",
    apresentacao: { mgPorFrasco: 50, mlPorFrasco: 10 },
    reconstituicao: {
      diluente: "Água para injetáveis",
      volumeMl: 10.3,
      instrucao:
        "Injetar lentamente pela parede interna de cada frasco. Cada frasco produz 5 mg/mL (50 mg por 10 mL).",
    },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "adicionar",
      faixaConcentracao: { min: 0.5, max: 4 },
      instrucaoExtra:
        "Volume final da bolsa entre 25 e 1000 mL. Inverter ou massagear delicadamente a bolsa para misturar.",
    },
    dosesUsuais: [],
    infusaoTexto:
      "Taxa inicial de no máximo 1 mg/kg/h; pode aumentar 2 mg/kg/h a cada 30 min, conforme tolerância, até o máximo de 7 mg/kg/h. Volume total em cerca de 4 horas.",
    estabilidade:
      "Após reconstituição: 24 h sob refrigeração, protegido da luz. Após diluição: 24 h sob refrigeração, protegido da luz.",
    observacoes:
      "Filtro em linha de 0,2 µm de baixa ligação proteica. Não congelar nem agitar. Contém 7 mg de sódio por frasco. Reação de hipersensibilidade grave possível até 3 h após a infusão.",
    pendencias: PEND_PADRAO,
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "alfataliglicerase",
    nome: "Alfataliglicerase",
    descricao: "Pó para solução injetável, 200 UI.",
    unidade: "UI",
    apresentacao: { mgPorFrasco: 200, mlPorFrasco: 5 },
    reconstituicao: {
      diluente: "Água para injetáveis",
      volumeMl: 5.1,
      instrucao:
        "Cada frasco reconstituído contém 5,3 mL; usar 5 mL de cada. Misturar suavemente, sem agitar.",
    },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "adicionar",
      faixaVolumeFinalMl: { min: 100, max: 200 },
    },
    dosesUsuais: [],
    infusaoTexto:
      "Pediatria: peso < 30 kg, 1 mL/min; peso ≥ 30 kg, iniciar a 1 mL/min e aumentar, se tolerado, até no máximo 2 mL/min (tempo mínimo 60 min). Adultos: iniciar a 1,2 mL/min e aumentar, se tolerado, até no máximo 2,2 mL/min (tempo mínimo 60 min).",
    estabilidade:
      "Após reconstituição: 24 h sob refrigeração (proteger da luz) ou 4 h em temperatura ambiente (sem proteção da luz). Após diluição: 24 h sob refrigeração, protegido da luz.",
    observacoes:
      "Usar filtro em linha de 0,2 µm de baixa ligação proteica. Pode ocorrer leve floculação após a diluição. Hipersensibilidade grave possível até 3 h após o início: interromper e tratar.",
    pendencias: PEND_PADRAO,
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "alfavelaglicerase",
    nome: "Alfavelaglicerase",
    descricao: "Pó liofilizado ou solução injetável, 400 U.",
    unidade: "U",
    apresentacao: { mgPorFrasco: 400, mlPorFrasco: 4 },
    reconstituicao: {
      diluente: "Água para injetáveis",
      volumeMl: 4.3,
      instrucao: "Concentração final de 100 U/mL.",
    },
    diluicao: { diluente: "SF 0,9%", modo: "adicionar", volumeBolsaMl: 100 },
    dosesUsuais: [],
    tempoInfusaoMin: 60,
    estabilidade:
      "Após reconstituição: 24 h sob refrigeração. Após diluição: 24 h sob refrigeração. Concluir a infusão em até 24 h após a reconstituição dos frascos.",
    observacoes:
      "Infundir com filtro em linha de baixa ligação proteica (0,2 ou 0,22 µm). Leve floculação é aceitável. Hipersensibilidade grave possível até 3 h após o início: interromper e tratar.",
    pendencias:
      "A diluição estava em vermelho no guia. A referência 2 cita taliglucerase (provável erro de cópia da página anterior). Confirmar.",
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "galsulfase",
    nome: "Galsulfase",
    descricao: "Solução injetável 1 mg/mL, frasco de 5 mL.",
    apresentacao: { mgPorFrasco: 5, mlPorFrasco: 5 },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "adicionar",
      faixaVolumeFinalMl: { max: 250 },
    },
    dosesUsuais: [],
    infusaoTexto:
      "Pelo menos 4 horas: 6 mL/h na primeira hora e 80 mL/h nas 3 horas restantes.",
    estabilidade:
      "Uso imediato (sem conservantes). Após a diluição, o armazenamento não deve exceder 48 h entre o preparo e o término da administração.",
    observacoes:
      "Usar bomba de infusão e equipo de PVC com filtro em linha de 0,2 µm. Retirar o volume do frasco lentamente, sem agulha com filtro, e não agitar (desnatura a enzima). Girar a bolsa suavemente. Em reação: diminuir a velocidade (pode prolongar até 20 h), suspender temporariamente ou administrar anti-histamínico, antitérmico ou corticoide.",
    pendencias: PEND_PADRAO,
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "idursulfase",
    nome: "Idursulfase",
    descricao: "Solução injetável 2 mg/mL, frasco de 3 mL.",
    apresentacao: { mgPorFrasco: 6, mlPorFrasco: 3 },
    diluicao: { diluente: "SF 0,9%", modo: "adicionar", volumeBolsaMl: 100 },
    dosesUsuais: [],
    infusaoTexto:
      "Iniciar a 8 mL/h por 15 min; se tolerado, aumentar 8 mL/h a cada 15 min até no máximo 100 mL/h. A primeira infusão deve durar mais de 3 h; se tolerado, as seguintes podem ser reduzidas gradualmente até 1 h. Tempo total máximo de 8 h.",
    estabilidade:
      "Uso imediato (sem conservantes). Após a diluição, o armazenamento não deve exceder 24 h entre o preparo e o término da administração.",
    observacoes:
      "Usar bomba de infusão e equipo de PVC com filtro em linha de 0,2 µm. Não agitar os frascos. Não usar se houver coloração ou partículas.",
    pendencias: PEND_PADRAO,
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "imiglucerase",
    nome: "Imiglucerase",
    descricao: "Pó liófilo injetável, 400 U.",
    unidade: "U",
    apresentacao: { mgPorFrasco: 400, mlPorFrasco: 10 },
    reconstituicao: {
      diluente: "Água para injetáveis",
      volumeMl: 10.2,
      instrucao:
        "Evitar impacto forte da água no pó; misturar suavemente, sem formar espuma. Cada frasco produz 40 U/mL.",
    },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "adicionar",
      faixaVolumeFinalMl: { min: 100, max: 200 },
      instrucaoExtra:
        "Retirar 10 mL do frasco reconstituído e diluir imediatamente. Misturar a solução suavemente.",
    },
    dosesUsuais: [],
    infusaoTexto:
      "1 a 2 horas. Recomenda-se que, inicialmente, as infusões sejam feitas em 2 horas.",
    estabilidade: "Após reconstituição: 12 h sob refrigeração. Após diluição: 24 h sob refrigeração.",
    observacoes:
      "Pode usar filtro em linha de 0,2 µm. Leve floculação (fibras finas) pode ocorrer após a diluição. Não usar frasco com partículas opacas ou alteração de cor.",
    pendencias: PEND_PADRAO,
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "imunoglobulina-humana",
    nome: "Imunoglobulina humana",
    descricao: "Frasco-ampola de 5 g a 6 g (conforme o fabricante).",
    unidade: "g",
    apresentacao: { mgPorFrasco: 5 },
    diluicao: { diluente: "SF 0,9%", modo: "adicionar", seguirFabricante: true },
    dosesUsuais: [],
    infusaoTexto:
      "Velocidade inicial usual de 0,5 mg/kg/hora, com bomba de infusão. Pode variar conforme o fabricante e a condição clínica.",
    estabilidade: "Uso imediato.",
    observacoes:
      "Usar veia calibrosa (antecubital, sobretudo com concentração ≥ 10%) e monitorar o acesso. Não misturar produtos ou frascos de laboratórios diferentes. Não agitar o frasco. Alguns laboratórios exigem filtro. Em risco de insuficiência renal, reduzir dose, taxa e/ou concentração. Em extravasamento: interromper, manter a agulha, aspirar a solução, remover o acesso, elevar o membro e aplicar compressas secas e mornas.",
    pendencias:
      "O guia traz frascos de 5 g a 6 g e não informa os mL por frasco; o cadastro usa 5 g. Diluição 'conforme o fabricante' estava em vermelho. Confirmar apresentação e concentração.",
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "laronidase",
    nome: "Laronidase",
    descricao: "Solução injetável 0,58 mg/mL (2,9 mg em 5 mL).",
    apresentacao: { mgPorFrasco: 2.9, mlPorFrasco: 5 },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "completar",
      volumeBolsaMl: 250,
      volumeBolsaPorPeso: [{ ateKg: 20, volumeMl: 100 }],
      instrucaoExtra:
        "Peso até 30 kg com comprometimento cardíaco ou respiratório: usar bolsa de 100 mL.",
    },
    dosesUsuais: [],
    infusaoTexto:
      "Velocidade inicial de 10 mcg/kg/h (bomba de infusão). Aumentar gradualmente a cada 15 min durante a primeira hora, conforme tolerado, até no máximo 200 mcg/kg/h; manter no restante da infusão (2 a 3 h). Volume total em cerca de 3 a 4 h.",
    estabilidade: "Após diluição: 36 h sob refrigeração.",
    observacoes:
      "Usar filtro em linha de 0,2 µm. Retirar a dose lentamente e adicionar à bolsa, sem agulha filtrante; não agitar (desnatura a enzima); girar a bolsa suavemente. Não usar frascos com partículas ou alteração de cor.",
    pendencias: PEND_PADRAO,
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "rituximabe-500",
    nome: "Rituximabe 500 mg/50 mL",
    descricao: "Solução injetável, frasco de 500 mg em 50 mL.",
    apresentacao: { mgPorFrasco: 500, mlPorFrasco: 50 },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "adicionar",
      faixaConcentracao: { min: 1, max: 4 },
    },
    dosesUsuais: [],
    infusaoTexto:
      "1ª infusão: iniciar a 50 mg/h; sem reação, aumentar 50 mg/h a cada 30 min até no máximo 400 mg/h. Infusões seguintes (se a inicial foi tolerada): iniciar a 100 mg/h e aumentar 100 mg/h a cada 30 min até no máximo 400 mg/h.",
    estabilidade: "Após diluição: 24 h sob refrigeração e 12 h em temperatura ambiente.",
    observacoes:
      "Em reação à infusão: diminuir a velocidade ou interromper; se melhorar, reiniciar a 50% da velocidade anterior. Interromper em arritmia grave. Evitar em infecção ativa grave.",
    pendencias: PEND_PADRAO,
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
  {
    id: "rituximabe-100",
    nome: "Rituximabe 100 mg/10 mL",
    descricao: "Solução injetável, frasco de 100 mg em 10 mL.",
    apresentacao: { mgPorFrasco: 100, mlPorFrasco: 10 },
    diluicao: {
      diluente: "SF 0,9%",
      modo: "adicionar",
      faixaConcentracao: { min: 1, max: 4 },
    },
    dosesUsuais: [],
    infusaoTexto:
      "1ª infusão: iniciar a 50 mg/h; sem reação, aumentar 50 mg/h a cada 30 min até no máximo 400 mg/h. Infusões seguintes (se a inicial foi tolerada): iniciar a 100 mg/h e aumentar 100 mg/h a cada 30 min até no máximo 400 mg/h.",
    estabilidade: "Após diluição: 24 h sob refrigeração e 12 h em temperatura ambiente.",
    observacoes:
      "Em reação à infusão: diminuir a velocidade ou interromper; se melhorar, reiniciar a 50% da velocidade anterior. Interromper em arritmia grave. Evitar em infecção ativa grave.",
    pendencias: PEND_PADRAO,
    arredondamento: SEM_ARRED,
    revisado: false,
    atualizadoEm: DATA,
  },
];
