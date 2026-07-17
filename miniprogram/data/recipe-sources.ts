export interface RecipeSource {
  cocktailId: string;
  publisher: 'International Bartenders Association';
  url: string;
  checkedAt: string;
  scope: 'name-and-ingredients';
}

const IBA_BASE = 'https://iba-world.com/iba-cocktail/';

const iba = (cocktailId: string, slug: string = cocktailId): RecipeSource => ({
  cocktailId,
  publisher: 'International Bartenders Association',
  url: `${IBA_BASE}${slug}/`,
  checkedAt: '2026-07-17',
  scope: 'name-and-ingredients'
});

// Flavor levels, aroma, texture and editorial copy are authored by 杯中事.
// These sources only validate the recognized cocktail name and principal ingredients.
export const RECIPE_SOURCES: RecipeSource[] = [
  iba('dry-martini'),
  iba('negroni'),
  iba('bees-knees'),
  iba('clover-club'),
  iba('french-75'),
  iba('aviation'),
  iba('southside', 'south-side'),
  iba('moscow-mule'),
  iba('cosmopolitan'),
  iba('espresso-martini'),
  iba('bloody-mary'),
  iba('black-russian'),
  iba('mojito'),
  iba('daiquiri'),
  iba('cuba-libre'),
  iba('mai-tai'),
  iba('pina-colada'),
  iba('dark-stormy', 'dark-n-stormy'),
  iba('margarita'),
  iba('paloma'),
  iba('tequila-sunrise'),
  iba('tommys-margarita'),
  iba('old-fashioned'),
  iba('whiskey-sour'),
  iba('manhattan'),
  iba('boulevardier'),
  iba('mint-julep'),
  iba('penicillin'),
  iba('new-york-sour'),
  iba('sazerac'),
  iba('sidecar'),
  iba('brandy-alexander', 'alexander'),
  iba('french-connection'),
  iba('aperol-spritz', 'spritz'),
  iba('americano'),
  iba('bellini'),
  iba('mimosa'),
  iba('long-island-iced-tea'),
  iba('sex-on-the-beach'),
  iba('irish-coffee')
];

export const RECIPE_SOURCE_BY_COCKTAIL_ID = new Map(
  RECIPE_SOURCES.map((source) => [source.cocktailId, source])
);

