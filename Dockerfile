FROM node:20-alpine AS builder
ENV npm_config_user_agent="pnpm/10.26.1 npm/? node/v20.0.0 linux x64"
RUN npm install -g pnpm@10.26.1
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile

ENV PORT=3000
ENV BASE_PATH=/
ENV NODE_ENV=production
RUN pnpm --filter @workspace/bright-library run build
RUN pnpm --filter @workspace/api-server run build

FROM node:20-alpine AS runner
ENV npm_config_user_agent="pnpm/10.26.1 npm/? node/v20.0.0 linux x64"
RUN npm install -g pnpm@10.26.1
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json ./lib/db/
COPY lib/db/drizzle.config.ts ./lib/db/
COPY lib/db/src ./lib/db/src
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
RUN pnpm install --no-frozen-lockfile

COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/bright-library/dist/public ./artifacts/bright-library/dist/public
COPY start.sh ./start.sh
RUN chmod +x ./start.sh && mkdir -p /app/artifacts/api-server/uploads

EXPOSE 8080
CMD ["sh", "./start.sh"]
