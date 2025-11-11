import { Scene, ComicPanel, ComicPage } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil, RefreshCw } from 'lucide-react';
import { QueueStatus } from '@/lib/queue';

interface ComicPanelGridProps {
  // 单分镜模式
  scenes?: Scene[];
  panels?: ComicPanel[];
  onEditScene?: (scene: Scene) => void;
  onGeneratePanel?: (index: number) => void;
  onRegeneratePanel?: (index: number) => void;
  
  // 多分镜模式
  pages?: ComicPage[];
  onGeneratePage?: (index: number) => void;
  onRegeneratePage?: (index: number) => void;
  
  // 通用
  onGenerateAll: () => void;
  isGenerating: boolean;
  queueStatus?: QueueStatus;
  mode: 'single-panel' | 'multi-panel';
}

export function ComicPanelGrid({
  scenes,
  panels,
  pages,
  onEditScene,
  onGeneratePanel,
  onRegeneratePanel,
  onGeneratePage,
  onRegeneratePage,
  onGenerateAll,
  isGenerating,
  queueStatus,
  mode,
}: ComicPanelGridProps) {
  // 检查是否有内容
  const hasContent = mode === 'single-panel' 
    ? (scenes && scenes.length > 0)
    : (pages && pages.length > 0);

  if (!hasContent) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            请在右侧输入小说文本并点击&ldquo;开始分析&rdquo;
          </p>
        </CardContent>
      </Card>
    );
  }

  // 单分镜模式渲染
  if (mode === 'single-panel' && scenes && panels) {
    return (
      <div className="space-y-6 w-full">
        {/* 头部操作栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 bg-background z-10 py-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">
              漫画面板 ({scenes.length} 个场景)
            </h2>
            {/* 队列状态显示 */}
            {isGenerating && queueStatus && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">运行中:</span>
                  <Badge variant="default" className="bg-blue-600">{queueStatus.running}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">等待中:</span>
                  <Badge variant="outline">{queueStatus.waiting}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">已完成:</span>
                  <Badge variant="secondary">{queueStatus.completed}</Badge>
                </div>
                {queueStatus.failed > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">失败:</span>
                    <Badge variant="destructive">{queueStatus.failed}</Badge>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={onGenerateAll}
            disabled={isGenerating}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              '生成所有漫画'
            )}
          </Button>
        </div>

        {/* 面板网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6 pb-6">
          {scenes.map((scene, index) => {
            const panel = panels[index];
            return (
              <Card key={scene.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-lg">场景 {scene.sceneNumber}</CardTitle>
                        <Badge variant="secondary">{scene.mood}</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {scene.description}
                      </CardDescription>
                    </div>
                    {onEditScene && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditScene(scene)}
                        className="flex-shrink-0"
                        title="编辑场景"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* 场景详情 */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-muted-foreground">场景:</span>
                      <span className="ml-2">{scene.setting}</span>
                    </div>
                    {scene.characters.length > 0 && (
                      <div>
                        <span className="font-semibold text-muted-foreground">角色:</span>
                        <span className="ml-2">{scene.characters.join(', ')}</span>
                      </div>
                    )}
                    {scene.dialogue && (
                      <div>
                        <span className="font-semibold text-muted-foreground">对话:</span>
                        <span className="ml-2 italic">&ldquo;{scene.dialogue}&rdquo;</span>
                      </div>
                    )}
                  </div>

                  {/* 漫画面板显示 */}
                  <div className="pt-4 border-t">
                    {panel?.imageUrl ? (
                      <div className="space-y-3">
                        <div className="aspect-square rounded-lg overflow-hidden shadow-md relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={panel.imageUrl}
                            alt={`场景 ${scene.sceneNumber}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {onRegeneratePanel && (
                          <Button
                            onClick={() => onRegeneratePanel(index)}
                            variant="outline"
                            className="w-full"
                            size="sm"
                            disabled={panel.isGenerating}
                          >
                            {panel.isGenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                生成中...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                重新生成
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : panel?.isGenerating ? (
                      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-3" />
                          <p className="text-muted-foreground">生成中...</p>
                        </div>
                      </div>
                    ) : panel?.error ? (
                      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center p-4">
                        <div className="text-center space-y-3">
                          <p className="text-sm text-destructive">{panel.error}</p>
                          {onGeneratePanel && (
                            <Button onClick={() => onGeneratePanel(index)} variant="outline">
                              重试
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                        {onGeneratePanel && (
                          <Button
                            onClick={() => onGeneratePanel(index)}
                            disabled={isGenerating}
                            size="lg"
                          >
                            生成此面板
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // 多分镜模式渲染
  if (mode === 'multi-panel' && pages) {
    return (
      <div className="space-y-6 w-full">
        {/* 头部操作栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 bg-background z-10 py-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">
              漫画页面 ({pages.length} 页)
            </h2>
            {/* 队列状态显示 */}
            {isGenerating && queueStatus && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">运行中:</span>
                  <Badge variant="default" className="bg-blue-600">{queueStatus.running}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">等待中:</span>
                  <Badge variant="outline">{queueStatus.waiting}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">已完成:</span>
                  <Badge variant="secondary">{queueStatus.completed}</Badge>
                </div>
                {queueStatus.failed > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">失败:</span>
                    <Badge variant="destructive">{queueStatus.failed}</Badge>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={onGenerateAll}
            disabled={isGenerating}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              '生成所有页面'
            )}
          </Button>
        </div>

        {/* 页面网格 */}
        <div className="grid grid-cols-1 gap-6 pb-6">
          {pages.map((page, pageIndex) => (
            <Card key={page.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CardTitle className="text-lg">
                        第 {page.pageNumber} 页
                      </CardTitle>
                      <Badge variant="secondary">{page.scenes.length} 个分镜</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 场景列表 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">分镜内容:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {page.scenes.map((scene, sceneIndex) => (
                      <div key={scene.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            分镜 {sceneIndex + 1}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{scene.mood}</span>
                        </div>
                        <p className="text-sm line-clamp-2">{scene.description}</p>
                        {scene.characters.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            角色: {scene.characters.join('、')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 漫画页面显示 */}
                <div className="pt-4 border-t">
                  {page.imageUrl ? (
                    <div className="space-y-3">
                      <div className="aspect-square rounded-lg overflow-hidden shadow-md relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={page.imageUrl}
                          alt={`第 ${page.pageNumber} 页`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {onRegeneratePage && (
                        <Button
                          onClick={() => onRegeneratePage(pageIndex)}
                          variant="outline"
                          className="w-full"
                          size="sm"
                          disabled={page.isGenerating}
                        >
                          {page.isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              重新生成
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ) : page.isGenerating ? (
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-3" />
                        <p className="text-muted-foreground">生成中...</p>
                      </div>
                    </div>
                  ) : page.error ? (
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center p-4">
                      <div className="text-center space-y-3">
                        <p className="text-sm text-destructive">{page.error}</p>
                        {onGeneratePage && (
                          <Button onClick={() => onGeneratePage(pageIndex)} variant="outline">
                            重试
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                      {onGeneratePage && (
                        <Button
                          onClick={() => onGeneratePage(pageIndex)}
                          disabled={isGenerating}
                          size="lg"
                        >
                          生成此页面
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
