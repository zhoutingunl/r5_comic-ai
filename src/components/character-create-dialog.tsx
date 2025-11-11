import { useState } from 'react';
import { Character } from '@/types';
import { addCharacter } from '@/lib/db';
import { generateCharacter, getStoredApiKey } from '@/lib/ai-services';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';

interface CharacterCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCharacterCreated: (character: Character) => void;
}

export function CharacterCreateDialog({
  open,
  onOpenChange,
  onCharacterCreated,
}: CharacterCreateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleReset = () => {
    setName('');
    setDescription('');
    setImageUrl('');
    setError('');
  };

  const handleGenerateImage = async () => {
    if (!name.trim() || !description.trim()) {
      setError('请先填写角色名称和描述');
      return;
    }

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setError('请先在设置中配置 DashScope API Key');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const result = await generateCharacter({
        name: name.trim(),
        description: description.trim(),
        referenceImage: imageUrl.trim() || undefined, // 传递用户提供的参考图
        apiKey,
      });

      setImageUrl(result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成角色图片失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      setError('请填写角色名称和描述');
      return;
    }

    try {
      // 保存到 IndexedDB
      const savedCharacter = await addCharacter({
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });

      onCharacterCreated(savedCharacter);
      onOpenChange(false);
      handleReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存角色失败');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    handleReset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建角色</DialogTitle>
          <DialogDescription>
            手动添加角色信息到角色库，用于保持漫画中角色的一致性
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">角色名称 *</Label>
            <Input
              id="name"
              placeholder="例如：精灵弓箭手艾莉娅"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">角色描述 *</Label>
            <Textarea
              id="description"
              placeholder="详细描述角色的外貌特征，例如：一位年轻的女性精灵，有着长长的金色头发和翠绿色的眼睛。她穿着绿色和棕色的皮革护甲，背着一把精致的长弓，腰间挂着箭袋。她的耳朵尖尖的，身材纤细而矫健。"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>角色参考图</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateImage}
                disabled={isGenerating || !name.trim() || !description.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI 生成三视图
                  </>
                )}
              </Button>
            </div>
            <Input
              id="imageUrl"
              placeholder="可选：先输入参考图 URL，或留空直接生成"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              {imageUrl 
                ? '点击"AI 生成三视图"将基于此参考图生成角色的正面/侧面/背面视图' 
                : '点击"AI 生成三视图"按钮自动生成角色设计稿，或先输入参考图 URL 再生成（推荐）'
              }
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isGenerating && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm text-blue-700 dark:text-blue-300">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>正在生成角色三视图，请稍候...</span>
              </div>
            </div>
          )}

          {imageUrl && (
            <div className="space-y-3">
              <Label>参考图预览</Label>
              <div className="relative rounded-lg border overflow-hidden bg-muted w-full max-h-64">
                <img
                  src={imageUrl}
                  alt={`${name} - 参考图`}
                  className="w-full h-auto object-contain"
                  onError={() => setError('图片加载失败，请检查 URL 是否正确')}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isGenerating}>
            保存到角色库
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
