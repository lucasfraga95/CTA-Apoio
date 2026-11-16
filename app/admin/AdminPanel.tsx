"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dataBR } from "@/lib/format";
import type { Diluente, EntradaHistorico, Medicamento, ModoDiluicao, TipoArredondamento, Unidade } from "@/lib/types";

const DILUENTES: Diluente[] = ["SF 0,9%", "SG 5%", "Água para injetáveis"];
const UNIDADES: Unidade[] = ["mg", "g", "U", "UI"];

type TipoDil = "bolsa" | "concentracao" | "volume" | "fabricante";
type RegraPeso = "nenhuma" | "abaixo" | "ate";

/** Formulário com campos em texto, para aceitar vírgula e campos vazios. */
interface Form {
  id: string;
  novo: boolean;
  nome: string;
  descricao: string;
  unidade: Unidade;
  mgFrasco: string;
  mlFrasco: string;
  usaReconst: boolean;
  reDiluente: Diluente;
  reVolume: string;
  reInstrucao: string;
  diluente: Diluente;
  tipoDil: TipoDil;
  volumeBolsa: string;
  regraTipo: RegraPeso;
  regraKg: string;
  regraVolume: string;
  faixaConcMin: string;
  faixaConcMax: string;
  faixaVolMin: string;
  faixaVolMax: string;
  instrucaoExtra: string;
  modoDil: ModoDiluicao;
  cMin: string;
  cMax: string;
  doses: { rotulo: string; mgkg: string }[];
  doseMinKg: string;
  doseMaxKg: string;
  doseMaxMg: string;
  tempo: string;
  infusaoTexto: string;
  estabilidade: string;
  obs: string;
  pendencias: string;
  arredTipo: TipoArredondamento;
  arredTol: string;
  revisado: boolean;
}

const s = (n: number | undefined) => (n === undefined ? "" : String(n).replace(".", ","));

function paraForm(m: Medicamento): Form {
  return {
    id: m.id,
    novo: false,
    nome: m.nome,
    descricao: m.descricao ?? "",
    unidade: m.unidade ?? "mg",
    mgFrasco: s(m.apresentacao.mgPorFrasco),
    mlFrasco: s(m.apresentacao.mlPorFrasco),
    usaReconst: Boolean(m.reconstituicao),
    reDiluente: m.reconstituicao?.diluente ?? "Água para injetáveis",
    reVolume: s(m.reconstituicao?.volumeMl),
    reInstrucao: m.reconstituicao?.instrucao ?? "",
    diluente: m.diluicao.diluente,
    tipoDil:
      m.diluicao.volumeBolsaMl || m.diluicao.volumeBolsaPorPeso?.length
        ? "bolsa"
        : m.diluicao.faixaConcentracao
          ? "concentracao"
          : m.diluicao.faixaVolumeFinalMl
            ? "volume"
            : "fabricante",
    volumeBolsa: s(m.diluicao.volumeBolsaMl),
    regraTipo: m.diluicao.volumeBolsaPorPeso?.[0]
      ? m.diluicao.volumeBolsaPorPeso[0].abaixoDeKg
        ? "abaixo"
        : "ate"
      : "nenhuma",
    regraKg: s(m.diluicao.volumeBolsaPorPeso?.[0]?.abaixoDeKg ?? m.diluicao.volumeBolsaPorPeso?.[0]?.ateKg),
    regraVolume: s(m.diluicao.volumeBolsaPorPeso?.[0]?.volumeMl),
    faixaConcMin: s(m.diluicao.faixaConcentracao?.min),
    faixaConcMax: s(m.diluicao.faixaConcentracao?.max),
    faixaVolMin: s(m.diluicao.faixaVolumeFinalMl?.min),
    faixaVolMax: s(m.diluicao.faixaVolumeFinalMl?.max),
    instrucaoExtra: m.diluicao.instrucaoExtra ?? "",
    modoDil: m.diluicao.modo,
    cMin: s(m.diluicao.concentracaoFinalMinMgMl),
    cMax: s(m.diluicao.concentracaoFinalMaxMgMl),
    doses: m.dosesUsuais.map((d) => ({ rotulo: d.rotulo, mgkg: s(d.mgPorKg) })),
    doseMinKg: s(m.doseMinMgKg),
    doseMaxKg: s(m.doseMaxMgKg),
    doseMaxMg: s(m.doseMaxMg),
    tempo: s(m.tempoInfusaoMin),
    infusaoTexto: m.infusaoTexto ?? "",
    estabilidade: m.estabilidade ?? "",
    obs: m.observacoes ?? "",
    pendencias: m.pendencias ?? "",
    arredTipo: m.arredondamento.tipo,
    arredTol: s(m.arredondamento.toleranciaPercent),
    revisado: m.revisado,
  };
}

