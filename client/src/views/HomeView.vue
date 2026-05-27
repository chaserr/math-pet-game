<template>
  <div class="home col">
    <div class="topbar">
      <div class="title">🧮 数字积木大冒险</div>
      <div class="right">
        <span class="coin-pill">🪙 {{ auth.points }}</span>
        <button class="logout" @click="logout">退出</button>
      </div>
    </div>

    <div class="hub">
      <!-- 宠物展示 -->
      <div class="showcase center col">
        <PetSprite v-if="featured" :pet-id="featured.petId" :mood="featured.mood" :level="featured.level" :size="140" />
        <div v-else class="no-pet">
          <PetSprite pet-id="cat" mood="normal" :size="120" />
          <p>还没有宠物，去商店领养一只吧！</p>
        </div>
        <p v-if="featured" class="pet-name">{{ featured.name }} · Lv.{{ featured.level }}</p>
      </div>

      <!-- 学科 Tab -->
      <div class="subject-tabs">
        <button v-for="s in SUBJECTS" :key="s.id"
          class="subj-tab"
          :class="{ active: currentSubject === s.id }"
          :style="currentSubject === s.id ? { borderColor: s.color, background: s.color + '22', color: s.color } : {}"
          @click="currentSubject = s.id"
        >
          <span class="se">{{ s.emoji }}</span>
          <span class="sn">{{ s.name }}</span>
        </button>
      </div>
      <p class="subj-desc">{{ subjectInfo.desc }}</p>

      <!-- 拼音专区快捷入口（仅语文显示） -->
      <div v-if="currentSubject === 'chinese'" class="pinyin-entry" @click="go('pinyin')">
        <span class="pe-icon">🔠</span>
        <div class="pe-text">
          <span class="pe-title">拼音专区</span>
          <span class="pe-desc">字母表 · 声母 · 韵母 · 练习 · 游戏</span>
        </div>
        <span class="pe-arrow">→</span>
      </div>

      <!-- 阅读乐园快捷入口（英语 / 语文显示） -->
      <div v-if="currentSubject === 'english' || currentSubject === 'chinese'" class="reading-entry" @click="goReading">
        <span class="pe-icon">📖</span>
        <div class="pe-text">
          <span class="pe-title">阅读乐园</span>
          <span class="pe-desc">看图 · 拼词 · 读句子 · 可选挑战关</span>
        </div>
        <span class="pe-arrow">→</span>
      </div>

      <!-- 除法启蒙馆快捷入口（仅数学显示） -->
      <div v-if="currentSubject === 'math'" class="division-entry" @click="go('division-hub')">
        <span class="pe-icon">➗</span>
        <div class="pe-text">
          <span class="pe-title">除法启蒙馆</span>
          <span class="pe-desc">学一学 · 试一试 · 连一连 · 翻翻乐</span>
        </div>
        <span class="pe-arrow">→</span>
      </div>

      <!-- 浏览方式切换：按能力练 / 跟课本学 -->
      <div class="mode-switch">
        <button class="mode active" disabled>💪 按能力练</button>
        <button class="mode" v-if="textbookAvailable" @click="goTextbook">📚 跟课本学 →</button>
      </div>

      <!-- 模块卡片网格 -->
      <div class="module-grid">
        <div v-for="m in modules" :key="m.id"
          class="mod-card col"
          :class="{ placeholder: m.placeholder }"
          :style="{ borderColor: m.color }"
        >
          <div class="mod-head">
            <span class="me" :style="{ background: m.color + '22', color: m.color }">{{ m.emoji }}</span>
            <div class="mod-title">
              <h3>{{ m.name }}</h3>
              <span class="mod-desc">{{ m.desc }}</span>
            </div>
          </div>

          <template v-if="m.placeholder">
            <div class="placeholder-tip">🚧 敬请期待</div>
          </template>

          <!-- 数学：分类 + 选关网格 -->
          <template v-else-if="hasCat(m.id)">
            <div class="prog">
              <div class="prog-text">
                <b>已通关 {{ catCleared(m.id) }} / {{ catTotal(m.id) }}</b>
                <span class="prog-pct">{{ catPct(m.id) }}%</span>
              </div>
              <div class="prog-bar"><div class="prog-fill" :style="{ width: catPct(m.id) + '%', background: m.color }"></div></div>
            </div>
            <div class="mod-actions">
              <button class="btn-primary" :style="{ background: m.color }" @click="enterStages(m.id)">
                进入选关 →
              </button>
            </div>
          </template>

          <!-- 语文 / 英语：继续 + 跳关 -->
          <template v-else>
            <div class="prog">
              <div class="prog-text">
                <b>已通关 {{ progressFor(m.id) }} / {{ STAGES_PER_MODULE }}</b>
                <span class="prog-pct">{{ Math.floor(progressFor(m.id) / STAGES_PER_MODULE * 100) }}%</span>
              </div>
              <div class="prog-bar"><div class="prog-fill" :style="{ width: (progressFor(m.id) / STAGES_PER_MODULE * 100) + '%', background: m.color }"></div></div>
            </div>

            <div class="mod-actions">
              <button class="btn-primary" :style="{ background: m.color }" @click="playNext(m.id)">
                继续第 {{ nextFor(m.id) }} 关 →
              </button>
              <button class="btn-jump" @click="openJump(m)">🎯 跳到任意关</button>
            </div>
          </template>
        </div>
      </div>

      <!-- 次级菜单 -->
      <div class="menu">
        <button class="btn-accent" @click="go('shop')">🛒 商店</button>
        <button class="btn-accent" @click="go('pets')">🏠 我的宠物</button>
      </div>
    </div>

    <!-- 跳关弹窗 -->
    <Transition name="pop">
      <div v-if="jump" class="overlay center" @click.self="jump = null">
        <div class="jump-card col">
          <button class="close" @click="jump = null">✕</button>
          <div class="jump-head">
            <span class="me" :style="{ background: jump.module.color + '22', color: jump.module.color }">{{ jump.module.emoji }}</span>
            <h3>{{ subjectInfo.name }} · {{ jump.module.name }}</h3>
          </div>
          <p class="small">输入要挑战的关卡号（1 ~ {{ STAGES_PER_MODULE }}）：</p>
          <input type="number" min="1" :max="STAGES_PER_MODULE" v-model.number="jump.value" class="jump-input" />
          <div class="jump-quick">
            <button v-for="q in jumpQuick" :key="q" @click="jump.value = q">{{ q }}</button>
          </div>
          <button class="btn-primary big" :disabled="!isValidJump" @click="confirmJump">挑战第 {{ jump.value || '?' }} 关</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PetSprite from '../components/PetSprite.vue';
