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

    console.log('API路由环境变量检测:', {
      apiEndpoint: apiEndpoint ? '已设置' : '未设置',
      apiKey: apiKey ? '已设置' : '未设置',
      apiModel: apiModel
    });

    // 解析请求体
    const requestData = await request.json();

    // 检查请求中是否使用环境变量配置的标记
    const isUsingEnvConfig =
      requestData.model === "使用环境变量配置" ||
      requestData.endpoint === "使用环境变量配置" ||
      requestData.apiKey === "使用环境变量配置";

    // 如果请求表明要使用环境变量配置，但环境变量没有配置
    if (isUsingEnvConfig && (!apiKey || !apiEndpoint)) {
      return NextResponse.json(
        { error: '服务器端API配置缺失，请手动配置API参数' },
        { status: 500 }
      );
    }

    // 如果没有配置 API 密钥或端点，返回错误
    if (!isUsingEnvConfig && (!requestData.apiKey || !requestData.endpoint)) {
      return NextResponse.json(
        { error: 'API key or endpoint not configured in request' },
        { status: 400 }
      );
    }

    // 如果请求中包含 model 参数，则使用请求中的 model，否则使用环境变量中的 model
    const model = isUsingEnvConfig ? apiModel : (requestData.model || apiModel);

    // 使用正确的API端点和密钥
    const finalEndpoint = isUsingEnvConfig ? apiEndpoint : requestData.endpoint;
    const finalApiKey = isUsingEnvConfig ? apiKey : requestData.apiKey;

    // 构建实际发送给 API 的请求体
    const payload = {
      ...requestData,
      model
    };

    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${finalApiKey}`
    };

    console.log('Sending request to API:', {
      endpoint: finalEndpoint,
      model: model,
      usingEnvConfig: isUsingEnvConfig,
      apiKeyConfigured: finalApiKey ? '已配置' : '未配置'
    });

    // 发送请求到实际的 API 端点，增加超时设置
    const response = await axios.post(finalEndpoint, payload, {
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
