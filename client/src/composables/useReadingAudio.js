// 阅读引擎 · 集中音频解析（单一入口）
// ─────────────────────────────────────────────────────────────
// 阶段组件不再各自直连 TTS，而是统一通过本 composable 播音。
// 这样"换资源只改一处"才落到实处：
//   - 词数据声明了 audio（真人录音）→ 优先播放真音频
//   - 否则回退 Web Speech TTS（英文 usePhonicsAudio / 中文 usePinyinAudio）
//
// 词的 audio 字段约定见 lib/reading/resources.js + public/reading/README.md。
// 真音频加载失败（文件未放置 / 网络错误）也会自动回退 TTS，绝不静默。

import { usePhonicsAudio } from './usePhonicsAudio.js';
import { usePinyinAudio } from './usePinyinAudio.js';
import { hasRealAudio, resolveAudioSrc } from '../lib/reading/resources.js';

function isZh(word) {
  return String(word?.lang || '').toLowerCase().startsWith('zh');
}

export function useReadingAudio() {
  const phonics = usePhonicsAudio();
  const pinyin = usePinyinAudio();
  let el = null; // 当前播放的 <audio>

  function stopAudio() {
    if (el) { try { el.pause(); } catch { /* ignore */ } el = null; }
  }

  // 先尝试真音频，失败/缺失则 ttsFallback()
  function playSrcOrTTS(src, ttsFallback) {
    if (!src) return ttsFallback();
    stopAudio();
    el = new Audio(src);
    el.onerror = () => { el = null; ttsFallback(); };
    const p = el.play();
    if (p && typeof p.catch === 'function') p.catch(() => { el = null; ttsFallback(); });
  }

  /** 整词 / 整字 */
  function playWord(word) {
    const tts = () => (isZh(word) ? pinyin.speakChar(word.text) : phonics.speakWord(word.text, word.lang));
    playSrcOrTTS(hasRealAudio(word) ? resolveAudioSrc(word, 'word') : null, tts);
  }

  /** 单个拼读单元（字母 phoneme / 拼音 piece）。中文无法孤立发 piece → 回退整字锚点。 */
  function playUnit(word, i) {
    const u = word.units?.[i];
    const tts = () => {
      if (isZh(word)) pinyin.speakChar(word.text);
      else phonics.speakPhoneme(u?.silent ? 'shh' : u?.sound, word.lang);
    };
    playSrcOrTTS(hasRealAudio(word) ? resolveAudioSrc(word, 'unit', i) : null, tts);
  }

  /** 整句 */
  function playSentence(word) {
    const text = word.sentence?.text || word.text;
    const tts = () => (isZh(word) ? pinyin.speak(text) : phonics.speakSentence(text, word.lang));
    playSrcOrTTS(hasRealAudio(word) ? resolveAudioSrc(word, 'sentence') : null, tts);
  }

  /** 任意文本（如句子里的干扰词卡），仅走 TTS（无对应真音频概念）。 */
  function speakText(text, lang = 'en-US') {
    if (!text) return;
    if (String(lang).toLowerCase().startsWith('zh')) pinyin.speak(text);
    else phonics.speakWord(text, lang);
  }

  function cancel() {
    stopAudio();
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }

  return { playWord, playUnit, playSentence, speakText, cancel };
}
