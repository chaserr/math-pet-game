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
          <button class="view-pdf"
            :disabled="!currentPdfPath"
            :title="currentPdfPath ? '在线查看课本 PDF' : '该册课本 PDF 未配置（见 README 教材资源）'"
            @click="openPdf"
          >📖 查看课本</button>
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

    <!-- 📖 查看课本 PDF 沉浸式全屏 -->
    <Teleport to="body">
      <div v-if="showPdf && currentPdfPath" class="pdf-modal">
        <div class="pdf-modal-inner">
          <!-- 右上角悬浮 X，唯一退出入口 -->
          <button class="pdf-close-float" @click="showPdf = false" aria-label="关闭课本">✕</button>

          <!-- 探测中 -->
          <div v-if="pdfState === 'loading'" class="pdf-state">
            <div class="ps-spinner">⏳</div>
            <p>正在加载课本…</p>
          </div>

          <!-- 资源缺失：引导下载 + 放置路径 -->
          <div v-else-if="pdfState === 'missing'" class="pdf-missing">
            <div class="pm-emoji">📭</div>
            <h4>本地暂无这册课本</h4>
            <p class="pm-line">课本 PDF 体积较大，没有放进代码仓库。请到下面这个开源教材仓库下载：</p>
            <a class="pm-repo" :href="TEXTBOOK_REPO" target="_blank" rel="noopener">{{ TEXTBOOK_REPO }}</a>
            <p class="pm-line">下载后把文件放到下面这个完整路径（文件名需保持一致）：</p>
            <code class="pm-path">{{ missingLocalPath }}</code>
            <button class="pm-retry" @click="openPdf">放好了，重新加载 ↻</button>
          </div>

          <!-- 正常预览 -->
          <iframe v-else :src="currentPdfPath" class="pdf-frame" loading="lazy"></iframe>
        </div>
      </div>
    </Teleport>
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
  pdfPath,
} from '../lib/textbook.js';
import { checkPdfExists, localPdfPath, TEXTBOOK_REPO } from '../lib/pdfResource.js';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const subject = ref(String(route.query.subject || 'math'));
const grade = ref(String(route.query.grade || ''));
const volume = ref(String(route.query.volume || 'up'));

const subjects = computed(() => SUBJECTS.filter(s => textbookHasSubject(s.id)));
const gradeName = computed(() => GRADES.find(g => g.id === grade.value)?.name || '');
const subjectName = computed(() => SUBJECTS.find(s => s.id === subject.value)?.name || '');
const units = computed(() => getUnits(subject.value, grade.value, volume.value));

const showPdf = ref(false);
const pdfState = ref('loading'); // 'loading' | 'ok' | 'missing'
const missingLocalPath = ref('');
const currentPdfPath = computed(() => grade.value ? pdfPath(subject.value, grade.value, volume.value) : null);

async function openPdf() {
  if (!currentPdfPath.value) return;
  showPdf.value = true;
  pdfState.value = 'loading';
  const path = currentPdfPath.value;
  missingLocalPath.value = localPdfPath(path);
  const ok = await checkPdfExists(path);
  if (!showPdf.value || currentPdfPath.value !== path) return; // 期间已切换/关闭
  pdfState.value = ok ? 'ok' : 'missing';
}

// 切册或切年级时自动关闭 PDF 弹窗
watch([subject, grade, volume], () => { showPdf.value = false; });

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

.view-pdf {
  background: #fffaf0; color: #b67517; padding: 6px 14px;
  font-family: inherit; font-weight: 800; font-size: 13px;
  border: 2px solid #f0a93a; border-radius: 999px; cursor: pointer;
  margin-top: 2px;
  transition: transform 0.15s;
}
.view-pdf:hover:not(:disabled) { background: #fff3d6; transform: translateY(-1px); }
.view-pdf:disabled { opacity: 0.4; cursor: not-allowed; border-color: #d6c9b0; color: #b9a892; }

/* PDF 弹层 — 沉浸式全屏，仅留右上角悬浮 X */
.pdf-modal {
  position: fixed; inset: 0; z-index: 1000;
  background: #fff;
  display: flex;
}
.pdf-modal-inner {
  position: relative;
  background: #fff;
  width: 100vw; height: 100vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.pdf-close-float {
  position: absolute;
  top: max(14px, env(safe-area-inset-top));
  right: max(14px, env(safe-area-inset-right));
  z-index: 10;
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(0, 0, 0, 0.55); color: #fff;
  border: none; font-size: 20px; font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, transform 0.15s;
}
.pdf-close-float:hover { background: rgba(0, 0, 0, 0.75); transform: scale(1.05); }
.pdf-frame { flex: 1; border: 0; width: 100%; height: 100%; background: #f4f0e6; }

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
  font-size: 15px; font-weight: 800; color: #3a92e0; word-break: break-all;
  padding: 8px 16px; background: #f0f8ff; border: 2px solid #b0d4f0;
  border-radius: 12px; text-decoration: none;
}
.pm-repo:hover { background: #e0f0ff; }
.pm-path {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 13px; color: #2e7a3c; background: #f0fff4;
  border: 2px solid #b0e0c0; border-radius: 10px;
  padding: 10px 14px; word-break: break-all; max-width: 520px;
}
.pm-retry {
  margin-top: 4px; background: var(--primary); color: #fff;
  padding: 10px 24px; font-family: inherit; font-weight: 900; font-size: 14px;
  border-radius: 12px; cursor: pointer; box-shadow: 0 3px 0 var(--shadow);
}
.pm-retry:hover { transform: translateY(-2px); }

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
