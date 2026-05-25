<template>
  <div class="pinyin-hub col">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back" @click="router.push({ name: 'home' })">‹ 首页</button>
      <div class="hub-title">🔠 拼音专区</div>
      <span class="coin-pill">🪙 {{ auth.points }}</span>
    </div>

    <!-- 主 tab -->
    <div class="main-tabs">
      <button v-for="t in MAIN_TABS" :key="t.id"
        class="main-tab" :class="{ on: mainTab === t.id }"
        @click="mainTab = t.id"
      >{{ t.emoji }} {{ t.name }}</button>
    </div>

    <div class="body">
      <!-- ========== 学习 tab ========== -->
      <template v-if="mainTab === 'learn'">
        <div class="sub-tabs">
          <button v-for="s in LEARN_TABS" :key="s.id"
            class="sub-tab" :class="{ on: learnTab === s.id }"
            @click="learnTab = s.id"
          >{{ s.name }}</button>
        </div>

        <!-- 字母音序表 -->
        <div v-if="learnTab === 'alpha'" class="table-section">
          <h3 class="section-title">26 个字母音序表</h3>
          <div class="alpha-grid">
            <div v-for="item in ALPHABET_TABLE" :key="item.letter" class="alpha-cell">
              <div class="alpha-pair">
                <span class="alpha-upper">{{ item.letter }}</span>
                <span class="alpha-lower">{{ item.lower }}</span>
              </div>
              <div class="alpha-name">{{ item.name }}</div>
              <div class="alpha-ex">
                <span class="ex-char">{{ item.example.char }}</span>
                <span class="ex-pinyin">{{ item.example.pinyin }}</span>
              </div>
              <button class="audio-btn" @click="audio.speak(item.tts)" title="播放发音">🔊</button>
            </div>
          </div>
        </div>

        <!-- 声母表 -->
        <div v-else-if="learnTab === 'initial'" class="table-section">
          <h3 class="section-title">声母表</h3>
          <div class="group-block">
            <div class="group-label">普通声母（16 个）</div>
            <div class="phonics-grid">
              <div v-for="item in INITIALS_TABLE.regular" :key="item.id" class="phonics-cell">
                <div class="phonics-main" :style="{ color: '#54b85a' }">{{ item.display }}</div>
                <div class="phonics-ex">
                  <span>{{ item.example.char }}</span>
                  <span class="py">{{ item.example.pinyin }}</span>
                </div>
                <div class="phonics-group-tag">{{ item.group }}</div>
                <button class="audio-btn" @click="audio.speak(item.example.char)">🔊</button>
              </div>
            </div>
          </div>
          <div class="group-block" style="margin-top:18px">
            <div class="group-label">翘舌音 & 平舌音（7 个）</div>
            <div class="phonics-grid">
              <div v-for="item in INITIALS_TABLE.retroflex" :key="item.id"
                class="phonics-cell" :class="{ retroflex: item.group === '翘舌音' }"
              >
                <div class="phonics-main" :style="{ color: item.group === '翘舌音' ? '#e85b5b' : '#3a92e0' }">
                  {{ item.display }}
                </div>
                <div class="phonics-ex">
                  <span>{{ item.example.char }}</span>
                  <span class="py">{{ item.example.pinyin }}</span>
                </div>
                <div class="phonics-group-tag">{{ item.group }}</div>
                <button class="audio-btn" @click="audio.speak(item.example.char)">🔊</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 韵母表 -->
        <div v-else-if="learnTab === 'final'" class="table-section">
          <h3 class="section-title">韵母表</h3>
          <div v-for="(items, key) in FINALS_TABLE" :key="key" class="group-block">
            <div class="group-label">{{ FINALS_LABELS[key] }}</div>
            <div class="phonics-grid">
              <div v-for="item in items" :key="item.id" class="phonics-cell">
                <div class="phonics-main" style="color:#9b5cd6">{{ item.display }}</div>
                <div class="phonics-ex">
                  <span>{{ item.example.char }}</span>
                  <span class="py">{{ item.example.pinyin }}</span>
                </div>
                <button class="audio-btn" @click="audio.speak(item.example.char)">🔊</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 整体认读音节 -->
        <div v-else-if="learnTab === 'whole'" class="table-section">
          <h3 class="section-title">整体认读音节（16 个）</h3>
          <p class="tip-text">这些音节不能拆开拼读，需要整体记忆</p>
          <div class="phonics-grid whole-grid">
            <div v-for="item in WHOLE_SYLLABLES" :key="item.id" class="phonics-cell whole-cell">
              <div class="phonics-main" style="color:#f0a93a; font-size:20px">{{ item.display }}</div>
              <div class="phonics-ex">
                <span>{{ item.example.char }}</span>
                <span class="py">{{ item.example.pinyin }}</span>
              </div>
              <button class="audio-btn" @click="audio.speak(item.example.char)">🔊</button>
            </div>
          </div>
        </div>

        <!-- 声调表 -->
        <div v-else-if="learnTab === 'tone'" class="table-section">
          <h3 class="section-title">声调表</h3>
          <div class="tone-grid">
            <div v-for="item in TONES_TABLE" :key="item.tone" class="tone-card"
              :style="{ borderColor: item.color, '--tc': item.color }"
            >
              <div class="tone-number">{{ item.tone === 0 ? '轻声' : item.tone + '声' }}</div>
              <div class="tone-name">{{ item.name }}</div>
              <div class="tone-symbol" :style="{ color: item.color }">{{ item.symbol }}</div>
              <div class="tone-marks">
                <span v-for="m in item.marks" :key="m" class="tone-mark">{{ m }}</span>
              </div>
              <div class="tone-desc">{{ item.desc }}</div>
              <div class="tone-mnemonic">示例：<b>{{ item.mnemonic }}</b></div>
              <button class="audio-btn" @click="audio.speak(item.tts)">🔊 听示例</button>
            </div>
          </div>
          <!-- 声调对比：妈麻马骂吗 -->
          <div class="tone-compare">
            <h4>声调对比：妈 麻 马 骂 吗</h4>
            <div class="tone-compare-row">
              <div v-for="(w, i) in ['妈 mā','麻 má','马 mǎ','骂 mà','吗 ma']" :key="i"
                class="tc-item" :style="{ color: TONES_TABLE[i]?.color || '#666' }"
              >
                <span class="tc-word">{{ w.split(' ')[0] }}</span>
                <span class="tc-py">{{ w.split(' ')[1] }}</span>
                <button class="audio-btn small" @click="audio.speak(w.split(' ')[0])">🔊</button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ========== 练习 tab ========== -->
      <template v-else-if="mainTab === 'practice'">
        <div class="practice-header">
          <h3 class="section-title">✏️ 填写拼音</h3>
          <p class="tip-text">把字母积木拖入对应位置，拼出汉字的拼音</p>
        </div>
        <FillPinyinSection />
      </template>

      <!-- ========== 课本 tab ========== -->
      <template v-else-if="mainTab === 'books'">
        <h3 class="section-title" style="margin-bottom:14px">📚 拼音课本资源</h3>
        <p class="tip-text">点击下方课本可在线翻阅；若本地未放置 PDF，会指引你下载并放到正确位置。</p>
        <div class="book-cards">
          <button v-for="b in PINYIN_BOOKS" :key="b.id" class="book-card" @click="openPdf(b)">
            <span class="bc-emoji">{{ b.emoji }}</span>
            <div class="bc-info">
              <span class="bc-name">{{ b.name }}</span>
              <span class="bc-desc">{{ b.desc }}</span>
            </div>
            <span class="bc-go">📖</span>
          </button>
        </div>
        <Teleport to="body">
          <div v-if="showPdf" class="pdf-modal" @click.self="closePdf">
            <div class="pdf-modal-inner">
              <div class="pdf-modal-head">
                <span>{{ showPdf.name }}</span>
                <button class="pdf-close" @click="closePdf">✕</button>
              </div>

              <!-- 探测中 -->
              <div v-if="pdfState === 'loading'" class="pdf-state">
                <div class="ps-spinner">⏳</div>
                <p>正在加载课本…</p>
              </div>

              <!-- 资源缺失：引导下载 + 放置路径 -->
              <div v-else-if="pdfState === 'missing'" class="pdf-missing">
                <div class="pm-emoji">📭</div>
                <h4>本地暂无这本课本</h4>
                <p class="pm-line">这本 PDF 体积较大，没有放进代码仓库。请到下面这个开源教材仓库下载：</p>
                <a class="pm-repo" :href="TEXTBOOK_REPO" target="_blank" rel="noopener">
                  {{ TEXTBOOK_REPO }}
                </a>
                <p class="pm-line">下载后把文件放到下面这个完整路径（文件名需保持一致）：</p>
                <code class="pm-path">{{ missingLocalPath }}</code>
                <button class="pm-retry" @click="openPdf(showPdf)">放好了，重新加载 ↻</button>
              </div>

              <!-- 正常预览 -->
              <iframe v-else :src="showPdf.path" class="pdf-frame" loading="lazy"></iframe>
            </div>
          </div>
        </Teleport>
      </template>

      <!-- ========== 游戏天地 tab ========== -->
      <template v-else-if="mainTab === 'games'">
        <div class="game-selector" v-if="!currentGame">
          <h3 class="section-title">🎮 游戏天地</h3>
          <div class="game-cards">
            <button class="game-card" @click="currentGame = 'match'">
              <div class="gc-emoji">🎯</div>
              <div class="gc-name">拼音消消乐</div>
              <div class="gc-desc">找到汉字对应的拼音，点击消除</div>
            </button>
            <button class="game-card" @click="currentGame = 'snake'">
              <div class="gc-emoji">🐍</div>
              <div class="gc-name">拼音贪吃蛇</div>
              <div class="gc-desc">控制蛇吃字母，拼出汉字的拼音</div>
            </button>
          </div>
        </div>
        <template v-else>
          <button class="btn-back-game" @click="currentGame = null">‹ 返回游戏列表</button>
          <MatchGame v-if="currentGame === 'match'" />
          <SnakeGame v-else-if="currentGame === 'snake'" />
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { usePinyinAudio } from '../composables/usePinyinAudio.js';
import {
  ALPHABET_TABLE, INITIALS_TABLE, FINALS_TABLE,
  WHOLE_SYLLABLES, TONES_TABLE,
} from '../lib/pinyin-data.js';
import { checkPdfExists, localPdfPath, TEXTBOOK_REPO } from '../lib/pdfResource.js';
import FillPinyinSection from '../components/PinyinFillGame.vue';
import MatchGame from '../components/PinyinMatchGame.vue';
import SnakeGame from '../components/PinyinSnakeGame.vue';