function formVazio(): Form {
  return {
    id: "",
    novo: true,
    nome: "",
    descricao: "",
    unidade: "mg",
    mgFrasco: "",
    mlFrasco: "",
    usaReconst: false,
    reDiluente: "Água para injetáveis",
    reVolume: "",
    reInstrucao: "",
    diluente: "SF 0,9%",
    tipoDil: "bolsa",
    volumeBolsa: "100",
    regraTipo: "nenhuma",
    regraKg: "",
    regraVolume: "",
    faixaConcMin: "",
    faixaConcMax: "",
    faixaVolMin: "",
    faixaVolMax: "",
    instrucaoExtra: "",
    modoDil: "adicionar",
    cMin: "",
    cMax: "",
    doses: [{ rotulo: "", mgkg: "" }],
    doseMinKg: "",
    doseMaxKg: "",
    doseMaxMg: "",
    tempo: "",
    infusaoTexto: "",
    estabilidade: "",
    obs: "",
    pendencias: "",
    arredTipo: "nenhum",
    arredTol: "",
    revisado: false,
  };
}

function lerNum(texto: string, rotulo: string): number | undefined {
  const t = texto.trim().replace(",", ".");
  if (!t) return undefined;
  const n = Number(t);
  if (!Number.isFinite(n)) throw new Error(`"${rotulo}": valor numérico inválido.`);
  return n;
}

function slug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function diluicaoDeForm(f: Form): Partial<Medicamento["diluicao"]> {
  switch (f.tipoDil) {
    case "bolsa": {
      const volume = lerNum(f.volumeBolsa, "volume da bolsa");
      const regraVol = lerNum(f.regraVolume, "volume da bolsa pela regra de peso");
      const regraKg = lerNum(f.regraKg, "peso da regra de bolsa");
      const regras =
        f.regraTipo !== "nenhuma"
          ? [
              {
                abaixoDeKg: f.regraTipo === "abaixo" ? regraKg : undefined,
                ateKg: f.regraTipo === "ate" ? regraKg : undefined,
                volumeMl: regraVol ?? NaN,
              },
            ]
          : undefined;
      return { volumeBolsaMl: volume ?? NaN, volumeBolsaPorPeso: regras };
    }
    case "concentracao":
      return {
        faixaConcentracao: {
          min: lerNum(f.faixaConcMin, "concentração mínima") ?? NaN,
          max: lerNum(f.faixaConcMax, "concentração máxima") ?? NaN,
        },
      };
    case "volume":
      return {
        faixaVolumeFinalMl: {
          min: lerNum(f.faixaVolMin, "volume final mínimo"),
          max: lerNum(f.faixaVolMax, "volume final máximo"),
        },
      };
    default:
      return { seguirFabricante: true };
  }
}

