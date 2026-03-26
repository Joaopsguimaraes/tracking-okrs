FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --filter @tracking-okrs/api... --frozen-lockfile=false

WORKDIR /workspace/apps/api

EXPOSE 4000

CMD ["pnpm", "dev"]
