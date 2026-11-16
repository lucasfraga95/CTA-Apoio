"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (resp.ok) {
        router.refresh();
        return;
      }
      const dados = await resp.json().catch(() => ({}));
      setErro(dados.erro ?? "Não foi possível entrar.");
    } catch {
      setErro("Sem conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card" onSubmit={entrar} style={{ maxWidth: 420 }}>
      <h2>Entrar</h2>
      <div className="campo">
        <label htmlFor="senha">Senha de administrador</label>
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
      </div>
      {erro && (
        <div className="aviso vermelho" role="alert">
          {erro}
        </div>
      )}
      <button className="btn" disabled={enviando || !senha}>
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
