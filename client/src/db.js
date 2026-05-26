// 数据访问层：用 Supabase 实现原后端的全部能力（纯前端）
import { supabase } from './supabase.js';
import {
  PETS, FOODS, findPet, findFood, expForLevel, MAX_LEVEL,
  GACHA_COST, GACHA_DUP_FOOD_QTY, GACHA_POOL,
  FRAGMENT_PET, FRAGMENT_KEY, FRAGMENT_GOAL,
} from './catalog.js';
import { scoreRound, petMood, unlockConditions } from './lib/gameLogic.js';
import { cacheGet, cacheSet } from './lib/cloudCache.js';
import { markCloudOnline, markCloudOffline } from './lib/cloudHealth.js';

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data?.user) throw new Error('请先登录');
  return data.user.id;
}

// 当前 userId（无需等待 Supabase，给缓存读写用）
async function uidForCache() {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || 'guest';
  } catch {
    return 'guest';
  }
}

/**
 * 云端读 + 本地缓存兜底
 * - 成功：写缓存 + 标记 online + 返回数据
 * - 失败 + 有缓存：标记 offline + 返回缓存
 * - 失败 + 无缓存 + 有 fallback：标记 offline + 返回 fallback
 * - 失败 + 无缓存 + 无 fallback：抛错
 */
async function withCache(topic, fetcher, fallback) {
  try {
    const data = await fetcher();
    const u = await uidForCache();
    cacheSet(u, topic, data);
    markCloudOnline();
    return data;
  } catch (e) {
    const u = await uidForCache();
    const cached = cacheGet(u, topic);
    if (cached !== null && cached !== undefined) {
      console.warn(`[cloud] ${topic} 失败，使用缓存：`, e?.message || e);
      markCloudOffline(topic);
      return cached;
    }
    if (fallback !== undefined) {
      console.warn(`[cloud] ${topic} 失败且无缓存，使用 fallback：`, e?.message || e);
      markCloudOffline(topic);
      return fallback;
    }
    throw e;
  }
}

// ===== 玩家档案 =====
export async function getProfile() {
  return withCache('profile', async () => {
    const { data, error } = await supabase
      .from('profiles').select('points, main_level').single();
    if (error) throw new Error(error.message);
    return { points: data.points, mainLevel: data.main_level };
  }, { points: 0, mainLevel: 1 });
}

async function addPoints(delta) {
  const { data, error } = await supabase.rpc('add_points', { delta });
  if (error) throw new Error(error.message);
  return data; // 新积分
}

async function getPoints() {
  const { data, error } = await supabase.from('profiles').select('points').single();
  if (error) throw new Error(error.message);
  return data.points;
}

// ===== 我的宠物 / 口粮 =====
export async function listMyPets() {
  return withCache('myPets', async () => {
    const { data, error } = await supabase
      .from('user_pets').select('*').order('created_at');
    if (error) throw new Error(error.message);
    return data.map(r => {
      const cat = findPet(r.pet_id);
      return {
        petId: r.pet_id, name: cat?.cnName, level: r.level, exp: r.exp,
        expNeeded: r.level >= MAX_LEVEL ? null : expForLevel(r.level),
        intimacy: r.intimacy, foodId: cat?.foodId,
        mood: petMood(r.last_fed_at), lastFedAt: r.last_fed_at,
      };
    });
  }, []);
}

export async function listMyFoods() {
  return withCache('myFoods', async () => {
    const { data, error } = await supabase
      .from('user_foods').select('food_id, quantity').gt('quantity', 0);
    if (error) throw new Error(error.message);
    return Object.fromEntries(data.map(r => [r.food_id, r.quantity]));
  }, {});
}

async function ownedPetIds() {
  const { data, error } = await supabase.from('user_pets').select('pet_id, level');
  if (error) throw new Error(error.message);
  return data;
}

async function unlockedKeys() {
  const { data, error } = await supabase.from('user_unlocks').select('unlock_key');
  if (error) throw new Error(error.message);
  return new Set(data.map(r => r.unlock_key));
}

