# CTA Apoio

Site de apoio à padronização de prescrição no centro de infusão.

- **Página pública (`/`)**: o médico escolhe o medicamento, informa peso e dose (mg/kg), número de
  frascos inteiros ou dose em mg, e o site calcula a dose, os frascos, o volume a aspirar e gera uma
  **nota de preparo** pronta para copiar e colar na prescrição.
- **Administração (`/admin`)**: protegida por senha. Só o administrador cadastra e altera os
  medicamentos (apresentação, diluição, doses usuais, limites, arredondamento etc.).
- **Nenhum dado de paciente é armazenado.** Peso e dose existem apenas na tela do navegador.

> Ferramenta de apoio. Não substitui a avaliação do médico nem a conferência da farmácia. Os dados
> iniciais (tocilizumabe) são **de exemplo** e aparecem marcados como "não revisado" até você
> conferir e marcar como revisado no `/admin`.

## Como os dados são guardados

Tudo roda só na Vercel, sem outro serviço:

- Os medicamentos ficam em um **Edge Config** da Vercel (chave `medicamentos`), e o histórico de
  alterações na chave `historico`.
- A leitura é pública (página `/`). A **gravação só acontece no servidor**, depois do login no
  `/admin`, usando um token da Vercel que nunca vai para o navegador.
- Enquanto o Edge Config não estiver conectado, o site mostra dados de exemplo.

## Configuração na Vercel (uma vez só)

1. **Importar o projeto**: Vercel → *Add New → Project* → importar `cta-apoio` → *Deploy*.
   Cada novo envio ao GitHub republica o site sozinho.
2. **Criar o Edge Config**: no projeto, aba *Storage* → *Create Database* → *Edge Config*.
   Dê um nome (ex.: `cta-apoio`) e **conecte ao projeto** `cta-apoio`. Isso cria automaticamente a
   variável `EDGE_CONFIG` (em versões novas da interface, o produto se chama *Global Config* e a
   variável `GLOBAL_CONFIG`; o site aceita as duas).
3. **Criar um token**: Vercel → *Account Settings → Tokens* → criar um token (ex.: `cta-apoio-admin`).
   Se o projeto estiver dentro de um Team, escolha o escopo desse Team. Copie o valor, que só aparece
   uma vez.
4. **Variáveis de ambiente** do projeto (*Settings → Environment Variables*, marcando Production):

   | Variável | Valor |
   |---|---|
   | `ADMIN_PASSWORD` | Uma senha longa e única para o `/admin` |
   | `SESSION_SECRET` | Texto aleatório longo (qualquer um) |
   | `VERCEL_API_TOKEN` | O token do passo 3 |
   | `VERCEL_TEAM_ID` | Só se o projeto estiver em um Team (começa com `team_`, em *Team Settings*) |

5. **Novo deploy**: *Deployments →* ⋯ *→ Redeploy* para as variáveis passarem a valer.
6. Abra `/admin`, entre com a senha e cadastre/revise os medicamentos.

Nunca coloque senhas ou tokens no código nem no GitHub. O arquivo `.env.example` só mostra os nomes.

## Como o cálculo funciona

- **Dose por kg**: `dose (mg) = peso × mg/kg`.
- **Frascos inteiros**: `dose (mg) = frascos × mg por frasco` (nunca é arredondada).
- **Dose em mg**: dose informada diretamente.
- **Volume a aspirar** = `dose × mL por frasco ÷ mg por frasco`.
- **Arredondamento** (por medicamento): dose exata, frasco inteiro mais próximo, ou frasco inteiro
  só quando a diferença estiver dentro de uma tolerância em %.
- **Diluição**: "adicionar à bolsa" (volume final = bolsa + medicamento) ou "completar até o volume
  da bolsa" (retira-se antes da bolsa o volume do medicamento).
- **Liofilizados**: informe a reconstituição no cadastro; em "mL por frasco" use o volume já
  reconstituído.
- **Alertas** quando a dose passa dos limites cadastrados (mg/kg mínimo/máximo, teto em mg,
  concentração final).

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local   # preencha ADMIN_PASSWORD e SESSION_SECRET
npm run dev                  # http://localhost:3000
npm test                     # testes dos cálculos
```

Sem `EDGE_CONFIG`/`GLOBAL_CONFIG` e `VERCEL_API_TOKEN` o `/admin` abre, mas não grava (aparece um aviso).
