// 出题：根据关卡 maxNum 限制数字范围，加减法都不超出 [0, maxNum]
// 返回 { question, a, b, op, answer, slots, tiles }

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function genQuestion(maxNum = 100) {
  const max = Math.max(2, Math.min(100, Math.floor(maxNum)));
  const op = Math.random() < 0.5 ? '+' : '-';
  let a, b, answer;

  if (op === '+') {
    a = randInt(1, Math.max(1, max - 1));
    b = randInt(1, max - a);   // 保证 a + b ≤ max
    answer = a + b;
  } else {
    a = randInt(1, max);
    b = randInt(0, a);         // 保证结果 ≥ 0
    answer = a - b;
  }

  const answerDigits = String(answer).split('').map(Number);
  const slots = answerDigits.length;

  // 候选积木池：正确位数个 + 干扰项补足到 4 块
  const POOL_SIZE = 4;
  const tiles = [...answerDigits];
  while (tiles.length < POOL_SIZE) {
    const d = randInt(0, 9);
    tiles.push(d); // 允许重复干扰，更自然
  }
  // 若答案位数 > 4（不会发生，最大 100=3 位），保护性截断
  const finalTiles = tiles.slice(0, Math.max(POOL_SIZE, slots));

  return {
    question: `${a} ${op} ${b}`,
    a, b, op,
    answer,
    slots,
    tiles: shuffle(finalTiles),
  };
}

// 校验玩家填入的数字序列是否等于答案
export function checkAnswer(filledDigits, answer) {
  if (filledDigits.some(d => d == null)) return false;
  return Number(filledDigits.join('')) === answer;
}
