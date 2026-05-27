<template>
  <div class="hub col">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back" @click="router.push({ name: 'home' })">‹ 首页</button>
      <div class="hub-title">📖 阅读乐园</div>
      <div class="top-right">
        <button class="album-btn" @click="showAlbum = true">🗂️ 集字册</button>
        <span class="coin-pill">🪙 {{ auth.points }}</span>
      </div>
    </div>

    <div class="body">
      <p class="lead">没有关卡、没有计时，<b>看图 · 拼词 · 读句子</b>，慢慢探索每一个词～</p>

      <!-- 语言切换 -->
      <div class="lang-tabs">
        <button v-for="l in LANGS" :key="l.id"
          class="lang-tab" :class="{ active: lang === l.id }"
          @click="selectLang(l.id)"
        >{{ l.emoji }} {{ l.name }}</button>
      </div>

      <!-- 进度统计 + 一键继续 -->
      <div class="stats">
        <div class="stat"><span class="s-num">{{ langExplored }}</span><span class="s-lab">已集字</span></div>
        <div class="stat"><span class="s-num">{{ langPacksDone }} / {{ packs.length }}</span><span class="s-lab">词包集齐 🏅</span></div>
        <div class="stat"><span class="s-num">{{ langPct }}%</span><span class="s-lab">总进度</span></div>
        <button v-if="recommendation" class="btn-continue" @click="continueExplore">
          ▶️ {{ langExplored ? '继续探索' : '开始探索' }}
        </button>
        <span v-else class="all-done">🎉 全部集齐！</span>
      </div>

      <!-- 词包网格 -->
      <div class="pack-grid">
        <div v-for="p in packs" :key="p.id" class="pack-card" :style="{ borderColor: p.color }">
          <div class="pc-head">
            <span class="pc-emoji" :style="{ background: p.color + '22' }">{{ p.emoji }}</span>
            <div class="pc-meta">
              <h3>{{ p.name }} <span v-if="isPackDone(p)" class="done-badge" title="已集齐">🏅</span></h3>
              <span class="pc-count">{{ doneOf(p) }} / {{ p.words.length }} 个词</span>
            </div>
          </div>
          <div class="pc-bar"><div class="pc-fill" :style="{ width: pctOf(p) + '%', background: p.color }"></div></div>
          <div class="pc-actions">
            <button class="btn-explore" :style="{ background: p.color }" @click="openPack(p)">探索 →</button>
            <button v-if="p.challenge" class="btn-challenge" @click="goChallenge(p)">🏆 挑战关</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 词卡选择浮层 -->
    <Teleport to="body">
      <div v-if="activePack && !playWord" class="overlay" @click.self="activePack = null">
        <div class="word-picker col">
          <button class="close" @click="activePack = null">✕</button>
          <h3 class="wp-title">{{ activePack.emoji }} {{ activePack.name }}</h3>
          <p class="wp-tip">点一个词，开始探索它的故事</p>
          <div class="word-grid">
            <button v-for="w in activePack.words" :key="w.id"
              class="word-cell" :class="{ done: exploredIds.has(w.id) }"
              @click="startWord(w)"
            >
              <span class="wc-emoji">{{ w.image?.value || '✨' }}</span>
              <span class="wc-text">{{ w.text }}</span>
              <span v-if="exploredIds.has(w.id)" class="wc-badge">⭐</span>
            </button>
          </div>
          <button v-if="activePack.challenge" class="btn-challenge wide" @click="goChallenge(activePack)">
            🏆 去挑战关（计分掉口粮）
          </button>
        </div>
      </div>
    </Teleport>

    <!-- 集字册：跨词包收集墙 -->
    <Teleport to="body">
      <div v-if="showAlbum" class="overlay" @click.self="showAlbum = false">
        <div class="album col">
          <button class="close" @click="showAlbum = false">✕</button>
          <h3 class="album-title">🗂️ 我的集字册</h3>
          <p class="album-sum">已收集 <b>{{ albumDone }}</b> / {{ albumTotal }} 个词</p>
          <div class="album-achieve">
            <span class="ach-badges">{{ completedPackCount }} / {{ totalPackCount }} 🏅</span>
            <span class="ach-msg">{{ albumMilestone }}</span>
          </div>
          <div class="album-body">
            <div v-for="p in allPacks" :key="p.id" class="album-pack">
              <div class="ap-head">
                <span>{{ p.emoji }} {{ p.name }} <span v-if="isPackDone(p)" class="done-badge">🏅</span></span>
                <span class="ap-count">{{ doneOf(p) }}/{{ p.words.length }}</span>
              </div>
              <div class="sticker-row">
                <div v-for="w in p.words" :key="w.id"
                  class="sticker" :class="{ got: albumSet(p.id).has(w.id) }"
                  :title="albumSet(p.id).has(w.id) ? w.text : '还没探索'"
                >
                  <template v-if="albumSet(p.id).has(w.id)">
                    <span class="st-emoji">{{ w.image?.value || '✨' }}</span>
                    <span class="st-text">{{ w.text }}</span>
                  </template>
                  <span v-else class="st-lock">？</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 阅读管线全屏浮层 -->
    <Teleport to="body">
      <div v-if="playWord" class="fullscreen col">
        <button class="fs-close" @click="closePlayer">✕</button>

        <ReadingPlayer
          v-if="!finished"
          :word="playWord"
          :pack="activePack"
          :companion-pet-id="companion.petId"
          :companion-level="companion.level"
          @finished="onFinished"
        />

        <!-- 完成庆祝 -->
        <div v-else class="celebrate col">
          <div class="cele-stage">
            <span class="cele-emoji">{{ playWord.image?.value || '🎉' }}</span>
            <PetSprite class="cele-pet" :pet-id="companion.petId" mood="happy" :level="companion.level" :size="96" />
          </div>
          <h2 class="cele-word">{{ playWord.text }}</h2>
          <p class="cele-msg">{{ celeMsg }}</p>

          <!-- 整包完成奖励 -->
          <div v-if="rewardInfo" class="reward">
            <span v-if="rewardInfo.coins" class="reward-pill">🪙 +{{ rewardInfo.coins }}</span>
            <span v-if="rewardInfo.food" class="reward-pill">🍱 {{ rewardInfo.food.name }} ×{{ rewardInfo.food.qty }}</span>
          </div>

          <div class="cele-actions">
            <button v-if="nextWord" class="btn-explore" @click="startWord(nextWord)">下一个词 →</button>
            <button class="btn-replay" @click="startWord(playWord)">再玩一遍 ↻</button>
            <button class="btn-back" @click="closePlayer">回词包</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import ReadingPlayer from '../components/reading/ReadingPlayer.vue';
