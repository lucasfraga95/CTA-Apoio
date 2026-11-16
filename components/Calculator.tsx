"use client";

import { useMemo, useState } from "react";
import { calcular, unidadeDe } from "@/lib/calc";
import { gerarNota } from "@/lib/nota";
import { num, plural } from "@/lib/format";
import type { EntradaCalculo, Medicamento, ModoCalculo, ResultadoCalculo } from "@/lib/types";

/** Aceita vírgula ou ponto como separador decimal. */
function lerNumero(texto: string): number | undefined {
  const limpo = texto.trim().replace(",", ".");
  if (!limpo) return undefined;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : undefined;
}

function textoVolumeFinal(r: ResultadoCalculo): string {
  if (r.volumeFinalMl !== undefined) return `${num(r.volumeFinalMl)} mL`;
  const f = r.volumeFinalFaixaMl;
  if (f) {
    if (f.min !== undefined && f.max !== undefined) return `${num(f.min, 1)} a ${num(f.max, 1)} mL`;
    if (f.max !== undefined) return `até ${num(f.max, 1)} mL`;
    if (f.min !== undefined) return `≥ ${num(f.min, 1)} mL`;
  }
  return "—";
}

export default function Calculator({ medicamentos }: { medicamentos: Medicamento[] }) {
  const [medId, setMedId] = useState(medicamentos[0]?.id ?? "");
  const [modo, setModo] = useState<ModoCalculo>("mgkg");
  const [peso, setPeso] = useState("");
  const [doseKg, setDoseKg] = useState(
    medicamentos[0]?.dosesUsuais[0] ? String(medicamentos[0].dosesUsuais[0].mgPorKg).replace(".", ",") : "",
  );
  const [frascos, setFrascos] = useState("");
  const [doseMg, setDoseMg] = useState("");
  const [copiado, setCopiado] = useState<"ok" | "erro" | null>(null);

  const med = medicamentos.find((m) => m.id === medId);
  const un = med ? unidadeDe(med) : "mg";
  const exigePeso = Boolean(med?.diluicao.volumeBolsaPorPeso?.length);

  const entrada: EntradaCalculo = {
    modo,
    pesoKg: lerNumero(peso),
    doseMgPorKg: lerNumero(doseKg),
    frascos: lerNumero(frascos),
    doseMg: lerNumero(doseMg),
  };

  const resultado = useMemo(() => (med ? calcular(med, entrada) : null), [
    med,
    modo,
    peso,
    doseKg,
    frascos,
    doseMg,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const nota = useMemo(
    () => (med && resultado?.ok ? gerarNota(med, entrada, resultado).join("\n") : ""),
    [med, resultado], // eslint-disable-line react-hooks/exhaustive-deps
  );

  function trocarMedicamento(id: string) {
    setMedId(id);
    const novo = medicamentos.find((m) => m.id === id);
    const usual = novo?.dosesUsuais[0];
    setDoseKg(usual ? String(usual.mgPorKg).replace(".", ",") : "");
    setCopiado(null);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(nota);
      setCopiado("ok");
    } catch {
      // Alternativa para navegadores sem permissão de área de transferência.
      try {
        const area = document.getElementById("nota-texto") as HTMLTextAreaElement | null;
        area?.select();
        document.execCommand("copy");
        setCopiado("ok");
      } catch {
        setCopiado("erro");
      }
    }
    setTimeout(() => setCopiado(null), 2500);
  }

  if (medicamentos.length === 0) {
    return (
      <div className="card">
        <p>Nenhum medicamento cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <>
      <section className="card" aria-labelledby="t-dados">
        <h2 id="t-dados">1. Medicamento e dose</h2>

        <div className="campo">
          <label htmlFor="med">Medicamento</label>
          <select id="med" value={medId} onChange={(e) => trocarMedicamento(e.target.value)}>
            {medicamentos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          {med && (
            <small>
              Frasco de {num(med.apresentacao.mgPorFrasco)} {un}
              {med.apresentacao.mlPorFrasco !== undefined
                ? ` / ${num(med.apresentacao.mlPorFrasco)} mL`
                : ""}
              {med.descricao ? ` — ${med.descricao}` : ""}
            </small>
          )}
        </div>

        {med && !med.revisado && (
          <div className="aviso amarelo" role="alert">
            <strong>Cadastro não revisado.</strong> Os dados deste medicamento ainda não foram
            validados pelo responsável. Não use para prescrição até a revisão.
          </div>
        )}

        <div className="abas" role="group" aria-label="Como calcular a dose">
          <button type="button" className="aba" aria-pressed={modo === "mgkg"} onClick={() => setModo("mgkg")}>
            Dose por kg
          </button>
          <button type="button" className="aba" aria-pressed={modo === "frascos"} onClick={() => setModo("frascos")}>
            Frascos inteiros
          </button>
          <button type="button" className="aba" aria-pressed={modo === "mg"} onClick={() => setModo("mg")}>
            Dose em {un}
          </button>
        </div>

        <div className="grade dois">
          {(modo === "mgkg" || modo === "frascos") && (
            <div className="campo">
              <label htmlFor="peso">
                Peso do paciente (kg){modo === "frascos" && !exigePeso ? " — opcional" : ""}
              </label>
              <input
                id="peso"
                inputMode="decimal"
                placeholder="ex.: 60"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
              />
            </div>
          )}

          {modo === "mgkg" && (
            <div className="campo">
              <label htmlFor="dosekg">Dose ({un}/kg)</label>
              <input
                id="dosekg"
                inputMode="decimal"
                placeholder="ex.: 8"
                value={doseKg}
                onChange={(e) => setDoseKg(e.target.value)}
              />
              {med && med.dosesUsuais.length > 0 && (
                <div className="chips" aria-label="Doses usuais">
                  {med.dosesUsuais.map((d) => (
                    <button
                      type="button"
                      key={d.rotulo + d.mgPorKg}
                      className="chip"
                      onClick={() => setDoseKg(String(d.mgPorKg).replace(".", ","))}
                      title={d.rotulo}
                    >
                      {num(d.mgPorKg)} {un}/kg · {d.rotulo}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {modo === "frascos" && (
            <div className="campo">
              <label htmlFor="frascos">Número de frascos</label>
              <input
                id="frascos"
                inputMode="numeric"
                placeholder="ex.: 6"
                value={frascos}
                onChange={(e) => setFrascos(e.target.value)}
              />
            </div>
          )}

          {modo === "mg" && (
            <div className="campo">
              <label htmlFor="dosemg">Dose total ({un})</label>
              <input
                id="dosemg"
                inputMode="decimal"
                placeholder="ex.: 480"
                value={doseMg}
                onChange={(e) => setDoseMg(e.target.value)}
              />
              <small>{exigePeso ? "O peso define o volume da bolsa de diluição." : `Peso opcional (usado só para conferir os limites em ${un}/kg).`}</small>
            </div>
          )}

          {modo === "mg" && (
            <div className="campo">
              <label htmlFor="peso2">Peso do paciente (kg){exigePeso ? "" : " — opcional"}</label>
              <input
                id="peso2"
                inputMode="decimal"
                placeholder="ex.: 60"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
              />
            </div>
          )}
        </div>
      </section>

      <section className="card" aria-labelledby="t-res" aria-live="polite">
        <h2 id="t-res">2. Resultado</h2>

        {resultado && !resultado.ok && <p className="aviso azul">{resultado.erro}</p>}

        {resultado?.ok && med && (
          <>
            {resultado.alertas.length > 0 && (
              <div className="aviso vermelho" role="alert">
                <strong>Atenção</strong>
                <ul>
                  {resultado.alertas.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {resultado.limitadaAoMaximo && (
              <div className="aviso vermelho" role="alert">
                <strong>Dose limitada ao máximo.</strong> A dose calculada de{" "}
                {num(resultado.doseCalculadaMg)} {un} passa do máximo por infusão; o site usou{" "}
                {num(resultado.doseMg)} {un}
                {resultado.frascosNecessarios > 0 ? ` (${resultado.frascosNecessarios} frascos)` : ""}.
              </div>
            )}
            {resultado.arredondada && !resultado.limitadaAoMaximo && (
              <div className="aviso azul">
                Dose calculada de {num(resultado.doseCalculadaMg)} {un} arredondada para{" "}
                {num(resultado.doseMg)} {un} conforme a regra do medicamento.
              </div>
            )}

            <div className="resumo">
              <div className="metrica">
                <span>Dose total</span>
                <strong>{num(resultado.doseMg)} {un}</strong>
              </div>
              <div className="metrica">
                <span>Frascos</span>
                <strong>
                  {resultado.frascosNecessarios} {plural(resultado.frascosNecessarios, "frasco", "frascos")}
                </strong>
              </div>
              <div className="metrica">
                <span>Aspirar</span>
                <strong>{resultado.volumeAspirarMl !== undefined ? `${num(resultado.volumeAspirarMl)} mL` : "—"}</strong>
              </div>
              <div className="metrica">
                <span>Volume final</span>
                <strong>{textoVolumeFinal(resultado)}</strong>
              </div>
            </div>

            {resultado.mgPorKgEquivalente !== undefined && modo !== "mgkg" && (
              <p>Equivale a {num(resultado.mgPorKgEquivalente)} {un}/kg.</p>
            )}
            {resultado.sobraMg > 0 && (
              <p>
                {resultado.mlUltimoFrasco !== undefined
                  ? resultado.frascosInteiros > 0
                    ? `${resultado.frascosInteiros} ${resultado.frascosInteiros === 1 ? "frasco completo" : "frascos completos"} e ${num(resultado.mlUltimoFrasco)} mL do último (descartar ${num(resultado.sobraMl ?? 0)} mL).`
                    : `Usar ${num(resultado.mlUltimoFrasco)} mL do frasco (descartar ${num(resultado.sobraMl ?? 0)} mL).`
                  : `Sobra de ${num(resultado.sobraMg)} ${un} no último frasco (descartar).`}
              </p>
            )}
          </>
        )}
      </section>

      <section className="card" aria-labelledby="t-nota">
        <h2 id="t-nota">3. Nota para a prescrição</h2>
        {nota ? (
          <>
            <textarea id="nota-texto" className="nota" readOnly value={nota} rows={10} />
            <div className="acoes nao-imprimir" style={{ marginTop: 10 }}>
              <button type="button" className="btn" onClick={copiar}>
                {copiado === "ok" ? "Copiado ✓" : "Copiar nota"}
              </button>
              <button type="button" className="btn sec" onClick={() => window.print()}>
                Imprimir
              </button>
              {copiado === "erro" && (
                <span className="aviso vermelho" style={{ margin: 0 }}>
                  Não foi possível copiar. Selecione o texto e copie manualmente.
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="aviso azul" style={{ margin: 0 }}>
            Preencha os dados acima para gerar a nota.
          </p>
        )}
      </section>
    </>
  );
}
