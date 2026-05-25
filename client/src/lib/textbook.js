// 教材轴（单一事实来源）—— 与「按能力闯关」并存的「跟课本学」组织方式。
// 结构：学科 → 年级(grade1..6) → 册(up/down) → 单元(unit) → 内容项(items)
//
// 内容项三类（type）：
//   'lesson'   教学卡：讲解 + 互动演示 + 自测（解题技巧走这条）。trickId 指向 useQuizGen 的脚本。
//   'practice' 专项练习：preset 自带题集（如九九表），或 ref 复用现有能力闯关分类。
//   'expand'   拓展：进阶 / 趣味题。
//
// 凡 placeholder:true 的年级/册/单元/内容项 = 占位（敬请期待），等教材 PDF 到位后逐个填充。
//
// 课本 PDF：物理路径 client/public/textbooks/<subject>/<grade>/<grade>-<volume>.pdf
//   - 由 PDF_AVAILABLE 注册"哪些册有 PDF"
//   - 70MB+ 不进 git（见 .gitignore），需要本地放置（README 教材资源章节）

// 已就绪的课本 PDF（前端"📖 查看课本"按钮据此启用 / 禁用）
export const PDF_AVAILABLE = {
  math: {
    grade1: ['up', 'down'],
    // grade2..6 待添加
  },
  chinese: {
    grade1: ['up', 'down'],
    // grade2..6 待添加
  },
};

export function isPdfAvailable(subjectId, gradeId, volumeId) {
  return PDF_AVAILABLE[subjectId]?.[gradeId]?.includes(volumeId) || false;
}

export function pdfPath(subjectId, gradeId, volumeId) {
  if (!isPdfAvailable(subjectId, gradeId, volumeId)) return null;
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  return `${base}textbooks/${subjectId}/${gradeId}/${gradeId}-${volumeId}.pdf`;
}

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
    // 2022 年版课程标准修订（人教版）一年级上册：6 单元 + 数学游戏导入
    up: {
      units: [
        {
          unit: 1, title: '5 以内数的认识和加、减法',
          items: [
            { type: 'practice', id: 'g1u1_add', name: '5 以内加法', engine: 'tile', ref: { module: 'add', category: 'within10' } },
            { type: 'practice', id: 'g1u1_sub', name: '5 以内减法', engine: 'tile', ref: { module: 'sub', category: 'within10' } },
          ],
        },
        {
          unit: 2, title: '6～10 的认识和加、减法',
          items: [
            { type: 'practice', id: 'g1u2_add', name: '10 以内加法', engine: 'tile', ref: { module: 'add', category: 'within10' } },
            { type: 'practice', id: 'g1u2_sub', name: '10 以内减法', engine: 'tile', ref: { module: 'sub', category: 'within10' } },
          ],
        },
        {
          unit: 3, title: '认识立体图形',
          items: [
            { type: 'practice', id: 'g1u3_solid', name: '立体图形识别（长方体/正方体/圆柱/球）', engine: 'choice', ref: { module: 'shape', category: 'solid' } },
          ],
        },
        {
          unit: 4, title: '11～20 的认识',
          items: [
            { type: 'practice', id: 'g1u4_d2', name: '两位数数位认识', engine: 'tile', ref: { module: 'place', category: 'd2' } },
          ],
        },
        {
          unit: 5, title: '20 以内的进位加法',
          items: [
            { type: 'lesson', id: 'g1u5_make10', name: '凑十法（加法技巧）', trickId: 'make-ten' },
            { type: 'practice', id: 'g1u5_add', name: '20 以内进位加法', engine: 'tile', ref: { module: 'add', category: 'within20' } },
          ],
        },
        {
          unit: 6, title: '复习与关联',
          items: [
            { type: 'practice', id: 'g1u6_review', name: '一上综合复习（9 题混合）', engine: 'mix', ref: { module: 'review', category: 'g1up' } },
          ],
        },
      ],
    },
    // 2022 年版课程标准修订（人教版）一年级下册：6 单元 + 主题「欢乐购物街」+ 复习
    down: {
      units: [
        {
          unit: 1, title: '认识平面图形',
          items: [
            { type: 'practice', id: 'g1d1_plane', name: '平面图形识别（长方/正方/三角/圆/平行四边）', engine: 'choice', ref: { module: 'shape', category: 'plane' } },
          ],
        },
        {
          unit: 2, title: '20 以内的退位减法',
          items: [
            { type: 'lesson', id: 'g1d2_break10', name: '破十法（减法技巧）', trickId: 'break-ten' },
            { type: 'practice', id: 'g1d2_sub', name: '20 以内退位减法', engine: 'tile', ref: { module: 'sub', category: 'within20' } },
          ],
        },
        {
          unit: 3, title: '100 以内数的认识',
          items: [
            { type: 'practice', id: 'g1d3_d2', name: '两位数数位认识', engine: 'tile', ref: { module: 'place', category: 'd2' } },
          ],
        },
        {
          unit: 4, title: '100 以内的口算加、减法',
          items: [
            { type: 'practice', id: 'g1d4_add', name: '100 以内口算加法', engine: 'tile', ref: { module: 'add', category: 'within100' } },
            { type: 'practice', id: 'g1d4_sub', name: '100 以内口算减法', engine: 'tile', ref: { module: 'sub', category: 'within100' } },
          ],
        },
        {
          unit: 5, title: '100 以内的笔算加、减法',
          items: [
            { type: 'practice', id: 'g1d5_vadd', name: '两位数加法竖式', engine: 'tile', ref: { module: 'vertical', category: 'add' } },
            { type: 'practice', id: 'g1d5_vsub', name: '两位数减法竖式', engine: 'tile', ref: { module: 'vertical', category: 'sub' } },
          ],
        },
        {
          unit: 6, title: '数量间的加减关系',
          items: [
            { type: 'practice', id: 'g1d6_word', name: '加减应用题（剩余 / 共有 / 比多少）', engine: 'tile', ref: { module: 'word', category: 'mixed' } },
          ],
        },
        {
          unit: 7, title: '🛒 欢乐购物街（主题学习）',
          items: [
            { type: 'practice', id: 'g1d7_money', name: '认面额（元 / 角 / 分换算）', engine: 'choice', ref: { module: 'money', category: 'recognize' } },
            { type: 'practice', id: 'g1d7_change', name: '找零计算', engine: 'tile', ref: { module: 'money', category: 'change' } },
          ],
        },
        {
          unit: 8, title: '复习与关联',
          items: [
            { type: 'practice', id: 'g1d8_review', name: '一下综合复习（9 题混合）', engine: 'mix', ref: { module: 'review', category: 'g1down' } },
          ],
        },
      ],
    },
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

