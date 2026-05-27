// 阅读引擎 · 阶段管线（声明层）
// ─────────────────────────────────────────────────────────────
// 一个词依次经过若干"阶段(step)"。阶段类型在此声明；
// 类型 → 组件 的映射在 ReadingPlayer.vue 的注册表里（加玩法=注册一个组件）。
//
// 默认管线借鉴 Endless Reader 的四段式：
//   reveal  亮相  —— 词炸开成会说话的单元，建立好奇 + 音义初印象
//   spell   拼词  —— 把单元拖/点回卡槽，拿起即发音，无失败
//   say     读词  —— 整词朗读 + 含义图，音义绑定
//   sentence入句  —— 词放进一句话，语境化
//
// 铁律（Endless Reader 灵魂）：无计时、无评分、无失败；每次触碰都有反馈。

export const STEP = {
  REVEAL: 'reveal',
  SPELL: 'spell',
  SAY: 'say',
  SENTENCE: 'sentence',
};

export const DEFAULT_PIPELINE = [STEP.REVEAL, STEP.SPELL, STEP.SAY, STEP.SENTENCE];

// 阶段元信息（进度点的标签 / 图标）。新增阶段时在这里补一条。
export const STEP_META = {
  [STEP.REVEAL]:   { label: '认一认', icon: '✨' },
  [STEP.SPELL]:    { label: '拼一拼', icon: '🧩' },
  [STEP.SAY]:      { label: '读一读', icon: '🔊' },
  [STEP.SENTENCE]: { label: '用一用', icon: '💬' },
};

/** 取某词包的管线（词包可覆盖默认）。 */
export function pipelineForPack(pack) {
  const p = pack?.pipeline;
  return Array.isArray(p) && p.length ? p : DEFAULT_PIPELINE;
}
