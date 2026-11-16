import { describe, expect, it } from "vitest";
import { calcular } from "./calc";
import { MEDICAMENTOS_GUIA } from "./dados-guia";
import { MEDICAMENTOS_GUIA_FUTUROS } from "./dados-guia-futuros";
import { gerarNota } from "./nota";
import { validarMedicamentos } from "./validate";
import type { EntradaCalculo, Medicamento } from "./types";

const guia = (id: string): Medicamento => {
  const m = [...MEDICAMENTOS_GUIA, ...MEDICAMENTOS_GUIA_FUTUROS].find((x) => x.id === id);
  if (!m) throw new Error(`medicamento ${id} não encontrado`);
  return m;
};
const toci = guia("tocilizumabe");
const infli = guia("infliximabe");
const vedo = guia("vedolizumabe");

const nota = (med: Medicamento, e: EntradaCalculo) => gerarNota(med, e, calcular(med, e)).join("\n");

describe("tocilizumabe (bolsa 50 mL < 30 kg, 100 mL >= 30 kg)", () => {
  it("60 kg x 8 mg/kg = 480 mg: 6 frascos, aspirar 24 mL, bolsa de 100 mL (volume final 100 mL)", () => {
    const r = calcular(toci, { modo: "mgkg", pesoKg: 60, doseMgPorKg: 8 });
    expect(r.ok).toBe(true);
    expect(r.doseMg).toBe(480);
    expect(r.frascosNecessarios).toBe(6);
    expect(r.sobraMg).toBe(0);
    expect(r.volumeAspirarMl).toBe(24);
    expect(r.bolsaMl).toBe(100);
    expect(r.volumeFinalMl).toBe(100);
    expect(r.volumeDiluenteMl).toBe(76);
    expect(r.alertas).toEqual([]);
  });

  it("25 kg x 8 mg/kg = 200 mg: 3 frascos (sobra 40 mg), aspirar 10 mL, bolsa de 50 mL", () => {
    const r = calcular(toci, { modo: "mgkg", pesoKg: 25, doseMgPorKg: 8 });
    expect(r.doseMg).toBe(200);
    expect(r.frascosNecessarios).toBe(3);
    expect(r.sobraMg).toBe(40);
    expect(r.mlUltimoFrasco).toBe(2); // 40 mg de um frasco de 80 mg/4 mL
    expect(r.sobraMl).toBe(2);
    expect(r.volumeAspirarMl).toBe(10);
    expect(r.bolsaMl).toBe(50);
    expect(r.volumeFinalMl).toBe(50);
  });

  it("limite de 30 kg: 29,9 kg usa 50 mL; 30 kg usa 100 mL", () => {
    expect(calcular(toci, { modo: "mg", doseMg: 240, pesoKg: 29.9 }).bolsaMl).toBe(50);
    expect(calcular(toci, { modo: "mg", doseMg: 240, pesoKg: 30 }).bolsaMl).toBe(100);
  });

  it("sem peso não define a bolsa: devolve erro pedindo o peso", () => {
    const r = calcular(toci, { modo: "mg", doseMg: 480 });
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/peso/i);
    expect(calcular(toci, { modo: "frascos", frascos: 6 }).ok).toBe(false);
  });

  it("frascos inteiros com peso: 6 frascos = 480 mg", () => {
    const r = calcular(toci, { modo: "frascos", frascos: 6, pesoKg: 70 });
    expect(r.doseMg).toBe(480);
    expect(r.bolsaMl).toBe(100);
  });

  it("a nota é curta: dose, frascos, aspirar, bolsa e concentração final", () => {
    const n = nota(toci, { modo: "mgkg", pesoKg: 60, doseMgPorKg: 8 });
    expect(n).toContain("TOCILIZUMABE 480 mg IV (8 mg/kg x 60 kg = 480 mg)");
    expect(n).toContain("Total: 6 frascos (frascos inteiros, sem sobra).");
    expect(n).toContain("Aspirar 24 mL do medicamento e completar com SF 0,9% até o volume final de 100 mL");
    expect(n).toContain("retirando antes 24 mL do soro");
    expect(n).toContain("Inverter suavemente a bolsa para misturar, sem agitar.");
    expect(n).toContain("Concentração final: 4,8 mg/mL.");
    expect(n).toContain("cadastro ainda NÃO revisado");
  });

  it("a nota não traz infusão, estabilidade, observações nem rodapé", () => {
    const n = nota(toci, { modo: "mgkg", pesoKg: 60, doseMgPorKg: 8 });
    expect(n).not.toMatch(/Infundir|Infusão|Estabilidade|Obs\.|Apresentação|Conferir com a farmácia/);
  });
});

