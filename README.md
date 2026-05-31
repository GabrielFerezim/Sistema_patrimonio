# Trynova | Sistema de Controle de Patrimônio e Inventário

Este é um sistema moderno e completo de controle de patrimônio e inventário de equipamentos, desenvolvido com **React + Vite** no frontend, **Express** no backend e conectado diretamente a um banco de dados relacional **PostgreSQL (Neon)**. 

O projeto está totalmente configurado para execução local simplificada e pronto para implantação em produção na plataforma **Vercel** usando Serverless Functions.

---

## 🚀 Funcionalidades Principais

*   **Painel Administrativo (Dashboard):** Visão geral em tempo real com indicadores de KPI (Total de Itens, Em Uso, Em Estoque, Em Manutenção) e gráficos interativos (estado físico do equipamento, distribuição por status e principais localizações).
*   **Gestão de Inventário (Patrimônios):** Tabela interativa para listagem de equipamentos, busca avançada inteligente em tempo real e filtros combinados por status e departamentos.
*   **Cadastro e Edição (CRUD completo):** Formulário modal com validação de unicidade de tag/código do patrimônio e regras de preenchimento dinâmicas.
*   **Aba Dinâmica de Funcionários:** Agrupamento automático de todos os equipamentos definidos como "Em Uso", listando os colaboradores responsáveis e detalhando os patrimônios sob a posse de cada um em cartões expansíveis estilo *accordion*.
*   **Tela de Login Premium:** Interface de autenticação segura e responsiva com efeito moderno de glassmorphism, suporte à visualização de senha e validação em tempo real integrada com o Express.
*   **Mecanismo de Auto-inicialização (Database Self-Seeding):** O backend Express se conecta ao Neon, cria a tabela necessária e insere dados iniciais simulados caso o banco de dados esteja vazio, permitindo testar a aplicação imediatamente.
*   **Robustez e Fallback Offline:** Integração nativa com cache no LocalStorage para que o sistema continue exibindo os dados locais mesmo se houver perda de conexão com a API do banco de dados.

---

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** [React](https://reactjs.org/) (Hooks, Context, JSX)
*   **Ferramenta de Build:** [Vite](https://vitejs.dev/)
*   **Backend / API:** [Express.js](https://expressjs.com/) (Node.js)
*   **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) hospedado no [Neon](https://neon.tech/)
*   **Comunicação DB:** [node-postgres (pg)](https://node-postgres.com/) com SSL seguro
*   **Execução Concorrente:** [Concurrently](https://www.npmjs.com/package/concurrently)
*   **Estilização:** CSS3 Vanilla (Design responsivo, variáveis CSS nativas, Glassmorphism, animações de transição)
*   **Hospedagem / Serverless:** [Vercel](https://vercel.com/) (Serverless Functions)

---

## ⚙️ Instalação e Execução Local

### Pré-requisitos
*   [Node.js](https://nodejs.org/) instalado em sua máquina (compatível desde a versão v16+).

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/nome-do-repositorio.git
    cd nome-do-repositorio
    ```

2.  **Instale as dependências do projeto:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto e configure a URL de conexão do seu banco de dados PostgreSQL (Neon) e a porta de execução local:
    ```env
    DATABASE_URL=postgresql://seu_usuario:sua_senha@seu_host/nome_db?sslmode=require
    PORT=3001
    ```
    *Nota: O arquivo `.env` já está configurado no `.gitignore` e não será enviado para o repositório por razões de segurança.*

4.  **Execute o projeto em modo de desenvolvimento:**
    ```bash
    npm run dev
    ```
    Este comando utilizará a biblioteca `concurrently` para iniciar automaticamente:
    *   O **Backend da API** rodando localmente na porta `3001` (com conexão ao banco Neon).
    *   O **Dev Server do Vite** rodando o frontend na porta `5173`.

5.  **Acesse no navegador:**
    Abra o link [http://localhost:5173](http://localhost:5173) no seu navegador.

---

## 🔑 Credenciais de Teste Padrão

Para acessar o painel administrativo na tela de login, utilize as credenciais abaixo:
*   **Usuário:** `admin`
*   **Senha:** `admin123`

---

## 📦 Deploy na Vercel (Configuração Serverless)

Este projeto está pronto e otimizado para ser hospedado na Vercel usando **Serverless Functions** (Express encapsulado na pasta `api/` mapeada no `vercel.json`):

1.  Crie um novo projeto no painel da **Vercel** apontando para o seu repositório do GitHub.
2.  Vá em **Settings (Configurações) > Environment Variables** no painel da Vercel.
3.  Cadastre a variável de ambiente:
    *   **Key:** `DATABASE_URL`
    *   **Value:** `SUA_CONEXAO_DO_NEON_POSTGRES`
4.  Clique em **Save** (Salvar).
5.  A Vercel executará o deploy da aplicação. As chamadas à API `/api/*` serão automaticamente roteadas para o arquivo serverless `/api/index.js` e as demais requisições servirão a interface estática do Vite.
