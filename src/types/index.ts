export interface ApiConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  allowUserConfig?: boolean; // 是否允许用户在前端配置API设置
  accessPassword?: string; // 访问密码
  searxng?: SearxngConfig; // 添加SearXNG支持
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  people: Person[];
  expanded?: boolean;
  source?: string; // Added source field for tracking message source
}

export interface Person {
  name: string;
  role?: string;
  color?: string;
}

export interface TimelineData {
  events: TimelineEvent[];
  summary?: string;
}

// Added date filter related types
export type DateFilterOption = 'all' | 'month' | 'halfYear' | 'year' | 'custom';

export interface DateFilterConfig {
  option: DateFilterOption;
  startDate?: Date;
  endDate?: Date;
}

// 环境变量配置接口
export interface EnvConfig {
  // 服务器端环境变量
  API_ENDPOINT?: string;
  API_MODEL?: string;
  API_KEY?: string;
  // 客户端环境变量
  NEXT_PUBLIC_API_ENDPOINT?: string;
  NEXT_PUBLIC_API_MODEL?: string;
  NEXT_PUBLIC_API_KEY?: string;
  NEXT_PUBLIC_ALLOW_USER_CONFIG?: string;
  NEXT_PUBLIC_ACCESS_PASSWORD?: string; // 访问密码环境变量
  NEXT_PUBLIC_SEARXNG_URL?: string; // SearXNG服务器URL
  NEXT_PUBLIC_SEARXNG_ENABLED?: string; // 是否启用SearXNG
}

// SearXNG搜索配置
export interface SearxngConfig {
  url: string;
  enabled: boolean;
  categories?: string;
  language?: string;
  timeRange?: string;
  engines?: string[];
  numResults?: number;
}

// SearXNG搜索结果
export interface SearxngResult {
  query: string;
  results: SearxngSearchItem[];
  answers?: string[];
  corrections?: string[];
  infoboxes?: any[];
  suggestions?: string[];
  unresponsive_engines?: string[];
  number_of_results?: number; // 添加这个字段以匹配实际响应
}

export interface SearxngSearchItem {
  title: string;
  url: string;
  content: string;
  engine: string;
  engines?: string[]; // 添加这个字段以匹配实际响应
  positions?: number[]; // 添加这个字段以匹配实际响应
  score?: number;
  category?: string;
  img_src?: string;
  thumbnail?: string; // 添加这个字段以匹配实际响应
  publishedDate?: string;
  template?: string; // 添加这个字段以匹配实际响应
  parsed_url?: string[]; // 添加这个字段以匹配实际响应
  priority?: string; // 添加这个字段以匹配实际响应
  fromQuery?: string; // 添加这个字段用于标识结果来自哪个查询
}
