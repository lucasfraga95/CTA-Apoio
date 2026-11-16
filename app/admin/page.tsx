import Link from "next/link";
import { adminConfigurado, estaLogado } from "@/lib/auth";
import { gravacaoConfigurada, lerHistorico, lerMedicamentos } from "@/lib/store";
import AdminPanel from "./AdminPanel";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administração — CTA Apoio" };

export default async function AdminPage() {
  const cabecalho = (
    <header className="topo">
      <div>
        <h1>Administração</h1>
        <p>Cadastro de medicamentos</p>
      </div>
      <Link href="/" className="btn sec">
        Voltar à calculadora
      </Link>
    </header>
  );

  if (!adminConfigurado()) {
    return (
      <main className="container">
        {cabecalho}
        <div className="aviso vermelho">
          A área administrativa está desativada: defina a variável de ambiente{" "}
          <code>ADMIN_PASSWORD</code> na Vercel e faça um novo deploy.
        </div>
      </main>
    );
  }

  if (!(await estaLogado())) {
    return (
      <main className="container">
        {cabecalho}
        <LoginForm />
      </main>
    );
  }

  const [{ lista, origem }, historico] = await Promise.all([lerMedicamentos(), lerHistorico()]);

  return (
    <main className="container">
      {cabecalho}
      <AdminPanel
        inicial={lista}
        origem={origem}
        historico={historico.slice(0, 15)}
        podeGravar={gravacaoConfigurada()}
      />
    </main>
  );
}
