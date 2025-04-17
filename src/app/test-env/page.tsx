"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useApi } from '@/contexts/ApiContext';

export default function TestEnvPage() {
  const [serverEnv, setServerEnv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestError, setApiTestError] = useState<string | null>(null);

  // 使用API上下文
  const {
    apiConfig,
    isConfigured,
    allowUserConfig,
    hasEnvConfig,
    useEnvConfig
  } = useApi();

  useEffect(() => {
    async function fetchEnvData() {
      try {
        setLoading(true);
        const response = await axios.get('/api/test-env');
        setServerEnv(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || '获取环境变量失败');
      } finally {
        setLoading(false);
      }
    }

    fetchEnvData();
  }, []);

  // 测试API调用，使用环境变量
  const testApiCall = async () => {
    try {
      setApiTestLoading(true);
      setApiTestError(null);

      // 使用"使用环境变量配置"标记，触发后端使用环境变量
      const response = await axios.post('/api/chat', {
        model: "使用环境变量配置",
        endpoint: "使用环境变量配置",
        apiKey: "使用环境变量配置",
        messages: [
          { role: "system", content: "你是一个简单的测试助手。" },
          { role: "user", content: "返回'环境变量API测试成功'" }
        ],
        temperature: 0.7
      });

      setApiTestResult(response.data);
    } catch (err: any) {
      console.error('API测试失败:', err);
      setApiTestError(err.response?.data?.error || err.message || '测试API失败');
    } finally {
      setApiTestLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">环境变量测试页面</h1>

      <div className="mb-8 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
        <h2 className="text-xl font-semibold mb-4">前端API上下文状态</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded shadow">
            <p className="font-medium">是否已配置: <span className={isConfigured ? "text-green-600" : "text-red-600"}>{isConfigured ? "是" : "否"}</span></p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded shadow">
            <p className="font-medium">允许用户配置: <span className={allowUserConfig ? "text-green-600" : "text-red-600"}>{allowUserConfig ? "是" : "否"}</span></p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded shadow">
            <p className="font-medium">存在环境变量配置: <span className={hasEnvConfig ? "text-green-600" : "text-red-600"}>{hasEnvConfig ? "是" : "否"}</span></p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded shadow">
            <p className="font-medium">使用环境变量配置: <span className={useEnvConfig ? "text-green-600" : "text-red-600"}>{useEnvConfig ? "是" : "否"}</span></p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mt-4 mb-2">当前API配置</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
          {JSON.stringify(apiConfig, null, 2)}
        </pre>
      </div>

      {loading ? (
        <div className="text-center p-4">加载中...</div>
      ) : error ? (
        <div className="text-red-500 p-4 border border-red-300 rounded">
          错误: {error}
        </div>
      ) : (
        <div className="mb-8 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
          <h2 className="text-xl font-semibold mb-4">服务器端环境变量</h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
            {JSON.stringify(serverEnv, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-8 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        <h2 className="text-xl font-semibold mb-4">测试API调用（使用环境变量）</h2>
        <button
          onClick={testApiCall}
          disabled={apiTestLoading}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {apiTestLoading ? '测试中...' : '测试API调用'}
        </button>

        {apiTestError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            <h3 className="font-bold">错误:</h3>
            <p>{apiTestError}</p>
          </div>
        )}

        {apiTestResult && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">API响应结果:</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
              {JSON.stringify(apiTestResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <a href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">返回主页</a>
      </div>
    </div>
  );
}
