<template>
  <div class="stages col">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back" @click="goHome">‹ 返回</button>
      <div class="ctx-tag" :style="{ borderColor: moduleInfo.color }">
        <span class="se">{{ moduleInfo.emoji }}</span>
        <b>{{ subjectInfo.name }} · {{ moduleInfo.name }}</b>
      </div>
      <span class="coin-pill">🪙 {{ auth.points }}</span>
    </div>

    <div class="body">
      <!-- 分类 Tab -->
      <div class="cat-tabs">
        <button v-for="c in categories" :key="c.id"
          class="cat-tab"
          :class="{ active: currentCat === c.id }"
          :style="currentCat === c.id ? { borderColor: moduleInfo.color, background: moduleInfo.color + '22', color: moduleInfo.color } : {}"
          @click="selectCat(c.id)"
        >
          <span class="cn">{{ c.name }}</span>
          <span class="cc">{{ clearedFor(c.id) }}/{{ c.count }}</span>
        </button>
      </div>
      <p class="cat-desc">{{ activeCat?.desc }}</p>

      <!-- 进度条 -->
      <div class="prog">
        <div class="prog-bar">
          <div class="prog-fill"
            :style="{ width: pct + '%', background: moduleInfo.color }"></div>
        </div>
        <span class="prog-text">已通关 {{ clearedFor(currentCat) }} / {{ activeCat?.count }} （{{ pct }}%）</span>
      </div>

      <!-- 关卡网格 -->
      <div class="grid">
        <button v-for="st in pageStages" :key="st"
          class="lv"
          :class="{ cleared: isCleared(st), enum: isEnum }"
          @click="play(st)"
        >
          <span class="lv-label">{{ label(st) }}</span>
          <span v-if="isCleared(st)" class="lv-check">✓</span>
        </button>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pager">
        <button class="pg" :disabled="page === 0" @click="page--">‹</button>
        <button v-for="p in pageWindow" :key="p"
          class="pg num" :class="{ active: p - 1 === page }"
          @click="page = p - 1"
        >{{ p }}</button>
        <button class="pg" :disabled="page >= totalPages - 1" @click="page++">›</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { findSubject, findModule } from '../catalog.js';
import { getCategories, findCategory, levelLabel } from '../lib/mathLevels.js';
import { isStageCleared, clearedCount } from '../lib/progress.js';

const PAGE_SIZE = 100;
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const subjectId = computed(() => String(route.query.subject || 'math'));
const moduleId = computed(() => String(route.query.module || 'add'));
const subjectInfo = computed(() => findSubject(subjectId.value));
const moduleInfo = computed(() => findModule(subjectId.value, moduleId.value));
const categories = computed(() => getCategories(subjectId.value, moduleId.value));

const currentCat = ref(String(route.query.category || '') || categories.value[0]?.id || '');
const page = ref(0);

const activeCat = computed(() => findCategory(subjectId.value, moduleId.value, currentCat.value));
const isEnum = computed(() => activeCat.value?.kind === 'enum');
const totalStages = computed(() => activeCat.value?.count || 0);
const totalPages = computed(() => Math.max(1, Math.ceil(totalStages.value / PAGE_SIZE)));

const pageStages = computed(() => {
  const start = page.value * PAGE_SIZE;
  const end = Math.min(totalStages.value, start + PAGE_SIZE);
  const out = [];
  for (let s = start + 1; s <= end; s++) out.push(s);
  return out;
});

// 分页窗口（最多显示 7 个页码）
const pageWindow = computed(() => {
  const tp = totalPages.value;
  const cur = page.value;
  const win = 7;
  let start = Math.max(0, cur - 3);
  let end = Math.min(tp, start + win);
  start = Math.max(0, end - win);
  const out = [];
  for (let p = start; p < end; p++) out.push(p + 1);
  return out;
});

const pct = computed(() => {
  const total = totalStages.value || 1;
  return Math.floor(clearedFor(currentCat.value) / total * 100);
});

function clearedFor(catId) {
  return clearedCount(subjectId.value, moduleId.value, catId);
}
function isCleared(stage) {
  return isStageCleared(subjectId.value, moduleId.value, currentCat.value, stage);
}
function label(stage) {
  return levelLabel(subjectId.value, moduleId.value, currentCat.value, stage);
}
function selectCat(id) {
  currentCat.value = id;
  page.value = 0;
}
function play(stage) {
  router.push({
    name: 'quiz',
    query: { subject: subjectId.value, module: moduleId.value, category: currentCat.value, stage },
  });
}
function goHome() { router.push({ name: 'home' }); }

