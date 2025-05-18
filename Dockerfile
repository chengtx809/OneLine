# 使用 Node.js 作为基础镜像
FROM node:20-alpine AS base

# 安装依赖
FROM base AS dependencies
WORKDIR /app
COPY package.json ./
# 使用官方安装脚本安装 Bun
RUN apk add --no-cache curl unzip
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"
# 安装依赖
COPY . .
RUN bun install
# 显式安装 Biome 以确保 lint 能够运行
RUN bun add -d @biomejs/biome

# 构建应用
FROM dependencies AS builder
WORKDIR /app
# 构建应用
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
