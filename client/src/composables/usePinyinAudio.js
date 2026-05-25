// 拼音音频工具：使用 Web Speech API (speechSynthesis) 合成中文发音
// 浏览器内置，无需额外资源文件

import { ref } from 'vue';

let voices = [];
let voicesLoaded = false;

function loadVoices() {
  if (voicesLoaded) return;
  const load = () => {
    voices = window.speechSynthesis.getVoices();
    voicesLoaded = true;
  };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

function pickVoice() {
  // 优先选中文普通话声音
  const pref = ['zh-CN', 'zh_CN', 'zh'];
  for (const lang of pref) {
    const v = voices.find(v => v.lang.startsWith(lang));
    if (v) return v;
  }
  return null;
}

export function usePinyinAudio() {
  const isPlaying = ref(false);

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadVoices();
  }

  function speak(text) {
    if (!window?.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'zh-CN';
    utt.rate = 0.75;
    utt.pitch = 1.1;
    const v = pickVoice();
    if (v) utt.voice = v;
    utt.onstart = () => { isPlaying.value = true; };
    utt.onend = () => { isPlaying.value = false; };
    utt.onerror = () => { isPlaying.value = false; };
    window.speechSynthesis.speak(utt);
  }

  // 说单个字/词（直接用汉字发音，最准确）
  function speakChar(char) { speak(char); }

  // 说拼音（用对应汉字代替，发音准确）
  function speakPinyin(tts) { speak(tts); }

  // 说声调示例词
  function speakTone(tts) { speak(tts); }

  return { speak, speakChar, speakPinyin, speakTone, isPlaying };
}
