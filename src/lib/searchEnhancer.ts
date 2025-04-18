import axios from 'axios';
import { type ApiConfig, type SearxngResult, type SearxngSearchItem } from '@/types';

/**
 * 对查询关键词进行分析和拆分，获得更全面的搜索结果
 * @param originalQuery 原始查询词
 * @returns 拆分后的查询词数组
 */
export function analyzeAndSplitQuery(originalQuery: string): string[] {
  // 基本分词 - 按空格拆分
  const basicTokens = originalQuery.split(/\s+/).filter(token => token.length > 0);

  // 提取时间信息（年份、月份等）
  const timePatterns = /\b(20\d{2}|19\d{2})年?\b|\b\d{1,2}月\b|\b\d{1,2}日\b/g;
  const timeTokens = originalQuery.match(timePatterns) || [];

  // 提取人名和地点（简单启发式方法）
  const namePatterns = /[\u4e00-\u9fa5]{2,4}(?:总统|总理|主席|部长|官员|领导人)/g;
  const nameTokens = originalQuery.match(namePatterns) || [];

  // 提取可能的事件类型
  const eventTypes = [
    '战争', '冲突', '和平', '协议', '会谈', '峰会', '危机', '事件',
    '爆炸', '抗议', '示威', '选举', '政变', '改革', '制裁', '协议',
    '经济', '政治', '外交', '军事', '科技', '文化', '环境', '疫情'
  ];

  const eventTypeTokens = eventTypes.filter(type => originalQuery.includes(type));

  // 构建核心搜索词
  const coreQuery = basicTokens.length > 2 ? basicTokens.slice(0, 3).join(' ') : originalQuery;

  // 构建拆分后的查询数组
  const queries: string[] = [originalQuery]; // 始终包含原始查询

  // 添加核心查询 + 时间信息
  if (timeTokens.length > 0) {
    queries.push(`${coreQuery} ${timeTokens.join(' ')}`);
  }

  // 添加核心查询 + 人物信息
  if (nameTokens.length > 0) {
    queries.push(`${coreQuery} ${nameTokens.join(' ')}`);
  }

  // 添加核心查询 + 事件类型
  if (eventTypeTokens.length > 0) {
    queries.push(`${coreQuery} ${eventTypeTokens.join(' ')}`);
  }

  // 添加最新进展查询
  queries.push(`${coreQuery} 最新进展`);
  queries.push(`${coreQuery} 最新消息`);

  // 添加背景和影响查询
  queries.push(`${coreQuery} 背景`);
  queries.push(`${coreQuery} 影响`);

  // 去重
  return Array.from(new Set(queries));
}

/**
 * 并行执行多个搜索请求
 * @param queries 查询词数组
 * @param apiConfig API配置
 * @param searxngUrl SearXNG服务URL
 * @returns 合并后的搜索结果
 */
export async function parallelSearch(
  queries: string[],
  apiConfig: ApiConfig,
  searxngUrl: string
): Promise<SearxngResult> {
  // 确保查询词不为空
  if (!queries || queries.length === 0) {
    return {
      query: '',
      results: []
    };
  }

  console.log(`执行并行搜索，共${queries.length}个查询:`);
  queries.forEach((q, i) => console.log(`  查询${i+1}: "${q}"`));

  // 对每个查询词发起独立的搜索请求
  const searchPromises = queries.map(query => {
    const payload = {
      query,
      searxngUrl,
      categories: apiConfig.searxng?.categories || 'general',
      language: apiConfig.searxng?.language || 'zh',
      timeRange: apiConfig.searxng?.timeRange || 'year',
      engines: apiConfig.searxng?.engines || null,
      numResults: 5 // 每个查询取较少的结果，避免过多重复
    };

    // 使用中间层API发起搜索请求
    return axios.post('/api/search', payload)
      .then(response => {
        // 返回带有原始查询词的结果
        if (response.data && response.data.results) {
          return {
            ...response.data,
            originalQuery: query // 添加原始查询词字段，用于后续合并
          };
        }
        return null;
      })
      .catch(error => {
        console.error(`查询 "${query}" 失败:`, error);
        return null;
      });
  });

  // 并行执行所有搜索请求
  const results = await Promise.all(searchPromises);
  const validResults = results.filter(r => r !== null && r.results && r.results.length > 0);

  // 如果没有有效结果，返回空结果
  if (validResults.length === 0) {
    return {
      query: queries[0],
      results: []
    };
  }

  // 合并搜索结果
  return mergeSearchResults(validResults, queries[0]);
}

/**
 * 合并多个搜索结果并去重
 * @param results 多个搜索结果
 * @param originalQuery 原始查询词
 * @returns 合并后的搜索结果
 */
function mergeSearchResults(results: any[], originalQuery: string): SearxngResult {
  // 用于存储去重后的结果
  const uniqueResults: Record<string, SearxngSearchItem> = {};
  let totalResults = 0;

  // 处理每个搜索结果
  results.forEach(result => {
    if (result && Array.isArray(result.results)) {
      totalResults += result.results.length;

      // 遍历每个结果项
      result.results.forEach((item: SearxngSearchItem) => {
        // 使用URL作为唯一标识符
        if (item.url && !uniqueResults[item.url]) {
          // 添加一个字段表明这个结果来自哪个查询
          uniqueResults[item.url] = {
            ...item,
            fromQuery: result.originalQuery || result.query
          };
        }
      });
    }
  });

  // 将唯一结果转换为数组
  const mergedResults = Object.values(uniqueResults);

  // 根据相关性或分数排序
  mergedResults.sort((a, b) => {
    // 优先考虑有分数的结果
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreB - scoreA;
  });

  console.log(`合并搜索结果: 原始结果数量 ${totalResults}, 去重后 ${mergedResults.length}`);

  return {
    query: originalQuery,
    results: mergedResults,
    number_of_results: mergedResults.length
  };
}

/**
 * 使用智能拆分和并行搜索获取更全面的结果
 * @param query 原始查询词
 * @param apiConfig API配置
 * @returns 增强的搜索结果
 */
export async function enhancedSearch(
  query: string,
  apiConfig: ApiConfig
): Promise<SearxngResult | null> {
  // 检查是否启用SearXNG
  if (!apiConfig.searxng?.enabled || !apiConfig.searxng?.url) {
    console.log('SearXNG搜索未启用或URL未配置');
    return null;
  }

  const searxngUrl = apiConfig.searxng.url;

  // 1. 分析并拆分查询
  const queries = analyzeAndSplitQuery(query);
  console.log('查询拆分结果:', queries);

  // 2. 并行执行搜索
  return parallelSearch(queries, apiConfig, searxngUrl);
}
