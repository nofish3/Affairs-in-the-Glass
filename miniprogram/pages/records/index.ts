import { getRecordRepository } from '../../services/record-service';
import type { DrinkRecord } from '../../types/domain';

function recordView(record: DrinkRecord) {
  return {
    ...record,
    title: record.drinkName || record.ingredientsText,
    ingredientsSummary: record.drinkName ? record.ingredientsText : '',
    feelingSummary: record.feeling.length > 58 ? `${record.feeling.slice(0, 58)}…` : record.feeling
  };
}

Page({
  data: {
    records: [] as ReturnType<typeof recordView>[],
    loadError: ''
  },

  onShow() { this.loadRecords(); },

  loadRecords() {
    try {
      const records = getRecordRepository().list().map(recordView);
      this.setData({ records, loadError: '' });
    } catch (error) {
      this.setData({ records: [], loadError: error instanceof Error ? error.message : '本地记录读取失败' });
    }
  },

  addRecord() { wx.navigateTo({ url: '/pages/record-edit/index' }); },

  editRecord(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/record-edit/index?id=${encodeURIComponent(id)}` });
  }
});

