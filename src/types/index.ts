export interface ApiConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  allowUserConfig?: boolean; // 是否允许用户在前端配置API设置
  accessPassword?: string; // 访问密码
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
}