import { packsByLang, packReward, READING_PACKS } from '../lib/reading/packs.js';
import { exploredSet, exploredCount, markExplored, isPackRewarded, markPackRewarded } from '../lib/reading/explored.js';
import { grantReward, listMyPets } from '../db.js';
import PetSprite from '../components/PetSprite.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const LANGS = [
  { id: 'en-US', name: 'English', emoji: '🔤' },
  { id: 'zh-CN', name: '中文',    emoji: '🀄' },
];

// 入口可带 ?subject=english|chinese 决定默认语言
const subjectToLang = { english: 'en-US', chinese: 'zh-CN' };
const lang = ref(subjectToLang[route.query.subject] || 'en-US');

const packs = computed(() => packsByLang(lang.value));
const activePack = ref(null);
const playWord = ref(null);
const finished = ref(false);
const exploredIds = ref(new Set());
const rewardInfo = ref(null); // 整包完成时的奖励 { coins, food }
const companion = ref({ petId: 'cat', level: 1 }); // 陪读宠物
const showAlbum = ref(false);
const albumTick = ref(0); // 探索后自增，刷新集字册的收集状态

const allPacks = computed(() => READING_PACKS);
function albumSet(packId) { albumTick.value; return exploredSet(packId); }
const albumTotal = computed(() => READING_PACKS.reduce((s, p) => s + p.words.length, 0));
const albumDone = computed(() => { albumTick.value; return READING_PACKS.reduce((s, p) => s + exploredCount(p.id), 0); });

