<template>
  <div class="formula col">
    <h3 class="title">看，这就是 <b>除法</b></h3>

    <div class="big-eq">
      <button class="n a" :class="{ on: focus === 'a' }" @click="focus = 'a'">{{ dividend }}</button>
      <span class="op">÷</span>
      <button class="n b" :class="{ on: focus === 'b' }" @click="focus = 'b'">{{ divisor }}</button>
      <span class="op">=</span>
      <button class="n c" :class="{ on: focus === 'c' }" @click="focus = 'c'">{{ quotient }}</button>
    </div>

    <div class="meaning" :class="focus">
      <template v-if="focus === 'a'">
        <span class="m-emoji">{{ theme.itemEmoji }}</span>
        <p><b>{{ dividend }}</b> = 一共有多少个 {{ theme.item }}</p>
      </template>
      <template v-else-if="focus === 'b'">
        <span class="m-emoji">👥</span>
        <p><b>{{ divisor }}</b> = 分成几份（{{ divisor }} 只{{ theme.actor }}）</p>
      </template>
      <template v-else-if="focus === 'c'">
        <span class="m-emoji">🎁</span>
        <p><b>{{ quotient }}</b> = 每份有几个（每只{{ theme.actor }}的份额）</p>
      </template>
      <template v-else>
        <span class="m-emoji">👆</span>
        <p>点一点上面的数字，看它代表什么意思</p>
      </template>
    </div>

    <div class="read">
      <p>读作：<b>{{ dividend }} 除以 {{ divisor }} 等于 {{ quotient }}</b></p>
      <button class="speak" @click="speakAll" :disabled="speaking">
        {{ speaking ? '🔊 朗读中…' : '🔊 跟我读' }}
      </button>
    </div>

    <button class="cta" @click="$emit('next')">接下来玩翻翻乐 →</button>
  </div>
</template>

<script setup>
import { computed, ref, onBeforeUnmount } from 'vue';

const props = defineProps({
  dividend: { type: Number, required: true },
  divisor:  { type: Number, required: true },
  theme:    { type: Object, required: true },
});
defineEmits(['next']);

const quotient = computed(() => props.dividend / props.divisor);
const focus = ref('');
const speaking = ref(false);

function speakAll() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(
    `${props.dividend} 除以 ${props.divisor} 等于 ${quotient.value}`,
  );
  u.lang = 'zh-CN';
  u.rate = 0.85;
  speaking.value = true;
  u.onend = () => { speaking.value = false; };
  u.onerror = () => { speaking.value = false; };
  window.speechSynthesis.speak(u);
}
onBeforeUnmount(() => {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
});
</script>

<style scoped>
.formula {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column; align-items: center;
  gap: 18px; padding: 12px;
}
.title { margin: 0; font-size: 20px; color: #3a2e2e; }
.title b { color: #ff8e3c; }

.big-eq {
  display: flex; align-items: center; gap: 14px;
  background: #fffdf6; border: 3px solid #f0d999;
  border-radius: 20px; padding: 24px 32px;
}
.n {
  font-family: inherit;
  font-size: 56px; font-weight: 900;
  width: 90px; height: 90px;
  border-radius: 18px;
  background: #fff;
  border: 4px solid #e0d8cc;
  color: #3a2e2e;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--shadow, rgba(120, 80, 40, 0.18));
  transition: transform 0.12s, border-color 0.12s, background 0.12s;
}
.n:hover { transform: translateY(-3px); }
.n.on { background: #fff7e0; transform: translateY(-4px); }
.n.a.on { border-color: #ff8e3c; color: #ff8e3c; }
.n.b.on { border-color: #54b85a; color: #54b85a; }
.n.c.on { border-color: #9b5cd6; color: #9b5cd6; }
.op {
  font-size: 44px; font-weight: 900; color: #9b8b7a;
}

.meaning {
  display: flex; align-items: center; gap: 12px;
  background: #fff5e6; border: 2px solid #f0d999;
  border-radius: 14px; padding: 12px 20px;
  min-height: 56px; max-width: 520px;
  transition: background 0.2s, border-color 0.2s;
}
.meaning.a { background: #fff5e6; border-color: #ff8e3c; }
.meaning.b { background: #f0fff4; border-color: #54b85a; }
.meaning.c { background: #f5f0ff; border-color: #9b5cd6; }
.meaning p { margin: 0; font-size: 15px; font-weight: 700; color: #3a2e2e; }
.meaning b { font-size: 18px; }
.m-emoji { font-size: 28px; }

.read {
  display: flex; align-items: center; gap: 14px;
  background: #fffdf6; border: 2px solid #e0d8cc;
  border-radius: 14px; padding: 10px 18px;
}
.read p { margin: 0; font-size: 15px; color: #3a2e2e; }
.read b { color: #ff8e3c; font-size: 17px; }
.speak {
  background: #54b85a; color: #fff;
  border: none; border-radius: 999px;
  padding: 6px 14px; font-family: inherit; font-weight: 800; font-size: 13px;
  cursor: pointer; box-shadow: 0 3px 0 #3a8a42;
}
.speak:disabled { opacity: 0.55; cursor: default; }

.cta {
  background: #ff8e3c; color: #fff;
  border: none; border-radius: 14px;
  padding: 12px 28px; font-family: inherit; font-weight: 900; font-size: 16px;
  cursor: pointer; box-shadow: 0 5px 0 #f06b1d;
  margin-top: 6px;
}
.cta:hover { transform: translateY(-2px); }
</style>
