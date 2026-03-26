FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --filter @tracking-okrs/web... --frozen-lockfile=false

WORKDIR /workspace/apps/web

EXPOSE 5173
EXPOSE 4173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
