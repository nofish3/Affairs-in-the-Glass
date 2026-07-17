import { COCKTAILS } from '../../data/cocktails';
import { INGREDIENTS } from '../../data/ingredients';
import { recognizeFields } from '../../services/recognition-service';
import { getRecognitionSession, setRecognitionSession } from '../../stores/recognition-session';

Page({
  data: {
    drinkName: '',
    ingredientsText: '',
    error: '',
    submitting: false
  },

  onLoad() {
    const previous = getRecognitionSession();
    if (previous) this.setData(previous.fields);
  },

  onNameInput(event: WechatMiniprogram.Input) {
    this.setData({ drinkName: event.detail.value, error: '' });
  },

  onIngredientsInput(event: WechatMiniprogram.Input) {
    this.setData({ ingredientsText: event.detail.value, error: '' });
  },

  submit() {
    if (this.data.submitting) return;
    const drinkName = this.data.drinkName.trim();
    const ingredientsText = this.data.ingredientsText.trim();
    const input = [drinkName, ingredientsText].filter(Boolean).join('、');
    if (!input) {
      this.setData({ error: '酒名或配料至少填写一项' });
      return;
    }
    if (input.length > 500) {
      this.setData({ error: '酒名与配料合计不能超过 500 个字符' });
      return;
    }
    this.setData({ submitting: true });
    const result = recognizeFields({ drinkName, ingredientsText }, COCKTAILS, INGREDIENTS);
    if (result.type === 'empty') {
      this.setData({ error: '酒名或配料至少填写一项', submitting: false });
      return;
    }
    setRecognitionSession({ drinkName, ingredientsText }, input, result);
    this.setData({ submitting: false });
    wx.navigateTo({ url: '/pages/recognition-result/index' });
  }
});
