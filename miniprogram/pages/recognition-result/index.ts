import { COCKTAIL_BY_ID } from '../../data/cocktails';
import { INGREDIENT_BY_ID } from '../../data/ingredients';
import { getRecognitionSession } from '../../stores/recognition-session';
import { cocktailView, ingredientResultView } from '../../utils/presentation';

Page({
  data: {
    resultType: '' as 'cocktail' | 'ingredient-combination' | 'not-found' | '',
    cocktail: null as ReturnType<typeof cocktailView> | null,
    combination: null as ReturnType<typeof ingredientResultView> | null,
    extraIngredientNames: [] as string[],
    extraIngredientNamesText: '',
    unrecognizedTokens: [] as string[],
    unrecognizedText: '',
    input: ''
  },

  onLoad() {
    const session = getRecognitionSession();
    if (!session) {
      wx.redirectTo({ url: '/pages/recognition-input/index' });
      return;
    }
    const { result, input } = session;
    if (result.type === 'cocktail') {
      const cocktail = COCKTAIL_BY_ID.get(result.cocktailId);
      if (!cocktail) {
        this.setData({ resultType: 'not-found', input, unrecognizedTokens: result.unrecognizedTokens, unrecognizedText: result.unrecognizedTokens.join('、') });
        return;
      }
      this.setData({
        resultType: 'cocktail',
        input,
        cocktail: cocktailView(cocktail),
        extraIngredientNames: result.recognizedExtraIngredientIds.map((id) => INGREDIENT_BY_ID.get(id)?.name ?? id),
        extraIngredientNamesText: result.recognizedExtraIngredientIds.map((id) => INGREDIENT_BY_ID.get(id)?.name ?? id).join('、'),
        unrecognizedTokens: result.unrecognizedTokens,
        unrecognizedText: result.unrecognizedTokens.join('、')
      });
      return;
    }
    if (result.type === 'ingredient-combination') {
      this.setData({ resultType: result.type, input, combination: ingredientResultView(result), unrecognizedTokens: result.unrecognizedTokens, unrecognizedText: result.unrecognizedTokens.join('、') });
      return;
    }
    this.setData({ resultType: 'not-found', input, unrecognizedTokens: result.unrecognizedTokens, unrecognizedText: result.unrecognizedTokens.join('、') });
  },

  reenter() { wx.navigateBack(); }
});
