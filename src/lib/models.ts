// 图片生成供应商类型
export type ImageProvider = 'qwen-image' | 'qwen-image-edit';

// 文本模型常量
export const TEXT_MODEL = 'qwen-plus';

// 图片生成模型映射
export const IMAGE_MODEL_MAP = {
  'qwen-image': 'qwen-image-plus',
  'qwen-image-edit': 'qwen-image-edit',
} as const;

// 图片生成尺寸常量
export const IMAGE_SIZE = '1328*1328';
