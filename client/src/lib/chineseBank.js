// 语文一年级·内容库（识字 / 拼音 / 古诗 / 组词）
// 来源：人教版 2022 课标修订《语文一年级上/下册》识字表 + 阅读单元生字 + 必背古诗
//
// 数据结构：
//   PINYIN_CHAR_BANK：{ char, pinyin, emoji?, words[] }
//     - char    汉字
//     - pinyin  带声调拼音（用 Unicode 字符 ā á ǎ à ē é ě è ī í ǐ ì ō ó ǒ ò ū ú ǔ ù ǖ ǘ ǚ ǜ）
//     - emoji   图意（看图识字用，可为空）
//     - words   常用词组（组词题用）
//
//   POEM_BANK：{ id, title, author, lines[], blanks[] }
//     - lines[]   诗句完整
//     - blanks[]  填空题：{ lineIdx, charIdx, distractors[] }  挖去 lines[lineIdx][charIdx]，干扰 3 字

export const PINYIN_CHAR_BANK = [
  // ===== 一上·第一单元（识字：天地人 / 金木水火土 / 口耳目手足 / 日月山川）=====
  { char: '天', pinyin: 'tiān', emoji: '🌤', words: ['天空', '蓝天', '春天', '天天'] },
  { char: '地', pinyin: 'dì',   emoji: '🌍', words: ['大地', '土地', '地图', '田地'] },
  { char: '人', pinyin: 'rén',  emoji: '🧑', words: ['大人', '人们', '主人', '人口'] },
  { char: '金', pinyin: 'jīn',  emoji: '🥇', words: ['金子', '金色', '现金', '金鱼'] },
  { char: '木', pinyin: 'mù',   emoji: '🌳', words: ['木头', '树木', '木门', '木马'] },
  { char: '水', pinyin: 'shuǐ', emoji: '💧', words: ['水果', '喝水', '河水', '水池'] },
  { char: '火', pinyin: 'huǒ',  emoji: '🔥', words: ['火车', '火苗', '大火', '火光'] },
  { char: '土', pinyin: 'tǔ',   emoji: '🪴', words: ['泥土', '土地', '土豆', '黄土'] },
  { char: '口', pinyin: 'kǒu',  emoji: '👄', words: ['张口', '门口', '人口', '出口'] },
  { char: '耳', pinyin: 'ěr',   emoji: '👂', words: ['耳朵', '木耳', '左耳', '耳光'] },
  { char: '目', pinyin: 'mù',   emoji: '👁',  words: ['目光', '目标', '题目', '醒目'] },
  { char: '手', pinyin: 'shǒu', emoji: '✋', words: ['小手', '手心', '手指', '左手'] },
  { char: '足', pinyin: 'zú',   emoji: '🦶', words: ['手足', '足球', '满足', '足够'] },
  { char: '日', pinyin: 'rì',   emoji: '☀️', words: ['生日', '日记', '今日', '日月'] },
  { char: '月', pinyin: 'yuè',  emoji: '🌙', words: ['月亮', '月饼', '月光', '一月'] },
  { char: '山', pinyin: 'shān', emoji: '⛰',  words: ['高山', '山水', '青山', '山顶'] },
  { char: '川', pinyin: 'chuān', emoji: '🏞', words: ['山川', '川流', '四川', '冰川'] },

  // ===== 一上·第五单元阅读（秋天 / 江南 / 雪地里的小画家 / 四季）=====
  { char: '秋', pinyin: 'qiū',  emoji: '🍂', words: ['秋天', '秋风', '中秋', '秋季'] },
  { char: '风', pinyin: 'fēng', emoji: '🌬', words: ['风雨', '春风', '大风', '北风'] },
  { char: '叶', pinyin: 'yè',   emoji: '🍃', words: ['树叶', '红叶', '叶子', '茶叶'] },
  { char: '江', pinyin: 'jiāng', emoji: '🏞', words: ['江南', '长江', '江水', '黑龙江'] },
  { char: '南', pinyin: 'nán',  emoji: '🧭', words: ['江南', '南方', '南瓜', '指南'] },
  { char: '鱼', pinyin: 'yú',   emoji: '🐟', words: ['小鱼', '鱼儿', '金鱼', '鱼缸'] },
  { char: '鸟', pinyin: 'niǎo', emoji: '🐦', words: ['小鸟', '鸟蛋', '飞鸟', '小鸟'] },
  { char: '雪', pinyin: 'xuě',  emoji: '❄️', words: ['雪花', '大雪', '雪人', '滑雪'] },
  { char: '花', pinyin: 'huā',  emoji: '🌸', words: ['花儿', '红花', '花朵', '雪花'] },
  { char: '草', pinyin: 'cǎo',  emoji: '🌿', words: ['小草', '青草', '草地', '稻草'] },

  // ===== 一上·第六单元（识字：对韵歌 / 日月明 / 小书包 / 升国旗）=====
  { char: '云', pinyin: 'yún',  emoji: '☁️', words: ['白云', '云朵', '彩云', '风云'] },
  { char: '雨', pinyin: 'yǔ',   emoji: '🌧', words: ['下雨', '春雨', '大雨', '雨衣'] },
  { char: '虫', pinyin: 'chóng', emoji: '🐛', words: ['虫子', '昆虫', '毛虫', '害虫'] },
  { char: '书', pinyin: 'shū',  emoji: '📖', words: ['看书', '书本', '小书包', '读书'] },
  { char: '包', pinyin: 'bāo',  emoji: '🎒', words: ['书包', '面包', '包子', '红包'] },
  { char: '国', pinyin: 'guó',  emoji: '🇨🇳', words: ['中国', '国家', '国旗', '美国'] },
  { char: '旗', pinyin: 'qí',   emoji: '🚩', words: ['国旗', '彩旗', '升旗', '红旗'] },

  // ===== 一上·第七 / 第八单元阅读（小小的船 / 影子 / 比尾巴 / 雨点儿）=====
  { char: '船', pinyin: 'chuán', emoji: '⛵', words: ['小船', '船长', '帆船', '渔船'] },
  { char: '尾', pinyin: 'wěi',  emoji: '🐅', words: ['尾巴', '结尾', '尾声', '燕尾'] },
  { char: '巴', pinyin: 'bā',   emoji: '👅', words: ['尾巴', '嘴巴', '泥巴', '巴掌'] },
  { char: '点', pinyin: 'diǎn', emoji: '🔘', words: ['雨点', '点心', '一点', '点头'] },

  // ===== 一下·第一单元（春夏秋冬 / 姓氏歌 / 小青蛙 / 猜字谜）=====
  { char: '春', pinyin: 'chūn', emoji: '🌷', words: ['春天', '春风', '春节', '青春'] },
  { char: '夏', pinyin: 'xià',  emoji: '🌻', words: ['夏天', '夏夜', '炎夏', '初夏'] },
  { char: '冬', pinyin: 'dōng', emoji: '⛄', words: ['冬天', '冬瓜', '寒冬', '隆冬'] },
  { char: '青', pinyin: 'qīng', emoji: '🐸', words: ['青蛙', '青草', '青山', '青菜'] },
  { char: '蛙', pinyin: 'wā',   emoji: '🐸', words: ['青蛙', '蛙泳', '牛蛙', '蛙声'] },
  { char: '李', pinyin: 'lǐ',   emoji: '🌳', words: ['李子', '李白', '桃李', '李树'] },
  { char: '张', pinyin: 'zhāng', emoji: '📋', words: ['张开', '一张', '紧张', '主张'] },
  { char: '王', pinyin: 'wáng', emoji: '👑', words: ['国王', '王子', '王后', '猴王'] },

  // ===== 一下·第三 / 第四单元（小公鸡和小鸭子 / 静夜思 / 端午粽）=====
  { char: '鸡', pinyin: 'jī',   emoji: '🐔', words: ['小鸡', '公鸡', '母鸡', '鸡蛋'] },
  { char: '鸭', pinyin: 'yā',   emoji: '🦆', words: ['小鸭', '鸭子', '北京鸭', '鸭蛋'] },
  { char: '夜', pinyin: 'yè',   emoji: '🌃', words: ['黑夜', '夜晚', '深夜', '夜空'] },
  { char: '静', pinyin: 'jìng', emoji: '🤫', words: ['安静', '静夜', '冷静', '寂静'] },
  { char: '思', pinyin: 'sī',   emoji: '💭', words: ['思念', '思考', '心思', '反思'] },
  { char: '床', pinyin: 'chuáng', emoji: '🛏', words: ['床上', '床铺', '木床', '起床'] },
  { char: '光', pinyin: 'guāng', emoji: '✨', words: ['月光', '阳光', '光明', '灯光'] },
  { char: '故', pinyin: 'gù',   emoji: '🏠', words: ['故乡', '故事', '故人', '故宫'] },
  { char: '乡', pinyin: 'xiāng', emoji: '🏞', words: ['故乡', '家乡', '乡村', '乡音'] },
  { char: '粽', pinyin: 'zòng', emoji: '🍙', words: ['粽子', '端午粽', '甜粽', '咸粽'] },

  // ===== 一下·第五单元（动物儿歌 / 古对今 / 操场上 / 人之初）=====
  { char: '蜻', pinyin: 'qīng', emoji: '🦋', words: ['蜻蜓', '红蜻蜓', '蜻蛉', '点水蜻蜓'] },
  { char: '蝶', pinyin: 'dié',  emoji: '🦋', words: ['蝴蝶', '彩蝶', '蛱蝶', '蝶恋花'] },
  { char: '蜘', pinyin: 'zhī',  emoji: '🕷', words: ['蜘蛛', '小蜘蛛', '蜘蛛网', '大蜘蛛'] },
  { char: '蛛', pinyin: 'zhū',  emoji: '🕸', words: ['蜘蛛', '蛛网', '蛛丝', '小蜘蛛'] },
  { char: '古', pinyin: 'gǔ',   emoji: '🏛', words: ['古代', '古诗', '远古', '古今'] },
  { char: '今', pinyin: 'jīn',  emoji: '📆', words: ['今天', '今日', '至今', '当今'] },
  { char: '初', pinyin: 'chū',  emoji: '🌱', words: ['初一', '初步', '初春', '当初'] },
  { char: '善', pinyin: 'shàn', emoji: '☺️', words: ['善良', '善心', '友善', '完善'] },

  // ===== 一下·第六单元（古诗二首：池上 / 小池）=====
  { char: '池', pinyin: 'chí',  emoji: '🌊', words: ['池塘', '小池', '游泳池', '荷花池'] },
  { char: '荷', pinyin: 'hé',   emoji: '🪷', words: ['荷花', '荷叶', '荷塘', '薄荷'] },
  { char: '叶', pinyin: 'yè',   emoji: '🍃', words: ['荷叶', '树叶', '红叶', '叶子'] },
  { char: '浪', pinyin: 'làng', emoji: '🌊', words: ['浪花', '海浪', '波浪', '风浪'] },

  // ===== 一下·第七 / 第八单元（文具的家 / 小猴子下山 / 棉花姑娘 / 小壁虎借尾巴）=====
  { char: '猴', pinyin: 'hóu',  emoji: '🐒', words: ['猴子', '小猴', '猴山', '猴王'] },
  { char: '棉', pinyin: 'mián', emoji: '☁️', words: ['棉花', '棉衣', '棉被', '棉袄'] },
  { char: '壁', pinyin: 'bì',   emoji: '🦎', words: ['壁虎', '墙壁', '隔壁', '峭壁'] },
  { char: '虎', pinyin: 'hǔ',   emoji: '🐯', words: ['老虎', '壁虎', '虎口', '虎牙'] },

  // ===== 补充常用字（高频，便于干扰项）=====
  { char: '大', pinyin: 'dà',   emoji: '🔠', words: ['大小', '大山', '长大', '大门'] },
  { char: '小', pinyin: 'xiǎo', emoji: '🔡', words: ['小心', '大小', '小鸟', '小手'] },
  { char: '上', pinyin: 'shàng', emoji: '⬆️', words: ['上面', '上学', '马上', '上山'] },
  { char: '下', pinyin: 'xià',  emoji: '⬇️', words: ['下面', '下来', '上下', '下山'] },
  { char: '中', pinyin: 'zhōng', emoji: '🎯', words: ['中国', '中心', '中间', '中午'] },
  { char: '白', pinyin: 'bái',  emoji: '⚪', words: ['白天', '白云', '黑白', '白雪'] },
  { char: '红', pinyin: 'hóng', emoji: '🔴', words: ['红色', '红花', '火红', '红旗'] },
];

