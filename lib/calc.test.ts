import { describe, expect, it } from "vitest";
import { calcular } from "./calc";
import { gerarNota } from "./nota";
import { MEDICAMENTOS_SEED } from "./seed";
import { validarMedicamentos } from "./validate";
import type { Medicamento } from "./types";

const toci: Medicamento = { ...MEDICAMENTOS_SEED[0], revisado: true };

describe("calcular", () => {
  it("dose por kg: 8 mg/kg x 60 kg = 480 mg, 6 frascos, 24 mL", () => {
    const r = calcular(toci, { modo: "mgkg", pesoKg: 60, doseMgPorKg: 8 });
    expect(r.ok).toBe(true);
    expect(r.doseMg).toBe(480);
    expect(r.frascosNecessarios).toBe(6);
    expect(r.frascosInteiros).toBe(6);
    expect(r.sobraMg).toBe(0);
    expect(r.volumeAspirarMl).toBe(24);
    expect(r.volumeFinalMl).toBe(124);
    expect(r.alertas).toEqual([]);
  });

  it("exemplo do pedido: 60 mg de frasco 80 mg/4 mL => aspirar 3 mL", () => {
    const r = calcular(toci, { modo: "mg", doseMg: 60 });
    expect(r.volumeAspirarMl).toBe(3);
    expect(r.frascosNecessarios).toBe(1);
    expect(r.frascosInteiros).toBe(0);
    expect(r.sobraMg).toBe(20);
  });

  it("frascos inteiros: 6 frascos = 480 mg, sem arredondar", () => {
    const r = calcular(
      { ...toci, arredondamento: { tipo: "frasco" } },
      { modo: "frascos", frascos: 6 },
    );
    expect(r.doseMg).toBe(480);
    expect(r.arredondada).toBe(false);
  });

  it("frascos inteiros rejeita número fracionado", () => {
    expect(calcular(toci, { modo: "frascos", frascos: 2.5 }).ok).toBe(false);
  });

  it("evita erro de ponto flutuante (0,1 mg/kg x 3 kg)", () => {
    const r = calcular(toci, { modo: "mgkg", pesoKg: 3, doseMgPorKg: 0.1 });
    expect(r.doseMg).toBe(0.3);
  });

  it("arredondamento para frasco inteiro", () => {
    const med: Medicamento = { ...toci, arredondamento: { tipo: "frasco" } };
    const r = calcular(med, { modo: "mg", doseMg: 475 });
    expect(r.doseMg).toBe(480);
    expect(r.arredondada).toBe(true);
    expect(r.doseCalculadaMg).toBe(475);
  });

  it("arredondamento com tolerância só arredonda dentro do limite", () => {
    const med: Medicamento = {
      ...toci,
      arredondamento: { tipo: "frasco_tolerancia", toleranciaPercent: 10 },
    };
    expect(calcular(med, { modo: "mg", doseMg: 475 }).doseMg).toBe(480); // 1,05%
    expect(calcular(med, { modo: "mg", doseMg: 440 }).doseMg).toBe(480); // 9,09%
    expect(calcular(med, { modo: "mg", doseMg: 430 }).doseMg).toBe(400); // 6,98% (dentro)
    expect(calcular(med, { modo: "mg", doseMg: 100 }).doseMg).toBe(100); // 20% (fora, mantém exata)
  });

  it("modo completar: volume final = volume da bolsa", () => {
    const med: Medicamento = { ...toci, diluicao: { ...toci.diluicao, modo: "completar" } };
    const r = calcular(med, { modo: "mgkg", pesoKg: 60, doseMgPorKg: 8 });
    expect(r.volumeFinalMl).toBe(100);
    expect(r.volumeDiluenteMl).toBe(76);
  });

  it("modo completar: erro quando o medicamento não cabe na bolsa", () => {
    const med: Medicamento = {
      ...toci,
      diluicao: { ...toci.diluicao, modo: "completar", volumeBolsaMl: 20 },
    };
    expect(calcular(med, { modo: "mgkg", pesoKg: 60, doseMgPorKg: 8 }).ok).toBe(false);
  });

  it("alerta quando passa dos limites cadastrados", () => {
    const r = calcular(toci, { modo: "mgkg", pesoKg: 120, doseMgPorKg: 8 });
    expect(r.doseMg).toBe(960);
    expect(r.alertas.length).toBeGreaterThanOrEqual(1);
    expect(r.alertas.join(" ")).toMatch(/teto/);
  });

  it("peso ou dose ausentes/zero/negativos devolvem erro", () => {
    expect(calcular(toci, { modo: "mgkg", doseMgPorKg: 8 }).ok).toBe(false);
    expect(calcular(toci, { modo: "mgkg", pesoKg: 0, doseMgPorKg: 8 }).ok).toBe(false);
    expect(calcular(toci, { modo: "mgkg", pesoKg: -5, doseMgPorKg: 8 }).ok).toBe(false);
    expect(calcular(toci, { modo: "mg", doseMg: NaN }).ok).toBe(false);
  });
});

describe("gerarNota", () => {
  it("inclui dose, frascos, volume a aspirar e bolsa", () => {
    const e = { modo: "mgkg" as const, pesoKg: 60, doseMgPorKg: 8 };
    const r = calcular(toci, e);
    const nota = gerarNota(toci, e, r).join("\n");
    expect(nota).toContain("TOCILIZUMABE 480 mg");
    expect(nota).toContain("6 frascos");
    expect(nota).toContain("aspirar 24 mL");
    expect(nota).toContain("100 mL de SF 0,9%");
    expect(nota).toContain("Infundir em 60 minutos");
  });

  it("avisa quando o cadastro não foi revisado", () => {
    const e = { modo: "mg" as const, doseMg: 80 };
    const med = { ...toci, revisado: false };
    expect(gerarNota(med, e, calcular(med, e)).join("\n")).toContain("NÃO foi revisado");
  });

  it("inclui reconstituição para liofilizados", () => {
    const med: Medicamento = {
      ...toci,
      apresentacao: { mgPorFrasco: 100, mlPorFrasco: 10 },
      reconstituicao: { diluente: "Água para injetáveis", volumeMl: 10 },
    };
    const e = { modo: "mg" as const, doseMg: 300 };
    const nota = gerarNota(med, e, calcular(med, e)).join("\n");
    expect(nota).toContain("reconstituir cada frasco com 10 mL de Água para injetáveis");
    expect(nota).toContain("total de 30 mL para 3 frascos");
  });
});

describe("validarMedicamentos", () => {
  it("aceita o cadastro de exemplo", () => {
    expect(validarMedicamentos(MEDICAMENTOS_SEED).ok).toBe(true);
  });

  it("rejeita mg por frasco zerado", () => {
    const ruim = [{ ...toci, apresentacao: { mgPorFrasco: 0, mlPorFrasco: 4 } }];
    expect(validarMedicamentos(ruim).ok).toBe(false);
  });

  it("rejeita identificadores repetidos", () => {
    expect(validarMedicamentos([toci, toci]).ok).toBe(false);
  });
});
