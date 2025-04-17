import { NextResponse } from 'next/server';
import { getEnvConfig, hasServerEnvConfig, getEnvConfigStatus } from '@/lib/env';

export async function GET() {
  try {
    // 直接读取环境变量
    const directEnv = {
      API_ENDPOINT: process.env.API_ENDPOINT,
      API_MODEL: process.env.API_MODEL,
      API_KEY: process.env.API_KEY ? '已设置' : '未设置',
      NEXT_PUBLIC_ALLOW_USER_CONFIG: process.env.NEXT_PUBLIC_ALLOW_USER_CONFIG,
      NEXT_PUBLIC_ACCESS_PASSWORD: process.env.NEXT_PUBLIC_ACCESS_PASSWORD ? '已设置' : '未设置',
      NEXT_PUBLIC_HAS_SERVER_CONFIG: process.env.NEXT_PUBLIC_HAS_SERVER_CONFIG,
    };

    // 使用lib/env.ts中的方法
    const envUtils = {
      hasServerEnvConfig: hasServerEnvConfig(),
      getEnvConfigStatus: getEnvConfigStatus(),
      getEnvApiEndpoint: typeof process.env.API_ENDPOINT === 'string' ? '已设置' : '未设置',
      getEnvApiModel: typeof process.env.API_MODEL === 'string' ? '已设置' : '未设置',
      getEnvApiKey: typeof process.env.API_KEY === 'string' ? '已设置' : '未设置',
      getEnvAccessPassword: typeof process.env.NEXT_PUBLIC_ACCESS_PASSWORD === 'string' ? '已设置' : '未设置',
    };

    return NextResponse.json({
      directEnv,
      envUtils,
      message: '这是服务器端环境变量测试'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