describe("infliximabe (bolsa fixa de 250 mL)", () => {
  it("70 kg x 5 mg/kg = 350 mg: 4 frascos, aspirar 35 mL, bolsa de 250 mL", () => {
    const r = calcular(infli, { modo: "mgkg", pesoKg: 70, doseMgPorKg: 5 });
    expect(r.doseMg).toBe(350);
    expect(r.frascosNecessarios).toBe(4);
    expect(r.frascosInteiros).toBe(3);
    expect(r.sobraMg).toBe(50);
    expect(r.mlUltimoFrasco).toBe(5);
    expect(r.sobraMl).toBe(5);
    expect(r.volumeAspirarMl).toBe(35);
    expect(r.bolsaMl).toBe(250);
    expect(r.volumeFinalMl).toBe(250);
    expect(r.volumeReconstituicaoTotalMl).toBe(40);
    expect(r.concentracaoFinalMgMl).toBe(1.4);
    expect(r.alertas).toEqual([]);
  });

  it("não precisa do peso para definir a bolsa", () => {
    const r = calcular(infli, { modo: "frascos", frascos: 3 });
    expect(r.ok).toBe(true);
    expect(r.bolsaMl).toBe(250);
  });

  it("alerta quando a concentração final fica abaixo de 0,4 mg/mL", () => {
    const r = calcular(infli, { modo: "mgkg", pesoKg: 30, doseMgPorKg: 3 });
    expect(r.doseMg).toBe(90);
    expect(r.alertas.join(" ")).toMatch(/abaixo do mínimo/);
  });

  it("a nota fica no formato curto aprovado (80 kg x 5 mg/kg = 400 mg)", () => {
    const e: EntradaCalculo = { modo: "mgkg", pesoKg: 80, doseMgPorKg: 5 };
    const linhas = gerarNota(infli, e, calcular(infli, e));
    expect(linhas[0]).toBe("INFLIXIMABE 400 mg IV (5 mg/kg x 80 kg = 400 mg)");
    expect(linhas[1]).toBe(
      "Total: 4 frascos (frascos inteiros, sem sobra). " +
        "Reconstituir cada frasco com 10 mL de Água para injetáveis. " +
        "Girar suavemente, sem agitar; deixar a solução em repouso por 5 minutos. " +
        "Após, aspirar 40 mL do medicamento e completar com SF 0,9% até o volume final de 250 mL " +
        "(bolsa de 250 mL, retirando antes 40 mL do soro). Concentração final: 1,6 mg/mL.",
    );
    expect(linhas).toHaveLength(3); // cabeçalho + parágrafo + aviso de "não revisado"
  });

  it("frasco parcial aparece em mL: 3 frascos completos e 5 mL do último", () => {
    const n = nota(infli, { modo: "mgkg", pesoKg: 70, doseMgPorKg: 5 });
    expect(n).toContain("Total: 4 frascos (3 frascos completos e 5 mL do último).");
    expect(n).not.toMatch(/descartar \d+ mg|usar \d+ mg/);
  });

  it("singular: 1 frasco completo e X mL do último", () => {
    const n = nota(infli, { modo: "mg", doseMg: 125 });
    expect(n).toContain("Total: 2 frascos (1 frasco completo e 2,5 mL do último).");
  });

  it("só um frasco parcial: usar X mL do frasco (tocilizumabe 60 mg => 3 mL)", () => {
    const n = nota(toci, { modo: "mg", doseMg: 60, pesoKg: 70 });
    expect(n).toContain("Total: 1 frasco (usar 3 mL do frasco).");
  });

  it("depois de revisado, a nota tem só o cabeçalho e o parágrafo", () => {
    const med = { ...infli, revisado: true };
    const e: EntradaCalculo = { modo: "mgkg", pesoKg: 80, doseMgPorKg: 5 };
    expect(gerarNota(med, e, calcular(med, e))).toHaveLength(2);
  });
});