const router = useRouter();
const auth = useAuthStore();
const audio = usePinyinAudio();

const MAIN_TABS = [
  { id: 'learn',    name: '学习',   emoji: '📖' },
  { id: 'practice', name: '练习',   emoji: '✏️' },
  { id: 'games',    name: '游戏天地', emoji: '🎮' },
  { id: 'books',    name: '课本',   emoji: '📚' },
];

const LEARN_TABS = [
  { id: 'alpha',   name: '字母音序' },
  { id: 'initial', name: '声母' },
  { id: 'final',   name: '韵母' },
  { id: 'whole',   name: '整体认读' },
  { id: 'tone',    name: '声调' },
];

const FINALS_LABELS = {
  single:     '单韵母（6 个）',
  compound:   '复韵母（9 个）',
  nasal_front:'前鼻音韵母（5 个）',
  nasal_back: '后鼻音韵母（4 个）',
};

const mainTab  = ref('learn');
const learnTab = ref('alpha');
const currentGame = ref(null);
const showPdf  = ref(null);
const pdfState = ref('loading'); // 'loading' | 'ok' | 'missing'
const missingLocalPath = ref('');

const PINYIN_BOOKS = [
  { id: 'lesson-up',   name: '拼音课程（上）', desc: '幼儿拼音学习课程上册', emoji: '📗', path: '/textbooks/chinese/pinyin/拼音课程-上.pdf' },
  { id: 'lesson-down', name: '拼音课程（下）', desc: '幼儿拼音学习课程下册', emoji: '📘', path: '/textbooks/chinese/pinyin/拼音课程-下.pdf' },
  { id: 'workbook-1',  name: '练习册①',       desc: '拼音练习册第一册',      emoji: '📙', path: '/textbooks/chinese/pinyin/练习册-上.pdf' },
  { id: 'workbook-2',  name: '练习册②',       desc: '拼音练习册第二册',      emoji: '📕', path: '/textbooks/chinese/pinyin/练习册-下.pdf' },
];

