# API

Backend HTTP da aplicação Tracking OKRs. Esta API expõe autenticação baseada em sessão, documentação OpenAPI, healthcheck e a base de persistência em PostgreSQL para usuários e entidades de OKR.

## Visão Geral

- Stack principal: Node.js, Express, TypeScript, PostgreSQL, Passport, `express-session`
- Sessão: server-side com persistência em PostgreSQL via `connect-pg-simple`
- Auth local: email + senha com hash Argon2id
- Auth social: GitHub OAuth via `passport-github2`
- Verificação de email: tokens de uso único com envio por Resend
- Observabilidade: OpenTelemetry bootstrapado no startup

Entry points principais:

- [server.ts](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/src/server.ts)
- [app.ts](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/src/app.ts)
- [index.ts](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/src/routes/index.ts)

## Como Rodar

Instalar dependências no workspace e usar os scripts do pacote:

```bash
npm run dev --workspace @tracking-okrs/api
```

Scripts disponíveis em [package.json](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/package.json):

- `npm run dev --workspace @tracking-okrs/api`
- `npm run build --workspace @tracking-okrs/api`
- `npm run start --workspace @tracking-okrs/api`
- `npm run lint --workspace @tracking-okrs/api`
- `npm run typecheck --workspace @tracking-okrs/api`
- `npm run test --workspace @tracking-okrs/api`

## Variáveis de Ambiente

Definidas e validadas em [env.ts](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/src/config/env.ts).

Obrigatórias:

- `NODE_ENV`
- `PORT`
- `APP_ORIGIN`
- `AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_LOGIN`
- `SESSION_SECRET`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `OTEL_EXPORTER_OTLP_ENDPOINT`

Exemplo base em [apps/api/.env.example](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/.env.example).

## Known Issue / Temporary Behavior

Atualmente a API mantém toda a infraestrutura de verificação de email, mas o bloqueio de login local para contas não verificadas está desligado por padrão.

- Controle: `AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_LOGIN`
- Valor atual esperado: `false`
- Efeito: usuários locais com `is_verified = false` ainda conseguem autenticar com email e senha válidos
- O fluxo de verificação continua existindo:
  registro gera token,
  `/auth/verify-email` marca `is_verified = true`,
  `/auth/resend-verification` continua funcional

Isso é temporário e existe para acomodar a configuração de domínio de email e pendências administrativas. Quando esse processo terminar, basta reativar a flag para restaurar o bloqueio sem reimplementar o fluxo.

## Arquitetura

Estrutura principal:

- `src/app.ts`: middlewares globais, sessão, CORS, rate limit, docs e roteamento
- `src/server.ts`: bootstrap HTTP, teste de conexão com banco e shutdown gracioso
- `src/routes`: composição das rotas HTTP
- `src/modules/auth/controllers`: tradução de domínio para HTTP
- `src/modules/auth/services`: regras de autenticação e verificação
- `src/modules/auth/repositories`: acesso SQL raw
- `src/modules/auth/passport.ts`: strategies local e GitHub, serialize/deserialize
- `src/docs/openapi.ts`: especificação Swagger/OpenAPI
- `src/db`: pool PostgreSQL e helper de query

Fluxo de request simplificado:

1. `Express route`
2. `Controller`
3. `Service`
4. `Repository / integrations`
5. `HTTP response`

## Middlewares e Infra HTTP

Configurados em [app.ts](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/src/app.ts):

- `helmet`
- `cors` com `origin = APP_ORIGIN` e `credentials = true`
- `express-rate-limit`
- `express.json`
- `cookie-parser`
- `express-session`
- `passport.initialize`
- `passport.session`
- Swagger UI em `/api/v1/docs`

Sessão:

- cookie: `tracking_okrs.sid`
- `httpOnly: true`
- `sameSite: 'lax'`
- `secure: true` apenas em produção
- store: tabela `user_sessions` criada pelo `connect-pg-simple` quando necessário