import { useAuthStore } from '../stores/auth.js';
import { listMyPets } from '../db.js';
import { SUBJECTS, MODULES, STAGES_PER_MODULE, findSubject } from '../catalog.js';
import { moduleHasCategories, getCategories } from '../lib/mathLevels.js';
import { clearedCount, nextChallengeStage } from '../lib/progress.js';
import { textbookHasSubject } from '../lib/textbook.js';

const auth = useAuthStore();
const router = useRouter();
const pets = ref([]);

const currentSubject = ref('math');
const subjectInfo = computed(() => findSubject(currentSubject.value));
const modules = computed(() => MODULES[currentSubject.value] || []);

const featured = computed(() => pets.value[0] || null);

const jump = ref(null);
const jumpQuick = [1, 50, 100, 250, 500, 750, 1000];
const isValidJump = computed(() => {
  const v = Number(jump.value?.value);
  return Number.isFinite(v) && v >= 1 && v <= STAGES_PER_MODULE;
});

function hasCat(moduleId) {
  return moduleHasCategories(currentSubject.value, moduleId);
}
function catTotal(moduleId) {
  return getCategories(currentSubject.value, moduleId).reduce((s, c) => s + c.count, 0);
}
function catCleared(moduleId) {
  return getCategories(currentSubject.value, moduleId)
    .reduce((s, c) => s + clearedCount(currentSubject.value, moduleId, c.id), 0);
}
function catPct(moduleId) {
  const total = catTotal(moduleId) || 1;
  return Math.floor(catCleared(moduleId) / total * 100);
}
function enterStages(moduleId) {
  router.push({ name: 'stages', query: { subject: currentSubject.value, module: moduleId } });
}

