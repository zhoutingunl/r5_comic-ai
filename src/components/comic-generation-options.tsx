import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { ComicStyle, LayoutMode } from '@/types';

interface ComicGenerationOptionsProps {
  novelText: string;
  onNovelTextChange: (text: string) => void;
  comicStyle: ComicStyle;
  onComicStyleChange: (style: ComicStyle) => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  disabled?: boolean;
}

export function ComicGenerationOptions({
  novelText,
  onNovelTextChange,
  comicStyle,
  onComicStyleChange,
  layoutMode,
  onLayoutModeChange,
  onAnalyze,
  isAnalyzing,
  disabled = false,
}: ComicGenerationOptionsProps) {
  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader>
        <CardTitle>生成设置</CardTitle>
        <CardDescription>配置漫画生成的各种选项</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 小说文本输入 */}
        <div className="space-y-2">
          <Label htmlFor="novel-text">小说文本</Label>
          <Textarea
            id="novel-text"
            value={novelText}
            onChange={(e) => onNovelTextChange(e.target.value)}
            placeholder="在这里粘贴或输入您的小说片段...&#10;&#10;例如：&#10;夜幕降临，小镇的街道上空无一人。李明独自走在回家的路上，突然听到身后传来一阵脚步声..."
            className="h-[300px] resize-vertical"
            disabled={disabled || isAnalyzing}
          />
        </div>

        {/* 漫画风格选择 */}
        <div className="space-y-2">
          <Label htmlFor="comic-style">漫画风格</Label>
          <Select
            value={comicStyle}
            onValueChange={(value) => onComicStyleChange(value as ComicStyle)}
            disabled={disabled || isAnalyzing}
          >
            <SelectTrigger id="comic-style">
              <SelectValue placeholder="选择漫画风格" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="japanese-manga">🇯🇵 日本漫画</SelectItem>
              <SelectItem value="korean-manhwa">🇰🇷 韩国漫画</SelectItem>
              <SelectItem value="american-comics">🇺🇸 美式漫画</SelectItem>
              <SelectItem value="chinese-manhua">🇨🇳 国漫</SelectItem>
              <SelectItem value="european-comics">🇪🇺 欧美漫画</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 布局模式选择 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="layout-mode">布局模式</Label>
            <Select
              value={layoutMode}
              onValueChange={(value) => onLayoutModeChange(value as LayoutMode)}
              disabled={disabled || isAnalyzing}
            >
              <SelectTrigger id="layout-mode">
                <SelectValue placeholder="选择布局模式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-panel">🖼️ 单张分镜</SelectItem>
                <SelectItem value="multi-panel">🎬 多分镜页面</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {layoutMode === 'single-panel'
                ? '每个场景生成单独的分镜图片'
                : 'AI 将根据故事节奏自动决定每页的分镜数量和布局'}
            </p>
          </div>
        </div>

        {/* 分析按钮 */}
        <Button
          onClick={onAnalyze}
          disabled={disabled || isAnalyzing || !novelText.trim()}
          className="w-full"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              分析中...
            </>
          ) : (
            '开始分析'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
