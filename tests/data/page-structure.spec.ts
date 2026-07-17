import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pageRoot = resolve(process.cwd(), 'miniprogram/pages');
const pages = ['home', 'preference', 'recommendation', 'recognition-input', 'recognition-result', 'records', 'record-edit'];

describe('mini program page structure', () => {
  it.each(pages)('%s has json, ts, wxml and wxss files', (page) => {
    ['json', 'ts', 'wxml', 'wxss'].forEach((extension) => {
      expect(() => readFileSync(resolve(pageRoot, page, `index.${extension}`), 'utf8')).not.toThrow();
    });
  });

  it('registers every product page', () => {
    const app = JSON.parse(readFileSync(resolve(process.cwd(), 'miniprogram/app.json'), 'utf8')) as { pages: string[] };
    pages.forEach((page) => expect(app.pages).toContain(`pages/${page}/index`));
  });

  it('contains the agreed product copy and no shortcut note action', () => {
    const home = readFileSync(resolve(pageRoot, 'home/index.wxml'), 'utf8');
    const preference = readFileSync(resolve(pageRoot, 'preference/index.wxml'), 'utf8');
    const recommendation = readFileSync(resolve(pageRoot, 'recommendation/index.wxml'), 'utf8');
    const recognition = readFileSync(resolve(pageRoot, 'recognition-input/index.wxml'), 'utf8');
    expect(home).toContain('今晚，喝点什么。');
    expect(preference).toContain('今晚想喝点什么');
    expect(recommendation).toContain('为什么适合你');
    expect(recognition).toContain('输入酒名、英文名或主要配料');
    expect(recommendation).not.toContain('记下这杯');
  });
});

