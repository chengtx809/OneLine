import { NextResponse } from 'next/server';
import axios from 'axios';

// 简单的HTML内容提取函数
function extractTextFromHtml(html: string): string {
  try {
    // 移除HTML标签、脚本和样式
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 限制内容长度，避免过大
    const maxLength = 5000;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }

    return text;
  } catch (error) {
    console.error("HTML内容提取失败:", error);
    return "内容提取失败";
  }
}

export async function POST(request: Request) {
  try {
    // 从请求体中获取URL
    const requestData = await request.json();
    const { url } = requestData;

    // 如果没有提供URL，返回错误
    if (!url) {
      return NextResponse.json(
        { error: 'URL not provided' },
        { status: 400 }
      );
    }

    // 设置较短的超时时间，避免阻塞
    const timeout = requestData.timeout || 10000; // 默认10秒

    console.log(`服务器正在抓取网页内容: ${url}，超时: ${timeout}ms`);

    // 发送请求获取网页内容
    const response = await axios.get(url, {
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    });

    // 提取网页内容
    const html = response.data;
    if (typeof html !== 'string') {
      return NextResponse.json(
        { error: 'Invalid HTML content' },
        { status: 500 }
      );
    }

    // 提取并返回文本内容
    const extractedText = extractTextFromHtml(html);

    return NextResponse.json({
      url: url,
      content: extractedText,
      content_length: extractedText.length,
      status: 'success'
    });
  } catch (error: any) {
    console.error(`网页内容获取失败:`, error.message);

    // 构建错误信息
    const errorMessage = error.message || 'Unknown error';
    const errorStatus = error.response?.status || 500;

    return NextResponse.json(
      {
        error: 'Failed to fetch webpage content',
        message: errorMessage,
        status: errorStatus,
        url: error.config?.url
      },
      { status: 200 } // 返回200以允许客户端处理
    );
  }
}
