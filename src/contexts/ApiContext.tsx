"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { ApiConfig } from '@/types';
import { getEnvApiEndpoint, getEnvApiKey, getEnvApiModel, isUserConfigAllowed, getEnvAccessPassword, getEnvConfigStatus } from '@/lib/env';

interface ApiContextType {
  apiConfig: ApiConfig;
  updateApiConfig: (config: Partial<ApiConfig>) => void;
  isConfigured: boolean;
  allowUserConfig: boolean;
  isPasswordProtected: boolean;
  validatePassword: (password: string) => boolean;
  isPasswordValidated: boolean;
  setPasswordValidated: (validated: boolean) => void;
  hasEnvConfig: boolean; // 新增：是否存在环境变量配置
  useEnvConfig: boolean; // 新增：是否使用环境变量配置
  setUseEnvConfig: (use: boolean) => void; // 新增：设置是否使用环境变量配置
}

const defaultApiConfig: ApiConfig = {
  endpoint: '',
  model: 'gemini-2.0-flash-exp-search',
  apiKey: '',
  allowUserConfig: true,
  accessPassword: '',
};

// 创建默认上下文值，避免服务器端渲染问题
const ApiContext = createContext<ApiContextType>({
  apiConfig: defaultApiConfig,
  updateApiConfig: () => {},
  isConfigured: false,
  allowUserConfig: true,
  isPasswordProtected: false,
  validatePassword: () => false,
  isPasswordValidated: false,
  setPasswordValidated: () => {},
  hasEnvConfig: false,
  useEnvConfig: false,
  setUseEnvConfig: () => {},
});