function progressFor(moduleId) {
  return clearedCount(currentSubject.value, moduleId, 'default');
}
function nextFor(moduleId) {
  return nextChallengeStage(currentSubject.value, moduleId, 'default', STAGES_PER_MODULE);
}
function playNext(moduleId) {
  router.push({
    name: 'quiz',
    query: { subject: currentSubject.value, module: moduleId, stage: nextFor(moduleId) },
  });
}
function openJump(m) {
  jump.value = { module: m, value: nextFor(m.id) };
}
function confirmJump() {
  if (!isValidJump.value) return;
  router.push({
    name: 'quiz',
    query: { subject: currentSubject.value, module: jump.value.module.id, stage: jump.value.value },
  });
}
function go(name) { router.push({ name }); }
function goReading() {
  router.push({ name: 'reading', query: { subject: currentSubject.value } });
}
function goTextbook() {
  router.push({ name: 'textbook', query: { subject: currentSubject.value } });
}
const textbookAvailable = computed(() => textbookHasSubject(currentSubject.value));
async function logout() { await auth.logout(); router.push({ name: 'login' }); }

onMounted(async () => {
  try {
    const [, ps] = await Promise.all([auth.refreshProfile(), listMyPets()]);
    pets.value = ps;
    auth.setPets(ps);
  } catch { /* ignore */ }
});
</script>

