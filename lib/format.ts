/** Arredonda para n casas, evitando ruído de ponto flutuante (ex.: 0.1+0.2). */
export function arred(valor: number, casas = 2): number {
  const f = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * f) / f;
}

/** Formata número no padrão pt-BR, sem zeros desnecessários (ex.: 24 -> "24"; 2,5 -> "2,5"). */
export function num(valor: number, casas = 2): string {
  return arred(valor, casas).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  });
}

export function dataBR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm;
}
