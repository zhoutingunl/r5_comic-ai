'use client';

import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { CharacterReference, Scene } from '@/types';

// ==================== API Key 管理 ====================

const API_KEY_STORAGE_KEY = 'comic-ai-dashscope-key';

export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

// ==================== API URL 管理 ====================

/**
 * 获取 DashScope API 基础 URL
 * 开发环境使用代理，生产环境直接访问
 */
function getDashScopeApiUrl(endpoint: string): string {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    // 开发环境使用 Vite 代理
    return `/api/dashscope${endpoint}`;
  } else {
    // 生产环境直接访问
    return `https://dashscope.aliyuncs.com${endpoint}`;
  }
}

export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function clearStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

// ==================== AI 模型实例创建 ====================

function createDashScopeClient(apiKey?: string) {
  const key = apiKey || getStoredApiKey();
  if (!key) {
    throw new Error('请先配置 DashScope API Key');
  }

  return createOpenAICompatible({
    name: 'dashscope',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: key,
  });
}

function getTextModel(apiKey?: string) {
  const dashscope = createDashScopeClient(apiKey);
  return dashscope('qwen-plus');
}

// ==================== 场景分析 ====================

// 定义场景的 Zod schema
const SceneSchema = z.object({
  sceneNumber: z.number(),
  description: z.string(),
  characters: z.array(z.string()),
  setting: z.string(),
  mood: z.string(),
  dialogue: z.string().optional(),
  action: z.string(),
});

const ScenesSchema = z.object({
  scenes: z.array(SceneSchema),
});

export interface AnalyzeNovelParams {
  text: string;
  apiKey?: string;
}

export interface AnalyzeNovelResult {
  scenes: Scene[];
  characters: string[];
}

export async function analyzeNovel(params: AnalyzeNovelParams): Promise<AnalyzeNovelResult> {
  const { text, apiKey } = params;

  if (!text || typeof text !== 'string') {
    throw new Error('请提供有效的小说文本');
  }

  const model = getTextModel(apiKey);

  // 使用 Vercel AI SDK 的 generateObject 来结构化分析小说
  const { object } = await generateObject({
    model,
    schema: ScenesSchema,
    prompt: `你是一位专业的漫画分镜师。请将以下小说文本转换为漫画分镜脚本，提取关键画面场景。

重要原则：
1. 每个场景必须是一个静态的、可视化的画面瞬间
2. 描述要具体到能让画师直接作画：人物位置、动作姿态、表情、服装、背景细节
3. 避免叙述性语言，使用视觉化的画面描述

字段要求：
- description: 画面的视觉描述，包括：
  * 镜头角度（特写/中景/远景/俯视/仰视等）
  * 人物的具体动作和表情
  * 服装和外貌特征
  * 背景环境的具体细节
  * 光影效果和氛围
  示例：「近景特写：年轻女子侧脸，眼神犀利地盯着远方，长发在风中飘扬，身穿黑色风衣，背景是模糊的城市夜景，霓虹灯光映在她脸上」
  
- characters: 画面中出现的角色名称列表
  
- setting: 场景的时空背景（简短说明）
  示例：「城市天台，深夜」「古代宫殿大殿，白天」
  
- mood: 画面氛围（用于指导配色和光影）
  示例：「紧张」「温馨」「恐怖」「热血」
  
- dialogue: 对话气泡内容（如果有台词）
  
- action: 这一格的关键动作或情节点（一句话）
  示例：「主角发现真相」「敌人突然出现」

请将场景数量控制在 4-8 个，选择最具视觉冲击力和故事推进意义的关键画面。

返回JSON格式：
{
  "scenes": [
    {
      "sceneNumber": number,
      "description": string,
      "characters": string[],
      "setting": string,
      "mood": string,
      "dialogue": string (optional),
      "action": string
    }
  ]
}

小说文本：
${text}`,
  });

  // 为每个场景添加 ID
  const scenesWithIds = object.scenes.map((scene, index) => ({
    ...scene,
    id: `scene-${index + 1}`,
  }));

  // 从所有场景中提取角色列表
  const allCharacterNames = new Set<string>();
  scenesWithIds.forEach((scene) => {
    if (scene.characters && Array.isArray(scene.characters)) {
      scene.characters.forEach((char: string) => allCharacterNames.add(char));
    }
  });

  const characters = Array.from(allCharacterNames);

  return {
    scenes: scenesWithIds,
    characters,
  };
}