// 模块切换时重置分类
watch(moduleId, () => {
  currentCat.value = categories.value[0]?.id || '';
  page.value = 0;
});
</script>

<style scoped>
.stages { flex: 1; min-height: 0; }
.back { background: #fff; color: var(--ink); padding: 8px 16px; box-shadow: 0 3px 0 var(--shadow); }
.ctx-tag {
  display: inline-flex; align-items: center; gap: 6px;
  background: #fff; padding: 6px 14px; border-radius: 999px;
  border: 3px solid var(--primary); font-weight: 800; font-size: 14px;
}
.ctx-tag .se { font-size: 18px; }

.body { flex: 1; overflow-y: auto; padding: 10px 22px 26px; display: flex; flex-direction: column; gap: 14px; }

/* 分类 Tab */
.cat-tabs {
  display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;
}
.cat-tab {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: #fff; color: #9b8b7a;
  padding: 8px 18px; font-family: inherit; font-weight: 800;
  border: 3px solid transparent; border-radius: 16px;
  box-shadow: 0 3px 0 var(--shadow); cursor: pointer; transition: all 0.15s;
}
.cat-tab:hover:not(.active) { background: #fff8e8; }
.cat-tab .cn { font-size: 15px; }
.cat-tab .cc { font-size: 11px; opacity: 0.8; }
.cat-desc { text-align: center; color: #9b8b7a; font-size: 13px; margin: -4px 0 0; }

/* 进度条 */
.prog { display: flex; flex-direction: column; gap: 4px; max-width: 720px; width: 100%; margin: 0 auto; }
.prog-bar { height: 10px; background: #f0e6d8; border-radius: 999px; overflow: hidden; }
.prog-fill { height: 100%; transition: width 0.4s; border-radius: 999px; }
.prog-text { font-size: 12px; color: #9b8b7a; font-weight: 700; text-align: right; }

/* 关卡网格 */
.grid {
  display: grid; gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  max-width: 720px; width: 100%; margin: 0 auto;
}
/* 关卡：圆润饱满的蓝色按钮 */
.lv {
  position: relative;
  aspect-ratio: 1 / 1;
  background: radial-gradient(circle at 35% 28%, #b6e4ff 0%, #6dc6ff 38%, #3a92e0 72%, #2f7fcc 100%);
  color: #fff;
  border: 3px solid #2b78c0;
  border-radius: 50%;
  font-family: inherit; font-weight: 900; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  box-shadow:
    0 6px 0 #1f5e9a,
    inset 0 -8px 12px rgba(20,60,120,0.25),
    inset 0 6px 10px rgba(255,255,255,0.45);
  text-shadow: 0 1px 0 rgba(20,60,120,0.4);
  cursor: pointer; transition: transform 0.12s, filter 0.12s, box-shadow 0.12s;
  -webkit-tap-highlight-color: transparent;
}
.lv.enum { font-size: 14px; }
.lv:hover { transform: translateY(-2px) scale(1.03); filter: brightness(1.06); }
.lv:active {
  transform: translateY(3px);
  box-shadow:
    0 2px 0 #1f5e9a,
    inset 0 -4px 6px rgba(20,60,120,0.18),
    inset 0 4px 6px rgba(255,255,255,0.35);
}
/* 已通关：低饱和蓝灰，仍可点击重玩 */
.lv.cleared {
  background: radial-gradient(circle at 35% 28%, #e5ecf2 0%, #c0cdd9 50%, #98a8b6 100%);
  color: #6c7783;
  border-color: #8a98a6;
  box-shadow:
    0 4px 0 #74808d,
    inset 0 -6px 10px rgba(80,100,120,0.18),
    inset 0 5px 8px rgba(255,255,255,0.4);
  text-shadow: none;
}
.lv-label { line-height: 1.1; }
.lv-check {
  position: absolute; top: 3px; right: 4px;
  width: 18px; height: 18px; font-size: 11px; color: #fff;
  background: #54b85a; border-radius: 50%;
  box-shadow: 0 1px 0 #2f8a3f;
  display: flex; align-items: center; justify-content: center;
}

/* 分页 */
.pager { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-top: 4px; }
.pg {
  min-width: 34px; height: 34px; padding: 0 8px;
  background: #fff; color: var(--primary-dark); font-family: inherit; font-weight: 800;
  border-radius: 10px; box-shadow: 0 2px 0 var(--shadow); cursor: pointer;
}
.pg:disabled { opacity: 0.4; cursor: not-allowed; }
.pg.num.active { background: var(--primary); color: #fff; }
.pg:hover:not(:disabled):not(.active) { background: #fff3d6; }
</style>
