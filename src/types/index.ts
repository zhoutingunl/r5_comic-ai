// 小说场景定义
export interface Scene {
  id: string;
  sceneNumber: number;
  description: string;
  characters: string[];
  setting: string;
  mood: string;
  dialogue?: string;
  action: string;
}

// 漫画面板定义
export interface ComicPanel {
  id: string;
  sceneId: string;
  panelNumber: number;
  imageUrl?: string;
  imagePrompt: string;
  isGenerating?: boolean;
  error?: string;
}

// API 响应类型
export interface AnalyzeResponse {
  scenes: Scene[];
}

export interface GenerateResponse {
  imageUrl: string;
  revisedPrompt?: string;
}

// 生成状态
export type GenerationStatus = 'idle' | 'analyzing' | 'generating' | 'completed' | 'error';

// 漫画风格
export type ComicStyle = 'japanese-manga' | 'american-comics' | 'korean-manhwa' | 'chinese-manhua' | 'european-comics';

export const COMIC_STYLES = {
  'japanese-manga': '日本漫画 (Japanese Manga)',
  'american-comics': '美式漫画 (American Comics)',
  'korean-manhwa': '韩国漫画 (Korean Manhwa)',
  'chinese-manhua': '国漫 (Chinese Manhua)',
  'european-comics': '欧美漫画 (European Comics)',
} as const;

// 漫画布局模式
export type LayoutMode = 'single-panel' | 'multi-panel';

// 多分镜漫画页面
export interface ComicPage {
  id: string;
  pageNumber: number;
  scenes: Scene[]; // 这一页包含的多个场景
  imageUrl?: string; // 生成的完整页面图片
  isGenerating?: boolean;
  error?: string;
}

// 角色定义（存储在 IndexedDB）
export interface Character {
  id: string;
  name: string;
  description: string;
  imageUrl?: string; // 三视图的 URL
  createdAt: Date;
  updatedAt: Date;
}

// 角色创建请求
export interface CreateCharacterRequest {
  name: string;
  description: string;
}

// 角色参考图（用于生成漫画时传递角色参考）
export interface CharacterReference {
  name: string;
  imageUrl: string;
}