// ===== 必背古诗 =====
// blanks 用于诗词填空题：lineIdx → 第几句 (0-based), charIdx → 句中第几字 (0-based), distractors → 3 个干扰字
export const POEM_BANK = [
  {
    id: 'jingyesi',
    title: '静夜思',
    author: '李白',
    lines: ['床前明月光，', '疑是地上霜。', '举头望明月，', '低头思故乡。'],
    blanks: [
      { lineIdx: 0, charIdx: 4, distractors: ['亮', '色', '影'] },  // 光
      { lineIdx: 1, charIdx: 3, distractors: ['雪', '水', '冰'] },  // 霜
      { lineIdx: 3, charIdx: 3, distractors: ['家', '亲', '人'] },  // 故
    ],
  },
  {
    id: 'jiangnan',
    title: '江南',
    author: '汉乐府',
    lines: ['江南可采莲，', '莲叶何田田。', '鱼戏莲叶间。'],
    blanks: [
      { lineIdx: 0, charIdx: 4, distractors: ['花', '草', '菜'] },  // 莲
      { lineIdx: 2, charIdx: 0, distractors: ['虾', '蟹', '蛙'] },  // 鱼
    ],
  },
  {
    id: 'chishang',
    title: '池上',
    author: '白居易',
    lines: ['小娃撑小艇，', '偷采白莲回。', '不解藏踪迹，', '浮萍一道开。'],
    blanks: [
      { lineIdx: 1, charIdx: 4, distractors: ['菊', '梅', '兰'] },  // 莲
      { lineIdx: 3, charIdx: 0, distractors: ['沉', '荷', '水'] },  // 浮
    ],
  },
  {
    id: 'xiaochi',
    title: '小池',
    author: '杨万里',
    lines: ['泉眼无声惜细流，', '树阴照水爱晴柔。', '小荷才露尖尖角，', '早有蜻蜓立上头。'],
    blanks: [
      { lineIdx: 2, charIdx: 1, distractors: ['花', '叶', '果'] },  // 荷
      { lineIdx: 3, charIdx: 3, distractors: ['蝴', '蝙', '蚂'] },  // 蜻
    ],
  },
  {
    id: 'yonge',
    title: '咏鹅',
    author: '骆宾王',
    lines: ['鹅，鹅，鹅，', '曲项向天歌。', '白毛浮绿水，', '红掌拨清波。'],
    blanks: [
      { lineIdx: 2, charIdx: 0, distractors: ['黑', '黄', '青'] },  // 白
      { lineIdx: 3, charIdx: 0, distractors: ['黑', '白', '黄'] },  // 红
    ],
  },
  {
    id: 'minnong',
    title: '悯农',
    author: '李绅',
    lines: ['锄禾日当午，', '汗滴禾下土。', '谁知盘中餐，', '粒粒皆辛苦。'],
    blanks: [
      { lineIdx: 0, charIdx: 2, distractors: ['月', '星', '云'] },  // 日
      { lineIdx: 3, charIdx: 2, distractors: ['多', '都', '全'] },  // 皆
    ],
  },
  {
    id: 'denggu',
    title: '登鹳雀楼',
    author: '王之涣',
    lines: ['白日依山尽，', '黄河入海流。', '欲穷千里目，', '更上一层楼。'],
    blanks: [
      { lineIdx: 0, charIdx: 4, distractors: ['落', '高', '远'] },  // 尽
      { lineIdx: 2, charIdx: 2, distractors: ['百', '万', '十'] },  // 千
    ],
  },
  {
    id: 'chunxiao',
    title: '春晓',
    author: '孟浩然',
    lines: ['春眠不觉晓，', '处处闻啼鸟。', '夜来风雨声，', '花落知多少。'],
    blanks: [
      { lineIdx: 1, charIdx: 3, distractors: ['歌', '鸣', '叫'] },  // 啼
      { lineIdx: 3, charIdx: 0, distractors: ['草', '叶', '果'] },  // 花
    ],
  },
];

export function findChar(c) {
  return PINYIN_CHAR_BANK.find(x => x.char === c) || null;
}

export function findPoem(id) {
  return POEM_BANK.find(p => p.id === id) || null;
}
