# 使用 Node.js 作为基础镜像
FROM node:20-alpine AS base

# 安装依赖
FROM base AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN apk add --no-cache curl
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"
RUN bun install

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN apk add --no-cache curl
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"
RUN bun run build

# 生产环境
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# 复制必要的文件
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# 暴露端口
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 运行应用
CMD ["node", "server.js"]
