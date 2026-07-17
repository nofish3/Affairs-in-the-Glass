import type { AlcoholFeeling, Aroma, TasteKey, TasteLevel, Texture } from '../types/domain';

export const TASTE_LABELS: Record<TasteKey, string> = {
  sour: '酸',
  sweet: '甜',
  bitter: '苦',
  salty: '咸',
  umami: '鲜',
  spicy: '辣'
};

export const LEVEL_LABELS: Record<TasteLevel, string> = {
  0: '不明显',
  1: '低',
  2: '中',
  3: '高'
};

export const AROMA_LABELS: Record<Aroma, string> = {
  floral: '花香',
  fruity: '果香',
  herbal: '草本',
  woody: '木质',
  spiced: '香料',
  creamy: '奶香'
};

export const ALCOHOL_LABELS: Record<AlcoholFeeling, string> = {
  soft: '轻柔',
  medium: '适中',
  strong: '强烈'
};

export const TEXTURE_LABELS: Record<Texture, string> = {
  refreshing: '清爽',
  smooth: '顺滑',
  rich: '醇厚'
};

