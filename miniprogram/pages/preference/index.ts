import { getRecommendationSession, setCurrentRecommendation, setPreference } from '../../stores/recommendation-session';
import { COCKTAILS } from '../../data/cocktails';
import { recommend } from '../../services/recommendation-service';
import { validatePreference } from '../../utils/validation';
import type { AlcoholFeeling, Aroma, Preference, TasteKey, Texture } from '../../types/domain';

const tasteOptions: Array<{ key: TasteKey; label: string }> = [
  { key: 'sour', label: '酸' }, { key: 'sweet', label: '甜' }, { key: 'bitter', label: '苦' },
  { key: 'salty', label: '咸' }, { key: 'umami', label: '鲜' }, { key: 'spicy', label: '辣' }
];

Page({
  data: {
    tasteOptions,
    levels: [{ value: 1, label: '低' }, { value: 2, label: '中' }, { value: 3, label: '高' }],
    aromas: [
      { value: 'floral', label: '花香' }, { value: 'fruity', label: '果香' },
      { value: 'herbal', label: '草本' }, { value: 'woody', label: '木质' },
      { value: 'spiced', label: '香料' }, { value: 'creamy', label: '奶香' },
      { value: 'random', label: '随机' }
    ],
    alcoholOptions: [
      { value: 'soft', label: '轻柔' }, { value: 'medium', label: '适中' },
      { value: 'strong', label: '强烈' }, { value: 'random', label: '随机' }
    ],
    textures: [
      { value: 'refreshing', label: '清爽' }, { value: 'smooth', label: '顺滑' },
      { value: 'rich', label: '醇厚' }, { value: 'random', label: '随机' }
    ],
    preference: { tastes: {}, aroma: null, alcoholFeeling: null, texture: null } as Preference,
    valid: false,
    errors: [] as string[],
    errorText: ''
  },

  onLoad() {
    const existing = getRecommendationSession();
    if (existing) this.updatePreference(existing.preference);
  },

  updatePreference(preference: Preference) {
    const validation = validatePreference(preference);
    this.setData({ preference, valid: validation.valid, errors: [], errorText: '' });
  },

  selectTaste(event: WechatMiniprogram.TouchEvent) {
    const key = event.currentTarget.dataset.key as TasteKey;
    const level = Number(event.currentTarget.dataset.level) as 1 | 2 | 3;
    const tastes = { ...this.data.preference.tastes };
    if (tastes[key] === level) delete tastes[key]; else tastes[key] = level;
    this.updatePreference({ ...this.data.preference, tastes });
  },

  selectAroma(event: WechatMiniprogram.TouchEvent) {
    this.updatePreference({ ...this.data.preference, aroma: event.currentTarget.dataset.value as Aroma | 'random' });
  },

  selectAlcohol(event: WechatMiniprogram.TouchEvent) {
    this.updatePreference({ ...this.data.preference, alcoholFeeling: event.currentTarget.dataset.value as AlcoholFeeling | 'random' });
  },

  selectTexture(event: WechatMiniprogram.TouchEvent) {
    this.updatePreference({ ...this.data.preference, texture: event.currentTarget.dataset.value as Texture | 'random' });
  },

  showAromaHelp(event: WechatMiniprogram.TouchEvent) {
    const value = event.currentTarget.dataset.value;
    wx.showToast({ title: value === 'woody' ? '桶香、烘烤感' : '肉桂、丁香、胡椒一类气息', icon: 'none' });
  },

  submit() {
    const validation = validatePreference(this.data.preference);
    if (!validation.valid) {
      this.setData({ errors: validation.errors, errorText: validation.errors.join('；') });
      return;
    }
    setPreference(this.data.preference);
    const result = recommend(this.data.preference, COCKTAILS);
    if (!result) {
      wx.showToast({ title: '暂时没有找到合适的酒', icon: 'none' });
      return;
    }
    setCurrentRecommendation(result);
    wx.navigateTo({ url: '/pages/recommendation/index' });
  }
});
