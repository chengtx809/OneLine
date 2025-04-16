## 一线 (OneLine)

一线是一个热点事件时间轴分析工具，它可以帮助用户快速了解重大事件的发展脉络并提供AI辅助分析。[Demo站点](https://oneline.chengtx.me)
![image](https://github.com/user-attachments/assets/a16f198f-ee6d-4c6b-b212-00f212641cf0)

## 主要功能

- 根据用户输入的关键词，生成相关历史事件的时间轴
- 显示每个事件的时间、标题、描述和相关人物
- 时间筛选功能，可按不同时间范围筛选事件
- AI分析功能，提供事件的深入背景、过程、影响分析
- 标记事件信息来源，增强可信度

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

### 环境变量配置

除了前端配置外，你还可以通过环境变量来配置API设置。这对于部署环境特别有用，可以避免将敏感信息暴露给用户。

1. 复制项目根目录下的`.env.example`文件为`.env.local`
2. 在`.env.local`文件中填入你的配置：

```
# 服务器端环境变量（更安全，推荐使用）
# API端点配置
API_ENDPOINT=https://api.example.com/v1/chat/completions

# API模型配置
API_MODEL=gemini-2.0-pro-exp-search

# API密钥配置
API_KEY=your_api_key_here

# 客户端环境变量（会暴露给前端，不推荐存储敏感信息）
# API端点配置
NEXT_PUBLIC_API_ENDPOINT=https://api.example.com/v1/chat/completions

# API模型配置
NEXT_PUBLIC_API_MODEL=gemini-2.0-pro-exp-search

# API密钥配置（出于安全考虑，推荐使用服务器端 API_KEY）
NEXT_PUBLIC_API_KEY=your_api_key_here

# 是否允许用户在前端配置API设置
# 设置为"false"将禁止用户在前端修改API设置
# 设置为"true"或不设置将允许用户在前端修改API设置
NEXT_PUBLIC_ALLOW_USER_CONFIG=true

# 访问密码配置
# 设置后，用户需要输入正确的密码才能访问API设置
# 这可以避免API被滥用，增强应用安全性
NEXT_PUBLIC_ACCESS_PASSWORD=your_access_password_here
```

**注意事项：**

- 环境变量配置的优先级高于前端用户配置
- 服务器端环境变量（没有 NEXT_PUBLIC 前缀）更安全，不会暴露给前端
- 当`NEXT_PUBLIC_ALLOW_USER_CONFIG`设置为`false`时，用户将无法在前端修改API设置
- 当设置了`NEXT_PUBLIC_ACCESS_PASSWORD`时，用户需要输入正确的密码才能访问API设置
- 当未设置环境变量时，将使用前端用户配置的设置

## API 中间层

从版本 0.2.0 开始，OneLine 引入了 API 中间层机制，解决以下问题：

1. **CORS 错误**：避免前端直接调用外部 API 时可能遇到的跨域问题
2. **API 密钥安全**：API 密钥不再在前端暴露，而是安全地存储在服务器端
3. **网络错误处理**：提供更好的错误处理和重试机制

使用此版本，你需要将项目部署为服务器端渲染应用（SSR），而不是静态站点，以便使用 API Routes 功能。

### Vercel 部署注意事项

在 Vercel 上部署时，请确保：

1. 在 Vercel 项目设置中配置环境变量（API_KEY、API_ENDPOINT 等）
2. 不要在 Vercel 项目设置中启用"静态构建"选项

## 友情项目
- [@snailyp](https://github.com/snailyp)大佬的[gemini轮询代理服务](https://github.com/snailyp/gemini-balance) 本项目的Demo站后端API服务也是使用大佬的项目，太强了🤗