// ===== 语文 =====（一年级 2022 课标修订版整册落地：一上 8 单元 + 入学准备 / 一下 8 单元）
const CHINESE = {
  grade1: {
    // 一上：入学准备 + 8 单元
    up: {
      units: [
        {
          unit: 0, title: '入学准备 · 我上学了',
          items: [
            { type: 'practice', id: 'g1cu0_chars', name: '看图识字（入学准备）', engine: 'choice', ref: { module: 'recognize', category: 'default' } },
          ],
        },
        {
          unit: 1, title: '识字一 · 天地人 / 金木水火土 / 口耳目手足 / 日月山川',
          items: [
            { type: 'practice', id: 'g1cu1_chars', name: '看图识字', engine: 'choice', ref: { module: 'recognize', category: 'default' } },
            { type: 'practice', id: 'g1cu1_compose', name: '识字组词', engine: 'choice', ref: { module: 'compose', category: 'default' } },
          ],
        },
        {
          unit: 2, title: '汉语拼音 · a o e / i u ü / b p m f / d t n l',
          items: [
            { type: 'practice', id: 'g1cu2_pinyin', name: '汉字拼音双向匹配', engine: 'choice', ref: { module: 'pinyin', category: 'default' } },
          ],
        },
        {
          unit: 3, title: '汉语拼音 · g k h / j q x / z c s / zh ch sh r / y w',
          items: [
            { type: 'practice', id: 'g1cu3_pinyin', name: '汉字拼音双向匹配', engine: 'choice', ref: { module: 'pinyin', category: 'default' } },
          ],
        },
        {
          unit: 4, title: '汉语拼音 · 复韵母 / 鼻韵母',
          items: [
            { type: 'practice', id: 'g1cu4_pinyin', name: '汉字拼音双向匹配', engine: 'choice', ref: { module: 'pinyin', category: 'default' } },
          ],
        },
        {
          unit: 5, title: '阅读 · 秋天 / 江南 / 雪地里的小画家 / 四季',
          items: [
            { type: 'practice', id: 'g1cu5_chars', name: '看图识字（阅读生字）', engine: 'choice', ref: { module: 'recognize', category: 'default' } },
            { type: 'practice', id: 'g1cu5_poem', name: '必背古诗 · 江南', engine: 'choice', ref: { module: 'poem', category: 'default' } },
          ],
        },
        {
          unit: 6, title: '识字二 · 对韵歌 / 日月明 / 小书包 / 升国旗',
          items: [
            { type: 'practice', id: 'g1cu6_chars', name: '看图识字', engine: 'choice', ref: { module: 'recognize', category: 'default' } },
            { type: 'practice', id: 'g1cu6_compose', name: '识字组词', engine: 'choice', ref: { module: 'compose', category: 'default' } },
          ],
        },
        {
          unit: 7, title: '阅读 · 小小的船 / 影子 / 两件宝',
          items: [
            { type: 'practice', id: 'g1cu7_compose', name: '识字组词', engine: 'choice', ref: { module: 'compose', category: 'default' } },
          ],
        },
        {
          unit: 8, title: '阅读 · 比尾巴 / 乌鸦喝水 / 雨点儿',
          items: [
            { type: 'practice', id: 'g1cu8_compose', name: '识字组词', engine: 'choice', ref: { module: 'compose', category: 'default' } },
          ],
        },
      ],
    },
    // 一下：8 单元
    down: {
      units: [
        {
          unit: 1, title: '识字 · 春夏秋冬 / 姓氏歌 / 小青蛙 / 猜字谜',
          items: [
            { type: 'practice', id: 'g1cd1_chars', name: '看图识字', engine: 'choice', ref: { module: 'recognize', category: 'default' } },
            { type: 'practice', id: 'g1cd1_pinyin', name: '汉字拼音双向匹配', engine: 'choice', ref: { module: 'pinyin', category: 'default' } },
          ],
        },
        {
          unit: 2, title: '阅读 · 热爱中国共产党 / 吃水不忘挖井人 / 我多想去看看',
          items: [
            { type: 'practice', id: 'g1cd2_compose', name: '识字组词', engine: 'choice', ref: { module: 'compose', category: 'default' } },
          ],
        },
        {
          unit: 3, title: '阅读 · 小公鸡和小鸭子 / 树和喜鹊 / 怎么都快乐',
          items: [
            { type: 'practice', id: 'g1cd3_chars', name: '看图识字（动物字）', engine: 'choice', ref: { module: 'recognize', category: 'default' } },
            { type: 'practice', id: 'g1cd3_compose', name: '识字组词', engine: 'choice', ref: { module: 'compose', category: 'default' } },
          ],
        },
        {
          unit: 4, title: '阅读 · 静夜思 / 夜色 / 端午粽',
          items: [
            { type: 'practice', id: 'g1cd4_poem', name: '必背古诗 · 静夜思', engine: 'choice', ref: { module: 'poem', category: 'default' } },
            { type: 'practice', id: 'g1cd4_compose', name: '识字组词', engine: 'choice', ref: { module: 'compose', category: 'default' } },
          ],
        },
        {
          unit: 5, title: '识字 · 动物儿歌 / 古对今 / 操场上 / 人之初',
          items: [
            { type: 'practice', id: 'g1cd5_chars', name: '看图识字', engine: 'choice', ref: { module: 'recognize', category: 'default' } },
            { type: 'practice', id: 'g1cd5_pinyin', name: '汉字拼音双向匹配', engine: 'choice', ref: { module: 'pinyin', category: 'default' } },
            { type: 'practice', id: 'g1cd5_compose', name: '识字组词', engine: 'choice', ref: { module: 'compose', category: 'default' } },
          ],
        },
        {
          unit: 6, title: '阅读 · 古诗二首（池上 / 小池）/ 浪花 / 荷叶圆圆 / 要下雨了',
          items: [
            { type: 'practice', id: 'g1cd6_poem', name: '必背古诗 · 池上 / 小池', engine: 'choice', ref: { module: 'poem', category: 'default' } },
            { type: 'practice', id: 'g1cd6_chars', name: '看图识字', engine: 'choice', ref: { module: 'recognize', category: 'default' } },
          ],
        },
        {
          unit: 7, title: '阅读 · 文具的家 / 一分钟 / 动物王国开大会 / 小猴子下山',
          items: [
            { type: 'practice', id: 'g1cd7_compose', name: '识字组词', engine: 'choice', ref: { module: 'compose', category: 'default' } },
          ],
        },
        {
          unit: 8, title: '阅读 · 棉花姑娘 / 咕咚 / 小壁虎借尾巴',
          items: [
            { type: 'practice', id: 'g1cd8_chars', name: '看图识字（动物字）', engine: 'choice', ref: { module: 'recognize', category: 'default' } },
            { type: 'practice', id: 'g1cd8_compose', name: '识字组词', engine: 'choice', ref: { module: 'compose', category: 'default' } },
          ],
        },
      ],
    },
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
