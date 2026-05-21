<template>
  <div class="shop col">
    <div class="topbar">
      <button class="back" @click="$router.push({ name: 'home' })">‹ 返回</button>
      <div class="tabs">
        <button :class="{ on: tab === 'pets' }" @click="tab = 'pets'">宠物</button>
        <button :class="{ on: tab === 'foods' }" @click="tab = 'foods'">口粮</button>
        <button :class="{ on: tab === 'gacha' }" @click="tab = 'gacha'">扭蛋</button>
      </div>
      <span class="coin-pill">🪙 {{ auth.points }}</span>
    </div>

    <p v-if="msg" class="msg" :class="msgType">{{ msg }}</p>

    <div class="content">
      <!-- 宠物：商店统一展示「完全体」预览 -->
      <div v-if="tab === 'pets'" class="grid">
        <div v-for="p in buyablePets" :key="p.id" class="card item col center">
          <div class="art center">
            <PetSprite :pet-id="p.id" mood="normal" :level="MAX_LEVEL" :size="120" />
            <PetIcon class="head-badge" :pet-id="p.id" :level="MAX_LEVEL" :size="44" />
          </div>
          <div class="iname">
            {{ p.cnName }}
            <span class="stage-tag">完全体</span>
          </div>
          <template v-if="p.owned">
            <button disabled>已拥有</button>
          </template>
          <template v-else-if="p.purchasable">
            <button class="btn-primary buy" @click="buyPet(p)">🪙 {{ p.price }}</button>
          </template>
          <template v-else>
            <button disabled class="locked">🔒 {{ p.unlockDesc }}</button>
          </template>
        </div>
      </div>

      <!-- 口粮 -->
      <div v-else-if="tab === 'foods'" class="grid">
        <div v-for="f in foods" :key="f.id" class="card item col center">
          <FoodIcon :food-id="f.id" :size="64" />
          <div class="iname">{{ f.name }}</div>
          <div class="forwhom">给{{ petName(f.petId) }}</div>
          <button class="btn-primary buy" @click="buyFood(f)">🪙 {{ f.price }}</button>
        </div>
      </div>

      <!-- 扭蛋 -->
      <div v-else class="gacha center col">
        <div class="egg">🥚</div>
        <p>消耗 <b>🪙 {{ gachaCost }}</b> 抽一只宠物！<br/><span class="tip">抽到重复会变成 3 份它的专属口粮哦～</span></p>
        <button class="btn-primary big" :disabled="auth.points < gachaCost" @click="doGacha">扭一下！</button>
        <Transition name="pop">
          <div v-if="gachaResult" class="gacha-result card col center">
            <PetSprite :pet-id="gachaResult.petId" mood="happy" :level="MAX_LEVEL" :size="140" />
            <p v-if="gachaResult.type === 'new'" class="good">获得新宠物：{{ petName(gachaResult.petId) }}！</p>
            <p v-else class="dup">重复啦～获得 {{ petName(gachaResult.petId) }} 的专属口粮 ×{{ gachaResult.foodQty }}</p>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import PetSprite from '../components/PetSprite.vue';
import PetIcon from '../components/PetIcon.vue';
import FoodIcon from '../components/FoodIcon.vue';
import { useAuthStore } from '../stores/auth.js';
import { MAX_LEVEL } from '../catalog.js';
import { getShop, buyPet as apiBuyPet, buyFood as apiBuyFood, gacha as apiGacha } from '../db.js';

const auth = useAuthStore();
const tab = ref('pets');
const pets = ref([]);
const foods = ref([]);
const gachaCost = ref(50);
const msg = ref('');
const msgType = ref('');
const gachaResult = ref(null);

const buyablePets = computed(() => pets.value); // 含明购+解锁+(抽卡项也展示但不可买)

function petName(id) {
  return pets.value.find(p => p.id === id)?.cnName || '宠物';
}
function flash(text, type = 'good') {
  msg.value = text; msgType.value = type;
  setTimeout(() => { if (msg.value === text) msg.value = ''; }, 2500);
}

async function load() {
  const res = await getShop();
  pets.value = res.pets;
  foods.value = res.foods;
  gachaCost.value = res.gachaCost;
}

async function buyPet(p) {
  try {
    const res = await apiBuyPet(p.id);
    auth.setPoints(res.points);
    flash(`领养了 ${p.cnName}！`);
    if (res.newlyUnlocked?.length) flash('解锁了新宠物，快去看看！');
    await load();
  } catch (e) { flash(e.message, 'bad'); }
}

async function buyFood(f) {
  try {
    const res = await apiBuyFood(f.id, 1);
    auth.setPoints(res.points);
    flash(`买了 1 份${f.name}`);
  } catch (e) { flash(e.message, 'bad'); }
}

async function doGacha() {
  gachaResult.value = null;
  try {
    const res = await apiGacha();
    auth.setPoints(res.points);
    gachaResult.value = res;
    await load();
  } catch (e) { flash(e.message, 'bad'); }
}

onMounted(load);
</script>

<style scoped>
.shop { flex: 1; min-height: 0; }
.back { background: #fff; color: var(--ink); padding: 8px 16px; box-shadow: 0 3px 0 var(--shadow); }
.tabs { display: flex; gap: 8px; }
.tabs button { background: #fff; color: #9b8b7a; padding: 8px 18px; box-shadow: 0 3px 0 var(--shadow); }
.tabs button.on { background: var(--primary); color: #fff; }
.msg { text-align: center; font-weight: 800; padding: 4px; }
.msg.good { color: var(--green); }
.msg.bad { color: #e85b5b; }

.content { flex: 1; overflow-y: auto; padding: 12px 20px 30px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 16px; }
.item { padding: 16px 12px; gap: 8px; }
.art {
  position: relative; width: 140px; height: 140px;
  border-radius: 18px; background: radial-gradient(circle at 50% 60%, #fff5e0, #fbe7c5 70%, transparent);
  display: flex; align-items: center; justify-content: center;
}
.head-badge { position: absolute; right: -6px; bottom: -4px; }
.iname { font-weight: 900; font-size: 16px; display: flex; align-items: center; gap: 6px; }
.stage-tag {
  font-size: 11px; font-weight: 800; color: #fff;
  padding: 2px 7px; border-radius: 999px;
  background: linear-gradient(90deg, #9b5cd6, #6f3ec0);
}
.forwhom { font-size: 12px; color: #9b8b7a; }
.buy { padding: 8px 18px; font-size: 15px; }
.item button:disabled { background: #eee; color: #999; box-shadow: none; padding: 8px 14px; border-radius: 999px; font-size: 13px; }
.locked { font-size: 11px !important; line-height: 1.3; }

.gacha { gap: 18px; padding-top: 30px; text-align: center; }
.egg { font-size: 90px; animation: wob 2s ease infinite; }
@keyframes wob { 0%,100%{ transform: rotate(-6deg) } 50%{ transform: rotate(6deg) } }
.tip { font-size: 13px; color: #9b8b7a; }
.big { font-size: 22px; padding: 16px 48px; }
.gacha-result { padding: 20px 30px; margin-top: 10px; gap: 8px; }
.good { color: var(--green); font-weight: 900; }
.dup { color: var(--accent-dark); font-weight: 800; }
.pop-enter-active { transition: all 0.3s cubic-bezier(.34,1.56,.64,1); }
.pop-enter-from { opacity: 0; transform: scale(0.7); }
</style>
