import { NextResponse } from 'next/server';
import axios from 'axios';

// 设置较长的超时时间，避免 504 错误
const TIMEOUT_MS = 60000; // 60 秒

export async function POST(request: Request) {
  try {
    // 从环境变量中获取 API 密钥和端点
    const apiKey = process.env.API_KEY;
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiModel = process.env.API_MODEL || 'gemini-2.0-flash-exp-search';

    console.log('API Config:', {
      endpoint: apiEndpoint,
      model: apiModel,
      hasKey: !!apiKey
    });

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

    console.log('Sending request to API:', apiEndpoint);

    // 发送请求到实际的 API 端点，增加超时设置
    const response = await axios.post(apiEndpoint, payload, {
      headers,
      timeout: TIMEOUT_MS
    });

    // 返回 API 响应
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API route error:', error);

    // 构建更详细的错误信息
    const errorDetails = {
      error: 'API request failed',
      message: error.message,
    };

    // 如果有响应数据，添加到错误中
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.statusText = error.response.statusText;
      errorDetails.data = error.response.data;
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorDetails.request = 'Request was made but no response was received';
      errorDetails.timeout = error.code === 'ECONNABORTED';
    }

    // 返回错误响应
    return NextResponse.json(
      errorDetails,
      { status: error.response?.status || 500 }
    );
  }
}
