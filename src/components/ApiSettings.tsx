"use client";

import { useState, useEffect } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { SearxngConfig } from '@/types';

interface ApiSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiSettings({ open, onOpenChange }: ApiSettingsProps) {
  const {
    apiConfig,
    updateApiConfig,
    isConfigured,
    allowUserConfig,
    isPasswordProtected,
    isPasswordValidated,
    validatePassword,
    setPasswordValidated,
    hasEnvConfig,
    useEnvConfig,
    setUseEnvConfig
  } = useApi();

  const [endpoint, setEndpoint] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isEnvConfigActive, setIsEnvConfigActive] = useState(false);

  // 可用的搜索引擎分类
  const engineCategories = {
    '通用搜索': ['google', 'bing', 'brave', 'duckduckgo', 'baidu', 'yandex'],
    '新闻': ['google news', 'bing news', 'baidu news', 'duckduckgo news'],
    '学术': ['google scholar', 'semantic scholar', 'base', 'microsoft academic'],
    '百科': ['wikipedia', 'wikidata'],
    '社交媒体': ['reddit', 'twitter', 'youtube']
  };

  // SearXNG配置状态
  const [searxngConfig, setSearxngConfig] = useState<SearxngConfig>({
    url: 'https://sousuo.emoe.top',
    enabled: false,
    categories: 'general',
    language: 'zh',
    timeRange: 'year',
    numResults: 5,
    engines: []
  });

  // 当前选中的设置标签
  const [activeTab, setActiveTab] = useState('api');

  // 确保组件已挂载（客户端渲染）
  useEffect(() => {
    setIsMounted(true);
    // 从localStorage获取是否使用环境变量配置的设置
    if (typeof window !== 'undefined') {
      const storedUseEnvConfig = localStorage.getItem('oneLine_useEnvConfig');
      if (storedUseEnvConfig !== null) {
        const shouldUseEnvConfig = storedUseEnvConfig === 'true';
        setIsEnvConfigActive(shouldUseEnvConfig);
        // 使用函数式更新避免依赖项问题
        if (setUseEnvConfig) {
          setUseEnvConfig(shouldUseEnvConfig);
        }
      }
    }
  }, []); // 移除setUseEnvConfig依赖

  // Update local state when apiConfig changes or dialog opens
  useEffect(() => {
    if (open) {
      // 当对话框打开时，重新同步环境变量选择状态
      const storedUseEnvConfig = localStorage.getItem('oneLine_useEnvConfig');
      const shouldUseEnvConfig = storedUseEnvConfig === 'true';
      if (storedUseEnvConfig !== null) {
        setIsEnvConfigActive(shouldUseEnvConfig);
      } else {
        // 如果没有存储的值，则使用当前的useEnvConfig状态
        setIsEnvConfigActive(useEnvConfig);
      }

      // 根据环境变量配置状态设置输入字段
      if (useEnvConfig && hasEnvConfig) {
        // 如果使用环境变量配置，不显示实际值
        setEndpoint('');
        setModel('');
        setApiKey('');
      } else {
        // 使用用户自定义配置
        setEndpoint(apiConfig.endpoint === "使用环境变量配置" ? "" : apiConfig.endpoint);
        setModel(apiConfig.model === "使用环境变量配置" ? "" : apiConfig.model);
        setApiKey(apiConfig.apiKey === "使用环境变量配置" ? "" : apiConfig.apiKey);
      }

      setPassword('');
      setPasswordError('');
      setError('');

      // 更新效果，初始化SearXNG配置
      if (apiConfig.searxng) {
        setSearxngConfig({
          url: apiConfig.searxng.url || 'https://sousuo.emoe.top',
          enabled: apiConfig.searxng.enabled || false,
          categories: apiConfig.searxng.categories || 'general',
          language: apiConfig.searxng.language || 'zh',
          timeRange: apiConfig.searxng.timeRange || 'year',
          numResults: apiConfig.searxng.numResults || 5,
          engines: apiConfig.searxng.engines || []
        });
      }
    }
  }, [apiConfig, open, useEnvConfig, hasEnvConfig]);

  const handlePasswordSubmit = () => {
    if (!password.trim()) {
      setPasswordError('请输入访问密码');
      return;
    }

    const isValid = validatePassword(password);
    if (isValid) {
      setPasswordError('');
      setPassword('');
    } else {
      setPasswordError('密码错误，请重试');
    }
  };

  const handleToggleEnvConfig = () => {
    try {
      // 切换环境变量配置状态
      const newValue = !isEnvConfigActive;
      setIsEnvConfigActive(newValue);

      // 使用函数式更新，避免依赖项问题
      if (setUseEnvConfig) {
        setUseEnvConfig(newValue);
      }

      // 保存选择到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('oneLine_useEnvConfig', newValue.toString());
        console.log('保存环境变量配置选择到localStorage:', newValue);
      }

      // 清除错误信息
      setError('');
    } catch (err) {
      console.error('切换环境变量配置时出错:', err);
      setError('切换设置时出错，请重试');
    }
  };

  // 引擎选择处理函数
  const handleEngineChange = (engine: string, checked: boolean) => {
    setSearxngConfig(prev => {
      const engines = prev.engines || [];
      if (checked) {
        // 添加引擎
        return { ...prev, engines: [...engines, engine] };
      } else {
        // 移除引擎
        return { ...prev, engines: engines.filter(e => e !== engine) };
      }
    });
  };

  // 选择引擎类别中的所有引擎
  const selectCategoryEngines = (category: string, checked: boolean) => {
    const categoryEngines = engineCategories[category as keyof typeof engineCategories] || [];
    setSearxngConfig(prev => {
      const currentEngines = prev.engines || [];
      if (checked) {
        // 添加类别中所有尚未选择的引擎
        const newEngines = [...currentEngines];
        categoryEngines.forEach(engine => {
          if (!newEngines.includes(engine)) {
            newEngines.push(engine);
          }
        });
        return { ...prev, engines: newEngines };
      } else {
        // 移除该类别中的所有引擎
        return {
          ...prev,
          engines: currentEngines.filter(engine => !categoryEngines.includes(engine))
        };
      }
    });
  };

  // 检查类别中的引擎是否全部被选中
  const isCategorySelected = (category: string) => {
    const engines = searxngConfig.engines || [];
    const categoryEngines = engineCategories[category as keyof typeof engineCategories] || [];
    return categoryEngines.every(engine => engines.includes(engine));
  };

  // 检查类别中是否有部分引擎被选中
  const isCategoryIndeterminate = (category: string) => {
    const engines = searxngConfig.engines || [];
    const categoryEngines = engineCategories[category as keyof typeof engineCategories] || [];
    const hasSelected = categoryEngines.some(engine => engines.includes(engine));
    return hasSelected && !isCategorySelected(category);
  };

  // 更新SearXNG配置
  const handleSearxngChange = (key: keyof SearxngConfig, value: string | boolean | number | string[]) => {
    setSearxngConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 测试SearXNG连接
  const testSearxngConnection = async () => {
    if (!searxngConfig.url) {
      setError('SearXNG URL不能为空');
      return;
    }

    try {
      setError('正在测试连接...');

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'test',
          searxngUrl: searxngConfig.url
        }),
      });

      if (response.ok) {
        setError('SearXNG连接测试成功！');
        setTimeout(() => setError(''), 3000);
      } else {
        const data = await response.json();
        setError(`SearXNG连接测试失败: ${data.message || '未知错误'}`);
      }
    } catch (err) {
      setError(`SearXNG连接测试失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  // 更新保存函数以包含SearXNG配置
  const handleSave = () => {
    // 如果不允许用户配置，则直接关闭对话框
    if (!allowUserConfig) {
      onOpenChange(false);
      return;
    }

    // 如果使用环境变量配置，则直接关闭对话框
    if (isEnvConfigActive && hasEnvConfig) {
      // 只更新SearXNG配置，保留环境变量配置
      updateApiConfig({
        searxng: searxngConfig
      });
      onOpenChange(false);
      return;
    }

    // Validate inputs
    if (!endpoint.trim()) {
      setError('API端点不能为空');
      return;
    }

    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      setError('API端点需要以http://或https://开头');
      return;
    }

    if (!model.trim()) {
      setError('模型名称不能为空');
      return;
    }

    if (!apiKey.trim()) {
      setError('API密钥不能为空');
      return;
    }

    // 验证SearXNG URL（如果启用）
    if (searxngConfig.enabled && !searxngConfig.url) {
      setActiveTab('searxng');
      setError('SearXNG URL不能为空');
      return;
    }

    // Clear any previous errors
    setError('');

    // Update API config with all settings
    updateApiConfig({
      endpoint: endpoint.trim(),
      model: model.trim(),
      apiKey: apiKey.trim(),
      searxng: searxngConfig
    });

    // Close dialog
    onOpenChange(false);
  };

  // 重置密码验证状态
  const handleResetPasswordValidation = () => {
    if (isMounted) {
      setPasswordValidated(false);
      setPassword('');
    }
  };

  // 如果组件未挂载（服务器端渲染），返回基本对话框
  if (!isMounted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md backdrop-blur-lg bg-background/90 border border-border/30 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle>API 设置</DialogTitle>
            <DialogDescription>
              加载中...
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>正在加载设置界面，请稍候...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md backdrop-blur-lg bg-background/90 border border-border/30 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>
            {isPasswordProtected && !isPasswordValidated
              ? '请输入访问密码以继续'
              : allowUserConfig
                ? '配置API和搜索设置'
                : '当前使用环境变量配置，可以配置SearXNG搜索'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 密码验证界面 */}
          {isPasswordProtected && !isPasswordValidated ? (
            <>
              <div className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50 mb-2">
                此应用受密码保护，请输入访问密码以继续使用。
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="password" className="sm:text-right">
                  访问密码
                </Label>
                <div className="sm:col-span-3">
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入访问密码"
                    type="password"
                    className="rounded-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  />
                  {passwordError && (
                    <div className="text-sm text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                      {passwordError}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="sm:order-1 rounded-full">
                  取消
                </Button>
                <Button type="button" onClick={handlePasswordSubmit} className="sm:order-2 rounded-full">
                  验证
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {/* 设置界面使用Tabs分开API设置和SearXNG设置 */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="api" className="flex-1">API设置</TabsTrigger>
                  <TabsTrigger value="searxng" className="flex-1">搜索设置</TabsTrigger>
                </TabsList>

                {/* API设置标签页 */}
                <TabsContent value="api" className="mt-4">
                  {!allowUserConfig ? (
                    <div className="text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
                      管理员已通过环境变量配置API设置，不允许用户修改。如需更改，请联系管理员。
                    </div>
                  ) : (
                    <>
                      {/* 环境变量配置选项 - 仅当存在环境变量配置时显示 */}
                      {hasEnvConfig && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                          <div className="flex flex-col">
                            <label htmlFor="use-env-config" className="font-medium text-blue-800 dark:text-blue-200">
                              使用环境变量中的API配置
                            </label>
                            <span className="text-sm text-blue-600 dark:text-blue-300">
                              推荐选择此选项，无需手动填写API配置
                            </span>
                          </div>
                          <Switch
                            id="use-env-config"
                            checked={isEnvConfigActive}
                            onCheckedChange={handleToggleEnvConfig}
                          />
                        </div>
                      )}

                      {/* 用户自定义API配置区域 - 仅当不使用环境变量或没有环境变量配置时启用 */}
                      <div className={isEnvConfigActive && hasEnvConfig ? "opacity-50" : ""}>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4 mt-2">
                          <Label htmlFor="endpoint" className="sm:text-right">
                            API端点
                          </Label>
                          <Input
                            id="endpoint"
                            value={endpoint}
                            onChange={(e) => setEndpoint(e.target.value)}
                            placeholder="例如: https://example.com/v1/chat/completions"
                            className="sm:col-span-3 rounded-lg"
                            disabled={!allowUserConfig || (isEnvConfigActive && hasEnvConfig)}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4 mt-2">
                          <Label htmlFor="model" className="sm:text-right">
                            模型名称
                          </Label>
                          <Input
                            id="model"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="例如: gemini-2.0-pro-exp-search"
                            className="sm:col-span-3 rounded-lg"
                            disabled={!allowUserConfig || (isEnvConfigActive && hasEnvConfig)}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4 mt-2">
                          <Label htmlFor="api-key" className="sm:text-right">
                            API密钥
                          </Label>
                          <Input
                            id="api-key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="请输入API密钥"
                            type="password"
                            className="sm:col-span-3 rounded-lg"
                            disabled={!allowUserConfig || (isEnvConfigActive && hasEnvConfig)}
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      {/* 使用环境变量API时的说明 */}
                      {isEnvConfigActive && hasEnvConfig && (
                        <div className="text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-3 rounded-lg border border-green-200 dark:border-green-800/50 mt-4">
                          <p className="font-medium">已启用环境变量API配置</p>
                          <p className="mt-1">系统将使用服务器端配置的API信息，您无需手动填写。</p>
                          <p className="mt-1">此选项的配置已保存到本地，下次访问将自动使用。</p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* SearXNG搜索设置标签页 */}
                <TabsContent value="searxng" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                      <div className="flex flex-col">
                        <label htmlFor="enable-searxng" className="font-medium text-blue-800 dark:text-blue-200">
                          启用SearXNG搜索
                        </label>
                        <span className="text-sm text-blue-600 dark:text-blue-300">
                          使用SearXNG引擎获取最新信息
                        </span>
                      </div>
                      <Switch
                        id="enable-searxng"
                        checked={searxngConfig.enabled}
                        onCheckedChange={(checked) => handleSearxngChange('enabled', checked)}
                      />
                    </div>

                    <div className={!searxngConfig.enabled ? "opacity-50" : ""}>
                      <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4 mt-2">
                        <Label htmlFor="searxng-url" className="sm:text-right">
                          SearXNG URL
                        </Label>
                        <div className="sm:col-span-3">
                          <Input
                            id="searxng-url"
                            value={searxngConfig.url}
                            onChange={(e) => handleSearxngChange('url', e.target.value)}
                            placeholder="例如: https://sousuo.emoe.top"
                            className="rounded-lg mb-2"
                            disabled={!searxngConfig.enabled}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={testSearxngConnection}
                            disabled={!searxngConfig.enabled || !searxngConfig.url}
                            className="w-full rounded-full"
                          >
                            测试连接
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4 mt-2">
                        <Label htmlFor="searxng-categories" className="sm:text-right">
                          搜索分类
                        </Label>
                        <Input
                          id="searxng-categories"
                          value={searxngConfig.categories}
                          onChange={(e) => handleSearxngChange('categories', e.target.value)}
                          placeholder="例如: general,news"
                          className="sm:col-span-3 rounded-lg"
                          disabled={!searxngConfig.enabled}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4 mt-2">
                        <Label htmlFor="searxng-language" className="sm:text-right">
                          搜索语言
                        </Label>
                        <Input
                          id="searxng-language"
                          value={searxngConfig.language}
                          onChange={(e) => handleSearxngChange('language', e.target.value)}
                          placeholder="例如: zh"
                          className="sm:col-span-3 rounded-lg"
                          disabled={!searxngConfig.enabled}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4 mt-2">
                        <Label htmlFor="searxng-time-range" className="sm:text-right">
                          时间范围
                        </Label>
                        <Input
                          id="searxng-time-range"
                          value={searxngConfig.timeRange}
                          onChange={(e) => handleSearxngChange('timeRange', e.target.value)}
                          placeholder="例如: year, month, week"
                          className="sm:col-span-3 rounded-lg"
                          disabled={!searxngConfig.enabled}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4 mt-2">
                        <Label htmlFor="searxng-num-results" className="sm:text-right">
                          结果数量
                        </Label>
                        <Input
                          id="searxng-num-results"
                          type="number"
                          min="1"
                          max="20"
                          value={searxngConfig.numResults}
                          onChange={(e) => handleSearxngChange('numResults', parseInt(e.target.value) || 5)}
                          placeholder="例如: 5"
                          className="sm:col-span-3 rounded-lg"
                          disabled={!searxngConfig.enabled}
                        />
                      </div>

                      {/* 搜索引擎选择部分 */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-top gap-2 sm:gap-4 mt-4">
                        <Label className="sm:text-right mt-2">
                          搜索引擎选择
                        </Label>
                        <div className="sm:col-span-3">
                          <div className="text-sm mb-2">选择要使用的搜索引擎，不选择则使用默认引擎</div>
                          <ScrollArea className="h-[200px] rounded-md border p-4">
                            <div className="space-y-4">
                              {/* 按分类组织引擎选项 */}
                              {Object.keys(engineCategories).map((category) => (
                                <div key={category} className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`category-${category}`}
                                      checked={isCategorySelected(category)}
                                      onCheckedChange={(checked) =>
                                        selectCategoryEngines(category, checked === true)
                                      }
                                      disabled={!searxngConfig.enabled}
                                    />
                                    <label
                                      htmlFor={`category-${category}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {category}
                                    </label>
                                  </div>
                                  <div className="ml-6 space-y-1">
                                    {engineCategories[category as keyof typeof engineCategories].map((engine) => (
                                      <div key={engine} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`engine-${engine}`}
                                          checked={(searxngConfig.engines || []).includes(engine)}
                                          onCheckedChange={(checked) =>
                                            handleEngineChange(engine, checked === true)
                                          }
                                          disabled={!searxngConfig.enabled}
                                        />
                                        <label
                                          htmlFor={`engine-${engine}`}
                                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                          {engine}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <div className="mt-2 text-xs text-muted-foreground">
                            提示: 选择特定引擎可提高搜索针对性，但可能降低结果覆盖面
                          </div>
                        </div>
                      </div>
                    </div>

                    {!searxngConfig.enabled && (
                      <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50 mt-2">
                        启用SearXNG搜索可以让AI获取最新的信息，提供更准确的回答。
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <div className={`text-sm mt-4 text-center p-2 rounded-lg ${
                  error.includes('成功')
                    ? 'text-green-500 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
                    : 'text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'
                }`}>
                  {error}
                </div>
              )}

              {/* 如果已验证密码，显示重置密码验证的选项 */}
              {isPasswordProtected && isPasswordValidated && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetPasswordValidation}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    重置密码验证
                  </Button>
                </div>
              )}

              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="sm:order-1 rounded-full">
                  关闭
                </Button>
                <Button type="button" onClick={handleSave} className="sm:order-2 rounded-full">
                  保存
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