// ==================== 多分镜页面分析 ====================

// 定义页面的 Zod schema
const PageSchema = z.object({
  pageNumber: z.number(),
  title: z.string(),
  scenes: z.array(SceneSchema),
});

const PagesSchema = z.object({
  pages: z.array(PageSchema),
});

interface AnalyzedPage {
  id: string;
  pageNumber: number;
  title: string;
  scenes: Scene[];
}

export interface AnalyzeNovelForPagesParams {
  text: string;
  apiKey?: string;
}

export interface AnalyzeNovelForPagesResult {
  pages: AnalyzedPage[];
  characters: string[];
}

export async function analyzeNovelForPages(params: AnalyzeNovelForPagesParams): Promise<AnalyzeNovelForPagesResult> {
  const { text, apiKey } = params;

  if (!text || typeof text !== 'string') {
    throw new Error('请提供有效的小说文本');
  }

  const model = getTextModel(apiKey);

  // 使用 Vercel AI SDK 的 generateObject 来结构化分析小说为页面
  const { object } = await generateObject({
    model,
    schema: PagesSchema,
    prompt: `你是一位专业的漫画分镜师。请将以下小说文本转换为漫画页面脚本，适合制作成包含多个分镜的漫画页面。

重要原则：
1. 将文本拆分为多个"页面"，每个页面包含 3-6 个连续的场景（根据叙事节奏灵活调整）
2. 每个页面应该是一个完整的叙事单元，有起承转合
3. 每页内的场景要有连贯性，展现故事的发展
4. 每个场景是一个静态的、可视化的画面瞬间

页面要求：
- pageNumber: 页码（从1开始）
- title: 这一页的简短标题（3-6字，概括本页内容）
- scenes: 这一页包含的场景列表（3-6个场景，根据故事节奏灵活调整）

场景字段要求：
- sceneNumber: 场景编号（从1开始，每页重新计数）
- description: 画面的视觉描述，包括：
  * 镜头角度（特写/中景/远景/俯视/仰视等）
  * 人物的具体动作和表情
  * 服装和外貌特征
  * 背景环境的具体细节
  * 光影效果和氛围
  示例：「近景特写：年轻女子侧脸，眼神犀利地盯着远方，长发在风中飘扬，身穿黑色风衣，背景是模糊的城市夜景，霓虹灯光映在她脸上」
  
- characters: 画面中出现的角色名称列表
- setting: 场景的时空背景（简短说明）
- mood: 画面氛围（用于指导配色和光影）
- dialogue: 对话气泡内容（如果有台词）
- action: 这一格的关键动作或情节点（一句话）

请生成 2-4 个页面，每页根据故事节奏包含 3-6 个场景。选择最具视觉冲击力和故事推进意义的关键画面。

返回JSON格式：
{
  "pages": [
    {
      "pageNumber": number,
      "title": string,
      "scenes": [
        {
          "sceneNumber": number,
          "description": string,
          "characters": string[],
          "setting": string,
          "mood": string,
          "dialogue": string (optional),
          "action": string
        }
      ]
    }
  ]
}

小说文本：
${text}`,
  });

  // 为每个页面和场景添加 ID
  const pagesWithIds = object.pages.map((page, pageIndex) => ({
    ...page,
    id: `page-${pageIndex + 1}`,
    scenes: page.scenes.map((scene, sceneIndex) => ({
      ...scene,
      id: `page-${pageIndex + 1}-scene-${sceneIndex + 1}`,
    })),
  }));

  // 从所有场景中提取角色列表
  const allCharacterNames = new Set<string>();
  pagesWithIds.forEach((page) => {
    page.scenes.forEach((scene) => {
      if (scene.characters && Array.isArray(scene.characters)) {
        scene.characters.forEach((char: string) => allCharacterNames.add(char));
      }
    });
  });

  const characters = Array.from(allCharacterNames);

  return {
    pages: pagesWithIds,
    characters,
  };
}

// ==================== 图片生成 ====================

