<template>
  <div class="textbook col">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back" @click="onBack">‹ {{ grade ? '年级' : '首页' }}</button>
      <div class="tb-title">📚 跟课本学</div>
      <span class="coin-pill">🪙 {{ auth.points }}</span>
    </div>

    <div class="body">
      <!-- 学科切换 -->
      <div class="subj-tabs">
        <button v-for="s in subjects" :key="s.id"
          class="subj-tab" :class="{ on: subject === s.id }"
          :style="subject === s.id ? { borderColor: s.color, background: s.color + '22', color: s.color } : {}"
          @click="selectSubject(s.id)"
        >
          <span class="se">{{ s.emoji }}</span>{{ s.name }}
        </button>
      </div>

      <!-- ===== 年级网格 ===== -->
      <template v-if="!grade">
        <div class="grade-grid">
          <button v-for="g in GRADES" :key="g.id"
            class="grade-card" :class="{ empty: !hasContent(g.id) }"
            @click="openGrade(g.id)"
          >
            <span class="g-emoji">🎒</span>
            <span class="g-name">{{ g.name }}</span>
            <span class="g-tag">{{ hasContent(g.id) ? '有内容' : '整理中' }}</span>
          </button>
        </div>
      </template>

      <!-- ===== 某年级：上下册 + 单元 ===== -->
      <template v-else>
        <div class="vol-head">
          <h2>{{ gradeName }}</h2>
          <div class="vol-tabs">
            <button v-for="v in VOLUMES" :key="v.id"
              class="vol-tab" :class="{ on: volume === v.id }"
              @click="selectVolume(v.id)"
            >{{ v.name }}</button>
          </div>
        </div>

        <div v-if="!units.length" class="empty-tip">
          <div class="et-emoji">🚧</div>
          <p>本册内容整理中，敬请期待～</p>
        </div>

        <div v-else class="units">
          <div v-for="u in units" :key="u.unit" class="unit-card" :class="{ ph: u.placeholder }">
            <div class="unit-head">
              <span class="u-no">第{{ u.unit }}单元</span>
              <span class="u-title">{{ u.title }}</span>
            </div>
            <div v-if="u.placeholder || !u.items.length" class="unit-ph">🚧 敬请期待</div>
            <div v-else class="items">
              <button v-for="it in u.items" :key="it.id"
                class="item" :class="{ locked: isLocked(it) }"
                :style="!isLocked(it) ? { borderColor: typeColor(it) } : {}"
                @click="openItem(u, it)"
              >
                <span class="it-emoji" :style="{ background: typeColor(it) + '22', color: typeColor(it) }">{{ typeEmoji(it) }}</span>
                <span class="it-main">
                  <span class="it-name">{{ it.name }}</span>
                  <span class="it-type">{{ typeName(it) }}<template v-if="isLocked(it)"> · 敬请期待</template></span>
                </span>
                <span class="it-go" v-if="!isLocked(it)">→</span>
                <span class="it-go lock" v-else>🔒</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { SUBJECTS } from '../catalog.js';
import {
  GRADES, VOLUMES, ITEM_TYPES,
  textbookHasSubject, getUnits, gradeHasContent,
} from '../lib/textbook.js';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const subject = ref(String(route.query.subject || 'math'));
const grade = ref(String(route.query.grade || ''));
const volume = ref(String(route.query.volume || 'up'));

const subjects = computed(() => SUBJECTS.filter(s => textbookHasSubject(s.id)));
const gradeName = computed(() => GRADES.find(g => g.id === grade.value)?.name || '');
const units = computed(() => getUnits(subject.value, grade.value, volume.value));

function hasContent(gradeId) { return gradeHasContent(subject.value, gradeId); }

function isLocked(it) { return !!it.placeholder || (!it.trickId && !it.ref); }
function typeMeta(it) { return ITEM_TYPES[it.type] || ITEM_TYPES.practice; }
function typeColor(it) { return typeMeta(it).color; }
function typeEmoji(it) { return typeMeta(it).emoji; }
function typeName(it) { return typeMeta(it).name; }

function selectSubject(id) {
  subject.value = id;
  grade.value = '';
  syncQuery();
}
function openGrade(id) {
  grade.value = id;
  volume.value = 'up';
  syncQuery();
}
function selectVolume(id) { volume.value = id; syncQuery(); }

function openItem(unit, it) {
  if (isLocked(it)) return;
  const ctx = { subject: subject.value, grade: grade.value, volume: volume.value, unit: unit.unit };
  if (it.type === 'lesson' && it.trickId) {
    router.push({ name: 'lesson', query: { trick: it.trickId, ...ctx } });
  } else if (it.ref) {
    router.push({ name: 'quiz', query: {
      subject: subject.value, module: it.ref.module, category: it.ref.category, stage: 1,
      from: 'textbook', grade: grade.value, volume: volume.value, unit: unit.unit,
    } });
  }
}

