import axios from 'axios';
import { type ApiConfig, type TimelineData, TimelineEvent, type Person } from '@/types';

// 修改系统提示，使用分段文本格式而不是JSON
const SYSTEM_PROMPT = `
你是一个专业的历史事件分析助手。我需要你将热点事件以时间轴的方式呈现。
请按照以下格式返回数据（使用文本分段格式，不要使用JSON）：

===总结===
对整个事件的简短总结

===事件列表===

--事件1--
日期：事件发生日期，格式为YYYY-MM-DD，如果只知道月份则为YYYY-MM，如果只知道年份则为YYYY
标题：事件标题
描述：事件详细描述
相关人物：人物1(角色1,#颜色代码1);人物2(角色2,#颜色代码2)
来源：事件信息来源，如新闻媒体、官方公告、研究报告等

--事件2--
日期：...
标题：...
描述：...
相关人物：...
来源：...

... 更多事件 ...

请确保：
1. 按时间先后顺序组织事件（从最早到最近）
2. 为每个相关人物分配不同的颜色代码，让用户能够轻松识别不同人物的动向
3. 同一立场的人物使用相似的颜色
4. 尽可能客观描述各方观点和行为
5. 为每个事件标注可能的信息来源
6. 严格按照上述格式返回，不要添加其他格式
`;

// 解析文本响应，转换为TimelineData格式
function parseTimelineText(text: string): TimelineData {
  try {
    const result: TimelineData = {
      events: [],
      summary: ""
    };

    // 提取总结部分
    const summaryMatch = text.match(/===总结===\s*([\s\S]*?)(?=\s*===事件列表===|$)/);
    if (summaryMatch?.[1]) {
      result.summary = summaryMatch[1].trim();
    }

    // 提取事件列表
    const eventsMatch = text.match(/===事件列表===\s*([\s\S]*?)(?=$)/);
    if (eventsMatch?.[1]) {
      const eventsText = eventsMatch[1].trim();
      const eventBlocks = eventsText.split(/\s*--事件\d+--\s*/).filter(block => block.trim().length > 0);

      result.events = eventBlocks.map((block, index) => {
        // 提取日期
        const dateMatch = block.match(/日期：\s*(.*?)(?=\s*标题：|$)/);
        const date = dateMatch?.[1]?.trim() || "";

        // 提取标题
        const titleMatch = block.match(/标题：\s*(.*?)(?=\s*描述：|$)/);
        const title = titleMatch?.[1]?.trim() || "";

        // 提取描述
        const descMatch = block.match(/描述：\s*(.*?)(?=\s*相关人物：|$)/);
        const description = descMatch?.[1]?.trim() || "";

        // 提取相关人物
        const peopleMatch = block.match(/相关人物：\s*(.*?)(?=\s*来源：|$)/);
        const peopleText = peopleMatch?.[1]?.trim() || "";
        const people: Person[] = [];

        if (peopleText) {
          const personEntries = peopleText.split(';').map(p => p.trim()).filter(p => p.length > 0);

          // 使用for...of替代forEach
          for (const personEntry of personEntries) {
            // 格式：人物名(角色,#颜色)
            const personMatch = personEntry.match(/(.*?)\((.*?),(.*?)\)/);
            if (personMatch) {
              people.push({
                name: personMatch[1].trim(),
                role: personMatch[2].trim(),
                color: personMatch[3].trim()
              });
            } else {
              // 防止格式不完整，至少提取人名
              const simpleName = personEntry.split('(')[0].trim();
              if (simpleName) {
                // 使用随机颜色
                const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
                people.push({
                  name: simpleName,
                  role: "相关人物",
                  color: randomColor
                });
              }
            }
          }
        }

        // 提取来源
        const sourceMatch = block.match(/来源：\s*(.*?)(?=\s*--事件|$)/);
        const source = sourceMatch?.[1]?.trim() || "未指明来源";

        // 创建事件对象
        return {
          id: `event-${index}`,
          date,
          title,
          description,
          people,
          source
        };
      });

      // 按日期排序（从早到晚）
      result.events.sort((a, b) => {
        const dateA = a.date.replace(/\D/g, ''); // 移除非数字字符
        const dateB = b.date.replace(/\D/g, '');
        return dateA.localeCompare(dateB);
      });
    }

    return result;
  } catch (error) {
    console.error("解析文本响应失败:", error);
    return { events: [] };
  }
}

// 获取API地址，优先使用相对路径调用中间层
function getApiUrl(apiConfig: ApiConfig, endpoint = 'chat'): string {
  // 根据不同的端点返回不同的 API 路径
  return `/api/${endpoint}`;
}

export async function fetchTimelineData(
  query: string,
  apiConfig: ApiConfig
): Promise<TimelineData> {
  try {
    const { model, endpoint, apiKey } = apiConfig;
    // 使用中间层API端点
    const apiUrl = getApiUrl(apiConfig, 'chat');

    const payload = {
      model: model,
      endpoint: endpoint, // 传递endpoint给后端
      apiKey: apiKey, // 传递apiKey给后端
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `请为以下事件创建时间轴：${query}` }
      ],
      temperature: 0.7
    };

    const headers = {
      'Content-Type': 'application/json'
    };

    // 检查是否是使用环境变量配置
    const isUsingEnvConfig =
      model === "使用环境变量配置" ||
      endpoint === "使用环境变量配置" ||
      apiKey === "使用环境变量配置";

    console.log('发送请求到服务器:', {
      使用环境变量: isUsingEnvConfig,
      端点: apiUrl,
      模型: model
    });

    const response = await axios.post(apiUrl, payload, { headers });

    // 提取AI响应内容
    const content = response.data.choices[0].message.content;

    // 解析文本响应
    return parseTimelineText(content);
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

export async function fetchEventDetails(
  eventId: string,
  query: string,
  apiConfig: ApiConfig
): Promise<string> {
  try {
    const { model, endpoint, apiKey } = apiConfig;
    // 使用新的 event-details 端点
    const apiUrl = getApiUrl(apiConfig, 'event-details');

    const payload = {
      model: model,
      endpoint: endpoint, // 传递endpoint给后端
      apiKey: apiKey, // 传递apiKey给后端
      messages: [
        {
          role: "system",
          content: `你是一个专业的历史事件分析助手，专长于提供详细的事件分析和背景信息。
请按照以下格式回答用户询问的特定事件：

===背景===
事件的背景和前因

===详细内容===
事件的主要内容，按时间顺序或重要性组织

===参与方===
事件的主要参与者、相关人物及其立场和作用

===影响===
事件的短期和长期影响

===相关事实===
与事件相关的重要事实或数据

请注意：
1. 使用清晰的段落结构，避免过长的段落
2. 保持客观中立的叙述，多角度展示事件
3. 支持使用Markdown语法增强可读性：
   - **粗体** 用于强调重要内容
   - *斜体* 用于引用或细微强调
   - 使用换行符增加可读性
4. 回答应全面但精炼，突出重点，避免冗余`
        },
        { role: "user", content: `请详细分析以下事件的背景、过程、影响及各方观点：${query}` }
      ],
      temperature: 0.7
    };

    const headers = {
      'Content-Type': 'application/json'
    };

    // 检查是否是使用环境变量配置
    const isUsingEnvConfig =
      model === "使用环境变量配置" ||
      endpoint === "使用环境变量配置" ||
      apiKey === "使用环境变量配置";

    console.log('发送事件详情请求到服务器:', {
      使用环境变量: isUsingEnvConfig,
      端点: apiUrl,
      模型: model
    });

    const response = await axios.post(apiUrl, payload, { headers });

    // 提取内容
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}
