"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ServerErrorHandlerProps {
  error: Error;
  reset: () => void;
}

export default function ServerErrorHandler({ error, reset }: ServerErrorHandlerProps) {
  const [errorDetails, setErrorDetails] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    // 尝试解析错误信息，查看是否包含 API 响应数据
    try {
      if (error.message) {
        // 尝试查找 JSON 格式的错误信息
        const jsonStart = error.message.indexOf('{');
        const jsonEnd = error.message.lastIndexOf('}');

        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = error.message.substring(jsonStart, jsonEnd + 1);
          const parsed = JSON.parse(jsonStr);
          setErrorDetails(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to parse error details:", e);
    }
  }, [error]);

  const handleRetry = () => {
    toast.info("正在重试...");
    reset();
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">发生了错误</CardTitle>
        <CardDescription className="text-center">
          处理您的请求时出现了问题
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">错误信息:</p>
          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
            {error.message || "未知错误"}
          </p>
        </div>

        {errorDetails && (
          <div className="space-y-2">
            <p className="text-sm font-medium">错误详情:</p>
            <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(errorDetails, null, 2)}
            </pre>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">可能的解决方法:</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>检查您的网络连接</li>
            <li>检查 API 密钥和端点配置是否正确</li>
            <li>如果您使用的是模型不支持的功能，请尝试其他模型</li>
            <li>稍后再试</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleRetry} className="w-full">
          重试
        </Button>
      </CardFooter>
    </Card>
  );
}
