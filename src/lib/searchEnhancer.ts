import axios from 'axios';
import { type ApiConfig, type SearxngResult, type SearxngSearchItem } from '@/types';

// NLP相关工具函数 - 中文分词简易实现
function segmentChineseWords(text: string): string[] {
  // 正则表达式匹配中文词语模式
  // 这是一个简化的实现，实际应用中可以使用更复杂的NLP库
  const patterns = [
    /[\u4e00-\u9fa5]{2,6}(?:大学|学院|学校|医院|公司|集团|银行|酒店|餐厅|商场|市场|广场|中心|学会|研究院|研究所|组织|机构|部门|委员会|协会|联盟|基金会)/g, // 机构名称
    /[\u4e00-\u9fa5]{1,2}(?:省|市|县|区|镇|乡|村|街道|路|大道|高速|铁路|机场|港口|车站)/g, // 地名
    /[\u4e00-\u9fa5]{2,4}(?:总统|总理|主席|部长|官员|领导人|秘书长|议员|大使|外交官|司令|将军|指挥官)/g, // 职位/人名
    /[\u4e00-\u9fa5]{2,6}(?:战争|冲突|危机|事件|协议|合同|条约|宣言|声明|公告|计划|政策|法案|政变|革命|改革|运动|计划|项目)/g, // 事件名称
    /(?:19|20)\d{2}年?(?:\d{1,2}月)?(?:\d{1,2}日)?/g, // 日期
  ];

  // 收集所有匹配结果
  const segments: string[] = [];

  // 应用每个模式提取关键词
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      segments.push(...matches);
    }
  });

  // 添加原始词组（按空格和标点符号拆分）
  const basicTokens = text
    .split(/[\s,.;，。；：！？、""''《》【】()（）\[\]\{\}]/g)
    .filter(token => token.length > 1);

  segments.push(...basicTokens);

  // 去重并返回
  return Array.from(new Set(segments));
}

// 改进分词函数，支持多语言
function tokenize(text: string): string[] {
  // 检测是否包含中文
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);

  if (hasChinese) {
    return segmentChineseWords(text);
  } else {
    // 非中文使用空格分词
    return text.split(/\s+/).filter(token => token.length > 0);
  }
}

// 从文本中提取同义词/相关概念
function extractSynonymsAndRelatedConcepts(text: string): string[] {
  // 常见概念词与同义词映射
  const synonymMap: Record<string, string[]> = {
    '战争': ['冲突', '战事', '军事行动', '军事冲突'],
    '和平': ['休战', '停火', '和解', '协议'],
    '协议': ['条约', '协定', '合同', '备忘录'],
    '经济': ['金融', '财政', '贸易', '商业'],
    '政治': ['政府', '政策', '执政', '施政'],
    '军事': ['国防', '武装', '军队', '军备'],
    '冲突': ['争端', '纠纷', '对立', '矛盾'],
    '危机': ['紧急情况', '险情', '重大挑战'],
    '制裁': ['惩罚', '处罚', '限制', '禁令'],
    '峰会': ['会议', '高层会谈', '首脑会议'],
    '示威': ['抗议', '游行', '集会'],
    '最新': ['最近', '近期', '最新进展', '最新动态'],
    '影响': ['后果', '效应', '结果', '冲击'],
    '背景': ['来龙去脉', '历史背景', '前因后果'],
    // 英文同义词
    'war': ['conflict', 'military action', 'warfare'],
    'peace': ['ceasefire', 'truce', 'armistice'],
    'agreement': ['treaty', 'accord', 'pact', 'deal'],
    'economy': ['financial', 'fiscal', 'trade', 'business'],
    'politics': ['government', 'policy', 'governance'],
    'military': ['defense', 'armed forces', 'troops'],
    'conflict': ['dispute', 'clash', 'confrontation'],
    'crisis': ['emergency', 'critical situation'],
    'sanctions': ['penalties', 'restrictions', 'embargo'],
    'summit': ['conference', 'meeting', 'talks'],
    'protest': ['demonstration', 'rally', 'march'],
    'latest': ['recent', 'newest', 'current', 'update'],
    'impact': ['effect', 'consequence', 'result', 'aftermath'],
    'background': ['context', 'history', 'origin', 'cause']
  };

  const tokens = tokenize(text);
  const synonyms: string[] = [];

  tokens.forEach(token => {
    // 查找同义词
    if (synonymMap[token]) {
      synonyms.push(...synonymMap[token]);
    }
  });

  return synonyms;
}

