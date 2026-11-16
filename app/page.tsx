import Link from "next/link";
import Calculator from "@/components/Calculator";
import { lerMedicamentos } from "@/lib/store";

// Sempre lê a base atual; mudanças feitas no /admin aparecem sem novo deploy.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { lista, origem } = await lerMedicamentos();

  return (
    <main className="container">
      <header className="topo">
        <div>
          <h1>CTA Apoio</h1>
          <p>Calculadora de dose e diluição para o centro de infusão</p>
        </div>
        <Link href="/admin" className="btn sec nao-imprimir">
          Administração
        </Link>
      </header>

      {origem === "exemplo" && (
        <div className="aviso amarelo" role="status">
          Exibindo <strong>dados de exemplo</strong>. A base real ainda não foi cadastrada.
        </div>
      )}
      {origem === "erro" && (
        <div className="aviso vermelho" role="alert">
          Não foi possível ler a base de medicamentos. Os dados abaixo são apenas de exemplo e não
          devem ser usados.
        </div>
      )}

      <Calculator medicamentos={lista} />

      <p className="rodape">
        Ferramenta de apoio. Não substitui a avaliação do médico nem a conferência da farmácia.
        Nenhum dado de paciente é armazenado.
      </p>
    </main>
  );
}