export interface GenerateComicParams {
  sceneDescription: string;
  characters?: string[];
  characterReferences?: CharacterReference[]; // 多个角色的参考图
  setting?: string;
  mood?: string;
  style?: string;
  layoutMode?: 'single-panel' | 'multi-panel';
  panelLayout?: string;
  referenceImage?: string; // 保留向后兼容，单个参考图
  apiKey?: string;
}

export interface GenerateComicResult {
  imageUrl: string;
  revisedPrompt?: string;
  optimizedPrompt: string;
}

export async function generateComic(params: GenerateComicParams): Promise<GenerateComicResult> {
  const {
    sceneDescription,
    characters,
    characterReferences,
    setting,
    mood,
    style = 'japanese-manga',
    layoutMode = 'single-panel',
    panelLayout = '2x2',
    referenceImage,
    apiKey,
  } = params;

  if (!sceneDescription) {
    throw new Error('请提供场景描述');
  }

  const model = getTextModel(apiKey);

  // 根据漫画风格生成特定的风格描述
  const styleDescriptions: Record<string, string> = {
    'japanese-manga': 'Japanese manga style with black and white ink artwork, dynamic action lines, expressive eyes, and typical manga panel composition',
    'korean-manhwa': 'Korean manhwa style with vertical scrolling format, vibrant colors, detailed character designs, and realistic proportions',
    'american-comics': 'American comic book style with bold inking, vibrant primary colors, superhero-style action poses, and dynamic perspectives',
    'chinese-manhua': 'Chinese manhua style with flowing brushwork, traditional Chinese aesthetics mixed with modern techniques, and cinematic composition',
    'european-comics': 'European comics style (bande dessinée) with detailed backgrounds, realistic artwork, and sophisticated storytelling through visuals'
  };

  const styleDescription = styleDescriptions[style] || styleDescriptions['japanese-manga'];

  // 多分镜布局描述
  const layoutDescriptions: Record<string, string> = {
    '2x2': 'a 2x2 grid layout with 4 panels arranged in 2 rows and 2 columns',
    '3x1': 'a horizontal 3-panel layout arranged in a single row',
    '1x3': 'a vertical 3-panel layout arranged in a single column',
    '2x3': 'a 2x3 grid layout with 6 panels arranged in 3 rows and 2 columns',
    '3x2': 'a 3x2 grid layout with 6 panels arranged in 2 rows and 3 columns',
    '4x1': 'a horizontal 4-panel layout arranged in a single row',
    '1x4': 'a vertical 4-panel layout arranged in a single column',
  };

  // 根据布局模式调整提示词
  const isMultiPanel = layoutMode === 'multi-panel';
  const layoutInstruction = isMultiPanel
    ? `\n\nIMPORTANT: Create a multi-panel comic page with ${layoutDescriptions[panelLayout as keyof typeof layoutDescriptions]}. Each panel should show a progression of the scene with clear panel borders. The composition should look like a real comic book page with multiple sequential panels telling the story.`
    : '';

  // 构建角色参考信息
  let characterRefInfo = '';
  if (characterReferences && characterReferences.length > 0) {
    characterRefInfo = `\n角色参考图: 已提供 ${characterReferences.length} 个角色的参考图（${characterReferences.map(c => c.name).join('、')}）`;
  }

  // 使用 AI SDK 优化图片生成提示词
  const { text: optimizedPrompt } = await generateText({
    model,
    prompt: `你是一个专业的漫画艺术指导。请根据以下信息创建一个详细的漫画风格图片生成提示词：

场景描述: ${sceneDescription}
角色: ${characters?.join(', ') || '无'}${characterRefInfo}
场景设定: ${setting || '未指定'}
情绪氛围: ${mood || '中性'}
漫画风格: ${styleDescription}
${isMultiPanel ? `布局要求: 需要生成${layoutDescriptions[panelLayout as keyof typeof layoutDescriptions]}的多分镜漫画页面` : ''}

请创建一个详细的英文提示词，包含：
1. 具体的漫画风格特征（${style}）
2. ${isMultiPanel ? '多个分镜的连续场景，展现故事发展' : '详细的场景构图和视角'}
3. 角色的外观、表情和动作${characterRefInfo ? '（参考图中的角色应保持一致的外观特征）' : ''}
4. 光线、色彩和氛围
5. 特定的艺术技法和细节
${isMultiPanel ? '6. 清晰的分镜边框和漫画页面布局' : ''}

提示词应该直接可用于图片生成模型，不要包含任何解释性文字。输出纯英文提示词。${layoutInstruction}`,
  });

  console.log('优化后的提示词:', optimizedPrompt);

  // 漫画生成使用 qwen-image-edit
  const result = await generateImageDirect('qwen-image-edit', {
    prompt: optimizedPrompt,
    size: '1328*1328',
    quality: 'standard',
    style: 'vivid',
    referenceImage,
    characterReferences, // 传递多个角色参考
  }, apiKey);

  return {
    imageUrl: result.imageUrl,
    revisedPrompt: result.revisedPrompt,
    optimizedPrompt,
  };
}

