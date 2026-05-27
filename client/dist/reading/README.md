# 阅读乐园 · 真素材注入约定（resources seam）

这个目录是「阅读乐园」真人录音 / 原创插画的存放点。**不放也能玩**——
没有真素材时，引擎自动回退到 emoji + Web Speech TTS（和课本 PDF 一样的兜底策略）。

放进真素材后，**只需在词数据里声明 key，不改任何业务代码**——这就是
`lib/reading/resources.js` + `composables/useReadingAudio.js` 这条 seam 的意义。

## 目录约定

```
client/public/reading/
  img/        原创插画（替代 emoji），如 img/cat.png
  audio/
    en/       英文录音，如 audio/en/cat.mp3 / cat_sentence.mp3
    zh/       中文录音，如 audio/zh/mao.mp3
```

> 体积可能较大，建议同 PDF 一样在 `.gitignore` 排除，按设备本地放置。

## 如何为一个词接真素材（示例：英文 cat）

在 `client/src/lib/reading/packs.js` 里给该词补 `image` / `audio` 字段：

```js
{
  id: 'cat', lang: 'en-US', text: 'cat',
  // 图：kind 改为 'asset'，value 是相对 /reading/ 的路径
  image: { kind: 'asset', value: 'img/cat.png' },
  units: [
    { glyph: 'c', sound: 'kuh' },
    { glyph: 'a', sound: 'aah' },
    { glyph: 't', sound: 'tuh' },
  ],
  sentence: { text: 'A cat naps on the mat.', focus: 'cat' },
  // 音：声明任意一项即视为"已有真音频"，缺的那项仍回退 TTS
  audio: {
    word: 'audio/en/cat.mp3',
    sentence: 'audio/en/cat_sentence.mp3',
    units: ['audio/en/c.mp3', 'audio/en/a.mp3', 'audio/en/t.mp3'],
  },
}
```

解析与回退链路（已实现，无需改动）：

- `resources.js#resolveImage` → `image.kind==='asset'` 时返回 `/reading/img/cat.png`，否则 emoji。
- `resources.js#hasRealAudio` → 词声明了 `audio.word`/`audio.sentence` 即为 true。
- `useReadingAudio` → 真音频用 `<audio>` 播放；**文件缺失 / 加载失败自动回退 TTS**，绝不静默。
- 阶段组件（Reveal/Say/Sentence/SyllableSpell）只调 `playWord/playUnit/playSentence`，
  对"真音频还是 TTS"完全无感。

## 中文同理

`audio/zh/` 放整字录音，词里写 `audio: { word: 'audio/zh/mao.mp3' }` 即可；
中文拼读单元（声母/韵母 piece）无法孤立发音，未配 unit 录音时回退"整字读音"锚点。