export const useApi = () => useContext(ApiContext);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [apiConfig, setApiConfig] = useState<ApiConfig>(defaultApiConfig);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [allowUserConfig, setAllowUserConfig] = useState<boolean>(true);
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
  const [isPasswordValidated, setIsPasswordValidated] = useState<boolean>(false);
  const [hasEnvConfig, setHasEnvConfig] = useState<boolean>(false); // 新增：是否存在环境变量配置
  const [useEnvConfig, setUseEnvConfig] = useState<boolean>(false); // 新增：是否使用环境变量配置
  const [userConfig, setUserConfig] = useState<ApiConfig | null>(null); // 新增：用户自定义配置

  // 初始化API配置，优先使用环境变量，然后是localStorage
  useEffect(() => {
    try {
      // 检查是否允许用户配置
      const userConfigAllowed = isUserConfigAllowed();
      setAllowUserConfig(userConfigAllowed);

      // 获取环境变量配置
      const envEndpoint = getEnvApiEndpoint();
      const envModel = getEnvApiModel();
      const envApiKey = getEnvApiKey();
      const envAccessPassword = getEnvAccessPassword();

      // 使用新函数getEnvConfigStatus来获取环境变量配置状态
      const hasServerConfig = getEnvConfigStatus();
      setHasEnvConfig(hasServerConfig);

      console.log('初始化API上下文 - 环境变量检测:', {
        hasServerConfig,
        envEndpoint: envEndpoint ? '已设置' : '未设置',
        envApiKey: envApiKey ? '已设置' : '未设置',
        isClientSide: typeof window !== 'undefined',
        envConfigStatus: process.env.NEXT_PUBLIC_HAS_SERVER_CONFIG
      });

      // 设置是否启用密码保护
      setIsPasswordProtected(!!envAccessPassword);

      // 如果没有设置访问密码，则认为已通过验证
      if (!envAccessPassword) {
        setIsPasswordValidated(true);
      } else if (typeof window !== 'undefined') {
        // 只在客户端检查localStorage
        const passwordValidated = localStorage.getItem('oneLine_passwordValidated');
        setIsPasswordValidated(passwordValidated === 'true');
      }

      // 初始化配置对象
      let initialConfig: ApiConfig = { ...defaultApiConfig };

      // 客户端存储的配置
      let storedUserConfig: ApiConfig | null = null;

      // 是否使用环境变量配置
      let shouldUseEnvConfig = hasServerConfig;

      // 如果允许用户配置，尝试从localStorage加载
      if (userConfigAllowed && typeof window !== 'undefined') {
        // 加载用户保存的配置
        const storedConfig = localStorage.getItem('oneLine_apiConfig');
        if (storedConfig) {
          try {
            const parsedConfig = JSON.parse(storedConfig);
            storedUserConfig = {
              endpoint: parsedConfig.endpoint || '',
              model: parsedConfig.model || defaultApiConfig.model,
              apiKey: parsedConfig.apiKey || '',
              allowUserConfig: userConfigAllowed,
              accessPassword: envAccessPassword || '',
            };
          } catch (e) {
            console.error('Failed to parse stored config:', e);
          }
        }

        // 加载用户的选择（是否使用环境变量配置）
        const storedUseEnvConfig = localStorage.getItem('oneLine_useEnvConfig');
        if (storedUseEnvConfig !== null) {
          shouldUseEnvConfig = storedUseEnvConfig === 'true';
        }
      }

      setUseEnvConfig(shouldUseEnvConfig);

      // 保存用户配置，以备切换
      if (storedUserConfig) {
        setUserConfig(storedUserConfig);
      }

      // 根据当前选择设置使用的配置
      if (shouldUseEnvConfig && hasServerConfig) {
        // 使用环境变量配置，但不暴露具体值到前端
        initialConfig = {
          endpoint: "使用环境变量配置",
          model: "使用环境变量配置",
          apiKey: "使用环境变量配置",
          allowUserConfig: userConfigAllowed,
          accessPassword: envAccessPassword || '',
        };
        setIsConfigured(true); // 环境变量配置被视为已配置
      } else if (storedUserConfig) {
        // 使用用户自定义配置
        initialConfig = storedUserConfig;
        setIsConfigured(!!storedUserConfig.endpoint && !!storedUserConfig.apiKey);
      } else {
        // 没有任何配置
        initialConfig.allowUserConfig = userConfigAllowed;
        if (envAccessPassword) initialConfig.accessPassword = envAccessPassword;
        setIsConfigured(false);
      }

      // 更新状态
      setApiConfig(initialConfig);
    } catch (error) {
      console.error('Failed to initialize API config:', error);
    }
  }, []);

  // 更新是否使用环境变量配置
  const handleUseEnvConfig = (use: boolean) => {
    setUseEnvConfig(use);

    // 保存用户选择到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('oneLine_useEnvConfig', use.toString());
    }

    if (use && hasEnvConfig) {
      // 切换到环境变量配置，但不显示具体信息
      setApiConfig(prev => ({
        ...prev,
        endpoint: "使用环境变量配置",
        model: "使用环境变量配置",
        apiKey: "使用环境变量配置",
      }));
      setIsConfigured(true);
    } else if (!use && userConfig) {
      // 切换到用户自定义配置
      setApiConfig(userConfig);
      setIsConfigured(!!userConfig.endpoint && !!userConfig.apiKey);
    }
  };

  const updateApiConfig = (config: Partial<ApiConfig>) => {
    // 如果不允许用户配置，则不更新
    if (!allowUserConfig) return;

    // 如果当前使用环境变量配置，则切换到用户自定义配置
    if (useEnvConfig) {
      setUseEnvConfig(false);
      // 保存选择到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('oneLine_useEnvConfig', 'false');
      }
    }

    setApiConfig(prev => {
      const newConfig = { ...prev, ...config };

      // 保存新配置作为用户配置
      setUserConfig(newConfig);

      // 只在客户端保存到localStorage
      if (typeof window !== 'undefined') {
        // 创建一个不包含敏感信息的对象用于日志记录
        const sanitizedConfig = {
          ...newConfig,
          apiKey: newConfig.apiKey ? '***********' : '',
        };

        // 安全地存储到localStorage
        localStorage.setItem('oneLine_apiConfig', JSON.stringify(newConfig));

        // 日志记录使用脱敏后的配置
        console.log('API配置已更新', sanitizedConfig);
      }

      // 更新isConfigured状态
      setIsConfigured(!!newConfig.endpoint && !!newConfig.apiKey);
      return newConfig;
    });
  };

  // 验证访问密码
  const validatePassword = (password: string): boolean => {
    if (!isPasswordProtected) return true;

    const isValid = password === apiConfig.accessPassword;
    if (isValid) {
      setIsPasswordValidated(true);
      // 只在客户端保存到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('oneLine_passwordValidated', 'true');
      }
    }
    return isValid;
  };

  // 安全地设置密码验证状态的函数
  const setPasswordValidatedSafe = (validated: boolean) => {
    setIsPasswordValidated(validated);
    // 只在客户端保存到localStorage
    if (typeof window !== 'undefined') {
      if (validated) {
        localStorage.setItem('oneLine_passwordValidated', 'true');
      } else {
        localStorage.removeItem('oneLine_passwordValidated');
      }
    }
  };

  return (
    <ApiContext.Provider value={{
      apiConfig,
      updateApiConfig,
      isConfigured,
      allowUserConfig,
      isPasswordProtected,
      validatePassword,
      isPasswordValidated,
      setPasswordValidated: setPasswordValidatedSafe,
      hasEnvConfig,
      useEnvConfig,
      setUseEnvConfig: handleUseEnvConfig
    }}>
      {children}
    </ApiContext.Provider>
  );
}
