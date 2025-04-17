import type { EnvConfig } from '@/types';

// 获取环境变量配置
export function getEnvConfig(): EnvConfig {
  return {
    // 服务器端环境变量
    API_ENDPOINT: process.env.API_ENDPOINT,
    API_MODEL: process.env.API_MODEL,
    API_KEY: process.env.API_KEY,
    // 以下为客户端公开变量
    NEXT_PUBLIC_ALLOW_USER_CONFIG: process.env.NEXT_PUBLIC_ALLOW_USER_CONFIG,
    NEXT_PUBLIC_ACCESS_PASSWORD: process.env.NEXT_PUBLIC_ACCESS_PASSWORD,
    NEXT_PUBLIC_SEARXNG_URL: process.env.NEXT_PUBLIC_SEARXNG_URL,
    NEXT_PUBLIC_SEARXNG_ENABLED: process.env.NEXT_PUBLIC_SEARXNG_ENABLED,
  };
}

// 检查是否允许用户配置API设置
export function isUserConfigAllowed(): boolean {
  const allowUserConfig = process.env.NEXT_PUBLIC_ALLOW_USER_CONFIG;
  // 如果环境变量未设置或设置为 "true"，则允许用户配置
  return allowUserConfig === undefined || allowUserConfig === "true";
}

// 服务器API环境变量可用性检查
export function hasServerEnvConfig(): boolean {
  return !!process.env.API_ENDPOINT && !!process.env.API_KEY;
}

// 客户端检测环境变量配置状态的特殊标志
export function getEnvConfigStatus(): boolean {
  // 在服务端，检查实际的环境变量
  if (typeof window === 'undefined') {
    return hasServerEnvConfig();
  }

  // 在客户端，通过特殊的公开变量表明服务器API配置状态
  // 这个值会在服务端渲染期间被计算并注入到前端
  return process.env.NEXT_PUBLIC_HAS_SERVER_CONFIG === 'true';
}

// 获取环境变量中的API端点 - 客户端使用
export function getEnvApiEndpoint(): string | undefined {
  // 客户端不能直接访问服务器端环境变量，服务器端会使用环境变量
  if (typeof window !== 'undefined') {
    return ''; // 客户端返回空，需要用户手动配置或使用环境变量
  }
  return process.env.API_ENDPOINT;
}

// 获取环境变量中的API模型 - 客户端使用
export function getEnvApiModel(): string | undefined {
  // 客户端使用默认模型
  if (typeof window !== 'undefined') {
    return 'gemini-2.0-flash-exp-search'; // 返回默认模型
  }
  return process.env.API_MODEL || 'gemini-2.0-flash-exp-search';
}

// 获取环境变量中的API密钥 - 客户端使用
export function getEnvApiKey(): string | undefined {
  // 客户端不能直接访问服务器端环境变量
  if (typeof window !== 'undefined') {
    return ''; // 客户端返回空，需要用户手动配置或使用环境变量
  }
  return process.env.API_KEY;
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

// 获取环境变量中的SearXNG URL
export function getEnvSearxngUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SEARXNG_URL;
}

// 获取环境变量中的SearXNG启用状态
export function getEnvSearxngEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SEARXNG_ENABLED === 'true';
}
