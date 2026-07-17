# 杯中事数据来源说明

## 发布原则

- 第一版仅启用 41 款具有可追溯来源的含酒精鸡尾酒。
- 其中 40 款的中文名、英文名和主要配料以 International Bartenders Association（IBA）当前官方条目为基线。
- IBA 当前清单未覆盖、但酒吧中常见的酒款，必须绑定可逐项核验的行业或品牌官方资料；首版金汤力采用 The Bar 的官方条目。
- 小程序只展示配料名称，不展示 IBA 配方中的毫升数、比例或制作步骤。
- 酸甜苦咸鲜辣等级、主香气、酒感、口感、推荐标签和饮用描述是杯中事的编辑性判断，不是 IBA 的官方结论。
- 每条来源记录保存在 `miniprogram/data/recipe-sources.ts`，包含具体 URL 与核验日期。
- 缺少可靠来源的酒款可以保留为 `enabled: false` 草稿，但不会参与推荐或识别。

## 核验流程

1. 从 IBA 官方站点地图获取当前鸡尾酒条目。
2. 逐杯核对官方条目的名称和 Ingredients 区域。
3. 将主要材料映射到杯中事的统一配料 ID。
4. 运行数据校验，确保所有启用酒款都有来源、配料引用有效、别名无冲突。
5. 对配料或酒款数据的任何修改执行全量推荐与识别回归。

## 来源

- IBA Cocktail List: https://iba-world.com/iba-cocktail-list/
- IBA Cocktail Sitemap: https://iba-world.com/wp-sitemap-posts-iba-cocktail-1.xml
- The Bar, Gin and Tonic: https://www.thebar.com/en-gb/recipes/gin-and-tonic

具体酒款条目 URL 见 `miniprogram/data/recipe-sources.ts`。
