<template>
  <div class="pethouse col">
    <div class="topbar">
      <button class="back" @click="$router.push({ name: 'home' })">‹ 返回</button>
      <div class="title">🏠 我的宠物</div>
      <span class="coin-pill">🪙 {{ auth.points }}</span>
    </div>

    <p v-if="msg" class="msg" :class="msgType">{{ msg }}</p>

    <div class="content">
      <p v-if="pets.length === 0" class="empty">还没有宠物，去商店领养一只吧！</p>

      <div class="grid">
        <div v-for="p in pets" :key="p.petId" class="card pet-card col center" @click="openPreview(p)">
          <div class="card-art center">
            <PetSprite :pet-id="p.petId" :mood="p.mood" :level="p.level" :size="120" />
            <PetIcon class="card-badge" :pet-id="p.petId" :level="p.level" :size="40" />
          </div>
          <div class="pname">
            {{ p.name }}
            <span class="stage" :style="{ background: stageBg(p.level) }">{{ stageName(p.petId, p.level) }}</span>
          </div>

          <div class="stat">
            <span class="lv">Lv.{{ p.level }}</span>
            <div class="bar"><div class="fill exp" :style="{ width: expPct(p) + '%' }"></div></div>
          </div>
          <div class="stat">
            <span class="lbl">❤️亲密</span>
            <div class="bar"><div class="fill inti" :style="{ width: p.intimacy + '%' }"></div></div>
          </div>

          <div class="feed-row" @click.stop>
            <FoodIcon :food-id="p.foodId" :size="36" />
            <span class="own">×{{ foodQty(p.foodId) }}</span>
            <button class="btn-primary feed" :disabled="foodQty(p.foodId) < 1" @click="feed(p)">喂食</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 放大预览 -->
    <Transition name="pop">
      <div v-if="preview" class="overlay center" @click.self="preview = null">
        <div class="preview-card col">
          <button class="close" @click="preview = null">✕</button>
          <div class="pv-stage-row">
            <PetIcon v-for="s in 4" :key="s"
              :pet-id="preview.petId"
              :level="STAGE_MIN_LEVEL[s - 1]"
              :size="58"
              :locked="s - 1 > petStage(preview.level)"
              :badge="s - 1" />
          </div>

          <div class="pv-art center" :style="{ background: radialBg(preview.level) }">
            <PetSprite :pet-id="preview.petId" :mood="preview.mood" :level="preview.level" :size="220" />
          </div>

          <div class="pv-name">
            {{ preview.name }}
            <span class="stage" :style="{ background: stageBg(preview.level) }">{{ stageName(preview.petId, preview.level) }}</span>
          </div>
          <div class="pv-stars">
            <span v-for="s in 4" :key="s" :class="{ on: s <= petStage(preview.level) + 1 }">★</span>
          </div>
          <p class="pv-desc">{{ stageDesc(preview.petId, preview.level) }}</p>
          <div v-if="previewStage" class="pv-stage-meta">
            <div>
              <b>外观</b>
              <span>{{ previewStage.appearanceKeywords.join('、') || '基础外观' }}</span>
            </div>
            <div>
              <b>定位</b>
              <span>{{ previewStage.statusRole || '陪伴型宠物' }}</span>
            </div>
            <div>
              <b>解锁</b>
              <span>{{ previewStage.unlockCondition }}</span>
            </div>
          </div>

          <div class="pv-stat"><span>等级</span><b>Lv.{{ preview.level }} / {{ MAX_LEVEL }}</b></div>
          <div class="stat"><span class="lbl">经验</span><div class="bar"><div class="fill exp" :style="{ width: expPct(preview) + '%' }"></div></div></div>
          <div class="stat"><span class="lbl">❤️亲密</span><div class="bar"><div class="fill inti" :style="{ width: preview.intimacy + '%' }"></div></div></div>

          <div class="feed-row">
            <FoodIcon :food-id="preview.foodId" :size="36" />
            <span class="own">×{{ foodQty(preview.foodId) }}</span>
            <button class="btn-primary feed" :disabled="foodQty(preview.foodId) < 1" @click="feed(preview)">喂食</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 进化特效 -->
    <Transition name="fade">
      <div v-if="evolving" class="evo-overlay center" :style="{ '--evo': STAGE_COLORS[evolving.stage] }">
        <div class="evo-rings"><span></span><span></span><span></span></div>
        <div class="evo-pet center">
          <PetSprite :pet-id="evolving.petId" mood="happy" :level="evolving.level" :size="240" />
        </div>
        <div class="evo-text">✨ 进化！{{ stageName(evolving.petId, evolving.level) }}</div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import PetSprite from '../components/PetSprite.vue';
