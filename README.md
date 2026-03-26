# tracking-okrs

Monorepo de uma aplicação de tracking de OKRs com frontend Vue 3, backend Express, PostgreSQL, Jaeger e Nginx.

O objetivo do produto é permitir que um usuário:
- cadastre quarters, objectives e key results;
- acompanhe progresso percentual de cada KR;
- mantenha documentação rica por KR, no estilo Notion ou Obsidian;
- visualize dashboards de progresso por KR, objetivo e quarter;
- consolide a visão geral de todos os OKRs de um quarter específico.

Este repositório contém o setup inicial da plataforma, com a fundação de frontend, backend, infraestrutura local e pacotes compartilhados.

## Arquitetura

O monorepo é organizado com `pnpm workspaces` e separado em três áreas principais:

- `apps/`: aplicações executáveis do sistema.
- `packages/`: pacotes compartilhados entre frontend e backend.
- `infra/`: arquivos de infraestrutura local, containers e proxy reverso.

### Apps

- `apps/web`: frontend em Vue 3 + Vite + TypeScript strict, organizado em MVVM, com Pinia, Tailwind, shadcn-vue, Vitest, Chart.js, Zod, vee-validate, axios e tiptap.
- `apps/api`: backend em Express + TypeScript strict, com Passport para autenticação local e GitHub, PostgreSQL com SQL raw, OpenAPI e tracing com OpenTelemetry exportado para Jaeger.

### Packages

- `packages/shared-types`: contratos e tipos compartilhados entre frontend e backend, como payloads de API e entidades base.
- `packages/eslint-config`: configuração central de ESLint usada pelos apps.
- `packages/tsconfig`: presets de TypeScript compartilhados para Node e Vue.

Cada app e cada pacote pode ter documentação própria depois. Este `README` cobre a visão geral do monorepo e a forma de executá-lo.

## Stack

### Backend

- ExpressJS
- TypeScript strict
- ESLint strict
- Prettier
- Passport local + GitHub OAuth
- PostgreSQL com SQL raw via `pg`
- OpenAPI
- OpenTelemetry + Jaeger

### Frontend

- Vue 3
- Vite
- TypeScript strict
- MVVM
- Pinia
- Tailwind CSS
- shadcn-vue
- Vitest
- Chart.js
- Zod
- date-fns
- lodash
- tiptap
- vee-validate
- axios

### Infra

- Docker Compose
- PostgreSQL
- Jaeger
- Nginx

## Estrutura do Repositório

```text
.
├── apps
│   ├── api
│   └── web
├── infra
│   ├── docker
│   ├── nginx
│   └── postgres
├── packages
│   ├── eslint-config
│   ├── shared-types
│   └── tsconfig
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## Pré-requisitos

Para desenvolvimento local fora de containers:

- Node.js 22+
- pnpm 10+

Para execução containerizada:

- Docker
- Docker Compose

## Como Iniciar

Existem duas formas principais de subir o projeto.

### 1. Ambiente completo com Docker Compose

Essa é a forma mais próxima da topologia local prevista para a aplicação.

```bash
docker compose up -d --build
```

Serviços expostos:

- aplicação via Nginx: `http://localhost:8080`
- PostgreSQL no host: `localhost:5433`
- Jaeger UI: `http://localhost:16686`

Observação:
- internamente, o PostgreSQL continua em `5432` dentro da rede Docker;
- o mapeamento externo está em `5433` para evitar conflito com bancos já em execução na máquina;
- o Nginx está publicado em `8080` porque a porta `80` já estava ocupada no ambiente onde o setup foi validado.

Para derrubar os serviços:

```bash
docker compose down
```

Para derrubar os serviços e remover volumes:

```bash
docker compose down -v
```

### 2. Desenvolvimento com pnpm workspaces

Instale as dependências:

```bash
pnpm install
```

Suba os apps em paralelo:

```bash
pnpm dev
```

Scripts disponíveis na raiz:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format
pnpm format:write
```

## Como o Nginx Funciona na Aplicação

O Nginx é o ponto de entrada HTTP do ambiente local containerizado.

Ele tem três responsabilidades principais:

1. receber as requisições externas do cliente;
2. encaminhar chamadas de frontend para o app Vue;
3. encaminhar chamadas de API para o backend Express.

### Fluxo de requisição

Quando a stack está no ar:

- o navegador acessa `http://localhost:8080`;
- o Nginx recebe a requisição;
- requisições para `/` são encaminhadas para o serviço `web`;
- requisições para `/api/` são encaminhadas para o serviço `api`.

Em termos práticos:

- `http://localhost:8080/` -> frontend Vue/Vite
- `http://localhost:8080/api/v1/health` -> backend Express

### Benefícios dessa abordagem

- frontend e backend ficam sob o mesmo host no ambiente local;
- o frontend pode usar `/api/v1` como base sem depender de URL separada;
- reduz necessidade de configuração extra de CORS no fluxo principal;
- cria uma base simples para evoluir para balanceamento de carga do backend.

### Balanceamento de carga

O arquivo [infra/nginx/default.conf](/home/joaovpsguimaraes/apps/tracking-okrs/infra/nginx/default.conf) já define upstreams para `web` e `api`.

O upstream da API foi preparado para balanceamento com `least_conn`, o que permite evoluir para múltiplas instâncias do backend quando necessário. Hoje o Compose sobe uma instância da API, mas a configuração do proxy já está pronta para esse próximo passo.

## Banco de Dados e Observabilidade

### PostgreSQL

O PostgreSQL é iniciado pelo Compose com script inicial em [infra/postgres/init.sql](/home/joaovpsguimaraes/apps/tracking-okrs/infra/postgres/init.sql).

Esse arquivo cria a base inicial para:

- `users`
- `auth_accounts`
- `quarters`
- `objectives`
- `key_results`

O backend usa somente SQL raw via `pg`. Não há ORM no projeto.

### Jaeger

O backend exporta traces via OpenTelemetry para o Jaeger.

Interface local:

- `http://localhost:16686`

Isso permite acompanhar requests, latência e tracing distribuído conforme a API crescer.

## Convenções do Projeto

### Frontend

No frontend, a separação principal é:

- `views/`: telas
- `view-models/`: orquestração de tela
- `models/`: regras de negócio puras
- `services/`: integração HTTP
- `stores/`: estado global com Pinia
- `components/`: componentes de interface

### Backend

No backend, a separação principal é:

- `routes/`: definição das rotas HTTP
- `modules/`: organização por domínio
- `controllers/`: entrada HTTP
- `services/`: regras de aplicação
- `repositories/`: acesso ao banco com SQL raw
- `db/`: pool e utilitários de banco
- `docs/`: OpenAPI
- `telemetry/`: tracing

## Validação do Setup

Os comandos abaixo foram usados para validar o setup:

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build
pnpm test
docker compose config
docker compose up -d --build
```

Resultados esperados:

- workspace instalado com sucesso;
- lint sem erros;
- typecheck sem erros;
- build do frontend e backend funcionando;
- teste inicial de model do frontend passando;
- stack Docker subindo com `postgres`, `jaeger`, `api`, `web` e `nginx`.

## Próximos Passos

Depois do setup inicial, a evolução natural do projeto é:

- implementar CRUD de quarters;
- implementar objectives e key results;
- adicionar tracking histórico de progresso por KR;
- implementar editor rico para documentos de KR;
- criar dashboards reais por quarter e por objetivo;
- adicionar migrations SQL versionadas;
- adicionar CI/CD e automações de qualidade.
