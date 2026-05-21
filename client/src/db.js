// 数据访问层：用 Supabase 实现原后端的全部能力（纯前端）
import { supabase } from './supabase.js';
import {
  PETS, FOODS, findPet, findFood, expForLevel, MAX_LEVEL,
  GACHA_COST, GACHA_DUP_FOOD_QTY, GACHA_POOL,
} from './catalog.js';
import { scoreRound, petMood, unlockConditions } from './lib/gameLogic.js';

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data?.user) throw new Error('请先登录');
  return data.user.id;
}

// ===== 玩家档案 =====
export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles').select('points, main_level').single();
  if (error) throw new Error(error.message);
  return { points: data.points, mainLevel: data.main_level };
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
}

export async function listMyFoods() {
  const { data, error } = await supabase
    .from('user_foods').select('food_id, quantity').gt('quantity', 0);
  if (error) throw new Error(error.message);
  return Object.fromEntries(data.map(r => [r.food_id, r.quantity]));
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
  const owned = new Set((await ownedPetIds()).map(p => p.pet_id));
  const unlocked = await unlockedKeys();
  const pets = PETS.map(p => ({
    ...p,
    owned: owned.has(p.id),
    purchasable: p.acquireType === 'buy' || (p.acquireType === 'unlock' && unlocked.has(p.unlockKey)),
  }));
  return { pets, foods: FOODS, gachaCost: GACHA_COST };
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

export async function buyPet(petId) {
  const pet = findPet(petId);
  if (!pet) throw new Error('宠物不存在');
  if (pet.acquireType === 'gacha') throw new Error('该宠物仅限抽卡获得');
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
async function rollFoodDrops(score) {
  if (score.correctCount < 3) return [];
  const owned = await ownedPetIds();
  if (!owned.length) return [];
  const foodIds = owned
    .map(p => findPet(p.pet_id)?.foodId)
    .filter(Boolean);
  if (!foodIds.length) return [];

  const totalQty = score.perfect ? 3 : (score.correctCount >= 4 ? 2 : 1);
  const merged = {};
  for (let i = 0; i < totalQty; i++) {
    const id = foodIds[Math.floor(Math.random() * foodIds.length)];
    merged[id] = (merged[id] || 0) + 1;
  }

  for (const [foodId, qty] of Object.entries(merged)) {
    await addFood(foodId, qty);
  }
  return Object.entries(merged).map(([foodId, qty]) => ({
    foodId, qty, name: findFood(foodId)?.name || foodId,
  }));
}

export async function submitRound(results) {
  const score = scoreRound(results);
  const userId = await uid();
  const rows = results.map(r => ({
    user_id: userId,
    question: String(r.question ?? ''),
    answer: Number(r.answer ?? 0),
    user_answer: r.userAnswer == null ? null : Number(r.userAnswer),
    is_correct: !!r.isCorrect,
    error_count: Number(r.errorCount ?? 0),
    time_ms: Number(r.timeMs ?? 0),
  }));
  const { error } = await supabase.from('answer_history').insert(rows);
  if (error) throw new Error(error.message);
  const points = await addPoints(score.total);
  const foodDrops = await rollFoodDrops(score);
  const newlyUnlocked = await evaluateUnlocks();
  return { score, points, foodDrops, newlyUnlocked };
}

export async function getHistory() {
  const { data, error } = await supabase
    .from('answer_history').select('*').order('id', { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  return data;
}
