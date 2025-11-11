import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey } from '@/lib/ai-services';
import { Settings, Eye, EyeOff } from 'lucide-react';

export function ApiKeySettings() {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const stored = getStoredApiKey();
    setHasKey(!!stored);
    if (stored) {
      setApiKey(stored);
    }
  }, [open]);

  const handleSave = () => {
    if (apiKey.trim()) {
      setStoredApiKey(apiKey.trim());
      setHasKey(true);
      setOpen(false);
    }
  };

  const handleClear = () => {
    clearStoredApiKey();
    setApiKey('');
    setHasKey(false);
  };

  return (
    <>
      <Button
        variant={hasKey ? 'outline' : 'default'}
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Settings className="h-4 w-4 mr-2" />
        {hasKey ? 'API 设置' : '配置 API Key'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>API Key 配置</DialogTitle>
            <DialogDescription>
              配置阿里云 DashScope API Key 以使用 AI 功能
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription className="text-sm space-y-2">
                <p>
                  您需要一个阿里云 DashScope API Key 来使用文本分析和图片生成功能。
                </p>
                <p>
                  获取步骤：
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>访问 <a href="https://dashscope.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">阿里云 DashScope</a></li>
                  <li>登录或注册账号</li>
                  <li>进入控制台，创建 API Key</li>
                  <li>将 API Key 粘贴到下方</li>
                </ol>
                <p className="text-orange-600 font-medium mt-2">
                  ⚠️ API Key 将保存在浏览器本地存储中，请勿在公共设备上使用
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="apiKey">DashScope API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {hasKey && (
                <p className="text-xs text-green-600">
                  ✓ 已配置 API Key
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            {hasKey && (
              <Button variant="destructive" onClick={handleClear}>
                清除
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!apiKey.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
