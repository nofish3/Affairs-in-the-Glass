import { COCKTAILS } from '../../data/cocktails';
import { INGREDIENTS } from '../../data/ingredients';
import { recognizeInput } from '../../services/recognition-service';
import { getRecognitionSession, setRecognitionSession } from '../../stores/recognition-session';

Page({
  data: {
    input: '',
    error: '',
    submitting: false
  },

  onLoad() {
    const previous = getRecognitionSession();
    if (previous) this.setData({ input: previous.input });
  },

  onInput(event: WechatMiniprogram.Input) {
    this.setData({ input: event.detail.value, error: '' });
  },

  submit() {
    if (this.data.submitting) return;
    const input = this.data.input.trim();
    if (!input) {
      this.setData({ error: '请输入酒名或配料' });
      return;
    }
    if (input.length > 500) {
      this.setData({ error: '输入内容不能超过 500 个字符' });
      return;
    }
    this.setData({ submitting: true });
    const result = recognizeInput(input, COCKTAILS, INGREDIENTS);
    if (result.type === 'empty') {
      this.setData({ error: '请输入酒名或配料', submitting: false });
      return;
    }
    setRecognitionSession(input, result);
    this.setData({ submitting: false });
    wx.navigateTo({ url: '/pages/recognition-result/index' });
  }
});

