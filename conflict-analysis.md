# dev分支与main分支冲突分析与解决方案

## 冲突文件概览

在尝试将main分支合并到dev分支时，发现了以下冲突文件：

1. `package.json`
2. `bun.lock`
3. `src/components/ApiSettings.tsx`
4. `src/contexts/ApiContext.tsx`
5. `src/lib/api.ts`

此外，dev分支中新增了以下文件，这些文件在main分支中不存在：

1. `src/app/api/search/route.ts`
2. `src/components/ui/tabs.tsx`
3. `src/lib/searchEnhancer.ts`

还有一些文件在两个分支中都有修改，但没有冲突：

1. `.env.example`
2. `src/lib/env.ts`
3. `src/types/index.ts`

## 冲突分析

### 1. package.json 冲突

冲突原因：dev分支添加了 `@radix-ui/react-tabs` 依赖，而main分支中没有。

```json
<<<<<<< ours
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.1.4",
||||||| base
=======
    "@radix-ui/react-switch": "^1.0.3",
>>>>>>> theirs
```

解决方案：保留dev分支中的变更，因为这个包是新增的SearXNG搜索功能所需的UI组件。

### 2. bun.lock 冲突

冲突原因：由于package.json的依赖变化，bun.lock文件也相应发生了变化。

```
<<<<<<< ours
        "@radix-ui/react-switch": "^1.0.3",
        "@radix-ui/react-tabs": "^1.1.4",
||||||| base
=======
        "@radix-ui/react-switch": "^1.0.3",
>>>>>>> theirs
```

解决方案：保留dev分支的bun.lock文件，或者合并后重新运行 `bun install` 生成新的lock文件。

### 3. src/components/ApiSettings.tsx 冲突

冲突原因：dev分支引入了tabs组件和SearxngConfig类型，而main分支没有。

```jsx
<<<<<<< ours
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SearxngConfig } from '@/types';
||||||| base
=======
import { Switch } from '@/components/ui/switch'; // 导入开关组件
>>>>>>> theirs
```

解决方案：保留dev分支的导入语句，因为这些组件和类型在SearXNG搜索功能中需要使用。

### 4. src/contexts/ApiContext.tsx 冲突

冲突原因：dev分支引入了新的类型定义和环境变量获取函数，与main分支有差异。

```jsx
<<<<<<< ours
import type { ApiConfig, SearxngConfig } from '@/types';
import { getEnvApiEndpoint, getEnvApiKey, getEnvApiModel, isUserConfigAllowed, getEnvAccessPassword, getEnvConfigStatus, getEnvSearxngUrl, getEnvSearxngEnabled } from '@/lib/env';
||||||| base
import type { ApiConfig } from '@/types';
import { getEnvApiEndpoint, getEnvApiKey, getEnvApiModel, isUserConfigAllowed, getEnvAccessPassword } from '@/lib/env';
=======
import type { ApiConfig } from '@/types';
import { getEnvApiEndpoint, getEnvApiKey, getEnvApiModel, isUserConfigAllowed, getEnvAccessPassword, getEnvConfigStatus } from '@/lib/env';
>>>>>>> theirs
```

解决方案：保留dev分支的导入语句，它包含了SearxngConfig类型和两个新的环境变量函数，这些都是SearXNG功能所需的。

### 5. src/lib/api.ts 冲突

冲突原因：api.ts文件在两个分支中都有修改，但具体冲突内容需要仔细审查。

解决方案：需要手动合并两个分支的变更，保留所有功能，尤其是与SearXNG相关的代码。

## 合并策略

根据冲突分析，推荐以下合并策略：

1. 对于所有涉及SearXNG功能的冲突，优先保留dev分支的代码，因为这是新功能。
2. 对于其他冲突，需要逐个检查并确保合并后的代码能正确工作。
3. 合并后进行测试，确保原有功能和新功能都正常运行。

## 具体操作步骤

1. 在dev分支上，执行合并操作：
   ```bash
   git checkout dev
   git merge main
   ```

2. 对每个冲突文件逐一解决：
   - 保留dev分支中的 `@radix-ui/react-tabs` 依赖
   - 对于bun.lock，可以选择自动解决或手动编辑
   - 保留所有与SearXNG相关的导入和代码变更

3. 解决冲突后，提交合并：
   ```bash
   git add .
   git commit -m "Merge main into dev, resolving conflicts"
   ```

4. 测试合并后的代码，确保功能正常。

5. 将解决冲突后的dev分支推送到远程：
   ```bash
   git push origin dev
   ```
