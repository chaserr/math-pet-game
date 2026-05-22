// 教材轴（单一事实来源）—— 与「按能力闯关」并存的「跟课本学」组织方式。
// 结构：学科 → 年级(grade1..6) → 册(up/down) → 单元(unit) → 内容项(items)
//
// 内容项三类（type）：
//   'lesson'   教学卡：讲解 + 互动演示 + 自测（解题技巧走这条）。trickId 指向 useQuizGen 的脚本。
//   'practice' 专项练习：preset 自带题集（如九九表），或 ref 复用现有能力闯关分类。
//   'expand'   拓展：进阶 / 趣味题。
//
// 凡 placeholder:true 的年级/册/单元/内容项 = 占位（敬请期待），等教材 PDF 到位后逐个填充。

export const GRADES = [
  { id: 'grade1', name: '一年级' },
  { id: 'grade2', name: '二年级' },
  { id: 'grade3', name: '三年级' },
  { id: 'grade4', name: '四年级' },
  { id: 'grade5', name: '五年级' },
  { id: 'grade6', name: '六年级' },
];

export const VOLUMES = [
  { id: 'up', name: '上册' },
  { id: 'down', name: '下册' },
];

// 空册占位生成器
const emptyVolume = () => ({ placeholder: true, units: [] });
const emptyGrade = () => ({ up: emptyVolume(), down: emptyVolume() });

// ===== 数学 =====
const MATH = {
  grade1: {
    up: {
      units: [
        {
          unit: 1, title: '认识 10 以内的数',
          items: [
            { type: 'practice', id: 'g1u1_count', name: '10 以内加法', engine: 'tile', ref: { module: 'add', category: 'within10' } },
            { type: 'expand', id: 'g1u1_ex', name: '数一数拓展', placeholder: true },
          ],
        },
        {
          unit: 2, title: '10 以内的加减法',
          items: [
            { type: 'lesson', id: 'g1u2_make10', name: '凑十法（加法技巧）', trickId: 'make-ten' },
            { type: 'practice', id: 'g1u2_sub', name: '10 以内减法', engine: 'tile', ref: { module: 'sub', category: 'within10' } },
          ],
        },
        { unit: 3, title: '20 以内的进位加法', placeholder: true, items: [] },
      ],
    },
    down: emptyVolume(),
  },
  grade2: {
    up: {
      units: [
        {
          unit: 1, title: '表内乘法（九九乘法表）',
          items: [
            { type: 'practice', id: 'g2u1_times', name: '九九乘法表', engine: 'tile', ref: { module: 'mul', category: 'within10' } },
            { type: 'expand', id: 'g2u1_ex', name: '乘法应用拓展', placeholder: true },
          ],
        },
        { unit: 2, title: '100 以内的加减法', placeholder: true, items: [] },
      ],
    },
    down: emptyVolume(),
  },
  grade3: emptyGrade(),
  grade4: {
    up: {
      units: [
        {
          unit: 1, title: '万以内的减法（解题技巧）',
          items: [
            { type: 'lesson', id: 'g4u1_borrow', name: '整万数减法·减1法', trickId: 'borrow-trick' },
            { type: 'expand', id: 'g4u1_ex', name: '更多大数减法', placeholder: true },
          ],
        },
      ],
    },
    down: emptyVolume(),
  },
  grade5: emptyGrade(),
  grade6: emptyGrade(),
};

// ===== 语文 =====（诗词 / 必学字 / 注音 / 拼音学字 —— 每年级一个，先占位）
const CHINESE = {
  grade1: {
    up: {
      units: [
        {
          unit: 1, title: '汉语拼音',
          items: [
            { type: 'practice', id: 'g1c_pinyin', name: '拼音专项', placeholder: true },
            { type: 'practice', id: 'g1c_recognize', name: '看图识字', engine: 'choice', ref: { module: 'recognize', category: 'default' } },
          ],
        },
        { unit: 2, title: '必学汉字 / 必背诗词', placeholder: true, items: [] },
      ],
    },
    down: emptyVolume(),
  },
  grade2: emptyGrade(),
  grade3: emptyGrade(),
  grade4: emptyGrade(),
  grade5: emptyGrade(),
  grade6: emptyGrade(),
};

export const TEXTBOOK = {
  math: MATH,
  chinese: CHINESE,
  // english 暂不纳入教材轴，留待后续
};

// ===== 内容项类型元信息（卡片样式用）=====
export const ITEM_TYPES = {
  lesson:   { name: '教学卡', emoji: '📖', color: '#9b5cd6' },
  practice: { name: '专项练习', emoji: '✏️', color: '#54b85a' },
  expand:   { name: '拓展', emoji: '🌟', color: '#f0a93a' },
};

// ===== 查询助手 =====
export function textbookHasSubject(subjectId) {
  return Object.prototype.hasOwnProperty.call(TEXTBOOK, subjectId);
}

export function getGradeData(subjectId, gradeId) {
  return TEXTBOOK[subjectId]?.[gradeId] || null;
}

export function getVolume(subjectId, gradeId, volumeId) {
  return getGradeData(subjectId, gradeId)?.[volumeId] || null;
}

export function getUnits(subjectId, gradeId, volumeId) {
  return getVolume(subjectId, gradeId, volumeId)?.units || [];
}

export function findUnit(subjectId, gradeId, volumeId, unitNo) {
  return getUnits(subjectId, gradeId, volumeId).find(u => String(u.unit) === String(unitNo)) || null;
}

export function findItem(subjectId, gradeId, volumeId, unitNo, itemId) {
  const unit = findUnit(subjectId, gradeId, volumeId, unitNo);
  return unit?.items?.find(it => it.id === itemId) || null;
}

// 某年级是否有任何已实现内容（用于年级卡是否标"敬请期待"）
export function gradeHasContent(subjectId, gradeId) {
  const g = getGradeData(subjectId, gradeId);
  if (!g) return false;
  return VOLUMES.some(v => (g[v.id]?.units || []).some(u => !u.placeholder && (u.items || []).length));
}
