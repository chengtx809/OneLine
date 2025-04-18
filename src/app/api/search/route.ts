import { NextResponse } from 'next/server';
import axios from 'axios';

// 设置较长的超时时间，但不要太长以避免阻塞太多时间
const TIMEOUT_MS = 10000; // 10 秒，对于并行请求来说已经足够

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

    console.log(`搜索请求: "${query}" 发送到 ${searchUrl}`);

    // 发送请求到SearXNG，使用较短的超时时间
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
        { error: 'Invalid response format from SearXNG', rawData: typeof data },
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
        // 检查是否有其他可用数据，例如answers或suggestions
        if (data.answers && data.answers.length > 0) {
          adaptedData.results = data.answers.map((answer: string) => ({
            title: `${answer}`,
            content: answer,
            url: searchUrl,
            engine: 'searxng_answers'
          }));
          adaptedData.number_of_results = adaptedData.results.length;
          return NextResponse.json(adaptedData);
        }

        if (data.suggestions && data.suggestions.length > 0) {
          adaptedData.results = data.suggestions.map((suggestion: string) => ({
            title: `建议搜索: ${suggestion}`,
            content: `您可能想搜索: ${suggestion}`,
            url: `${searchUrl}?q=${encodeURIComponent(suggestion)}`,
            engine: 'searxng_suggestions'
          }));
          adaptedData.number_of_results = adaptedData.results.length;
          return NextResponse.json(adaptedData);
        }

        return NextResponse.json(
          {
            query: query,
            results: [],
            number_of_results: 0,
            message: 'No results found in SearXNG response'
          },
          { status: 200 } // 返回200以允许继续处理
        );
      }
    }

    // 返回搜索结果
    return NextResponse.json({
      ...response.data,
      query: query // 确保查询词被包含在响应中
    });
  } catch (error: any) {
    console.error(`SearXNG API route error for query "${error.config?.params?.q || 'unknown'}":`, error.message);

    // 构建错误信息
    const errorDetails = {
      error: 'SearXNG search request failed',
      message: error.message,
      query: error.config?.params?.q || 'unknown'
    };

    // 如果有响应数据，添加到错误中
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.statusText = error.response.statusText;
      errorDetails.data = error.response.data;
    } else if (error.code === 'ECONNABORTED') {
      // 请求超时
      console.warn(`搜索请求 "${error.config?.params?.q || 'unknown'}" 超时`);
      return NextResponse.json(
        {
          query: error.config?.params?.q || 'unknown',
          results: [],
          number_of_results: 0,
          message: 'Search request timed out'
        },
        { status: 200 } // 返回200以允许继续处理
      );
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorDetails.request = 'Request was made but no response was received';
      errorDetails.timeout = error.code === 'ECONNABORTED';
    }

    // 返回错误响应，但使用200状态码以便客户端不中断处理
    return NextResponse.json(
      {
        ...errorDetails,
        results: [],
        number_of_results: 0
      },
      { status: 200 }
    );
  }
}
