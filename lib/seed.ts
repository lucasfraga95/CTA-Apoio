import type { Medicamento } from "./types";

/**
 * Dados de EXEMPLO, usados enquanto o Edge Config estiver vazio.
 * Marcados como `revisado: false`: a tela pública e a nota mostram um aviso.
 * Valide cada campo no /admin e marque como revisado.
 */
export const MEDICAMENTOS_SEED: Medicamento[] = [
  {
    id: "tocilizumabe",
    nome: "Tocilizumabe",
    descricao: "Exemplo para teste. Validar os dados antes do uso clínico.",
    apresentacao: { mgPorFrasco: 80, mlPorFrasco: 4 },
    diluicao: {
      diluente: "SF 0,9%",
      volumeBolsaMl: 100,
      modo: "adicionar",
    },
    dosesUsuais: [{ rotulo: "Dose usual (exemplo)", mgPorKg: 8 }],
    doseMinMgKg: 4,
    doseMaxMgKg: 8,
    doseMaxMg: 800,
    tempoInfusaoMin: 60,
    observacoes: "",
    arredondamento: { tipo: "nenhum" },
    revisado: false,
    atualizadoEm: "2026-11-16T12:00:00.000Z",
  },
];