function onBack() {
  if (grade.value) { grade.value = ''; syncQuery(); }
  else router.push({ name: 'home' });
}

function syncQuery() {
  const q = { subject: subject.value };
  if (grade.value) { q.grade = grade.value; q.volume = volume.value; }
  router.replace({ name: 'textbook', query: q });
}

// 浏览器前进后退时同步
watch(() => route.query, (q) => {
  subject.value = String(q.subject || 'math');
  grade.value = String(q.grade || '');
  volume.value = String(q.volume || 'up');
});
</script>

<style scoped>
.textbook { flex: 1; min-height: 0; }
.back { background: #fff; color: var(--ink); padding: 8px 16px; box-shadow: 0 3px 0 var(--shadow); }
.tb-title { font-size: 18px; font-weight: 900; color: var(--primary-dark); }

.body { flex: 1; overflow-y: auto; padding: 12px 22px 28px; display: flex; flex-direction: column; gap: 16px; }

/* 学科 tab */
.subj-tabs { display: flex; gap: 10px; justify-content: center; }
.subj-tab {
  display: flex; align-items: center; gap: 6px;
  background: #fff; color: #9b8b7a; padding: 8px 20px; font-family: inherit; font-weight: 800;
  border: 3px solid transparent; border-radius: 999px; box-shadow: 0 3px 0 var(--shadow); cursor: pointer;
}
.subj-tab .se { font-size: 18px; }

/* 年级网格 */
.grade-grid {
  display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  max-width: 680px; width: 100%; margin: 0 auto;
}
.grade-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: #fffdf6; border: 3px solid #f0d99a; border-radius: 18px; padding: 22px 12px;
  font-family: inherit; cursor: pointer; box-shadow: 0 5px 0 var(--shadow); transition: transform 0.12s;
}
.grade-card:hover { transform: translateY(-3px); }
.grade-card.empty { opacity: 0.6; border-color: #e3d8c4; }
.g-emoji { font-size: 40px; }
.g-name { font-size: 18px; font-weight: 900; color: var(--ink); }
.g-tag { font-size: 11px; font-weight: 800; color: #9b8b7a; background: #fff3d6; padding: 2px 10px; border-radius: 999px; }
.grade-card.empty .g-tag { background: #eee; }

/* 册 + 单元 */
.vol-head { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.vol-head h2 { margin: 0; color: var(--primary-dark); }
.vol-tabs { display: flex; gap: 8px; }
.vol-tab {
  background: #fff; color: #9b8b7a; padding: 8px 22px; font-family: inherit; font-weight: 800;
  border-radius: 999px; box-shadow: 0 3px 0 var(--shadow); cursor: pointer;
}
.vol-tab.on { background: var(--primary); color: #fff; }

.empty-tip { text-align: center; color: #9b8b7a; padding: 40px; }
.et-emoji { font-size: 60px; margin-bottom: 10px; }

.units { display: flex; flex-direction: column; gap: 14px; max-width: 680px; width: 100%; margin: 0 auto; }
.unit-card { background: #fffdf6; border-radius: 16px; padding: 14px 16px; box-shadow: 0 4px 0 var(--shadow); border: 2px solid #f0e6d8; }
.unit-card.ph { opacity: 0.62; }
.unit-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; }
.u-no { font-size: 12px; font-weight: 900; color: #fff; background: var(--primary); padding: 2px 10px; border-radius: 999px; }
.u-title { font-size: 16px; font-weight: 900; color: var(--ink); }
.unit-ph { text-align: center; color: #b9a892; font-weight: 800; padding: 14px; background: #faf3e6; border-radius: 10px; }

.items { display: flex; flex-direction: column; gap: 8px; }
.item {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border: 3px solid transparent; border-radius: 14px; padding: 10px 14px;
  font-family: inherit; cursor: pointer; box-shadow: 0 3px 0 var(--shadow); transition: transform 0.1s; text-align: left;
}
.item:hover:not(.locked) { transform: translateX(3px); }
.item.locked { opacity: 0.55; cursor: not-allowed; }
.it-emoji { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.it-main { display: flex; flex-direction: column; flex: 1; }
.it-name { font-size: 15px; font-weight: 900; color: var(--ink); }
.it-type { font-size: 11px; font-weight: 700; color: #9b8b7a; }
.it-go { font-size: 20px; font-weight: 900; color: var(--primary-dark); }
.it-go.lock { font-size: 16px; }
</style>