import PetIcon from '../components/PetIcon.vue';
import FoodIcon from '../components/FoodIcon.vue';
import { useAuthStore } from '../stores/auth.js';
import { listMyPets, listMyFoods, feed as apiFeed } from '../db.js';
import { petStage, stageName, stageDesc, growthStageResource, STAGE_COLORS, STAGE_MIN_LEVEL, MAX_LEVEL } from '../catalog.js';

const auth = useAuthStore();
const pets = ref([]);
const foods = ref({});      // foodId -> qty
const msg = ref('');
const msgType = ref('');
const preview = ref(null);  // 当前放大预览的宠物
const evolving = ref(null); // { petId, level, stage } 进化特效
const previewStage = computed(() => (
  preview.value ? growthStageResource(preview.value.petId, preview.value.level) : null
));

function foodQty(id) { return foods.value[id] || 0; }
function expPct(p) { return p.expNeeded ? Math.round((p.exp / p.expNeeded) * 100) : 100; }
function stageBg(level) {
  const c = STAGE_COLORS[petStage(level)];
  return `linear-gradient(90deg, ${c}, ${c}cc)`;
}
function radialBg(level) {
  const c = STAGE_COLORS[petStage(level)];
  return `radial-gradient(circle at 50% 60%, ${c}33, ${c}11 60%, transparent 75%)`;
}
function openPreview(p) { preview.value = p; }
function flash(t, type = 'good') {
  msg.value = t; msgType.value = type;
  setTimeout(() => { if (msg.value === t) msg.value = ''; }, 2500);
}

async function load() {
  const [petList, foodMap] = await Promise.all([listMyPets(), listMyFoods()]);
  pets.value = petList;
  foods.value = foodMap;
  if (preview.value) preview.value = petList.find(x => x.petId === preview.value.petId) || null;
}

async function feed(p) {
  try {
    const beforeStage = petStage(p.level);
    const res = await apiFeed(p.petId);
    const afterStage = petStage(res.pet.level);
    await load();
    if (afterStage > beforeStage) {
      playEvolve(p.petId, res.pet.level, afterStage);
    } else {
      flash(res.leveledUp ? `${p.name} 升级到 Lv.${res.pet.level}！🎉` : `${p.name} 吃得好开心～`);
    }
    if (res.newlyUnlocked?.length) flash('达成条件，解锁了新宠物！');
  } catch (e) { flash(e.message, 'bad'); }
}

function playEvolve(petId, level, stage) {
  evolving.value = { petId, level, stage };
  setTimeout(() => {
    evolving.value = null;
    flash(`✨ 进化成「${stageName(petId, level)}」啦！`);
  }, 2200);
}

onMounted(load);
</script>