function deForm(f: Form, existentes: Medicamento[]): Medicamento {
  let id = f.id;
  if (f.novo) {
    const base = slug(f.nome) || "medicamento";
    id = base;
    for (let i = 2; existentes.some((m) => m.id === id); i++) id = `${base}-${i}`;
  }
  return {
    id,
    nome: f.nome,
    descricao: f.descricao,
    unidade: f.unidade,
    apresentacao: {
      mgPorFrasco: lerNum(f.mgFrasco, "quantidade por frasco") ?? NaN,
      mlPorFrasco: lerNum(f.mlFrasco, "mL por frasco"),
    },
    reconstituicao: f.usaReconst
      ? {
          diluente: f.reDiluente,
          volumeMl: lerNum(f.reVolume, "volume de reconstituição") ?? NaN,
          instrucao: f.reInstrucao,
        }
      : undefined,
    diluicao: {
      diluente: f.diluente,
      modo: f.modoDil,
      ...diluicaoDeForm(f),
      instrucaoExtra: f.instrucaoExtra,
      concentracaoFinalMinMgMl: lerNum(f.cMin, "concentração final mínima"),
      concentracaoFinalMaxMgMl: lerNum(f.cMax, "concentração final máxima"),
    },
    dosesUsuais: f.doses
      .filter((d) => d.rotulo.trim() || d.mgkg.trim())
      .map((d) => ({ rotulo: d.rotulo, mgPorKg: lerNum(d.mgkg, "dose usual (mg/kg)") ?? NaN })),
    doseMinMgKg: lerNum(f.doseMinKg, "dose mínima (mg/kg)"),
    doseMaxMgKg: lerNum(f.doseMaxKg, "dose máxima (mg/kg)"),
    doseMaxMg: lerNum(f.doseMaxMg, "dose máxima (mg)"),
    tempoInfusaoMin: lerNum(f.tempo, "tempo de infusão"),
    infusaoTexto: f.infusaoTexto,
    estabilidade: f.estabilidade,
    observacoes: f.obs,
    pendencias: f.pendencias,
    arredondamento: {
      tipo: f.arredTipo,
      toleranciaPercent: f.arredTipo === "frasco_tolerancia" ? lerNum(f.arredTol, "tolerância") : undefined,
    },
    revisado: f.revisado,
    atualizadoEm: new Date().toISOString(),
  };
}

interface Props {
  inicial: Medicamento[];
  origem: "edge-config" | "exemplo" | "erro";
  historico: EntradaHistorico[];
  podeGravar: boolean;
}

