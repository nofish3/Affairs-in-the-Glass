import { COCKTAILS, COCKTAIL_BY_ID } from '../../data/cocktails';
import { getNextRecommendation } from '../../services/recommendation-service';
import { getRecommendationSession, setCurrentRecommendation } from '../../stores/recommendation-session';
import { cocktailView } from '../../utils/presentation';

Page({
  data: {
    cocktail: null as ReturnType<typeof cocktailView> | null,
    reasons: [] as string[],
    relaxed: false,
    changing: false,
    showChangePrompt: false
  },

  onLoad() { this.loadCurrent(); },

  loadCurrent() {
    const session = getRecommendationSession();
    if (!session?.current) {
      wx.showToast({ title: '请先选择口味', icon: 'none' });
      setTimeout(() => wx.redirectTo({ url: '/pages/preference/index' }), 500);
      return;
    }
    const cocktail = COCKTAIL_BY_ID.get(session.current.cocktailId);
    if (!cocktail) return;
    this.setData({
      cocktail: cocktailView(cocktail),
      reasons: session.current.reasons.map((reason) => reason.text),
      relaxed: session.current.matchType === 'relaxed',
      changing: false
    });
  },

  changeDrink() {
    if (this.data.changing) return;
    const session = getRecommendationSession();
    if (!session?.current) return;
    this.setData({ changing: true });
    const result = getNextRecommendation(
      session.preference,
      COCKTAILS,
      session.shownCocktailIds,
      session.current.cocktailId
    );
    if (!result) {
      this.setData({ changing: false });
      wx.showToast({ title: '暂时没有别的酒了', icon: 'none' });
      return;
    }
    const updated = setCurrentRecommendation(result, true);
    this.loadCurrent();
    if (updated.changeCount === 3) this.setData({ showChangePrompt: true });
  },

  reselect() { wx.navigateBack(); },
  continueChange() { this.setData({ showChangePrompt: false }); },
  promptReselect() { this.setData({ showChangePrompt: false }); wx.navigateBack(); },
  closePrompt() { this.setData({ showChangePrompt: false }); }
});