/**
 * 对查询关键词进行分析和拆分，获得更全面的搜索结果
 * @param originalQuery 原始查询词
 * @returns 拆分后的查询词数组
 */
export function analyzeAndSplitQuery(originalQuery: string): string[] {
  // 基本分词
  const basicTokens = tokenize(originalQuery);

  // 提取同义词和相关概念
  const synonyms = extractSynonymsAndRelatedConcepts(originalQuery);

  // 提取时间信息（年份、月份等）
  const timePatterns = /\b(20\d{2}|19\d{2})年?\b|\b\d{1,2}月\b|\b\d{1,2}日\b/g;
  const timeTokens = originalQuery.match(timePatterns) || [];

  // 提取人名和地点（简单启发式方法）
  const namePatterns = /[\u4e00-\u9fa5]{2,4}(?:总统|总理|主席|部长|官员|领导人)/g;
  const nameTokens = originalQuery.match(namePatterns) || [];

  // 提取可能的事件类型，扩展类型列表
  const eventTypes = [
    '战争', '冲突', '和平', '协议', '会谈', '峰会', '危机', '事件',
    '爆炸', '抗议', '示威', '选举', '政变', '改革', '制裁', '协议',
    '经济', '政治', '外交', '军事', '科技', '文化', '环境', '疫情',
    '谈判', '会议', '签署', '发布', '宣布', '声明', '访问', '演讲',
    'war', 'conflict', 'peace', 'agreement', 'talks', 'summit', 'crisis', 'incident',
    'explosion', 'protest', 'election', 'coup', 'reform', 'sanctions',
    'economic', 'political', 'diplomatic', 'military', 'tech', 'cultural', 'environment', 'pandemic',
    'negotiation', 'meeting', 'signing', 'release', 'announce', 'statement', 'visit', 'speech'
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

  // 添加核心查询 + 同义词/相关概念（选择几个最相关的）
  if (synonyms.length > 0) {
    const topSynonyms = synonyms.slice(0, 3);
    queries.push(`${coreQuery} ${topSynonyms.join(' ')}`);
  }

  // 添加最新进展查询
  queries.push(`${coreQuery} 最新进展`);
  queries.push(`${coreQuery} 最新消息`);
  queries.push(`${coreQuery} latest news`);
  queries.push(`${coreQuery} recent updates`);

  // 添加背景和影响查询
  queries.push(`${coreQuery} 背景`);
  queries.push(`${coreQuery} 影响`);
  queries.push(`${coreQuery} background`);
  queries.push(`${coreQuery} impact`);

  // 去重
  return Array.from(new Set(queries));
}

/**
 * 并行执行多个搜索请求，带有自动重试和超时调整
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

  // 构建搜索批次，避免一次性发送太多请求
  const batchSize = 5; // 每批最多5个请求
  const batches: string[][] = [];

  for (let i = 0; i < queries.length; i += batchSize) {
    batches.push(queries.slice(i, i + batchSize));
  }

  // 所有批次的结果
  const allResults: any[] = [];

  // 分批处理查询
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`处理搜索批次 ${batchIndex + 1}/${batches.length}，包含 ${batch.length} 个查询`);

    // 构建每个查询的搜索函数，包含重试逻辑
    const searchFunctions = batch.map(query => async () => {
      // 重试参数
      const maxRetries = 2;
      const initialTimeout = 15000; // 初始超时15秒

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // 增加超时时间（每次重试增加5秒）
        const timeout = initialTimeout + (attempt * 5000);

        try {
          // 构建请求参数
          // 为每个查询使用最合适的引擎子集
          const engines = determineEnginesForQuery(query, apiConfig.searxng?.engines);

          const payload = {
            query,
            searxngUrl,
            categories: apiConfig.searxng?.categories || 'general',
            language: apiConfig.searxng?.language || 'zh',
            timeRange: apiConfig.searxng?.timeRange || 'year',
            engines: engines,
            numResults: 5, // 每个查询取较少的结果，避免过多重复
            safesearch: 0, // 禁用安全搜索，获取更多结果
            display_error: true, // 获取详细错误信息
            timeout // 动态超时时间
          };

          // 使用中间层API发起搜索请求
          console.log(`执行查询 "${query}" (尝试 ${attempt + 1}/${maxRetries + 1}，超时 ${timeout}ms)`);
          const response = await axios.post('/api/search', payload, { timeout });

          // 返回带有原始查询词的结果
          if (response.data && response.data.results) {
            console.log(`查询 "${query}" 成功，获取到 ${response.data.results.length} 条结果`);
            return {
              ...response.data,
              originalQuery: query // 添加原始查询词字段，用于后续合并
            };
          }

          console.warn(`查询 "${query}" 返回格式不正确:`, response.data);
          return null;
        } catch (error) {
          console.error(`查询 "${query}" 尝试 ${attempt + 1} 失败:`, error);

          // 如果已达到最大重试次数，返回null
          if (attempt === maxRetries) {
            console.error(`查询 "${query}" 在 ${maxRetries + 1} 次尝试后失败`);
            return null;
          }

          // 等待一段时间再重试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return null;
    });

    // 顺序执行批次内的查询，避免并发过多导致被封
    for (const searchFunction of searchFunctions) {
      const result = await searchFunction();
      if (result) {
        allResults.push(result);
      }
    }
  }

  const validResults = allResults.filter(r => r !== null && r.results && r.results.length > 0);

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
 * 根据查询类型和特点确定最合适的搜索引擎集合
 * @param query 查询关键词
 * @param configuredEngines 配置中的引擎列表
 * @returns 为特定查询优化的引擎列表
 */
function determineEnginesForQuery(query: string, configuredEngines?: string[]): string[] | null {
  // 如果已配置特定引擎且不为空，优先使用配置的引擎
  if (configuredEngines && configuredEngines.length > 0) {
    return configuredEngines;
  }

  // 为不同类型的查询推荐不同的引擎集合

  // 新闻类查询
  const newsKeywords = ['最新', '近期', '消息', '新闻', '报道', '通报', '公告',
    '最新进展', '最新消息', 'news', 'latest', 'recent', 'update'];

  // 学术/技术类查询
  const academicKeywords = ['研究', '论文', '学术', '科技', '技术', '报告', '分析',
    'research', 'paper', 'academic', 'technology', 'technical', 'report', 'analysis'];

  // 事实/百科类查询
  const factKeywords = ['是什么', '定义', '介绍', '简介', '百科', '历史', '起源', '背景',
    'what is', 'definition', 'introduction', 'wiki', 'history', 'origin', 'background'];

  // 检查查询类型
  const isNewsQuery = newsKeywords.some(keyword => query.includes(keyword));
  const isAcademicQuery = academicKeywords.some(keyword => query.includes(keyword));
  const isFactQuery = factKeywords.some(keyword => query.includes(keyword));

  // 根据查询类型返回优化的引擎集合
  if (isNewsQuery) {
    return ['google news', 'bing news', 'baidu news', 'duckduckgo news'];
  } else if (isAcademicQuery) {
    return ['google scholar', 'semantic scholar', 'base', 'microsoft academic'];
  } else if (isFactQuery) {
    return ['wikipedia', 'wikidata', 'baidu', 'bing', 'google', 'brave', 'duckduckgo'];
  }

  // 默认返回null，由SearXNG选择引擎
  return null;
}

/**
 * 合并多个搜索结果并进行智能排序和去重
 * @param results 多个搜索结果
 * @param originalQuery 原始查询词
 * @returns 合并后的搜索结果
 */
function mergeSearchResults(results: any[], originalQuery: string): SearxngResult {
  // 用于存储去重后的结果
  const uniqueResults: Record<string, SearxngSearchItem> = {};
  let totalResults = 0;

  // 搜索结果评分因素
  const currentDate = new Date();

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
            fromQuery: result.originalQuery || result.query,
            // 添加内部计算的得分字段用于后续排序
            score: calculateRelevanceScore(item, result.originalQuery || result.query, originalQuery, currentDate)
          };
        } else if (item.url && uniqueResults[item.url]) {
          // 如果结果已存在，更新得分为两者中的较高值
          const existingScore = uniqueResults[item.url].score || 0;
          const newScore = calculateRelevanceScore(item, result.originalQuery || result.query, originalQuery, currentDate);
          if (newScore > existingScore) {
            uniqueResults[item.url].score = newScore;
          }
        }
      });
    }
  });

  // 将唯一结果转换为数组
  const mergedResults = Object.values(uniqueResults);

  // 根据相关性或分数排序
  mergedResults.sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreB - scoreA;
  });

  // 实施domain diversity: 同一域名最多显示3个结果
  const domainCounts: Record<string, number> = {};
  const domainLimitedResults: SearxngSearchItem[] = [];

  for (const result of mergedResults) {
    // 提取域名
    let domain = "";
    try {
      domain = new URL(result.url).hostname;
    } catch (e) {
      // 如果URL无效，使用完整URL作为域名
      domain = result.url;
    }

    // 统计当前域名出现次数
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;

    // 如果当前域名结果少于3个，或者是原始查询的结果，则保留
    if (domainCounts[domain] <= 3 || result.fromQuery === originalQuery) {
      domainLimitedResults.push(result);
    }
  }

  console.log(`合并搜索结果: 原始结果数量 ${totalResults}, 去重后 ${mergedResults.length}, 域名多样化后 ${domainLimitedResults.length}`);

  return {
    query: originalQuery,
    results: domainLimitedResults,
    number_of_results: domainLimitedResults.length
  };
}

