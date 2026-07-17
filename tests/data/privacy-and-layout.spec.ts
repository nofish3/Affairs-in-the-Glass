import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const miniProgramRoot = resolve(process.cwd(), 'miniprogram');
const pageRoot = join(miniProgramRoot, 'pages');

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe('privacy, offline and layout safeguards', () => {
  it('does not call network, cloud, login or private-permission APIs', () => {
    const sourceFiles = filesUnder(miniProgramRoot).filter((path) => /\.(ts|wxml|json)$/.test(path));
    const source = sourceFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
    const forbiddenApis = [
      'wx.request', 'wx.uploadFile', 'wx.downloadFile', 'wx.login', 'wx.getUserProfile',
      'wx.authorize', 'wx.getLocation', 'wx.chooseLocation', 'wx.chooseMedia',
      'wx.chooseImage', 'wx.chooseAddress', 'wx.chooseContact', 'wx.cloud'
    ];
    forbiddenApis.forEach((api) => expect(source, api).not.toContain(api));
  });

  it('keeps user-facing privacy and responsible-drinking notices visible', () => {
    const records = readFileSync(join(pageRoot, 'records/index.wxml'), 'utf8');
    const home = readFileSync(join(pageRoot, 'home/index.wxml'), 'utf8');
    expect(records).toContain('记录只保存在当前设备');
    expect(records).toContain('清理缓存或更换手机后可能丢失');
    expect(home).toContain('理性饮酒');
    expect(home).toContain('未成年人请勿饮酒');
  });

  it('reserves content and device safe-area space for every fixed action', () => {
    const globalStyles = readFileSync(join(miniProgramRoot, 'app.wxss'), 'utf8');
    expect(globalStyles).toMatch(/\.page-with-action\s*\{[^}]*padding-bottom:/s);
    expect(globalStyles).toMatch(/\.fixed-action\s*\{[^}]*env\(safe-area-inset-bottom\)/s);

    ['preference', 'recommendation', 'recognition-input', 'record-edit'].forEach((page) => {
      const template = readFileSync(join(pageRoot, `${page}/index.wxml`), 'utf8');
      expect(template, page).toContain('page-with-action');
      expect(template, page).toContain('class="fixed-action"');
    });
  });

  it('does not expose a shortcut record action from recommendation or recognition results', () => {
    ['recommendation', 'recognition-result'].forEach((page) => {
      const template = readFileSync(join(pageRoot, `${page}/index.wxml`), 'utf8');
      expect(template).not.toContain('记下这杯');
      expect(template).not.toContain('/pages/record-edit/index');
    });
  });
});