async function openPdf(book) {
  showPdf.value = book;
  pdfState.value = 'loading';
  missingLocalPath.value = localPdfPath(book.path);
  const ok = await checkPdfExists(book.path);
  // 期间用户可能已关闭弹窗
  if (showPdf.value?.id !== book.id) return;
  pdfState.value = ok ? 'ok' : 'missing';
}
function closePdf() { showPdf.value = null; }
</script>

<style scoped>
.pinyin-hub { flex: 1; min-height: 0; }
.hub-title { font-size: 18px; font-weight: 900; color: #54b85a; }

/* 主 tab */
.main-tabs { display: flex; gap: 8px; padding: 10px 14px 0; border-bottom: 2px solid #f0e6d8; }
.main-tab {
  padding: 8px 20px; font-family: inherit; font-weight: 800; font-size: 14px;
  background: #fff; color: #9b8b7a; border-radius: 12px 12px 0 0;
  border: 2px solid #f0e6d8; border-bottom: none; cursor: pointer;
}
.main-tab.on { background: #e8f8ee; color: #54b85a; border-color: #54b85a; }

/* 子 tab */
.sub-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.sub-tab {
  padding: 6px 16px; font-family: inherit; font-weight: 800; font-size: 13px;
  background: #fff; color: #9b8b7a; border-radius: 999px;
  border: 2px solid #e0d8cc; cursor: pointer;
}
.sub-tab.on { background: #54b85a; color: #fff; border-color: #54b85a; }

.body { flex: 1; overflow-y: auto; padding: 14px 18px 28px; }

/* 表格通用 */
.table-section { display: flex; flex-direction: column; gap: 14px; }
.section-title {
  font-size: 17px; font-weight: 900; color: var(--ink);
  margin: 0 0 4px; padding-bottom: 8px; border-bottom: 2px solid #f0e6d8;
}
.tip-text { color: #9b8b7a; font-size: 13px; margin: 0 0 8px; }

/* 字母音序表 */
.alpha-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px;
}
.alpha-cell {
  background: #fffdf6; border: 2px solid #f0e6d8; border-radius: 14px; padding: 10px 8px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  box-shadow: 0 3px 0 var(--shadow);
}
.alpha-pair { display: flex; gap: 4px; align-items: baseline; }
.alpha-upper { font-size: 22px; font-weight: 900; color: #3a92e0; }
.alpha-lower { font-size: 18px; font-weight: 700; color: #54b85a; }
.alpha-name  { font-size: 13px; font-weight: 700; color: #9b5cd6; }
.alpha-ex    { display: flex; flex-direction: column; align-items: center; }
.ex-char     { font-size: 15px; font-weight: 900; color: var(--ink); }
.ex-pinyin   { font-size: 11px; color: #9b8b7a; }

/* 声母 / 韵母共用 */
.group-block { background: #fffdf6; border-radius: 14px; padding: 12px; border: 2px solid #f0e6d8; }
.group-label { font-size: 13px; font-weight: 900; color: #9b8b7a; margin-bottom: 10px; }
.phonics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
.whole-grid   { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); }
.phonics-cell {
  background: #fff; border: 2px solid #f0e6d8; border-radius: 12px; padding: 8px 6px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  box-shadow: 0 2px 0 var(--shadow);
}
.whole-cell { min-width: 80px; }
.phonics-main { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
.phonics-ex   { display: flex; flex-direction: column; align-items: center; font-size: 13px; }
.phonics-ex .py { font-size: 11px; color: #9b8b7a; }
.phonics-group-tag { font-size: 10px; color: #9b8b7a; background: #f0e6d8; padding: 1px 6px; border-radius: 999px; }

/* 声调表 */
.tone-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;
}
.tone-card {
  background: #fffdf6; border: 3px solid var(--tc); border-radius: 16px; padding: 16px 14px;
  display: flex; flex-direction: column; gap: 6px; box-shadow: 0 4px 0 var(--shadow);
}
.tone-number { font-size: 22px; font-weight: 900; color: var(--tc); }
.tone-name   { font-size: 13px; font-weight: 700; color: var(--ink); }
.tone-symbol { font-size: 36px; font-weight: 900; line-height: 1.2; }
.tone-marks  { display: flex; gap: 6px; flex-wrap: wrap; }
.tone-mark   { font-size: 18px; font-weight: 700; color: var(--tc); }
.tone-desc   { font-size: 12px; color: #9b8b7a; }
.tone-mnemonic { font-size: 13px; color: var(--ink); }
.tone-compare { background: #fffdf6; border-radius: 16px; padding: 16px; margin-top: 8px; border: 2px solid #f0e6d8; }
.tone-compare h4 { margin: 0 0 12px; font-size: 15px; color: var(--ink); }
.tone-compare-row { display: flex; gap: 14px; flex-wrap: wrap; }
.tc-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.tc-word { font-size: 32px; font-weight: 900; }
.tc-py   { font-size: 14px; font-weight: 700; }

/* 音频按钮 */
.audio-btn {
  background: #f0f8f2; color: #54b85a; border: 2px solid #c0e8cc;
  border-radius: 8px; padding: 4px 8px; font-size: 12px; cursor: pointer;
  font-weight: 800; transition: background 0.12s;
}
.audio-btn:hover { background: #d0f0da; }
.audio-btn.small { font-size: 11px; padding: 2px 6px; }

/* 游戏入口 */
.game-cards { display: flex; gap: 14px; flex-wrap: wrap; }
.game-card {
  flex: 1; min-width: 200px; background: #fffdf6;
  border: 3px solid #f0e6d8; border-radius: 20px; padding: 24px 20px;
  font-family: inherit; cursor: pointer; text-align: center;
  box-shadow: 0 5px 0 var(--shadow); transition: transform 0.12s;
}
.game-card:hover { transform: translateY(-4px); border-color: #54b85a; }
.gc-emoji { font-size: 48px; }
.gc-name  { font-size: 18px; font-weight: 900; color: var(--ink); margin: 8px 0 4px; }
.gc-desc  { font-size: 13px; color: #9b8b7a; }

.btn-back-game {
  background: #fff; color: var(--ink); padding: 8px 18px;
  font-family: inherit; font-weight: 800; border-radius: 12px;
  border: 2px solid #e0d8cc; box-shadow: 0 3px 0 var(--shadow);
  cursor: pointer; margin-bottom: 14px;
}

/* 课本资源 */
.book-cards { display: flex; flex-direction: column; gap: 10px; max-width: 600px; }
.book-card {
  display: flex; align-items: center; gap: 14px;
  background: #fffdf6; border: 3px solid #f0e6d8; border-radius: 16px; padding: 14px 16px;
  font-family: inherit; cursor: pointer; box-shadow: 0 3px 0 var(--shadow); transition: transform 0.1s;
  text-align: left;
}
.book-card:hover { transform: translateX(4px); border-color: #54b85a; }
.bc-emoji { font-size: 32px; }
.bc-info  { flex: 1; display: flex; flex-direction: column; }
.bc-name  { font-size: 16px; font-weight: 900; color: var(--ink); }
.bc-desc  { font-size: 12px; color: #9b8b7a; font-weight: 700; }
.bc-go    { font-size: 20px; }

/* PDF 弹层 */
.pdf-modal {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.pdf-modal-inner {
  background: #fff; border-radius: 16px;
  width: min(960px, 95vw); height: min(90vh, 95vh);
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.pdf-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; background: #54b85a; color: #fff; font-weight: 900;
}
.pdf-close {
  background: rgba(255,255,255,0.2); color: #fff;
  width: 32px; height: 32px; border: none; border-radius: 50%;
  font-size: 18px; font-weight: 900; cursor: pointer;
}
.pdf-close:hover { background: rgba(255,255,255,0.35); }
.pdf-frame { flex: 1; border: 0; width: 100%; background: #f4f0e6; }

/* PDF 加载中 */
.pdf-state {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; color: #9b8b7a; font-weight: 800;
}
.ps-spinner { font-size: 40px; animation: spin 1.4s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* PDF 缺失引导 */
.pdf-missing {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 28px; text-align: center;
}
.pm-emoji { font-size: 56px; }
.pdf-missing h4 { margin: 0; font-size: 20px; color: var(--ink); }
.pm-line { margin: 0; font-size: 14px; color: #9b8b7a; max-width: 460px; }
.pm-repo {
  font-size: 15px; font-weight: 800; color: #3a92e0;
  word-break: break-all; padding: 8px 16px;
  background: #f0f8ff; border: 2px solid #b0d4f0; border-radius: 12px;
  text-decoration: none;
}
.pm-repo:hover { background: #e0f0ff; }
.pm-path {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 13px; color: #2e7a3c;
  background: #f0fff4; border: 2px solid #b0e0c0; border-radius: 10px;
  padding: 10px 14px; word-break: break-all; max-width: 520px;
}
.pm-retry {
  margin-top: 4px; background: #54b85a; color: #fff;
  padding: 10px 24px; font-family: inherit; font-weight: 900; font-size: 14px;
  border-radius: 12px; cursor: pointer; box-shadow: 0 3px 0 #3a8a42;
}
.pm-retry:hover { transform: translateY(-2px); }
</style>
