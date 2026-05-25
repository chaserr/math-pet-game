#!/usr/bin/env node
/**
 * Preflight: rollup 平台原生二进制自动补装
 *
 * 背景：npm 已知 bug（https://github.com/npm/cli/issues/4828）
 * 当 node_modules 在不同 OS / arch 之间共享（macOS x64 / arm64 / Codex Linux 容器…），
 * 同一份 package-lock.json 只会保留首次安装时记录的平台二进制，
 * 跨平台切换后 vite 启动报：Cannot find module @rollup/rollup-<platform>-<arch>
 *
 * 该脚本在 `npm run dev` / `npm run build` 之前自动检测当前平台对应的
 * @rollup/rollup-<platform>-<arch> 是否在 node_modules 下，缺则用当前 rollup 版本
 * 临时安装一份（--no-save，不污染 package.json / lock）。
 *
 * 已存在时 5ms 退出，无开销。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLATFORM_MAP = {
  'darwin-arm64':  '@rollup/rollup-darwin-arm64',
  'darwin-x64':    '@rollup/rollup-darwin-x64',
  'linux-arm64':   '@rollup/rollup-linux-arm64-gnu',
  'linux-x64':     '@rollup/rollup-linux-x64-gnu',
  'win32-arm64':   '@rollup/rollup-win32-arm64-msvc',
  'win32-x64':     '@rollup/rollup-win32-x64-msvc',
};

const key = `${process.platform}-${process.arch}`;
const pkg = PLATFORM_MAP[key];
if (!pkg) process.exit(0); // 不认识的平台不阻塞，让 vite 报真错

const target = path.join(process.cwd(), 'node_modules', ...pkg.split('/'));
if (fs.existsSync(target)) process.exit(0);

// 读 rollup 主包的版本，按相同版本装平台子包
let version;
try {
  version = require(path.join(process.cwd(), 'node_modules', 'rollup', 'package.json')).version;
} catch {
  console.warn('[preflight] rollup 主包尚未安装，跳过');
  process.exit(0);
}

console.log(`[preflight] 当前平台 ${key} 缺少 ${pkg}，正在安装 ${pkg}@${version} (no-save)…`);
try {
  execSync(`npm i ${pkg}@${version} --no-save --no-audit --no-fund --silent`, { stdio: 'inherit' });
  console.log('[preflight] 安装完成。');
} catch (e) {
  console.error('[preflight] 自动安装失败：', e.message);
  console.error('[preflight] 请手动执行：rm -rf node_modules package-lock.json && npm i');
  process.exit(0); // 不阻塞，让 vite 报真错
}