// ==================== 多分镜页面图片生成 ====================

export interface GenerateComicPageParams {
  scenes: Scene[]; // 这一页包含的多个场景
  pageNumber: number;
  pageTitle: string;
  characterReferences?: CharacterReference[];
  style?: string;
  apiKey?: string;
}

export async function generateComicPage(params: GenerateComicPageParams): Promise<GenerateComicResult> {
  const {
    scenes,
    pageNumber,
    pageTitle,
    characterReferences,
    style = 'japanese-manga',
    apiKey,
  } = params;

  if (!scenes || scenes.length === 0) {
    throw new Error('请提供至少一个场景');
  }

  const model = getTextModel(apiKey);

  // 根据漫画风格生成特定的风格描述
  const styleDescriptions: Record<string, string> = {
    'japanese-manga': 'Japanese manga style with black and white ink artwork, dynamic action lines, expressive eyes, and typical manga panel composition with clear borders',
    'korean-manhwa': 'Korean manhwa style with detailed character designs, realistic proportions, vibrant colors, and clear panel divisions',
    'american-comics': 'American comic book style with bold inking, vibrant primary colors, superhero-style action poses, dynamic perspectives, and distinctive panel borders',
    'chinese-manhua': 'Chinese manhua style with flowing brushwork, traditional Chinese aesthetics mixed with modern techniques, cinematic composition, and elegant panel layouts',
    'european-comics': 'European comics style (bande dessinée) with detailed backgrounds, realistic artwork, sophisticated visual storytelling, and artistic panel arrangements'
  };

  const styleDescription = styleDescriptions[style] || styleDescriptions['japanese-manga'];

  // 收集所有角色
  const allCharacters = new Set<string>();
  scenes.forEach(scene => {
    scene.characters.forEach(char => allCharacters.add(char));
  });

  // 构建角色参考信息
  let characterRefInfo = '';
  if (characterReferences && characterReferences.length > 0) {
    characterRefInfo = `\n\n角色参考图: 已提供 ${characterReferences.length} 个角色的参考图（${characterReferences.map(c => c.name).join('、')}）。请保持角色在所有分镜中的外观一致性。`;
  }

  // 构建每个场景的详细描述
  const sceneDescriptions = scenes.map((scene, index) => 
    `分镜 ${index + 1}:
- 动作: ${scene.action}
- 视觉描述: ${scene.description}
- 角色: ${scene.characters.join('、') || '无'}
- 场景: ${scene.setting}
- 氛围: ${scene.mood}
${scene.dialogue ? `- 对话: ${scene.dialogue}` : ''}`
  ).join('\n\n');

  // 使用 AI SDK 优化图片生成提示词
  const { text: optimizedPrompt } = await generateText({
    model,
    prompt: `你是一个专业的漫画分镜艺术指导。请根据以下信息创建一个详细的多分镜漫画页面生成提示词。

页面信息:
- 页码: 第 ${pageNumber} 页
- 页面主题: ${pageTitle}
- 分镜数量: ${scenes.length} 个分镜
- 漫画风格: ${styleDescription}
- 出现的角色: ${Array.from(allCharacters).join('、')}${characterRefInfo}

分镜内容:
${sceneDescriptions}

请创建一个详细的英文提示词，要求：
1. 明确指出这是一个完整的漫画页面，包含 ${scenes.length} 个分镜
2. 根据分镜数量选择合适的布局（例如：3个分镜用横向或纵向排列，4个分镜用2x2网格，6个分镜用2x3或3x2网格）
3. 每个分镜要有清晰的边框线（panel borders）
4. 所有分镜按顺序讲述一个连贯的故事
5. 遵循${style}漫画风格的视觉特征
6. 角色在不同分镜中保持外观一致${characterRefInfo ? '，且符合参考图的特征' : ''}
7. 每个分镜的具体内容按照上述分镜内容描述
8. 整体构图要有专业漫画页面的感觉，包括边距和分镜间距

关键要求：
- MUST include clear panel borders separating each scene
- MUST choose appropriate panel layout based on ${scenes.length} panels
- MUST maintain character consistency across all panels
- MUST tell a coherent visual story across the panels
- The overall composition should look like a professional comic book page

提示词应该直接可用于图片生成模型，不要包含任何解释性文字。输出纯英文提示词。`,
  });

  console.log('多分镜页面优化后的提示词:', optimizedPrompt);

  // 使用 qwen-image-edit 生成多分镜页面
  const result = await generateImageDirect('qwen-image-edit', {
    prompt: optimizedPrompt,
    size: '1328*1328',
    quality: 'hd',
    style: 'vivid',
    characterReferences,
  }, apiKey);

  return {
    imageUrl: result.imageUrl,
    revisedPrompt: result.revisedPrompt,
    optimizedPrompt,
  };
}

