import { getRecordRepository } from '../../services/record-service';
import { normalizeRecordInput, validateRecordInput } from '../../utils/validation';

Page({
  data: {
    recordId: '',
    editing: false,
    drinkName: '',
    ingredientsText: '',
    feeling: '',
    error: '',
    submitting: false
  },

  onLoad(options: Record<string, string | undefined>) {
    const recordId = options.id ? decodeURIComponent(options.id) : '';
    if (!recordId) return;
    try {
      const record = getRecordRepository().get(recordId);
      if (!record) {
        wx.showToast({ title: '没有找到这条记录', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 500);
        return;
      }
      this.setData({
        recordId,
        editing: true,
        drinkName: record.drinkName,
        ingredientsText: record.ingredientsText,
        feeling: record.feeling
      });
      wx.setNavigationBarTitle({ title: '编辑记录' });
    } catch (error) {
      this.setData({ error: error instanceof Error ? error.message : '本地记录读取失败' });
    }
  },

  onNameInput(event: WechatMiniprogram.Input) { this.setData({ drinkName: event.detail.value, error: '' }); },
  onIngredientsInput(event: WechatMiniprogram.Input) { this.setData({ ingredientsText: event.detail.value, error: '' }); },
  onFeelingInput(event: WechatMiniprogram.Input) { this.setData({ feeling: event.detail.value, error: '' }); },

  save() {
    if (this.data.submitting) return;
    const input = normalizeRecordInput({
      drinkName: this.data.drinkName,
      ingredientsText: this.data.ingredientsText,
      feeling: this.data.feeling
    });
    const validation = validateRecordInput(input);
    if (!validation.valid) {
      this.setData({ error: validation.errors[0] });
      return;
    }
    this.setData({ submitting: true });
    try {
      const repository = getRecordRepository();
      if (this.data.editing) repository.update(this.data.recordId, input); else repository.create(input);
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 450);
    } catch (error) {
      this.setData({ error: error instanceof Error ? error.message : '保存失败，请稍后重试', submitting: false });
    }
  },

  remove() {
    if (!this.data.editing) return;
    wx.showModal({
      title: '删除这条记录？',
      content: '删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#9A3434',
      cancelText: '取消',
      success: (result) => {
        if (!result.confirm) return;
        try {
          getRecordRepository().remove(this.data.recordId);
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 450);
        } catch (error) {
          this.setData({ error: error instanceof Error ? error.message : '删除失败，请稍后重试' });
        }
      }
    });
  }
});