describe("vedolizumabe (bolsa de 250 mL)", () => {
  it("300 mg = 1 frasco, aspirar 5 mL, bolsa de 250 mL e volume final de 255 mL", () => {
    const r = calcular(vedo, { modo: "mg", doseMg: 300 });
    expect(r.frascosNecessarios).toBe(1);
    expect(r.volumeAspirarMl).toBe(5);
    expect(r.bolsaMl).toBe(250);
    expect(r.volumeFinalMl).toBe(255);
  });

  it("a nota traz reconstituição, preparo na bolsa de 250 mL e concentração final", () => {
    const n = nota(vedo, { modo: "frascos", frascos: 1 });
    expect(n).toContain("Reconstituir cada frasco com 4,8 mL de Água para injetáveis.");
    expect(n).toContain("deixar em repouso até 20 min");
    expect(n).toContain("Após, aspirar 5 mL do medicamento e adicionar a uma bolsa de 250 mL de SF 0,9%. Volume final: 255 mL.");
    expect(n).toContain("Concentração final: 1,177 mg/mL.");
    expect(n).not.toMatch(/lavar a linha|Infundir|Estabilidade/);
  });
});

describe("regras gerais do cálculo", () => {
  const base: Medicamento = { ...toci, diluicao: { ...toci.diluicao, volumeBolsaPorPeso: undefined } };

  it("frascos inteiros rejeita número fracionado", () => {
    expect(calcular(base, { modo: "frascos", frascos: 2.5 }).ok).toBe(false);
  });

  it("evita erro de ponto flutuante (0,1 mg/kg x 3 kg)", () => {
    expect(calcular(base, { modo: "mgkg", pesoKg: 3, doseMgPorKg: 0.1 }).doseMg).toBe(0.3);
  });

  it("peso ou dose ausentes, zero ou negativos devolvem erro", () => {
    expect(calcular(base, { modo: "mgkg", doseMgPorKg: 8 }).ok).toBe(false);
    expect(calcular(base, { modo: "mgkg", pesoKg: 0, doseMgPorKg: 8 }).ok).toBe(false);
    expect(calcular(base, { modo: "mgkg", pesoKg: -5, doseMgPorKg: 8 }).ok).toBe(false);
    expect(calcular(base, { modo: "mg", doseMg: NaN }).ok).toBe(false);
  });

  it("arredondamento para frasco inteiro", () => {
    const med: Medicamento = { ...base, arredondamento: { tipo: "frasco" } };
    const r = calcular(med, { modo: "mg", doseMg: 475 });
    expect(r.doseMg).toBe(480);
    expect(r.arredondada).toBe(true);
    expect(r.doseCalculadaMg).toBe(475);
  });

  it("arredondamento com tolerância só arredonda dentro do limite", () => {
    const med: Medicamento = { ...base, arredondamento: { tipo: "frasco_tolerancia", toleranciaPercent: 10 } };
    expect(calcular(med, { modo: "mg", doseMg: 475 }).doseMg).toBe(480);
    expect(calcular(med, { modo: "mg", doseMg: 440 }).doseMg).toBe(480);
    expect(calcular(med, { modo: "mg", doseMg: 430 }).doseMg).toBe(400);
    expect(calcular(med, { modo: "mg", doseMg: 100 }).doseMg).toBe(100);
  });

  it("modo completar: erro quando o medicamento não cabe na bolsa", () => {
    const med: Medicamento = { ...base, diluicao: { ...base.diluicao, volumeBolsaMl: 20 } };
    expect(calcular(med, { modo: "mgkg", pesoKg: 60, doseMgPorKg: 8 }).ok).toBe(false);
  });

  it("alerta quando passa dos limites cadastrados", () => {
    const med: Medicamento = { ...base, doseMaxMgKg: 8, doseMaxMg: 800 };
    const r = calcular(med, { modo: "mgkg", pesoKg: 120, doseMgPorKg: 8 });
    expect(r.alertas.join(" ")).toMatch(/teto/);
    const r2 = calcular(med, { modo: "mgkg", pesoKg: 60, doseMgPorKg: 10 });
    expect(r2.alertas.join(" ")).toMatch(/acima do máximo/);
  });
});

