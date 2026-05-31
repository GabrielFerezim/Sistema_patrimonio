# 🖥️ Trynova | Sistema de Controle de Patrimônio e Inventário

<p align="center">
  <strong>Solução corporativa para gestão inteligente de ativos de TI</strong>
</p>

<p align="center">
  Sistema moderno desenvolvido para gerenciamento completo de patrimônios tecnológicos, controle de inventário e acompanhamento operacional em tempo real.
</p>

---

## 📌 Sobre o Projeto

O **Trynova Inventory System** é uma plataforma web desenvolvida para centralizar e otimizar o controle de patrimônio e inventário de equipamentos corporativos.

A aplicação foi projetada para oferecer:

* Controle completo do ciclo de vida dos ativos
* Monitoramento em tempo real
* Gestão inteligente por status e localização
* Interface moderna e responsiva
* Alta disponibilidade com arquitetura serverless

O sistema foi construído com foco em **performance, escalabilidade, segurança e experiência do usuário**, atendendo demandas reais de gestão de infraestrutura e ativos empresariais.

---

## ✨ Principais Funcionalidades

### 📊 Dashboard Administrativo

Painel estratégico com indicadores em tempo real:

* Total de patrimônios cadastrados
* Equipamentos em uso
* Itens em estoque
* Equipamentos em manutenção
* Visualização gráfica interativa
* Distribuição por departamentos e localizações

---

### 🖥️ Gestão de Inventário

Controle completo de ativos com:

* Listagem dinâmica
* Busca inteligente em tempo real
* Filtros avançados
* Ordenação automática
* Visualização detalhada

---

### ⚙️ CRUD Completo

Gerenciamento total dos patrimônios:

* Cadastro de novos ativos
* Edição de informações
* Exclusão segura
* Validação automática de unicidade
* Regras dinâmicas de preenchimento

---

### 👥 Gestão de Funcionários

Visualização organizada por responsável:

* Agrupamento automático de equipamentos em uso
* Cards expansíveis estilo accordion
* Histórico de alocação
* Controle de responsabilidade patrimonial

---

### 🔐 Autenticação Segura

Sistema de login premium com:

* Validação em tempo real
* Interface glassmorphism
* Controle seguro de acesso
* Visualização de senha
* Proteção contra inconsistências de autenticação

---

### 🗄️ Auto-inicialização do Banco

Inicialização automática da aplicação:

* Criação automática da estrutura relacional
* Seed inicial de dados
* Ambiente pronto para testes imediatos

---

### 📦 Cache Offline Inteligente

Resiliência operacional com fallback local:

* Persistência via LocalStorage
* Continuidade de visualização
* Redução de falhas por indisponibilidade temporária da API

---

## 🛠️ Stack Tecnológica

### Frontend

* React
* Vite
* Context API
* Hooks
* CSS3

### Backend

* Node.js
* Express.js

### Banco de Dados

* PostgreSQL
* Neon Database

### Infraestrutura

* Vercel Serverless Functions

### Utilitários

* Concurrently
* Node-Postgres (pg)

---

## 🏗️ Arquitetura

```bash
trynova-inventory/
│
├── src/                 # Frontend React
├── api/                 # Serverless Functions
├── public/              # Assets estáticos
├── server/              # Backend Express local
├── vercel.json          # Configuração deploy
└── README.md
```

---

## ⚙️ Instalação Local

### Pré-requisitos

* Node.js v16+
* npm
* Banco PostgreSQL (Neon recomendado)

---

### 1. Clone o projeto

```bash
git clone https://github.com/seu-usuario/trynova-inventory.git
cd trynova-inventory
```

---

### 2. Instale as dependências

```bash
npm install
```

---

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env`

```env
DATABASE_URL=postgresql://usuario:senha@host/database?sslmode=require
PORT=3001
```

---

### 4. Execute localmente

```bash
npm run dev
```

---

### 5. Acesse no navegador

```bash
http://localhost:5173
```

---

## 🔑 Credenciais de Teste

```txt
Usuário: admin
Senha: admin123
```

---

## 🚀 Deploy

A aplicação está preparada para deploy serverless na **Vercel**.

### Configuração

Adicionar variável:

```env
DATABASE_URL
```

Após isso, o deploy será executado automaticamente.

---

## 🎯 Objetivos Técnicos

Este projeto demonstra competências práticas em:

* Desenvolvimento Full Stack
* Arquitetura React + Node
* Integração com banco relacional
* Deploy serverless
* Modelagem de dados
* UX/UI corporativa
* Estruturação escalável

---

## 📷 Preview

> Adicione aqui screenshots do sistema para destacar a interface visual.

Exemplo:

* Tela de Login
* Dashboard
* Gestão de Inventário
* Gestão de Funcionários

---

## 👨‍💻 Desenvolvido por

**Gabriel Ferezim**

Software Developer | Sistemas & Infraestrutura | Desenvolvimento Web

---

<p align="center">
  Desenvolvido para otimizar a gestão patrimonial corporativa com eficiência, escalabilidade e inteligência operacional.
  https://sistema-patrimonio-nu.vercel.app/
</p>
