import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    // 从环境变量中获取 API 密钥和端点
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY;
    const apiEndpoint = process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT;
    const apiModel = process.env.API_MODEL || process.env.NEXT_PUBLIC_API_MODEL || 'gemini-2.0-pro-exp-search';

    // 如果没有配置 API 密钥或端点，返回错误
    if (!apiKey || !apiEndpoint) {
      return NextResponse.json(
        { error: 'API key or endpoint not configured' },
        { status: 500 }
      );
    }

    // 解析请求体
    const requestData = await request.json();

    // 如果请求中包含 model 参数，则使用请求中的 model
    const model = requestData.model || apiModel;

    // 构建实际发送给 API 的请求体
    const payload = {
      ...requestData,
      model
    };

    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // 发送请求到实际的 API 端点
    const response = await axios.post(apiEndpoint, payload, { headers });

    // 返回 API 响应
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API route error:', error);

    // 返回错误响应
    return NextResponse.json(
      {
        error: 'API request failed',
        message: error.message,
        // 如果有响应数据，包含在错误中
        response: error.response?.data
      },
      { status: error.response?.status || 500 }
    );
  }
}
