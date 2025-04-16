import type { EnvConfig } from '@/types';

// 获取环境变量配置
export function getEnvConfig(): EnvConfig {
  return {
    // 服务器端环境变量
    API_ENDPOINT: process.env.API_ENDPOINT,
    API_MODEL: process.env.API_MODEL,
    API_KEY: process.env.API_KEY,
    // 以下为客户端公开变量
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
    NEXT_PUBLIC_API_MODEL: process.env.NEXT_PUBLIC_API_MODEL,
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
    NEXT_PUBLIC_ALLOW_USER_CONFIG: process.env.NEXT_PUBLIC_ALLOW_USER_CONFIG,
    NEXT_PUBLIC_ACCESS_PASSWORD: process.env.NEXT_PUBLIC_ACCESS_PASSWORD,
  };
}

// 检查是否允许用户配置API设置
export function isUserConfigAllowed(): boolean {
  const allowUserConfig = process.env.NEXT_PUBLIC_ALLOW_USER_CONFIG;
  // 如果环境变量未设置或设置为 "true"，则允许用户配置
  return allowUserConfig === undefined || allowUserConfig === "true";
}

// 获取环境变量中的API端点
export function getEnvApiEndpoint(): string | undefined {
  // 优先使用服务器端环境变量
  return process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT;
}

// 获取环境变量中的API模型
export function getEnvApiModel(): string | undefined {
  // 优先使用服务器端环境变量
  return process.env.API_MODEL || process.env.NEXT_PUBLIC_API_MODEL;
}

// 获取环境变量中的API密钥
export function getEnvApiKey(): string | undefined {
  // 优先使用服务器端环境变量
  return process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY;
}

// 获取环境变量中的访问密码
export function getEnvAccessPassword(): string | undefined {
  return process.env.NEXT_PUBLIC_ACCESS_PASSWORD;
}

// 检查是否设置了访问密码
export function hasAccessPassword(): boolean {
  return !!process.env.NEXT_PUBLIC_ACCESS_PASSWORD;
}

// 验证访问密码是否正确
export function validateAccessPassword(password: string): boolean {
  const envPassword = process.env.NEXT_PUBLIC_ACCESS_PASSWORD;
  if (!envPassword) return true; // 如果未设置密码，则任何密码都有效
  return password === envPassword;
}
