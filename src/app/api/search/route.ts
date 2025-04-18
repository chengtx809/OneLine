import { NextResponse } from 'next/server';
import axios from 'axios';

// 设置较长的超时时间
const TIMEOUT_MS = 30000; // 30 秒

export async function POST(request: Request) {
  try {
    // 从请求体中获取查询和SearXNG配置
    const requestData = await request.json();
    const { query, searxngUrl } = requestData;

    // 如果没有提供SearXNG URL或查询，返回错误
    if (!searxngUrl || !query) {
      return NextResponse.json(
        { error: 'SearXNG URL or query not provided' },
        { status: 400 }
      );
    }

    // 构建SearXNG API请求URL
    const searchUrl = `${searxngUrl}/search`;

    // 构建请求参数
    const params = {
      q: query,
      format: 'json',
      categories: requestData.categories || 'general',
      language: requestData.language || 'zh',
      time_range: requestData.timeRange || 'year', // 默认搜索最近一年的内容
      engines: requestData.engines || null, // 如果提供了特定的引擎则使用
      num_results: requestData.numResults || 10, // 默认返回10条结果
    };

    console.log('Sending request to SearXNG:', {
      url: searchUrl,
      params
    });

    // 发送请求到SearXNG
    const response = await axios.get(searchUrl, {
      params,
      timeout: TIMEOUT_MS,
      headers: {
        'Accept': 'application/json'
      }
    });

    // 检查返回的数据是否符合预期格式
    const data = response.data;
    if (!data || typeof data !== 'object') {
      console.error('SearXNG返回的数据格式不正确', data);
      return NextResponse.json(
        { error: 'Invalid response format from SearXNG', data },
        { status: 500 }
      );
    }

    // 确保结果字段存在且是数组
    if (!Array.isArray(data.results)) {
      console.warn('SearXNG返回的结果不是数组，尝试适配', data);

      // 尝试适配响应格式
      const adaptedData = {
        query: query,
        results: Array.isArray(data) ? data : [],
        number_of_results: 0
      };

      if (adaptedData.results.length > 0) {
        adaptedData.number_of_results = adaptedData.results.length;
        return NextResponse.json(adaptedData);
      } else {
        return NextResponse.json(
          { error: 'No results found in SearXNG response', originalData: data },
          { status: 500 }
        );
      }
    }

    // 返回搜索结果
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('SearXNG API route error:', error);

    // 构建错误信息
    const errorDetails = {
      error: 'SearXNG search request failed',
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
