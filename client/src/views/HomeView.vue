<template>
  <div class="home col">
    <div class="topbar">
      <div class="title">🧮 数字积木大冒险</div>
      <div class="right">
        <span class="coin-pill">🪙 {{ auth.points }}</span>
        <button class="logout" @click="logout">退出</button>
      </div>
    </div>

    <div class="hub center col">
      <!-- 展示宠物 -->
      <div class="showcase center col">
        <PetSprite v-if="featured" :pet-id="featured.petId" :mood="featured.mood" :level="featured.level" :size="160" />
        <div v-else class="no-pet">
          <PetSprite pet-id="cat" mood="normal" :size="140" />
          <p>还没有宠物，去商店领养一只吧！</p>
        </div>
        <p v-if="featured" class="pet-name">{{ featured.name }} · Lv.{{ featured.level }}</p>
      </div>

      <!-- 关卡选择 -->
      <div class="stage-list">
        <div class="sl-title">📍 选择关卡</div>
        <div class="sl-grid">
          <button
            v-for="s in STAGES" :key="s.id"
            class="stage-card"
            :class="{ locked: !isStageUnlocked(s.id), cleared: isStageCleared(s.id), current: s.id === currentStage }"
            :disabled="!isStageUnlocked(s.id)"
            @click="playStage(s.id)"
          >
            <span class="sc-emoji">{{ s.emoji }}</span>
            <span class="sc-title">第 {{ s.id }} 关</span>
            <span class="sc-name">{{ s.name }}</span>
            <span class="sc-range">{{ s.desc }}</span>
            <span class="sc-state">
              <span v-if="isStageCleared(s.id)">✅ 已通关</span>
              <span v-else-if="s.id === currentStage">▶ 开始</span>
              <span v-else>🔒 未解锁</span>
            </span>
          </button>
        </div>
      </div>

      <!-- 次级菜单 -->
      <div class="menu">
        <button class="btn-accent" @click="go('shop')">🛒 商店</button>
        <button class="btn-accent" @click="go('pets')">🏠 我的宠物</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PetSprite from '../components/PetSprite.vue';
import { useAuthStore } from '../stores/auth.js';
import { listMyPets } from '../db.js';
import { STAGES } from '../catalog.js';
import {
  isStageUnlocked, isStageCleared, nextChallengeStage,
} from '../lib/progress.js';

const auth = useAuthStore();
const router = useRouter();
const pets = ref([]);
const currentStage = ref(1);

const featured = computed(() => pets.value[0] || null);

function go(name) { router.push({ name }); }
function playStage(id) {
  if (!isStageUnlocked(id)) return;
  router.push({ name: 'quiz', query: { stage: id } });
}
async function logout() { await auth.logout(); router.push({ name: 'login' }); }

onMounted(async () => {
  try {
    await auth.refreshProfile();
    pets.value = await listMyPets();
  } catch { /* ignore */ }
  currentStage.value = nextChallengeStage();
});
</script>

<style scoped>
.home { flex: 1; }
.title { font-size: 22px; font-weight: 900; color: var(--primary-dark); }
.right { display: flex; align-items: center; gap: 12px; }
.logout { background: #fff; color: #9b8b7a; padding: 8px 14px; box-shadow: 0 3px 0 var(--shadow); }

.hub { flex: 1; gap: 20px; padding: 8px 16px 24px; overflow-y: auto; }
.showcase { gap: 6px; }
.pet-name { font-size: 18px; font-weight: 900; color: var(--ink); }
.no-pet { text-align: center; color: #9b8b7a; }
.no-pet p { margin-top: 6px; }

.stage-list { width: 100%; max-width: 720px; }
.sl-title {
  text-align: center; font-weight: 900; color: var(--primary-dark);
  font-size: 18px; margin-bottom: 10px;
}
.sl-grid {
  display: grid; gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}

.stage-card {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: #fffdf6; padding: 16px 10px 12px;
  border-radius: 18px; box-shadow: 0 5px 0 var(--shadow);
  color: var(--ink); font-family: inherit;
  cursor: pointer; transition: transform 0.15s;
}
.stage-card:hover:not(:disabled) { transform: translateY(-3px); }
.stage-card.current {
  background: linear-gradient(180deg, #fff8e0, #ffe9b8);
  box-shadow: 0 5px 0 #d9a14a, inset 0 0 0 3px #ffce6f;
}
.stage-card.cleared { background: #eaf7e6; box-shadow: 0 5px 0 #6db257; }
.stage-card.locked { background: #f0eae0; color: #b9a892; cursor: not-allowed; box-shadow: 0 4px 0 #c8b89e; }

.sc-emoji { font-size: 34px; line-height: 1; }
.sc-title { font-size: 14px; font-weight: 900; color: var(--primary-dark); }
.stage-card.locked .sc-title { color: #a08c75; }
.sc-name { font-size: 16px; font-weight: 900; }
.sc-range { font-size: 12px; color: #9b8b7a; }
.sc-state { font-size: 12px; font-weight: 800; margin-top: 4px; color: var(--primary-dark); }
.stage-card.cleared .sc-state { color: #3f8a31; }
.stage-card.locked .sc-state { color: #a08c75; }

.menu { display: flex; gap: 14px; justify-content: center; }
</style>