## Modelos de Dados

Schema base em [init.sql](/home/joaovpsguimaraes/apps/tracking-okrs/infra/postgres/init.sql).

### `users`

- `id uuid`
- `username text unique not null`
- `email text unique not null`
- `name text not null`
- `password_hash text null`
- `avatar_url text null`
- `job text null`
- `is_verified boolean not null default false`
- `created_at timestamptz`
- `updated_at timestamptz`

Observações:

- contas locais usam `password_hash`
- contas GitHub nascem com `is_verified = true`
- contas locais nascem com `is_verified = false`

### `auth_accounts`

- `id uuid`
- `user_id uuid`
- `provider text`
- `provider_user_id text`
- `provider_email text null`
- `created_at timestamptz`

Uso atual:

- vínculo entre `users` e provedores externos
- hoje usado para GitHub

### `email_verification_tokens`

- `id uuid`
- `user_id uuid`
- `token_hash text unique`
- `expires_at timestamptz`
- `sent_at timestamptz`
- `used_at timestamptz null`

Regras:

- token bruto nunca é persistido
- o banco guarda apenas o hash SHA-256
- token é de uso único
- validade de 24h
- reenvio respeita cooldown de 45s

### Entidades de OKR

A API já possui schema base para:

- `quarters`
- `objectives`
- `key_results`

Neste momento, o módulo HTTP implementado no pacote está concentrado em auth e healthcheck.

## Contratos de Auth

Tipos compartilhados vêm de [packages/shared-types/src/index.ts](/home/joaovpsguimaraes/apps/tracking-okrs/packages/shared-types/src/index.ts).

### `AuthUser`

```ts
type AuthUser = {
  id: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  job: string | null;
  isVerified: boolean;
};
```

### `LoginInput`

```ts
type LoginInput = {
  email: string;
  password: string;
};
```

### `RegisterInput`

```ts
type RegisterInput = {
  username: string;
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  avatarUrl?: string;
  job?: string;
};
```

### `RegisterResponse`

```ts
type RegisterResponse = {
  email: string;
  resendAvailableAt: string;
  deliveryStatus: 'sent' | 'pending_retry';
};
```

## Regras de Autenticação

Implementadas principalmente em [auth.service.ts](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/src/modules/auth/services/auth.service.ts).

### Cadastro local

- valida `password === confirmPassword`
- exige senha forte
- garante unicidade de `email`
- garante unicidade de `username`
- persiste usuário local com `is_verified = false`
- gera token de verificação
- tenta enviar email via Resend

### Login local

- normaliza email para lowercase
- busca usuário por email
- valida hash Argon2id
- se a flag `AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_LOGIN=true`, bloqueia `is_verified = false`
- se a flag estiver `false`, permite login mesmo com conta ainda não verificada

### Login GitHub

- usa `profile.emails[0]` como email primário
- falha se o GitHub não retornar email utilizável
- falha se o email já existir em conta local sem vínculo GitHub
- cria usuário automaticamente no primeiro acesso
- cria vínculo em `auth_accounts`

### Verificação de email

- link aponta para `/api/v1/auth/verify-email?token=<raw>`
- backend calcula hash do token e compara com o banco
- se válido e não expirado:
  marca usuário como verificado
  invalida tokens pendentes do usuário

## Rotas

Prefixo base: `/api/v1`

### Health

#### `GET /health`

Retorna status simples da API.

Resposta:

```json
{
  "data": {
    "status": "ok"
  }
}
```

### Auth

#### `POST /auth/register`

Cria conta local e dispara o fluxo de verificação.

Body:

```json
{
  "username": "ana",
  "email": "ana@example.com",
  "name": "Ana",
  "password": "Strong#123",
  "confirmPassword": "Strong#123",
  "avatarUrl": "https://example.com/avatar.png",
  "job": "Engineer"
}
```

Sucesso `201`:

