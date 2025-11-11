import { useState, useRef, useEffect } from 'react';
import { Scene, ComicPanel, ComicPage, GenerationStatus, ComicStyle, LayoutMode } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { SceneEditDialog } from '@/components/scene-edit-dialog';
import { ComicGenerationOptions } from '@/components/comic-generation-options';
import { ComicPanelGrid } from '@/components/comic-panel-grid';
import { CharacterSidebar } from '@/components/character-sidebar';
import { ApiKeySettings } from '@/components/api-key-settings';
import { TaskQueue, QueueStatus } from '@/lib/queue';
import { getAllCharacters } from '@/lib/db';
import { 
  analyzeNovel as analyzeNovelService, 
  analyzeNovelForPages,
  generateComic,
  generateComicPage,
  getStoredApiKey 
} from '@/lib/ai-services';

export default function App() {
  const [novelText, setNovelText] = useState('');
  
  // 单分镜模式状态
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [panels, setPanels] = useState<ComicPanel[]>([]);
  
  // 多分镜模式状态
  const [pages, setPages] = useState<ComicPage[]>([]);
  
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [error, setError] = useState<string>('');
  const [comicStyle, setComicStyle] = useState<ComicStyle>('japanese-manga');
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single-panel');
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ running: 0, waiting: 0, completed: 0, failed: 0 });
  const queueRef = useRef<TaskQueue | null>(null);

  // 初始化队列
  useEffect(() => {
    queueRef.current = new TaskQueue(3); // 最多同时 3 个任务
    const unsubscribe = queueRef.current.onStatusChange((status) => {
      setQueueStatus(status);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // 分析小说
  const analyzeNovel = async () => {
    if (!novelText.trim()) {
      setError('请输入小说文本');
      return;
    }

    // 检查是否配置了 API Key
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setError('请先在设置中配置 DashScope API Key');
      return;
    }

    setStatus('analyzing');
    setError('');

    try {
      if (layoutMode === 'single-panel') {
        // 单分镜模式：分析为多个独立场景
        const data = await analyzeNovelService({ text: novelText, apiKey });
        setScenes(data.scenes);

        // 初始化面板
        const initialPanels: ComicPanel[] = data.scenes.map((scene: Scene, index: number) => ({
          id: `panel-${index + 1}`,
          sceneId: scene.id,
          panelNumber: index + 1,
          imagePrompt: scene.description,
          isGenerating: false,
        }));

        setPanels(initialPanels);
        setPages([]); // 清空多分镜状态
      } else {
        // 多分镜模式：分析为多个页面，每页包含多个场景
        const data = await analyzeNovelForPages({ 
          text: novelText,
          apiKey 
        });
        
        // 将页面数据转换为 ComicPage 类型
        const initialPages: ComicPage[] = data.pages.map((page) => ({
          id: page.id,
          pageNumber: page.pageNumber,
          scenes: page.scenes,
          isGenerating: false,
        }));

        setPages(initialPages);
        setScenes([]); // 清空单分镜状态
        setPanels([]);
      }

      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析小说时发生错误');
      setStatus('error');
    }
  };

  // 生成单个面板（单分镜模式）
  const generatePanel = async (panelIndex: number) => {
    const panel = panels[panelIndex];
    const scene = scenes.find(s => s.id === panel.sceneId);
    
    if (!scene) return;

    // 检查是否配置了 API Key
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setError('请先在设置中配置 DashScope API Key');
      return;
    }

    // 更新面板状态为生成中
    setPanels(prev => prev.map((p, i) => 
      i === panelIndex ? { ...p, isGenerating: true, error: undefined } : p
    ));

    try {
      // 获取场景中角色的参考图
      const allCharacters = await getAllCharacters();
      const characterReferences = scene.characters
        .map(charName => {
          const character = allCharacters.find(
            c => c.name.toLowerCase() === charName.toLowerCase()
          );
          if (character && character.imageUrl) {
            return {
              name: character.name,
              imageUrl: character.imageUrl,
            };
          }
          return null;
        })
        .filter((ref): ref is { name: string; imageUrl: string } => ref !== null);

      console.log(`场景 ${scene.sceneNumber} 的角色参考图:`, characterReferences);

      // 直接调用前端 AI 服务（单分镜模式）
      const data = await generateComic({
        sceneDescription: scene.description,
        characters: scene.characters,
        characterReferences: characterReferences.length > 0 ? characterReferences : undefined,
        setting: scene.setting,
        mood: scene.mood,
        style: comicStyle,
        layoutMode: 'single-panel',
        apiKey,
      });
      
      // 更新面板图片
      setPanels(prev => prev.map((p, i) => 
        i === panelIndex ? { 
          ...p, 
          imageUrl: data.imageUrl, 
          isGenerating: false 
        } : p
      ));
    } catch (err) {
      setPanels(prev => prev.map((p, i) => 
        i === panelIndex ? { 
          ...p, 
          isGenerating: false, 
          error: err instanceof Error ? err.message : '生成失败' 
        } : p
      ));
    }
  };

  // 生成单个页面（多分镜模式）
  const generatePage = async (pageIndex: number) => {
    const page = pages[pageIndex];
    
    if (!page) return;

    // 检查是否配置了 API Key
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setError('请先在设置中配置 DashScope API Key');
      return;
    }

    // 更新页面状态为生成中
    setPages(prev => prev.map((p, i) => 
      i === pageIndex ? { ...p, isGenerating: true, error: undefined } : p
    ));

    try {
      // 获取所有场景中出现的角色的参考图
      const allCharacters = await getAllCharacters();
      const allSceneCharacters = new Set<string>();
      page.scenes.forEach(scene => {
        scene.characters.forEach(char => allSceneCharacters.add(char));
      });

      const characterReferences = Array.from(allSceneCharacters)
        .map(charName => {
          const character = allCharacters.find(
            c => c.name.toLowerCase() === charName.toLowerCase()
          );
          if (character && character.imageUrl) {
            return {
              name: character.name,
              imageUrl: character.imageUrl,
            };
          }
          return null;
        })
        .filter((ref): ref is { name: string; imageUrl: string } => ref !== null);

      console.log(`页面 ${page.pageNumber} 的角色参考图:`, characterReferences);

      // 调用多分镜页面生成服务
      const data = await generateComicPage({
        scenes: page.scenes,
        pageNumber: page.pageNumber,
        pageTitle: (page as any).title || `第${page.pageNumber}页`,
        characterReferences: characterReferences.length > 0 ? characterReferences : undefined,
        style: comicStyle,
        apiKey,
      });
      
      // 更新页面图片
      setPages(prev => prev.map((p, i) => 
        i === pageIndex ? { 
          ...p, 
          imageUrl: data.imageUrl, 
          isGenerating: false 
        } : p
      ));
    } catch (err) {
      setPages(prev => prev.map((p, i) => 
        i === pageIndex ? { 
          ...p, 
          isGenerating: false, 
          error: err instanceof Error ? err.message : '生成失败' 
        } : p
      ));
    }
  };

  // 生成所有面板或页面
  const generateAllPanels = async () => {
    setStatus('generating');
    setQueueStatus({ running: 0, waiting: 0, completed: 0, failed: 0 });

    if (!queueRef.current) {
      setError('队列初始化失败');
      setStatus('error');
      return;
    }

    // 重置队列
    queueRef.current.reset();

    if (layoutMode === 'single-panel') {
      // 单分镜模式：为每个面板创建任务
      const tasks = panels.map((_, panelIndex) => ({
        id: `panel-${panelIndex}`,
        execute: async () => {
          await generatePanel(panelIndex);
        },
      }));

      // 批量加入队列
      queueRef.current.enqueueBatch(tasks);
    } else {
      // 多分镜模式：为每个页面创建任务
      const tasks = pages.map((_, pageIndex) => ({
        id: `page-${pageIndex}`,
        execute: async () => {
          await generatePage(pageIndex);
        },
      }));

      // 批量加入队列
      queueRef.current.enqueueBatch(tasks);
    }

    // 等待所有任务完成
    await queueRef.current.waitAll();
    setStatus('completed');
  };

  // 打开编辑对话框
  const openEditDialog = (scene: Scene) => {
    setEditingScene(scene);
    setIsEditDialogOpen(true);
  };

  // 保存编辑后的场景
  const handleSaveScene = (updatedScene: Scene) => {
    // 更新场景列表
    setScenes(prev => prev.map(s => s.id === updatedScene.id ? updatedScene : s));
    
    // 更新对应面板的 imagePrompt
    const sceneIndex = scenes.findIndex(s => s.id === updatedScene.id);
    if (sceneIndex !== -1) {
      setPanels(prev => prev.map((p, i) => 
        i === sceneIndex ? { ...p, imagePrompt: updatedScene.description } : p
      ));
    }
  };

  // 重新生成单个面板（用于编辑后）
  const regeneratePanel = async (sceneIndex: number) => {
    const scene = scenes[sceneIndex];

    if (!scene) return;

    // 清除旧图片并重新生成
    setPanels(prev => prev.map((p, i) =>
      i === sceneIndex ? { ...p, imageUrl: undefined } : p
    ));

    await generatePanel(sceneIndex);
  };

  // 重新生成单个页面
  const regeneratePage = async (pageIndex: number) => {
    const page = pages[pageIndex];

    if (!page) return;

    // 清除旧图片并重新生成
    setPages(prev => prev.map((p, i) =>
      i === pageIndex ? { ...p, imageUrl: undefined } : p
    ));

    await generatePage(pageIndex);
  };

  // 重置所有状态
  const resetAll = () => {
    setNovelText('');
    setScenes([]);
    setPanels([]);
    setPages([]);
    setStatus('idle');
    setError('');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 头部 */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">
              小说转漫画生成器 📚➡️🎨
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {(scenes.length > 0 || pages.length > 0) && (
              <Button onClick={resetAll} variant="outline" size="sm">
                重新开始
              </Button>
            )}
            <ApiKeySettings />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* 错误提示 */}
      {error && (
        <div className="container px-4 pt-4 flex-shrink-0">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* 分析加载状态 */}
      {status === 'analyzing' && (
        <div className="container px-4 pt-8 flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <div className="space-y-2">
                  <p className="text-lg font-semibold">正在分析小说...</p>
                  <p className="text-muted-foreground">
                    AI 正在将小说文本分解为漫画场景，请稍候...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主内容区域 - 三栏布局，各自独立滚动 */}
      {status !== 'analyzing' && (
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 h-full px-4 py-6">
            {/* 左侧：角色库 */}
            <div className="lg:col-span-1 xl:col-span-1 min-h-0">
              <div className="h-full overflow-y-auto">
                <CharacterSidebar />
              </div>
            </div>

            {/* 中间：漫画面板展示区 */}
            <div className="lg:col-span-1 xl:col-span-2 min-h-0">
              <div className="h-full overflow-y-auto">
                <ComicPanelGrid
                  mode={layoutMode}
                  scenes={scenes}
                  panels={panels}
                  pages={pages}
                  onEditScene={openEditDialog}
                  onGeneratePanel={generatePanel}
                  onRegeneratePanel={regeneratePanel}
                  onGeneratePage={generatePage}
                  onRegeneratePage={regeneratePage}
                  onGenerateAll={generateAllPanels}
                  isGenerating={status === 'generating'}
                  queueStatus={queueStatus}
                />
              </div>
            </div>

            {/* 右侧：生成选项 */}
            <div className="lg:col-span-1 xl:col-span-1 min-h-0">
              <div className="h-full overflow-y-auto">
                <ComicGenerationOptions
                  novelText={novelText}
                  onNovelTextChange={setNovelText}
                  comicStyle={comicStyle}
                  onComicStyleChange={setComicStyle}
                  layoutMode={layoutMode}
                  onLayoutModeChange={setLayoutMode}
                  onAnalyze={analyzeNovel}
                  isAnalyzing={status !== 'idle' && status !== 'completed' && status !== 'error'}
                  disabled={status === 'generating'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑场景对话框 */}
      <SceneEditDialog
        scene={editingScene}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveScene}
      />
    </div>
  );
}