<style scoped>
.pethouse { flex: 1; min-height: 0; }
.back { background: #fff; color: var(--ink); padding: 8px 16px; box-shadow: 0 3px 0 var(--shadow); }
.title { font-weight: 900; color: var(--primary-dark); font-size: 20px; }
.msg { text-align: center; font-weight: 800; }
.msg.good { color: var(--green); }
.msg.bad { color: #e85b5b; }

.content { flex: 1; overflow-y: auto; padding: 16px 22px 30px; }
.empty { text-align: center; color: #9b8b7a; margin-top: 40px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 18px; }
.pet-card { padding: 18px 16px; gap: 8px; cursor: pointer; transition: transform 0.15s; }
.pet-card:hover { transform: translateY(-3px); }
.card-art {
  position: relative; width: 130px; height: 130px;
  border-radius: 18px;
  background: radial-gradient(circle at 50% 60%, #fff5e0, #fbe7c5 70%, transparent);
  display: flex; align-items: center; justify-content: center;
}
.card-badge { position: absolute; right: -4px; bottom: -2px; }
.pname { font-weight: 900; font-size: 18px; }
.stage {
  font-size: 12px; font-weight: 800; color: #fff;
  padding: 2px 8px; border-radius: 999px; margin-left: 4px;
  vertical-align: middle;
}

.stat { display: flex; align-items: center; gap: 8px; width: 100%; font-size: 13px; }
.lv, .lbl { min-width: 46px; font-weight: 800; color: #9b8b7a; }
.bar { flex: 1; height: 12px; background: #f0e6d8; border-radius: 999px; overflow: hidden; }
.fill { height: 100%; border-radius: 999px; transition: width 0.4s; }
.fill.exp { background: linear-gradient(90deg, #6fcf6f, #4ade80); }
.fill.inti { background: linear-gradient(90deg, #ff7eb6, #ff5d8f); }

.feed-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.own { font-weight: 800; color: #9b8b7a; }
.feed { padding: 8px 20px; font-size: 15px; }

/* ===== 放大预览 ===== */
.overlay { position: fixed; inset: 0; background: rgba(60,40,20,0.5); z-index: 60; }
.preview-card {
  position: relative; width: 320px; max-width: 90vw;
  background: #fffdf6; border-radius: 24px; padding: 20px 22px 22px;
  gap: 8px; align-items: center; box-shadow: 0 18px 40px rgba(0,0,0,0.3);
}
.close {
  position: absolute; top: 12px; right: 12px; width: 30px; height: 30px;
  border-radius: 50%; background: #f0e6d8; color: #8a7a66; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
}
.pv-stage-row {
  display: flex; gap: 12px; padding: 6px 4px 4px;
  justify-content: center; flex-wrap: wrap;
}
.pv-art {
  width: 240px; height: 240px; border-radius: 20px; margin: 4px 0;
}
.pv-name { font-weight: 900; font-size: 22px; }
.pv-stars { font-size: 22px; color: #d8c8b0; letter-spacing: 2px; }
.pv-stars .on { color: #ffc83a; }
.pv-desc { color: #8a7a66; text-align: center; font-size: 14px; margin: 2px 8px 6px; }
.pv-stage-meta {
  width: 100%; display: grid; gap: 6px; margin: 2px 0 6px;
  background: #fff7e8; border-radius: 14px; padding: 10px 12px;
  box-shadow: inset 0 0 0 1px #f2dfbd;
}
.pv-stage-meta div { display: grid; grid-template-columns: 42px 1fr; gap: 8px; align-items: start; }
.pv-stage-meta b { color: var(--primary-dark); font-size: 13px; }
.pv-stage-meta span { color: #6f5a45; font-size: 13px; line-height: 1.35; }
.pv-stat { display: flex; justify-content: space-between; width: 100%; font-weight: 800; color: #9b8b7a; font-size: 14px; }
.pv-stat b { color: var(--ink); }
.preview-card .stat { margin-top: 2px; }

/* ===== 进化特效 ===== */
.evo-overlay {
  position: fixed; inset: 0; z-index: 80; flex-direction: column;
  background: radial-gradient(circle at 50% 45%, rgba(255,255,255,0.25), rgba(20,10,30,0.78) 70%);
}
.evo-rings { position: absolute; top: 45%; left: 50%; }
.evo-rings span {
  position: absolute; left: 0; top: 0; transform: translate(-50%,-50%);
  width: 60px; height: 60px; border-radius: 50%;
  border: 4px solid var(--evo); opacity: 0;
  animation: ring 2.2s ease-out infinite;
}
.evo-rings span:nth-child(2) { animation-delay: 0.4s; }
.evo-rings span:nth-child(3) { animation-delay: 0.8s; }
@keyframes ring {
  0% { width: 40px; height: 40px; opacity: 0.9; }
  100% { width: 360px; height: 360px; opacity: 0; }
}
.evo-pet {
  position: relative; z-index: 1;
  filter: drop-shadow(0 0 24px var(--evo));
  animation: evopop 2.2s ease;
}
@keyframes evopop {
  0% { transform: scale(0.4) translateY(20px); opacity: 0; }
  30% { transform: scale(1.12); opacity: 1; }
  55% { transform: scale(1); }
  100% { transform: scale(1.04); opacity: 1; }
}
.evo-text {
  position: relative; z-index: 1; margin-top: 16px;
  color: #fff; font-weight: 900; font-size: 26px;
  text-shadow: 0 2px 10px var(--evo);
  animation: evotext 2.2s ease;
}
@keyframes evotext { 0%,20%{ opacity:0; transform: translateY(10px);} 40%{ opacity:1; transform:none;} 100%{ opacity:1; } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.pop-enter-active { transition: all 0.25s cubic-bezier(.34,1.56,.64,1); }
.pop-enter-from { opacity: 0; transform: scale(0.85); }
</style>