// ===== 解锁评估 =====
export async function evaluateUnlocks() {
  const owned = await ownedPetIds();
  const { mainLevel } = await getProfile();
  const ctx = {
    ownedCount: owned.length,
    mainLevel,
    maxPetLevel: owned.reduce((m, p) => Math.max(m, p.level), 0),
    ghostCount: owned.filter(p => findPet(p.pet_id)?.category === 'ghost').length,
  };
  const conds = unlockConditions(ctx);
  const already = await unlockedKeys();
  const toAdd = Object.entries(conds)
    .filter(([k, met]) => met && !already.has(k))
    .map(([k]) => k);
  if (toAdd.length === 0) return [];
  const userId = await uid();
  const { error } = await supabase
    .from('user_unlocks')
    .upsert(toAdd.map(k => ({ user_id: userId, unlock_key: k })), { onConflict: 'user_id,unlock_key', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  return toAdd;
}

// ===== 商店 =====
export async function getShop() {
  return withCache('shop', async () => {
    const owned = new Set((await ownedPetIds()).map(p => p.pet_id));
    const unlocked = await unlockedKeys();
    const fragments = await getFragments();
    const pets = PETS.map(p => ({
      ...p,
      owned: owned.has(p.id),
      purchasable: p.acquireType === 'buy' || (p.acquireType === 'unlock' && unlocked.has(p.unlockKey)),
    }));
    return { pets, foods: FOODS, gachaCost: GACHA_COST, fragments, fragmentGoal: FRAGMENT_GOAL };
  }, {
    // 完全离线（首次进入即失败、无缓存）：所有宠物默认未拥有，按 acquireType 决定可购买
    pets: PETS.map(p => ({
      ...p,
      owned: false,
      purchasable: p.acquireType === 'buy',
    })),
    foods: FOODS,
    gachaCost: GACHA_COST,
    fragments: {},
    fragmentGoal: FRAGMENT_GOAL,
  });
}

async function addFood(foodId, qty) {
  const userId = await uid();
  const { data: existing } = await supabase
    .from('user_foods').select('quantity').eq('food_id', foodId).maybeSingle();
  const newQty = (existing?.quantity || 0) + qty;
  const { error } = await supabase
    .from('user_foods')
    .upsert({ user_id: userId, food_id: foodId, quantity: newQty }, { onConflict: 'user_id,food_id' });
  if (error) throw new Error(error.message);
}

// 碎片：累加并返回累加后的总数
async function addFragments(fragKey, qty) {
  const userId = await uid();
  const { data: existing } = await supabase
    .from('user_fragments').select('quantity').eq('frag_key', fragKey).maybeSingle();
  const newQty = (existing?.quantity || 0) + qty;
  const { error } = await supabase
    .from('user_fragments')
    .upsert({ user_id: userId, frag_key: fragKey, quantity: newQty }, { onConflict: 'user_id,frag_key' });
  if (error) throw new Error(error.message);
  return newQty;
}

export async function getFragments() {
  return withCache('myFragments', async () => {
    const { data, error } = await supabase
      .from('user_fragments').select('frag_key, quantity');
    if (error) throw new Error(error.message);
    return Object.fromEntries(data.map(r => [r.frag_key, r.quantity]));
  }, {});
}

export async function buyPet(petId) {
  const pet = findPet(petId);
  if (!pet) throw new Error('宠物不存在');
  if (pet.acquireType === 'gacha') throw new Error('该宠物仅限抽卡获得');
  if (pet.acquireType === 'fragment') throw new Error('该宠物需集齐碎片召唤');
  const unlocked = await unlockedKeys();
  if (pet.acquireType === 'unlock' && !unlocked.has(pet.unlockKey)) throw new Error('该宠物尚未解锁');

  const owned = new Set((await ownedPetIds()).map(p => p.pet_id));
  if (owned.has(petId)) throw new Error('已拥有该宠物');
  if (await getPoints() < pet.price) throw new Error('积分不足');

  const userId = await uid();
  const { error } = await supabase.from('user_pets').insert({ user_id: userId, pet_id: petId });
  if (error) throw new Error(error.message);
  const points = await addPoints(-pet.price);
  const newlyUnlocked = await evaluateUnlocks();
  return { points, newlyUnlocked };
}

export async function buyFood(foodId, qty = 1) {
  const food = findFood(foodId);
  if (!food) throw new Error('口粮不存在');
  qty = Math.max(1, Math.floor(qty));
  const cost = food.price * qty;
  if (await getPoints() < cost) throw new Error('积分不足');
  await addFood(foodId, qty);
  const points = await addPoints(-cost);
  return { points, quantity: qty };
}

export async function gacha() {
  if (await getPoints() < GACHA_COST) throw new Error('积分不足');
  const petId = GACHA_POOL[Math.floor(Math.random() * GACHA_POOL.length)];
  const pet = findPet(petId);
  const owned = new Set((await ownedPetIds()).map(p => p.pet_id));

  await addPoints(-GACHA_COST);
  let result;
  if (owned.has(petId)) {
    await addFood(pet.foodId, GACHA_DUP_FOOD_QTY);
    result = { type: 'duplicate', petId, foodId: pet.foodId, foodQty: GACHA_DUP_FOOD_QTY };
  } else {
    const userId = await uid();
    const { error } = await supabase.from('user_pets').insert({ user_id: userId, pet_id: petId });
    if (error) throw new Error(error.message);
    result = { type: 'new', petId };
  }
  const points = await getPoints();
  const newlyUnlocked = await evaluateUnlocks();
  return { ...result, points, newlyUnlocked };
}

// ===== 喂食 =====
export async function feed(petId) {
  const cat = findPet(petId);
  if (!cat) throw new Error('宠物不存在');

  const { data: up, error: e1 } = await supabase
    .from('user_pets').select('*').eq('pet_id', petId).maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!up) throw new Error('你还没有这只宠物');

  const food = findFood(cat.foodId);
  const { data: inv } = await supabase
    .from('user_foods').select('quantity').eq('food_id', cat.foodId).maybeSingle();
  if (!inv || inv.quantity < 1) throw new Error(`缺少口粮：${food.name}`);

  let { level, exp, intimacy } = up;
  exp += food.exp;
  intimacy = Math.min(100, intimacy + food.intimacy);
  let leveledUp = false;
  while (level < MAX_LEVEL && exp >= expForLevel(level)) {
    exp -= expForLevel(level); level += 1; leveledUp = true;
  }
  if (level >= MAX_LEVEL) exp = 0;

  await supabase.from('user_foods')
    .update({ quantity: inv.quantity - 1 }).eq('food_id', cat.foodId);
  const { error: e2 } = await supabase.from('user_pets')
    .update({ level, exp, intimacy, last_fed_at: new Date().toISOString() })
    .eq('pet_id', petId);
  if (e2) throw new Error(e2.message);

  const newlyUnlocked = await evaluateUnlocks();
  return {
    leveledUp, newlyUnlocked,
    pet: { petId, level, exp, expNeeded: level >= MAX_LEVEL ? null : expForLevel(level), intimacy, mood: 'happy' },
  };
}

// ===== 提交一轮 =====
// 掉落由前端 rollRoundDrops 一次性决定（保证「显示=入账」），此处只负责落库：
//   drops = { foods: [{foodId, qty}], fragments: [{fragKey, qty}] }
// 碎片累加后若达标且尚未拥有该稀有宠物 → 自动召唤。
export async function submitRound(results, context = null, drops = null) {
  // context: { subjectId, moduleId, categoryId, stage } | null
  const score = scoreRound(results);
  const userId = await uid();
  const ctxStr = context
    ? `[${context.subjectId}/${context.moduleId}${context.categoryId ? '/' + context.categoryId : ''}#${context.stage}] `
    : '';
  const rows = results.map(r => ({
    user_id: userId,
    question: ctxStr + String(r.question ?? ''),
    answer: Number.isFinite(Number(r.answer)) ? Number(r.answer) : 0,
    user_answer: r.userAnswer == null ? null : (Number.isFinite(Number(r.userAnswer)) ? Number(r.userAnswer) : null),
    is_correct: !!r.isCorrect,
    error_count: Number(r.errorCount ?? 0),
    time_ms: Number(r.timeMs ?? 0),
  }));
  const { error } = await supabase.from('answer_history').insert(rows);
  if (error) throw new Error(error.message);
  const points = await addPoints(score.total);

  // 口粮落库
  const foodDrops = [];
  for (const d of (drops?.foods || [])) {
    if (!d?.foodId || !d.qty) continue;
    await addFood(d.foodId, d.qty);
    foodDrops.push({ foodId: d.foodId, qty: d.qty, name: findFood(d.foodId)?.name || d.foodId });
  }

  // 碎片落库 + 集齐召唤
  let fragmentTotal = null;
  let rarePetGranted = false;
  const fragQty = (drops?.fragments || []).reduce((s, f) => s + (f?.qty || 0), 0);
  if (fragQty > 0) {
    const owned = new Set((await ownedPetIds()).map(p => p.pet_id));
    if (!owned.has(FRAGMENT_PET)) {
      fragmentTotal = await addFragments(FRAGMENT_KEY, fragQty);
      if (fragmentTotal >= FRAGMENT_GOAL) {
        const { error: e2 } = await supabase.from('user_pets')
          .insert({ user_id: userId, pet_id: FRAGMENT_PET });
        if (!e2) rarePetGranted = true;
      }
    }
  }

  const newlyUnlocked = await evaluateUnlocks();
  return {
    score, points, foodDrops,
    fragmentDrop: fragQty, fragmentTotal, fragmentGoal: FRAGMENT_GOAL,
    rarePetGranted, rarePetId: FRAGMENT_PET,
    newlyUnlocked,
  };
}

export async function getHistory() {
  const { data, error } = await supabase
    .from('answer_history').select('*').order('id', { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  return data;
}