// ==================== 直接图片生成（客户端） ====================

interface ImageGenerationParams {
  prompt: string;
  size?: string;
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  negativePrompt?: string;
  referenceImage?: string; // 单个参考图（向后兼容）
  characterReferences?: CharacterReference[]; // 多个角色参考图
}

interface ImageGenerationResult {
  imageUrl: string;
  revisedPrompt?: string;
}

async function generateImageDirect(
  provider: 'qwen-image' | 'qwen-image-edit',
  params: ImageGenerationParams,
  apiKey?: string
): Promise<ImageGenerationResult> {
  const key = apiKey || getStoredApiKey();
  if (!key) {
    throw new Error('请先配置 DashScope API Key');
  }

  switch (provider) {
    case 'qwen-image':
      return generateWithQwenImage(params, key);
    case 'qwen-image-edit':
      return generateWithQwenImageEdit(params, key);
    default:
      throw new Error(`不支持的图片生成供应商: ${provider}`);
  }
}

// 使用阿里云Qwen-Image生成图片（同步，推荐）
async function generateWithQwenImage(params: ImageGenerationParams, apiKey: string): Promise<ImageGenerationResult> {
  const apiUrl = getDashScopeApiUrl('/api/v1/services/aigc/multimodal-generation/generation');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-image-plus',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                text: params.prompt,
              },
            ],
          },
        ],
      },
      parameters: {
        size: params.size || '1328*1328',
        negative_prompt: params.negativePrompt,
        n: 1,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || '阿里云图片生成失败');
  }

  const data = await response.json();

  // 支持两种响应格式
  // 格式1: output.results[0].url (旧格式)
  if (data.output?.results?.[0]?.url) {
    return {
      imageUrl: data.output.results[0].url,
    };
  }

  // 格式2: output.choices[0].message.content[0].image (新格式)
  if (data.output?.choices?.[0]?.message?.content?.[0]?.image) {
    return {
      imageUrl: data.output.choices[0].message.content[0].image,
    };
  }

  console.error('图片生成响应数据:', JSON.stringify(data, null, 2));
  throw new Error('阿里云图片生成失败：未返回图片');
}

