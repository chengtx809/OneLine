## 一线 (OneLine)

一线是一个热点事件时间轴分析工具，它可以帮助用户快速了解重大事件的发展脉络并提供AI辅助分析。
### [Demo站点](https://oneline.chengtx.me)
![image](https://github.com/user-attachments/assets/6d20acf8-c4a7-4a52-9849-1d526ec50ba7)
![image](https://github.com/user-attachments/assets/1b8adf2c-2223-4ba5-94bd-0c223889fd1b)

## 主要功能

- 根据用户输入的关键词，生成相关历史事件的时间轴
- 显示每个事件的时间、标题、描述和相关人物
- 时间筛选功能，可按不同时间范围筛选事件
- AI分析功能，提供事件的深入背景、过程、影响分析
- 标记事件信息来源，增强可信度
- 集成SearXNG搜索引擎，提供最新信息支持AI分析

## 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui 组件库

## Docker部署
感谢 [@justincnn](https://github.com/justincnn) 佬构建的镜像
```
docker pull justincnn/oneline
```

## 配置

### 前端配置

该应用需要配置外部AI API（如Google Gemini API或OpenAI API）才能正常工作。在使用前，点击右上角的"API设置"按钮，配置以下信息：

- API端点
- 模型名称
- API密钥
- SearXNG搜索引擎（可选）

### 环境变量配置

除了前端配置外，你还可以通过环境变量来配置API设置。这对于部署环境特别有用，可以避免将敏感信息暴露给用户。

1. 复制项目根目录下的`.env.example`文件为`.env.local`
2. 在`.env.local`文件中填入你的配置：

```
# 服务器端环境变量
# API端点配置
API_ENDPOINT=https://api.example.com/v1/chat/completions

# API模型配置
API_MODEL=gemini-2.0-pro-exp-search

# API密钥配置
API_KEY=your_api_key_here

# 是否允许用户在前端配置API设置
# 设置为"false"将禁止用户在前端修改API设置
# 设置为"true"或不设置将允许用户在前端修改API设置
NEXT_PUBLIC_ALLOW_USER_CONFIG=true

# 访问密码配置
# 设置后，用户需要输入正确的密码才能访问API设置
# 这可以避免API被滥用，增强应用安全性
NEXT_PUBLIC_ACCESS_PASSWORD=your_access_password_here

# SearXNG搜索配置（可选）
# SearXNG是一个元搜索引擎，可以聚合多个搜索引擎的结果
# 启用后，AI将获取最新信息以提供更准确的回答
NEXT_PUBLIC_SEARXNG_URL=https://sousuo.emoe.top
NEXT_PUBLIC_SEARXNG_ENABLED=true
```

**注意事项：**

- 环境变量配置的优先级高于前端用户配置
- 当`NEXT_PUBLIC_ALLOW_USER_CONFIG`设置为`false`时，用户将无法在前端修改API设置
- 当设置了`NEXT_PUBLIC_ACCESS_PASSWORD`时，用户需要输入正确的密码才能访问API设置
- 当未设置环境变量时，将使用前端用户配置的设置

### SearXNG 搜索集成

OneLine 现已集成 SearXNG 搜索引擎，可以为 AI 提供最新的信息作为参考，使生成的时间轴和分析更加准确：

1. **什么是 SearXNG**：SearXNG 是一个开源的元搜索引擎，可以汇总多个搜索引擎的结果
2. **如何配置**：在"设置"页面的"搜索设置"标签中启用 SearXNG，并设置 SearXNG 服务器 URL
3. **默认服务器**：应用默认配置了 `https://sousuo.emoe.top` 作为示例 SearXNG 服务器
4. **工作原理**：当启用此功能后，OneLine 会先进行搜索查询，然后将搜索结果提供给 AI 作为参考来源

**注意**：使用 SearXNG 可能会增加 API 请求的 token 数量，但会显著提高 AI 回答的准确性和时效性。

### Vercel 部署注意事项

在 Vercel 上部署时，请确保：

1. 在 Vercel 项目设置中配置环境变量（API_KEY、API_ENDPOINT 等）
2. 不要在 Vercel 项目设置中启用"静态构建"选项

## 友情项目
- [@snailyp](https://github.com/snailyp)大佬的[gemini轮询代理服务](https://github.com/snailyp/gemini-balance) 本项目的Demo站后端API服务也是使用大佬的项目，太强了🤗
