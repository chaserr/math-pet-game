// 数学拆分技巧（凑十法 / 破十法）
// 引导小朋友：把两位数拆成 整十 + 个位，先算整十再算个位；个位不够时再拆。
//
// 例 34 - 25 → 25=20+5 → 34-20=14 → 14的个位<5 → 5=4+1 → 14-4=10 → 10-1=9
// 例 28 + 35 → 35=30+5 → 28+30=58 → 58+5>10 → 5=2+3 → 58+2=60 → 60+3=63
//
// 返回步骤数组 [{ kind, ... }]：
//   { kind: 'direct',  a, b, op, answer }                    一步到位（不需要拆分）
//   { kind: 'split',   target, parts: [p1, p2], hint }        拆分填空（让用户填 p1, p2）
//   { kind: 'calc',    a, b, op, answer, hint }               中间运算填空（填 answer）
//   { kind: 'done',    a, b, op, answer }                     最终答案展示

/** 拆分加法：凑十法 */
export function decomposeAdd(a, b) {
  const final = a + b;
  // 简单加法（10 以内）直接做
  if (a < 10 && b < 10 && a + b <= 10) {
    return [{ kind: 'direct', a, b, op: '+', answer: final }];
  }

  const steps = [];
  const bTens = Math.floor(b / 10) * 10;
  const bOnes = b - bTens;
  let cur = a;

  if (bTens > 0 && bOnes > 0) {
    steps.push({ kind: 'split', target: b, parts: [bTens, bOnes], hint: `把 ${b} 拆成 ${bTens} + ${bOnes}` });
  }
  if (bTens > 0) {
    steps.push({ kind: 'calc', a: cur, b: bTens, op: '+', answer: cur + bTens, hint: '先加整十' });
    cur += bTens;
  }
  if (bOnes > 0) {
    const curOnes = cur % 10;
    if (curOnes === 0 || curOnes + bOnes <= 10) {
      // 不跨十，直接加
      steps.push({ kind: 'calc', a: cur, b: bOnes, op: '+', answer: cur + bOnes, hint: bTens > 0 ? '再加个位' : '' });
    } else {
      // 凑十：把 bOnes 拆为 (10 - curOnes) + 剩余
      const part1 = 10 - curOnes;
      const part2 = bOnes - part1;
      steps.push({ kind: 'split', target: bOnes, parts: [part1, part2], hint: `凑十法：${bOnes} 拆成 ${part1} + ${part2}` });
      steps.push({ kind: 'calc', a: cur, b: part1, op: '+', answer: cur + part1, hint: '先凑到整十' });
      cur += part1;
      steps.push({ kind: 'calc', a: cur, b: part2, op: '+', answer: cur + part2, hint: '再加剩下的' });
    }
  }
  steps.push({ kind: 'done', a, b, op: '+', answer: final });
  return steps;
}

/** 拆分减法：连减法（破十法） */
export function decomposeSub(a, b) {
  const final = a - b;
  // 简单减法（个位够减）直接做
  if (b < 10 && a % 10 >= b) {
    return [{ kind: 'direct', a, b, op: '-', answer: final }];
  }

  const steps = [];
  const bTens = Math.floor(b / 10) * 10;
  const bOnes = b - bTens;
  let cur = a;

  if (bTens > 0 && bOnes > 0) {
    steps.push({ kind: 'split', target: b, parts: [bTens, bOnes], hint: `把 ${b} 拆成 ${bTens} + ${bOnes}` });
  }
  if (bTens > 0) {
    steps.push({ kind: 'calc', a: cur, b: bTens, op: '-', answer: cur - bTens, hint: '先减整十' });
    cur -= bTens;
  }
  if (bOnes > 0) {
    const curOnes = cur % 10;
    if (curOnes >= bOnes) {
      // 个位够减
      steps.push({ kind: 'calc', a: cur, b: bOnes, op: '-', answer: cur - bOnes, hint: bTens > 0 ? '再减个位' : '' });
    } else {
      // 个位不够：把 bOnes 拆为 curOnes + 剩余，先减到整十再减
      const part1 = curOnes;
      const part2 = bOnes - curOnes;
      steps.push({ kind: 'split', target: bOnes, parts: [part1, part2], hint: `个位不够减，把 ${bOnes} 拆成 ${part1} + ${part2}` });
      if (part1 > 0) {
        steps.push({ kind: 'calc', a: cur, b: part1, op: '-', answer: cur - part1, hint: '先减到整十' });
        cur -= part1;
      }
      steps.push({ kind: 'calc', a: cur, b: part2, op: '-', answer: cur - part2, hint: '再减剩下的' });
    }
  }
  steps.push({ kind: 'done', a, b, op: '-', answer: final });
  return steps;
}

/** 通用入口 */
export function decompose(a, b, op) {
  return op === '+' ? decomposeAdd(a, b) : decomposeSub(a, b);
}
