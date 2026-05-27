// 阅读引擎 · 资源解析器（单一事实源）
// ─────────────────────────────────────────────────────────────
// 设计目标：业务层（阶段组件）永远只问"给我这个词的图 / 音"，
// 而不关心它今天是 emoji + TTS、明天是真人录音 + 插画。
// 将来接入真资源时，只改本文件，零改业务。
//
// 词的资源字段约定（见 packs.js 的 ReadingWord）：
//   image: { kind:'emoji'|'asset', value }   // emoji 字符 或 资源路径
//   audio: { word?, sentence?, units?:[] }    // 预留：真人录音的资源 key/路径
//
// 当前阶段：image 走 emoji，audio 全部交给 Web Speech（usePhonicsAudio），
// 故本文件只负责"图"的解析 + 声明"是否已有真音频"两个 seam。

// 真资源根目录（将来把录音/插画放这里即可）。
const ASSET_BASE = '/reading/';

/**
 * 解析一个词的"含义图"。
 * 返回判别联合，组件按 type 渲染：
 *   { type:'emoji', value:'🐱' }
 *   { type:'image', src:'/reading/img/cat.png', alt:'cat' }
 */
export function resolveImage(word) {
  const img = word?.image;
  if (img?.kind === 'asset' && img.value) {
    return { type: 'image', src: ASSET_BASE + img.value, alt: word.text || '' };
  }
  // 兜底：emoji；连 emoji 都没有就给个星星占位
  return { type: 'emoji', value: img?.value || '✨' };
}

/**
 * 该词是否已配真人录音。
 * 今天恒为 false → 阶段组件回退到 Web Speech TTS。
 * 将来词数据里填了 audio.word 等真实 key，这里返回 true，
 * 阶段组件即可优先播放真音频。
 */
export function hasRealAudio(word) {
  return !!(word?.audio && (word.audio.word || word.audio.sentence));
}

/** 解析真人录音的播放地址（hasRealAudio 为 true 时才有意义）。 */
export function resolveAudioSrc(word, slot = 'word', unitIndex = 0) {
  const a = word?.audio;
  if (!a) return null;
  if (slot === 'word' && a.word) return ASSET_BASE + a.word;
  if (slot === 'sentence' && a.sentence) return ASSET_BASE + a.sentence;
  if (slot === 'unit' && Array.isArray(a.units) && a.units[unitIndex]) {
    return ASSET_BASE + a.units[unitIndex];
  }
  return null;
}