<style scoped>
.home { flex: 1; }
.title { font-size: 22px; font-weight: 900; color: var(--primary-dark); }
.right { display: flex; align-items: center; gap: 12px; }
.logout { background: #fff; color: #9b8b7a; padding: 8px 14px; box-shadow: 0 3px 0 var(--shadow); }

.hub { flex: 1; padding: 8px 22px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }

.showcase { gap: 6px; align-items: center; }
.pet-name { font-size: 16px; font-weight: 900; color: var(--ink); }
.no-pet { text-align: center; color: #9b8b7a; }

/* 学科 Tab */
.subject-tabs {
  display: flex; gap: 10px; justify-content: center; padding: 4px;
  background: #fff; border-radius: 999px; box-shadow: 0 3px 0 var(--shadow);
  align-self: center;
}
.subj-tab {
  display: flex; align-items: center; gap: 8px;
  background: transparent; color: #9b8b7a;
  padding: 10px 22px; font-size: 16px; font-weight: 800; font-family: inherit;
  border: 3px solid transparent; border-radius: 999px;
  cursor: pointer; transition: all 0.15s;
}
.subj-tab:hover:not(.active) { background: #fff8e8; }
.subj-tab .se { font-size: 22px; }
.subj-desc { text-align: center; color: #9b8b7a; font-size: 14px; margin: -4px 0 4px; }

/* 拼音专区入口 */
.pinyin-entry {
  display: flex; align-items: center; gap: 14px;
  background: linear-gradient(135deg, #e8f8ee, #d8f0ff);
  border: 3px solid #54b85a; border-radius: 18px; padding: 14px 18px;
  cursor: pointer; box-shadow: 0 4px 0 #a8d8b0; transition: transform 0.12s;
  max-width: 920px; width: 100%; margin: 0 auto;
}
.pinyin-entry:hover { transform: translateY(-3px); }
.pe-icon  { font-size: 32px; }
.pe-text  { flex: 1; display: flex; flex-direction: column; }
.pe-title { font-size: 17px; font-weight: 900; color: #2e7a3c; }
.pe-desc  { font-size: 12px; font-weight: 700; color: #5a9068; }
.pe-arrow { font-size: 22px; font-weight: 900; color: #54b85a; }

/* 除法启蒙馆入口（沿用 .pe-* 排版，仅外壳配色不同） */
.division-entry {
  display: flex; align-items: center; gap: 14px;
  background: linear-gradient(135deg, #fff5e6, #ffe7c2);
  border: 3px solid #ff8e3c; border-radius: 18px; padding: 14px 18px;
  cursor: pointer; box-shadow: 0 4px 0 #f0c878; transition: transform 0.12s;
  max-width: 920px; width: 100%; margin: 0 auto;
}
.division-entry:hover { transform: translateY(-3px); }
.division-entry .pe-title { color: #b67517; }
.division-entry .pe-desc  { color: #8a6a3a; }
.division-entry .pe-arrow { color: #ff8e3c; }

/* 阅读乐园入口（沿用 .pe-* 排版，蓝色系呼应英语） */
.reading-entry {
  display: flex; align-items: center; gap: 14px;
  background: linear-gradient(135deg, #e8f1ff, #dbeaff);
  border: 3px solid #3a92e0; border-radius: 18px; padding: 14px 18px;
  cursor: pointer; box-shadow: 0 4px 0 #aecdf0; transition: transform 0.12s;
  max-width: 920px; width: 100%; margin: 0 auto;
}
.reading-entry:hover { transform: translateY(-3px); }
.reading-entry .pe-title { color: #2160a8; }
.reading-entry .pe-desc  { color: #4a7bb5; }
.reading-entry .pe-arrow { color: #3a92e0; }

/* 浏览方式切换 */
.mode-switch { display: flex; justify-content: center; gap: 8px; margin: -4px 0 2px; }
.mode {
  background: #fff; color: #9b8b7a; padding: 7px 18px; font-family: inherit; font-weight: 800; font-size: 13px;
  border: 2px solid transparent; border-radius: 999px; box-shadow: 0 2px 0 var(--shadow); cursor: pointer;
}
.mode.active { background: var(--primary); color: #fff; cursor: default; }
.mode:not(.active):hover { background: #fff3d6; color: var(--primary-dark); }

/* 模块卡片 */
.module-grid {
  display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  max-width: 920px; width: 100%; margin: 0 auto;
}
.mod-card {
  background: #fffdf6; border-radius: 18px; padding: 16px 18px 18px;
  box-shadow: 0 5px 0 var(--shadow);
  border: 3px solid transparent; gap: 12px;
}
.mod-card.placeholder { opacity: 0.7; }
.mod-head { display: flex; align-items: center; gap: 12px; }
.me {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; font-weight: 900; flex-shrink: 0;
}
.mod-title h3 { margin: 0; font-size: 18px; font-weight: 900; color: var(--ink); }
.mod-desc { color: #9b8b7a; font-size: 12px; font-weight: 700; }

.placeholder-tip {
  text-align: center; color: #b9a892; font-weight: 900;
  padding: 26px 0; font-size: 16px;
  background: #faf3e6; border-radius: 12px;
}

.prog { display: flex; flex-direction: column; gap: 4px; }
.prog-text { display: flex; justify-content: space-between; font-size: 12px; color: #9b8b7a; }
.prog-text b { color: var(--ink); }
.prog-pct { font-weight: 900; }
.prog-bar { height: 8px; background: #f0e6d8; border-radius: 999px; overflow: hidden; }
.prog-fill { height: 100%; transition: width 0.4s; border-radius: 999px; }

.mod-actions { display: flex; flex-direction: column; gap: 6px; }
.mod-actions .btn-primary { padding: 10px 12px; font-size: 14px; color: #fff; }
.btn-jump {
  background: #fff; color: #9b8b7a; padding: 6px 12px; font-size: 12px;
  border-radius: 999px; box-shadow: 0 2px 0 var(--shadow); font-family: inherit; cursor: pointer;
}
.btn-jump:hover { background: #fff8e8; color: var(--primary-dark); }

.menu { display: flex; gap: 14px; justify-content: center; }

/* 跳关弹窗 */
.overlay { position: fixed; inset: 0; background: rgba(60,40,20,0.5); z-index: 60; }
.jump-card {
  position: relative; width: 320px; max-width: 90vw;
  background: #fffdf6; border-radius: 24px; padding: 24px 26px;
  gap: 12px; box-shadow: 0 18px 40px rgba(0,0,0,0.3);
}
.close {
  position: absolute; top: 12px; right: 12px; width: 30px; height: 30px;
  border-radius: 50%; background: #f0e6d8; color: #8a7a66; font-weight: 900;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.jump-head { display: flex; align-items: center; gap: 10px; }
.jump-head h3 { margin: 0; font-size: 18px; color: var(--ink); }
.small { color: #9b8b7a; font-size: 13px; margin: 0; }
.jump-input {
  width: 100%; padding: 14px 18px; font-size: 24px; font-weight: 900; text-align: center;
  border: 3px solid #f0d99a; border-radius: 14px; background: #fff;
  outline: none; font-family: inherit;
}
.jump-input:focus { border-color: var(--primary); }
.jump-quick { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.jump-quick button {
  background: #fff; color: var(--primary-dark); padding: 5px 10px; font-size: 12px;
  border-radius: 999px; box-shadow: 0 2px 0 var(--shadow); font-family: inherit; cursor: pointer;
}
.jump-quick button:hover { background: #fff3d6; }
.big { padding: 14px 32px; font-size: 18px; }

.pop-enter-active { transition: all 0.3s cubic-bezier(.34,1.56,.64,1); }
.pop-enter-from { opacity: 0; transform: scale(0.7); }
</style>