const celeMsg = computed(() => {
  const total = activePack.value?.words.length || 0;
  const done = exploredCount(activePack.value?.id);
  if (done >= total && total > 0) return '🏆 这个词包全部探索完啦，太棒了！';
  return '⭐ 又认识一个词！';
});

const nextWord = computed(() => {
  if (!activePack.value) return null;
  const set = exploredSet(activePack.value.id);
  return activePack.value.words.find(w => !set.has(w.id) && w.id !== playWord.value?.id)
    || activePack.value.words.find(w => w.id !== playWord.value?.id)
    || null;
});

function selectLang(id) { lang.value = id; activePack.value = null; }
function doneOf(p) { albumTick.value; return exploredCount(p.id); }

// 当前语言进度统计
const langExplored = computed(() => { albumTick.value; return packs.value.reduce((s, p) => s + exploredCount(p.id), 0); });
const langTotal = computed(() => packs.value.reduce((s, p) => s + p.words.length, 0));
const langPct = computed(() => langTotal.value ? Math.round(langExplored.value / langTotal.value * 100) : 0);
const langPacksDone = computed(() => { albumTick.value; return packs.value.filter(isPackDone).length; });

// 推荐：当前语言下首个含未探索词的词包及该词
const recommendation = computed(() => {
  albumTick.value;
  for (const p of packs.value) {
    const set = exploredSet(p.id);
    const w = p.words.find(x => !set.has(x.id));
    if (w) return { pack: p, word: w };
  }
  return null;
});
function continueExplore() {
  const r = recommendation.value;
  if (!r) return;
  openPack(r.pack);
  startWord(r.word);
}
function pctOf(p) { return p.words.length ? Math.round(doneOf(p) / p.words.length * 100) : 0; }
function isPackDone(p) { return p.words.length > 0 && doneOf(p) >= p.words.length; }

// 整册成就
const completedPackCount = computed(() => { albumTick.value; return READING_PACKS.filter(isPackDone).length; });
const totalPackCount = READING_PACKS.length;
const albumMilestone = computed(() => {
  const n = completedPackCount.value, t = totalPackCount;
  if (n >= t) return '🏆 全部集齐，阅读小达人！';
  if (n >= Math.ceil(t / 2)) return '🌟 过半啦，继续加油！';
  if (n >= 1) return `⭐ 已集齐 ${n} 个词包！`;
  return '探索词包来集齐徽章吧～';
});

function openPack(p) {
  activePack.value = p;
  exploredIds.value = exploredSet(p.id);
}
function startWord(w) {
  finished.value = false;
  rewardInfo.value = null;
  playWord.value = w;
}
async function onFinished(word) {
  const pack = activePack.value;
  markExplored(pack.id, word.id);
  exploredIds.value = exploredSet(pack.id);
  albumTick.value += 1;
  finished.value = true;

  // 整包首次探索完成 → 发一次温和奖励（金币 + 口粮），轻度连到宠物经济
  const complete = exploredCount(pack.id) >= pack.words.length;
  if (complete && !isPackRewarded(pack.id) && markPackRewarded(pack.id)) {
    try {
      const r = packReward(pack);
      const got = await grantReward(r);
      rewardInfo.value = got;
      await auth.refreshProfile?.();
    } catch { /* 奖励失败不影响探索体验 */ }
  }
}
function closePlayer() {
  playWord.value = null;
  finished.value = false;
}
function goChallenge(p) {
  if (!p.challenge) return;
  router.push({ name: 'quiz', query: { ...p.challenge } });
}

onMounted(async () => {
  auth.refreshProfile?.().catch(() => {});
  try {
    const pets = await listMyPets();
    if (pets?.[0]) companion.value = { petId: pets[0].petId, level: pets[0].level || 1 };
  } catch { /* 无宠物则用默认 cat */ }
});
</script>