export default function AdminPanel({ inicial, origem, historico, podeGravar }: Props) {
  const router = useRouter();
  const [lista, setLista] = useState(inicial);
  const [form, setForm] = useState<Form | null>(null);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvarLista(nova: Medicamento[]): Promise<boolean> {
    setSalvando(true);
    setErro("");
    setMsg("");
    try {
      const resp = await fetch("/api/admin/medicamentos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicamentos: nova }),
      });
      const dados = await resp.json().catch(() => ({}));
      if (resp.status === 401) {
        router.refresh();
        return false;
      }
      if (!resp.ok) {
        setErro(dados.erro ?? "Não foi possível salvar.");
        return false;
      }
      setLista(dados.medicamentos);
      setMsg(dados.mensagem ?? "Salvo. A calculadora já usa os novos dados (pode levar alguns segundos).");
      router.refresh();
      return true;
    } catch {
      setErro("Sem conexão. Tente novamente.");
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function salvarForm() {
    if (!form) return;
    let med: Medicamento;
    try {
      med = deForm(form, lista);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Dados inválidos.");
      return;
    }
    const nova = form.novo ? [...lista, med] : lista.map((m) => (m.id === med.id ? med : m));
    if (await salvarLista(nova)) setForm(null);
  }

  async function remover(m: Medicamento) {
    if (!window.confirm(`Excluir "${m.nome}" da base? Isso não pode ser desfeito pela tela.`)) return;
    await salvarLista(lista.filter((x) => x.id !== m.id));
  }

  async function sair() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  const set = <K extends keyof Form>(campo: K, valor: Form[K]) =>
    setForm((f) => (f ? { ...f, [campo]: valor } : f));

  return (
    <>
      {!podeGravar && (
        <div className="aviso vermelho" role="alert">
          <strong>Gravação não configurada.</strong> Falta conectar o Edge Config ao projeto e/ou
          definir <code>VERCEL_API_TOKEN</code>. Você consegue ver a lista, mas não salvar. Veja o
          passo a passo no README.
        </div>
      )}
      {origem === "exemplo" && podeGravar && (
        <div className="aviso amarelo">
          A base ainda está vazia: estes são os dados de exemplo. Ao salvar pela primeira vez, a base
          real passa a valer.
        </div>
      )}
      {origem === "erro" && (
        <div className="aviso vermelho">
          Falha ao ler a base atual. <strong>Não salve</strong> até resolver, para não sobrescrever
          dados com exemplos.
        </div>
      )}
      {erro && (
        <div className="aviso vermelho" role="alert">
          {erro}
        </div>
      )}
      {msg && (
        <div className="aviso verde" role="status">
          {msg}
        </div>
      )}

      {!form && (
        <>
          <section className="card">
            <div className="acoes" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Medicamentos ({lista.length})</h2>
              <div className="acoes">
                <button
                  className="btn"
                  disabled={!podeGravar || origem === "erro"}
                  onClick={() => {
                    setErro("");
                    setMsg("");
                    setForm(formVazio());
                  }}
                >
                  + Novo medicamento
                </button>
                <button className="btn sec" onClick={sair}>
                  Sair
                </button>
              </div>
            </div>
            <div className="lista-meds">
              {lista.length === 0 && <p>Nenhum medicamento cadastrado.</p>}
              {lista.map((m) => (
                <div className="med-linha" key={m.id}>
                  <div>
                    <strong>
                      {m.nome}{" "}
                      <span className={`tag ${m.revisado ? "ok" : "pend"}`}>
                        {m.revisado ? "revisado" : "não revisado"}
                      </span>
                    </strong>
                    <small>
                      {m.apresentacao.mgPorFrasco} {m.unidade ?? "mg"}
                      {m.apresentacao.mlPorFrasco !== undefined ? `/${m.apresentacao.mlPorFrasco} mL` : ""} · atualizado em{" "}
                      {dataBR(m.atualizadoEm)}
                    </small>
                    {m.pendencias && (
                      <small style={{ display: "block", color: "var(--amarelo)" }}>Pendência: {m.pendencias}</small>
                    )}
                  </div>
                  <div className="acoes">
                    <button
                      className="btn sec mini"
                      onClick={() => {
                        setErro("");
                        setMsg("");
                        setForm(paraForm(m));
                      }}
                    >
                      Editar
                    </button>
                    <button className="btn perigo mini" disabled={!podeGravar || salvando} onClick={() => remover(m)}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>Últimas alterações</h2>
            {historico.length === 0 ? (
              <p style={{ margin: 0, color: "var(--suave)" }}>Sem alterações registradas.</p>
            ) : (
              <ul className="historico">
                {historico.map((h) => (
                  <li key={h.em + h.acao}>
                    {new Date(h.em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} — {h.acao}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {form && (
        <section className="card">
          <h2>{form.novo ? "Novo medicamento" : `Editar: ${form.nome}`}</h2>

          <div className="grade dois">
            <div className="campo">
              <label htmlFor="f-nome">Nome</label>
              <input id="f-nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="f-desc">Descrição curta (opcional)</label>
              <input id="f-desc" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} />
            </div>
          </div>

          <h3>Apresentação (frasco)</h3>
          <div className="grade tres">
            <div className="campo">
              <label htmlFor="f-un">Unidade de dose</label>
              <select id="f-un" value={form.unidade} onChange={(e) => set("unidade", e.target.value as Unidade)}>
                {UNIDADES.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="f-mg">Quantidade por frasco ({form.unidade})</label>
              <input id="f-mg" inputMode="decimal" value={form.mgFrasco} onChange={(e) => set("mgFrasco", e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="f-ml">mL por frasco</label>
              <input id="f-ml" inputMode="decimal" value={form.mlFrasco} onChange={(e) => set("mlFrasco", e.target.value)} />
              <small>Para liofilizados, informe o volume do frasco já reconstituído.</small>
            </div>
          </div>

          <div className="campo">
            <label className="checkbox">
              <input type="checkbox" checked={form.usaReconst} onChange={(e) => set("usaReconst", e.target.checked)} />
              Precisa de reconstituição (liofilizado)
            </label>
          </div>
          {form.usaReconst && (
            <div className="grade tres">
              <div className="campo">
                <label htmlFor="f-rd">Diluente da reconstituição</label>
                <select id="f-rd" value={form.reDiluente} onChange={(e) => set("reDiluente", e.target.value as Diluente)}>
                  {DILUENTES.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="f-rv">Volume por frasco (mL)</label>
                <input id="f-rv" inputMode="decimal" value={form.reVolume} onChange={(e) => set("reVolume", e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="f-ri">Instrução de preparo (vai na nota) — opcional</label>
                <input id="f-ri" value={form.reInstrucao} onChange={(e) => set("reInstrucao", e.target.value)} />
              </div>
            </div>
          )}

          <h3>Diluição na bolsa</h3>
          <div className="grade tres">
            <div className="campo">
              <label htmlFor="f-dil">Diluente</label>
              <select id="f-dil" value={form.diluente} onChange={(e) => set("diluente", e.target.value as Diluente)}>
                {DILUENTES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="f-tipodil">Regra de diluição</label>
              <select id="f-tipodil" value={form.tipoDil} onChange={(e) => set("tipoDil", e.target.value as TipoDil)}>
                <option value="bolsa">Volume fixo da bolsa (pode variar com o peso)</option>
                <option value="concentracao">Faixa de concentração final</option>
                <option value="volume">Faixa de volume final</option>
                <option value="fabricante">Seguir recomendação do fabricante</option>
              </select>
            </div>
            {form.tipoDil === "bolsa" && (
              <div className="campo">
                <label htmlFor="f-bolsa">Volume da bolsa (mL)</label>
                <input id="f-bolsa" inputMode="decimal" value={form.volumeBolsa} onChange={(e) => set("volumeBolsa", e.target.value)} />
                <small>Volume padrão. Abaixo, você pode definir um volume diferente por peso.</small>
              </div>
            )}
            {form.tipoDil === "concentracao" && (
              <>
                <div className="campo">
                  <label htmlFor="f-fcmin">Concentração final mínima ({form.unidade}/mL)</label>
                  <input id="f-fcmin" inputMode="decimal" value={form.faixaConcMin} onChange={(e) => set("faixaConcMin", e.target.value)} />
                </div>
                <div className="campo">
                  <label htmlFor="f-fcmax">Concentração final máxima ({form.unidade}/mL)</label>
                  <input id="f-fcmax" inputMode="decimal" value={form.faixaConcMax} onChange={(e) => set("faixaConcMax", e.target.value)} />
                </div>
              </>
            )}
            {form.tipoDil === "volume" && (
              <>
                <div className="campo">
                  <label htmlFor="f-fvmin">Volume final mínimo (mL) — opcional</label>
                  <input id="f-fvmin" inputMode="decimal" value={form.faixaVolMin} onChange={(e) => set("faixaVolMin", e.target.value)} />
                </div>
                <div className="campo">
                  <label htmlFor="f-fvmax">Volume final máximo (mL) — opcional</label>
                  <input id="f-fvmax" inputMode="decimal" value={form.faixaVolMax} onChange={(e) => set("faixaVolMax", e.target.value)} />
                </div>
              </>
            )}
            <div className="campo">
              <label htmlFor="f-modo">Como descrever</label>
              <select id="f-modo" value={form.modoDil} onChange={(e) => set("modoDil", e.target.value as ModoDiluicao)}>
                <option value="adicionar">Adicionar à bolsa (volume final = bolsa + medicamento)</option>
                <option value="completar">Completar até o volume da bolsa (retirar antes)</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="f-cmin">Alerta: conc. final mínima ({form.unidade}/mL) — opcional</label>
              <input id="f-cmin" inputMode="decimal" value={form.cMin} onChange={(e) => set("cMin", e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="f-cmax">Alerta: conc. final máxima ({form.unidade}/mL) — opcional</label>
              <input id="f-cmax" inputMode="decimal" value={form.cMax} onChange={(e) => set("cMax", e.target.value)} />
            </div>
          </div>

          {form.tipoDil === "bolsa" && (
            <div className="grade tres">
              <div className="campo">
                <label htmlFor="f-rt">Volume diferente por peso</label>
                <select id="f-rt" value={form.regraTipo} onChange={(e) => set("regraTipo", e.target.value as RegraPeso)}>
                  <option value="nenhuma">Não (sempre o volume padrão)</option>
                  <option value="abaixo">Se o peso for MENOR que…</option>
                  <option value="ate">Se o peso for MENOR OU IGUAL a…</option>
                </select>
              </div>
              {form.regraTipo !== "nenhuma" && (
                <>
                  <div className="campo">
                    <label htmlFor="f-rkg">Peso limite (kg)</label>
                    <input id="f-rkg" inputMode="decimal" value={form.regraKg} onChange={(e) => set("regraKg", e.target.value)} />
                  </div>
                  <div className="campo">
                    <label htmlFor="f-rvol">Volume da bolsa nesse caso (mL)</label>
                    <input id="f-rvol" inputMode="decimal" value={form.regraVolume} onChange={(e) => set("regraVolume", e.target.value)} />
                  </div>
                </>
              )}
            </div>
          )}
          <div className="campo">
            <label htmlFor="f-extra">Instrução extra de preparo (vai na nota) — opcional</label>
            <input id="f-extra" value={form.instrucaoExtra} onChange={(e) => set("instrucaoExtra", e.target.value)} />
          </div>

          <h3>Doses usuais ({form.unidade}/kg)</h3>
          {form.doses.map((d, i) => (
            <div className="linha-dose" key={i}>
              <div>
                <label htmlFor={`d-r-${i}`}>Indicação / rótulo</label>
                <input
                  id={`d-r-${i}`}
                  value={d.rotulo}
                  onChange={(e) => set("doses", form.doses.map((x, j) => (j === i ? { ...x, rotulo: e.target.value } : x)))}
                />
              </div>
              <div>
                <label htmlFor={`d-m-${i}`}>{form.unidade}/kg</label>
                <input
                  id={`d-m-${i}`}
                  inputMode="decimal"
                  value={d.mgkg}
                  onChange={(e) => set("doses", form.doses.map((x, j) => (j === i ? { ...x, mgkg: e.target.value } : x)))}
                />
              </div>
              <button type="button" className="btn perigo mini" onClick={() => set("doses", form.doses.filter((_, j) => j !== i))}>
                Remover
              </button>
            </div>
          ))}
          <button type="button" className="btn sec mini" onClick={() => set("doses", [...form.doses, { rotulo: "", mgkg: "" }])}>
            + Adicionar dose
          </button>

          <h3>Limites de segurança (opcionais)</h3>
          <div className="grade tres">
            <div className="campo">
              <label htmlFor="f-dmin">Dose mínima (mg/kg)</label>
              <input id="f-dmin" inputMode="decimal" value={form.doseMinKg} onChange={(e) => set("doseMinKg", e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="f-dmax">Dose máxima (mg/kg)</label>
              <input id="f-dmax" inputMode="decimal" value={form.doseMaxKg} onChange={(e) => set("doseMaxKg", e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="f-dabs">Teto por infusão (mg)</label>
              <input id="f-dabs" inputMode="decimal" value={form.doseMaxMg} onChange={(e) => set("doseMaxMg", e.target.value)} />
            </div>
          </div>

          <h3>Arredondamento e infusão</h3>
          <div className="grade tres">
            <div className="campo">
              <label htmlFor="f-arr">Regra de arredondamento</label>
              <select id="f-arr" value={form.arredTipo} onChange={(e) => set("arredTipo", e.target.value as TipoArredondamento)}>
                <option value="nenhum">Dose exata (sem arredondar)</option>
                <option value="frasco">Sempre para o frasco inteiro mais próximo</option>
                <option value="frasco_tolerancia">Frasco inteiro, só se a diferença for pequena</option>
              </select>
            </div>
            {form.arredTipo === "frasco_tolerancia" && (
              <div className="campo">
                <label htmlFor="f-tol">Tolerância (%)</label>
                <input id="f-tol" inputMode="decimal" value={form.arredTol} onChange={(e) => set("arredTol", e.target.value)} />
              </div>
            )}
            <div className="campo">
              <label htmlFor="f-tempo">Tempo de infusão (min) — só consulta</label>
              <input id="f-tempo" inputMode="numeric" value={form.tempo} onChange={(e) => set("tempo", e.target.value)} />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="f-inf">Infusão em texto (só consulta; não vai na nota) — opcional</label>
            <textarea id="f-inf" rows={3} value={form.infusaoTexto} onChange={(e) => set("infusaoTexto", e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="f-est">Estabilidade (só consulta; não vai na nota) — opcional</label>
            <textarea id="f-est" rows={2} value={form.estabilidade} onChange={(e) => set("estabilidade", e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="f-obs">Observações (só consulta; não vão na nota)</label>
            <textarea id="f-obs" rows={3} value={form.obs} onChange={(e) => set("obs", e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="f-pend">Pendências para conferir (só aparecem aqui no /admin)</label>
            <textarea id="f-pend" rows={3} value={form.pendencias} onChange={(e) => set("pendencias", e.target.value)} />
          </div>

          <div className="campo">
            <label className="checkbox">
              <input type="checkbox" checked={form.revisado} onChange={(e) => set("revisado", e.target.checked)} />
              Dados conferidos e revisados (remove o aviso &quot;não revisado&quot;)
            </label>
          </div>

          <div className="barra-salvar">
            <button className="btn" onClick={salvarForm} disabled={salvando || !podeGravar}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            <button className="btn sec" onClick={() => setForm(null)} disabled={salvando}>
              Cancelar
            </button>
          </div>
        </section>
      )}
    </>
  );
}