/**
 * 计算搜索结果的相关性得分
 * @param item 搜索结果项
 * @param itemQuery 产生该结果的查询
 * @param originalQuery 原始查询
 * @param currentDate 当前日期
 * @returns 相关性得分
 */
function calculateRelevanceScore(
  item: SearxngSearchItem,
  itemQuery: string,
  originalQuery: string,
  currentDate: Date
): number {
  // 基础分数
  let score = item.score || 1;

  // 1. 查询匹配度：来自原始查询的结果得分加成
  if (itemQuery === originalQuery) {
    score *= 1.5;
  }

  // 2. 内容相关性：标题或内容包含原始查询关键词的得分加成
  const originalKeywords = tokenize(originalQuery);
  const titleWords = tokenize(item.title);
  const contentWords = tokenize(item.content);

  let keywordMatches = 0;
  originalKeywords.forEach(keyword => {
    if (titleWords.some(word => word.includes(keyword) || keyword.includes(word))) {
      keywordMatches++;
    } else if (contentWords.some(word => word.includes(keyword) || keyword.includes(word))) {
      keywordMatches += 0.5;
    }
  });

  // 关键词匹配率影响分数
  const keywordMatchRatio = keywordMatches / originalKeywords.length;
  score *= (1 + keywordMatchRatio);

  // 3. 时效性评分：如果有发布日期，较新的内容得分更高
  if (item.publishedDate) {
    try {
      const publishDate = new Date(item.publishedDate);
      const daysDifference = (currentDate.getTime() - publishDate.getTime()) / (1000 * 3600 * 24);

      // 时效性因子：越新的内容分数越高
      // 7天内：最高时效性
      // 30天内：高时效性
      // 90天内：中等时效性
      // 365天内：低时效性
      let timelinessScore;
      if (daysDifference <= 7) {
        timelinessScore = 2.0;
      } else if (daysDifference <= 30) {
        timelinessScore = 1.5;
      } else if (daysDifference <= 90) {
        timelinessScore = 1.2;
      } else if (daysDifference <= 365) {
        timelinessScore = 1.1;
      } else {
        timelinessScore = 1.0;
      }

      score *= timelinessScore;
    } catch (e) {
      // 如果日期解析失败，不应用时效性评分
    }
  }

  // 4. 来源可信度：某些特定来源可能更值得信任
  const trustworthyDomains = [
    'wikipedia.org', 'gov', 'edu', 'un.org', 'who.int', 'bbc.com',
    'nytimes.com', 'reuters.com', 'theguardian.com', 'cnn.com',
    'xinhuanet.com', 'people.com.cn', 'chinadaily.com.cn', 'sina.com.cn'
  ];

  try {
    const domain = new URL(item.url).hostname;
    if (trustworthyDomains.some(trusted => domain.includes(trusted))) {
      score *= 1.3; // 提高可信源的分数
    }
  } catch (e) {
    // URL解析失败，不应用可信度评分
  }

  // 5. 引擎多样性：如果多个引擎都返回了这个结果，可能更相关
  if (item.engines && item.engines.length > 1) {
    score *= (1 + (item.engines.length * 0.1)); // 每多一个引擎增加10%分数
  }

  return score;
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