<style scoped>
.hub { flex: 1; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 22px; }
.back {
  background: #fff; color: #9b8b7a; padding: 8px 16px; font-family: inherit; font-weight: 800;
  border: none; border-radius: 999px; box-shadow: 0 3px 0 var(--shadow); cursor: pointer;
}
.hub-title { font-size: 20px; font-weight: 900; color: var(--primary-dark); }
.top-right { display: flex; align-items: center; gap: 10px; }
.album-btn { background: #fff; color: #cf8c25; border: 2px solid #f0d99a; padding: 8px 14px; border-radius: 999px; font-family: inherit; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 3px 0 #f0d99a; }
.album-btn:hover { background: #fff7e0; }
.coin-pill { background: #fff; padding: 8px 14px; border-radius: 999px; font-weight: 900; box-shadow: 0 3px 0 var(--shadow); }

.body { flex: 1; padding: 8px 22px 28px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.lead { text-align: center; color: #9b8b7a; font-weight: 700; margin: 0; }

.lang-tabs { display: flex; gap: 10px; justify-content: center; }
.lang-tab {
  background: #fff; color: #9b8b7a; padding: 9px 22px; font-family: inherit; font-weight: 800; font-size: 15px;
  border: 3px solid transparent; border-radius: 999px; box-shadow: 0 3px 0 var(--shadow); cursor: pointer;
}
.lang-tab.active { background: var(--primary); color: #fff; }

.stats {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: center;
  background: #fffdf6; border: 2px solid #ffe0a8; border-radius: 16px;
  padding: 12px 20px; max-width: 920px; width: 100%; margin: 0 auto;
  box-shadow: 0 3px 0 #f0e6d8;
}
.stat { display: flex; flex-direction: column; align-items: center; min-width: 64px; }
.s-num { font-size: 20px; font-weight: 900; color: var(--primary-dark); }
.s-lab { font-size: 12px; font-weight: 700; color: #9b8b7a; }
.btn-continue {
  margin-left: auto; background: #54b85a; color: #fff; border: none;
  padding: 11px 22px; border-radius: 14px; font-family: inherit; font-weight: 900; font-size: 15px;
  cursor: pointer; box-shadow: 0 4px 0 #3d9a43; transition: transform 0.12s;
}
.btn-continue:hover { transform: translateY(-2px); }
.all-done { margin-left: auto; font-weight: 900; color: #cf8c25; }

.pack-grid {
  display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  max-width: 920px; width: 100%; margin: 0 auto;
}
.pack-card { background: #fffdf6; border: 3px solid #eee; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 5px 0 var(--shadow); }
.pc-head { display: flex; align-items: center; gap: 12px; }
.pc-emoji { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
.pc-meta h3 { margin: 0; font-size: 17px; font-weight: 900; color: var(--ink); }
.pc-count { font-size: 12px; color: #9b8b7a; font-weight: 700; }
.pc-bar { height: 8px; background: #f0e6d8; border-radius: 999px; overflow: hidden; }
.pc-fill { height: 100%; transition: width 0.4s; border-radius: 999px; }
.pc-actions { display: flex; gap: 8px; }
.btn-explore { flex: 1; color: #fff; border: none; padding: 10px; border-radius: 12px; font-family: inherit; font-weight: 900; font-size: 14px; cursor: pointer; }
.btn-challenge { background: #fff; color: #cf8c25; border: 2px solid #f0d99a; padding: 10px 14px; border-radius: 12px; font-family: inherit; font-weight: 800; font-size: 13px; cursor: pointer; }
.btn-challenge.wide { width: 100%; margin-top: 8px; }

/* 浮层通用 */
.overlay { position: fixed; inset: 0; background: rgba(60,40,20,0.5); z-index: 60; display: flex; align-items: center; justify-content: center; }
.word-picker { position: relative; width: 560px; max-width: 92vw; max-height: 86vh; overflow-y: auto; background: #fffdf6; border-radius: 24px; padding: 26px; gap: 10px; box-shadow: 0 18px 40px rgba(0,0,0,0.3); align-items: center; }
.close { position: absolute; top: 12px; right: 12px; width: 30px; height: 30px; border-radius: 50%; background: #f0e6d8; color: #8a7a66; font-weight: 900; border: none; cursor: pointer; }
.wp-title { margin: 0; font-size: 20px; color: var(--ink); }
.wp-tip { margin: 0; color: #9b8b7a; font-weight: 700; font-size: 13px; }
.word-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); width: 100%; margin: 8px 0; }
.word-cell { position: relative; background: #fff; border: 3px solid #ffe0a8; border-radius: 16px; padding: 12px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; font-family: inherit; transition: transform 0.12s; }
.word-cell:hover { transform: translateY(-3px); }
.word-cell.done { border-color: #54b85a; background: #f3fbf1; }
.wc-emoji { font-size: 38px; }
.wc-text { font-size: 17px; font-weight: 900; color: var(--ink); }
.wc-badge { position: absolute; top: 4px; right: 6px; font-size: 14px; }

/* 集字册 */
.album { position: relative; width: 640px; max-width: 92vw; max-height: 86vh; overflow-y: auto; background: #fffdf6; border-radius: 24px; padding: 26px; gap: 8px; box-shadow: 0 18px 40px rgba(0,0,0,0.3); align-items: center; }
.album-title { margin: 0; font-size: 20px; color: var(--ink); }
.album-sum { margin: 0; color: #9b8b7a; font-weight: 700; font-size: 14px; }
.album-sum b { color: #54b85a; }
.album-achieve { display: flex; align-items: center; gap: 10px; background: #fff7e0; border: 2px solid #f0d99a; border-radius: 14px; padding: 8px 16px; margin: 4px 0 2px; }
.ach-badges { font-weight: 900; color: #cf8c25; font-size: 16px; }
.ach-msg { font-weight: 800; color: #b67517; font-size: 13px; }
.done-badge { font-size: 0.9em; }
.album-body { width: 100%; display: flex; flex-direction: column; gap: 16px; margin-top: 10px; }
.album-pack { display: flex; flex-direction: column; gap: 8px; }
.ap-head { display: flex; justify-content: space-between; font-weight: 900; color: var(--ink); font-size: 15px; }
.ap-count { color: #9b8b7a; font-weight: 800; font-size: 13px; }
.sticker-row { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); }
.sticker { aspect-ratio: 1; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; background: #f3ece0; border: 2px dashed #d8c9b3; }
.sticker.got { background: #f3fbf1; border: 2px solid #8fd49a; box-shadow: 0 3px 0 #cdeccf; }
.st-emoji { font-size: 30px; }
.st-text { font-size: 13px; font-weight: 900; color: var(--ink); }
.st-lock { font-size: 26px; font-weight: 900; color: #c9b9a3; }

/* 全屏管线 */
.fullscreen { position: fixed; inset: 0; background: #fffdf6; z-index: 70; display: flex; flex-direction: column; }
.fs-close { position: absolute; top: 16px; right: 18px; width: 40px; height: 40px; border-radius: 50%; background: #f0e6d8; color: #8a7a66; font-size: 20px; font-weight: 900; border: none; cursor: pointer; z-index: 2; }

.celebrate { flex: 1; align-items: center; justify-content: center; gap: 14px; padding: 24px; }
.cele-stage { display: flex; align-items: flex-end; gap: 6px; }
.cele-emoji { font-size: 110px; animation: bounce 1s ease infinite alternate; }
.cele-pet { animation: bounce 1s ease infinite alternate 0.3s; }
@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-14px); } }
.cele-word { font-size: 48px; font-weight: 900; color: var(--ink); margin: 0; }
.cele-msg { font-size: 18px; font-weight: 800; color: #54b85a; margin: 0; }
.reward { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.reward-pill { background: #fff7e0; color: #cf8c25; border: 2px solid #f0d99a; border-radius: 999px; padding: 6px 16px; font-weight: 900; font-size: 15px; animation: pop-pill 0.5s ease-out; }
@keyframes pop-pill { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
.cele-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
.cele-actions button { font-family: inherit; font-weight: 900; font-size: 15px; padding: 12px 22px; border-radius: 14px; border: none; cursor: pointer; }
.btn-replay { background: #fff; color: #9b8b7a; box-shadow: 0 4px 0 var(--shadow); }
.btn-back { background: #fff; color: #9b8b7a; box-shadow: 0 4px 0 var(--shadow); }
.cele-actions .btn-explore { background: #54b85a; box-shadow: 0 4px 0 #3d9a43; }
</style>