```json
{
  "data": {
    "email": "ana@example.com",
    "resendAvailableAt": "2026-03-26T12:00:45.000Z",
    "deliveryStatus": "sent"
  }
}
```

Erros comuns:

- `400 validation_error`
- `400 weak_password`
- `400 password_mismatch`
- `409 email_conflict`
- `409 username_conflict`

#### `POST /auth/login`

Autentica usuário local e cria sessão server-side.

Body:

```json
{
  "email": "ana@example.com",
  "password": "Strong#123"
}
```

Sucesso `200`:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "username": "ana",
      "email": "ana@example.com",
      "name": "Ana",
      "avatarUrl": null,
      "job": null,
      "isVerified": false
    }
  }
}
```

Erros comuns:

- `400 validation_error`
- `401 invalid_credentials`
- `403 email_not_verified` somente quando `AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_LOGIN=true`

#### `POST /auth/logout`

Encerra a sessão atual e limpa o cookie.

Sucesso:

- `204 No Content`

#### `GET /auth/me`

Retorna o usuário autenticado pela sessão atual.

Sucesso `200`:

```json
{
  "data": {
    "user": null
  }
}
```

Ou:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "username": "ana",
      "email": "ana@example.com",
      "name": "Ana",
      "avatarUrl": null,
      "job": null,
      "isVerified": false
    }
  }
}
```

#### `GET /auth/github`

Inicia o fluxo OAuth com GitHub.

Resposta:

- `302` redirect para GitHub

#### `GET /auth/github/callback`

Conclui o OAuth, cria sessão e redireciona para a aplicação web.

Resposta:

- `302` para `/`
- em erro, `302` para `/login?error=social_auth_failed&reason=...`

Reasons atuais:

- `email_conflict`
- `missing_email`
- `unknown`

#### `GET /auth/verify-email`

Consome token de verificação enviado por email.

Query params:

- `token`

Resposta:

- `302` para `/verify-email/result?status=verified`
- `302` para `/verify-email/result?status=expired`
- `302` para `/verify-email/result?status=invalid`

#### `POST /auth/resend-verification`

Reenvia email de verificação respeitando o cooldown.

Body:

```json
{
  "email": "ana@example.com"
}
```

Sucesso `200`:

```json
{
  "data": {
    "resendAvailableAt": "2026-03-26T12:00:45.000Z",
    "deliveryStatus": "sent"
  }
}
```

Erros comuns:

- `400 validation_error`
- `404 email_not_found`
- `429 cooldown_active`

## Códigos de Erro de Auth

Definidos em [auth.errors.ts](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/src/modules/auth/services/auth.errors.ts).

Principais:

- `invalid_credentials`
- `email_not_verified`
- `email_conflict`
- `username_conflict`
- `weak_password`
- `password_mismatch`
- `email_not_found`
- `cooldown_active`
- `invalid_verification_token`
- `expired_verification_token`
- `social_email_missing`

Formato padrão:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "Invalid email or password"
  }
}
```

## Documentação Swagger

- UI: `/api/v1/docs`
- JSON: `/api/v1/docs.json`

Fonte: [openapi.ts](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/src/docs/openapi.ts)

## Testes

Cobertura atual inclui:

- unit tests de service de auth
- testes de integração das rotas
- testes das integrações de verificação por email
- verificação do schema SQL de auth

Arquivos principais:

- [auth.service.test.ts](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/src/modules/auth/services/auth.service.test.ts)
- [auth.routes.test.ts](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/src/routes/auth.routes.test.ts)
- [auth-schema.test.ts](/home/joaovpsguimaraes/apps/tracking-okrs/apps/api/src/modules/auth/repositories/auth-schema.test.ts)

## Observações Operacionais

- O backend depende de PostgreSQL disponível no startup e aborta cedo se `select 1` falhar.
- O shutdown fecha telemetry, pool e servidor HTTP de forma graciosa.
- A API espera que a aplicação web esteja no `APP_ORIGIN` configurado para CORS, redirects e links de verificação.