// 使用阿里云Qwen-Image-Edit生成图片（支持参考图）
async function generateWithQwenImageEdit(params: ImageGenerationParams, apiKey: string): Promise<ImageGenerationResult> {
  const content: Array<{ text?: string; image?: string }> = [];

  // 优先使用多个角色参考图
  if (params.characterReferences && params.characterReferences.length > 0) {
    // 按顺序添加所有角色参考图
    params.characterReferences.forEach(charRef => {
      content.push({ image: charRef.imageUrl });
    });

    // 构建包含角色信息的提示词
    const characterNames = params.characterReferences.map(c => c.name).join('、');
    const enhancedPrompt = `参考图中的角色：${characterNames}。${params.prompt}`;
    content.push({ text: enhancedPrompt });
  } else if (params.referenceImage) {
    // 如果没有角色参考图，使用单个参考图（向后兼容）
    content.push({ image: params.referenceImage });
    content.push({ text: params.prompt });
  } else {
    // 没有任何参考图，只有提示词
    content.push({ text: params.prompt });
  }

  const apiUrl = getDashScopeApiUrl('/api/v1/services/aigc/multimodal-generation/generation');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-image-edit',
      input: {
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      },
      parameters: {
        size: params.size || '1328*1328',
        negative_prompt: params.negativePrompt || ' ',
        watermark: false,
        n: 1,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || '阿里云图片生成失败');
  }

  const data = await response.json();

  // 支持两种响应格式
  // 格式1: output.results[0].url (旧格式)
  if (data.output?.results?.[0]?.url) {
    return {
      imageUrl: data.output.results[0].url,
    };
  }

  // 格式2: output.choices[0].message.content[0].image (新格式)
  if (data.output?.choices?.[0]?.message?.content?.[0]?.image) {
    return {
      imageUrl: data.output.choices[0].message.content[0].image,
    };
  }

  console.error('图片生成响应数据:', JSON.stringify(data, null, 2));
  throw new Error('阿里云图片生成失败：未返回图片');
}

// ==================== 角色三视图生成 ====================

export interface GenerateCharacterParams {
  name: string;
  description: string;
  style?: string;
  referenceImage?: string; // 用户提供的参考图
  apiKey?: string;
}

export interface GenerateCharacterResult {
  imageUrl: string;
  optimizedPrompt: string;
}

export async function generateCharacter(params: GenerateCharacterParams): Promise<GenerateCharacterResult> {
  const {
    name,
    description,
    style = 'japanese-manga',
    referenceImage,
    apiKey,
  } = params;

  if (!name || !description) {
    throw new Error('请提供角色名称和描述');
  }

  const model = getTextModel(apiKey);

  // 根据漫画风格生成特定的风格描述
  const styleDescriptions: Record<string, string> = {
    'japanese-manga': 'Japanese manga style with clean black and white linework, expressive features, and typical anime/manga character design',
    'korean-manhwa': 'Korean manhwa style with detailed character designs, realistic proportions, and vibrant colors',
    'american-comics': 'American comic book style with bold inking and superhero-style character design',
    'chinese-manhua': 'Chinese manhua style with flowing brushwork and traditional aesthetics',
    'european-comics': 'European comics style (bande dessinée) with detailed and realistic character artwork'
  };

  const styleDescription = styleDescriptions[style] || styleDescriptions['japanese-manga'];

  // 根据是否有参考图调整提示词
  const referenceNote = referenceImage
    ? '\n\n重要：请参考提供的参考图，保持角色的外观特征一致（发型、服装、配饰等），生成该角色的标准三视图。'
    : '';

  // 使用 AI SDK 优化角色设计提示词
  const { text: optimizedPrompt } = await generateText({
    model,
    prompt: `你是一个专业的角色设计师。请根据以下信息创建一个详细的角色三视图（character sheet）生成提示词：

角色名称: ${name}
角色描述: ${description}
艺术风格: ${styleDescription}${referenceNote}

请创建一个详细的英文提示词，用于生成角色的三视图设计稿，包含：
1. 角色的正面视图 (front view)
2. 角色的侧面视图 (side view)
3. 角色的背面视图 (back view)

要求：
- 三个视图应该在同一张图上，清晰标注 "Front", "Side", "Back"
- 展示完整的身体比例和服装细节
- 保持${style}风格的艺术特征
- 包含角色的所有关键特征：发型、服装、配饰、身体比例等
- 白色背景，便于查看细节
- 专业的角色设计稿格式
${referenceImage ? '- 保持与参考图中角色的外观一致性' : ''}

提示词应该直接可用于图片生成模型，不要包含任何解释性文字。输出纯英文提示词。`,
  });

  console.log('角色设计优化后的提示词:', optimizedPrompt);

  // 如果有参考图，使用 qwen-image-edit；否则使用 qwen-image
  const provider = referenceImage ? 'qwen-image-edit' : 'qwen-image';

  const result = await generateImageDirect(provider, {
    prompt: optimizedPrompt,
    size: '1328*1328',
    quality: 'hd',
    style: 'natural',
    referenceImage, // 传递参考图
  }, apiKey);

  return {
    imageUrl: result.imageUrl,
    optimizedPrompt,
  };
}