describe("modelos de diluição dos demais medicamentos do guia (ainda não carregados)", () => {
  it("faixa de concentração (rituximabe 1 a 4 mg/mL): 700 mg => 175 a 700 mL", () => {
    const r = calcular(guia("rituximabe-500"), { modo: "mg", doseMg: 700 });
    expect(r.volumeFinalMl).toBeUndefined();
    expect(r.volumeFinalFaixaMl).toEqual({ min: 175, max: 700 });
    expect(nota(guia("rituximabe-500"), { modo: "mg", doseMg: 700 })).toContain("concentração final de 1 a 4 mg/mL");
  });

  it("unidades (imiglucerase 400 U / 10 mL): 800 U => 20 mL e faixa de 100 a 200 mL", () => {
    const med = guia("imiglucerase");
    const r = calcular(med, { modo: "mg", doseMg: 800 });
    expect(r.volumeAspirarMl).toBe(20);
    expect(r.volumeFinalFaixaMl).toEqual({ min: 100, max: 200 });
    expect(nota(med, { modo: "mg", doseMg: 800 })).toContain("IMIGLUCERASE 800 U");
  });

  it("sem mL por frasco (imunoglobulina): calcula frascos sem inventar volume", () => {
    const med = guia("imunoglobulina-humana");
    const e: EntradaCalculo = { modo: "mg", doseMg: 12 };
    const r = calcular(med, e);
    expect(r.ok).toBe(true);
    expect(r.frascosNecessarios).toBe(3);
    expect(r.volumeAspirarMl).toBeUndefined();
    expect(r.mlUltimoFrasco).toBeUndefined();
    expect(nota(med, e)).toContain("recomendação do fabricante");
    // sem mL por frasco, cai para a quantidade
    expect(nota(med, { modo: "mg", doseMg: 7 })).toContain("o último é parcial: usar 2 g e descartar 3 g");
  });

  it("laronidase: bolsa de 100 mL até 20 kg e 250 mL acima", () => {
    const med = guia("laronidase");
    expect(calcular(med, { modo: "mg", doseMg: 2.9, pesoKg: 20 }).bolsaMl).toBe(100);
    expect(calcular(med, { modo: "mg", doseMg: 2.9, pesoKg: 20.5 }).bolsaMl).toBe(250);
  });
});

describe("validarMedicamentos", () => {
  it("aceita os medicamentos carregados e os futuros", () => {
    expect(validarMedicamentos(MEDICAMENTOS_GUIA).ok).toBe(true);
    expect(validarMedicamentos(MEDICAMENTOS_GUIA_FUTUROS).ok).toBe(true);
  });

  it("todos os cadastros do guia entram como não revisados", () => {
    for (const m of [...MEDICAMENTOS_GUIA, ...MEDICAMENTOS_GUIA_FUTUROS]) expect(m.revisado).toBe(false);
  });

  it("o guia não traz pré-medicação nas notas", () => {
    for (const m of MEDICAMENTOS_GUIA) {
      const texto = JSON.stringify(m).toLowerCase();
      expect(texto).not.toMatch(/aciclovir|antiemético|pré-medica/);
    }
  });

  it("rejeita quantidade por frasco zerada e identificadores repetidos", () => {
    expect(validarMedicamentos([{ ...toci, apresentacao: { mgPorFrasco: 0, mlPorFrasco: 4 } }]).ok).toBe(false);
    expect(validarMedicamentos([toci, toci]).ok).toBe(false);
  });

  it("rejeita diluição sem nenhuma regra", () => {
    const sem = { ...toci, diluicao: { diluente: "SF 0,9%", modo: "adicionar" } };
    expect(validarMedicamentos([sem]).ok).toBe(false);
  });

  it("preserva a regra de bolsa por peso ao validar", () => {
    const r = validarMedicamentos([toci]);
    expect(r.ok && r.valor[0].diluicao.volumeBolsaPorPeso).toEqual([{ abaixoDeKg: 30, volumeMl: 50 }]);
  });
});
