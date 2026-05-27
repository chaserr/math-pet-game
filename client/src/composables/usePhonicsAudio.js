// Phonics 音频：统一封装 Web Speech API，按 lang 切换英文 / 中文音色。
//
// 已有 usePinyinAudio.js 服务于中文。这个文件是更通用的版本：
//   - 接受 lang 参数（'en-US' / 'zh-CN'）
//   - 接受 rate / pitch 微调（phoneme 用更慢、整词用正常速）
//   - 自动等 voices 加载完成（Safari/Chrome 异步）
//
// 故意不再单独装一个 chunk 给英文：拼音那个 composable 不动，避免触动现有功能。

import { ref } from 'vue';

let voices = [];
let voicesReady = false;
let voicesPromise = null;

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve([]);
  if (voicesReady) return Promise.resolve(voices);
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise(resolve => {
    const tryRead = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length) {
        voices = v;
        voicesReady = true;
        resolve(v);
        return true;
      }
      return false;
    };
    if (tryRead()) return;
    window.speechSynthesis.onvoiceschanged = () => { tryRead(); };
    // 兜底：500ms 后再试
    setTimeout(() => tryRead(), 500);
  });
  return voicesPromise;
}

function pickVoice(lang) {
  if (!voices.length) return null;
  // 完全匹配 > 前缀匹配 > 默认
  const exact = voices.find(v => v.lang === lang);
  if (exact) return exact;
  const prefix = lang.split('-')[0];
  const partial = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
  return partial || null;
}

export function usePhonicsAudio() {
  const isPlaying = ref(false);

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadVoices();
  }

  function _speak(text, { lang = 'en-US', rate = 1, pitch = 1 } = {}) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (!text) { isPlaying.value = false; return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.rate = rate;
    utt.pitch = pitch;
    const v = pickVoice(lang);
    if (v) utt.voice = v;
    utt.onstart = () => { isPlaying.value = true; };
    utt.onend = () => { isPlaying.value = false; };
    utt.onerror = () => { isPlaying.value = false; };
    // voices 可能还没就绪，等一下再说
    if (!voicesReady) {
      loadVoices().then(() => window.speechSynthesis.speak(utt));
    } else {
      window.speechSynthesis.speak(utt);
    }
  }

  /** 朗读整词（自然语速、稍微抬调） */
  function speakWord(word, lang = 'en-US') {
    _speak(word, { lang, rate: 0.85, pitch: 1.1 });
  }

  /** 朗读单个 phoneme（更慢、更强调） */
  function speakPhoneme(phoneme, lang = 'en-US') {
    if (!phoneme) return;
    _speak(phoneme, { lang, rate: 0.6, pitch: 1.2 });
  }

  /** 朗读句子（最慢） */
  function speakSentence(text, lang = 'en-US') {
    _speak(text, { lang, rate: 0.75, pitch: 1 });
  }

  function cancel() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isPlaying.value = false;
  }

  return { speakWord, speakPhoneme, speakSentence, cancel, isPlaying };
}
