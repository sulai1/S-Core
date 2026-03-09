<template>
  <q-chip
      v-for="(value, index) of leds"
      :key="index"
      outline dense
      :class="[value.state ? 'chip-led-on' : 'chip-led-off']"
      >
    <q-icon :class="['led', value.state ? 'led-on' : 'led-off']"/>
      <span :class="[value.state ? 'label-led-on' : 'label-led-off']">
        {{ value.state ? (value.label_on || value.name || 'On') : (value.label_off || value.name || 'Off') }}
      </span>
  </q-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type LEDData = {
  name?: string;
  label_on?: string;
  label_off?: string;
  state: boolean | number | undefined;
};
const props = defineProps<{
  value: LEDData | LEDData[];
}>();

const leds = computed<LEDData[]>(() => {
  return Array.isArray(props.value) ? props.value : [props.value];
});

</script>

<style scoped lang="scss">
  $duration: 16s;
  $intensity: 0.25;
  $size: 1px;

  .chip-led-on {
    border-color: $positive;
    position: relative;
    background-color: rgba($positive, 0.1) !important;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background: linear-gradient(90deg, transparent, rgba($positive, $intensity), transparent);
      background-size: 200% 100%;
      animation: gradient-move $duration ease-in-out infinite;
      pointer-events: none;
      z-index: -1;
    }
  }
  .chip-led-off {
    border-color: $negative;
    position: relative;
    background-color: rgba($negative, 0.1) !important;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background: linear-gradient(90deg, transparent, rgba($negative, $intensity), transparent);
      background-size: 200% 100%;
      animation: gradient-move $duration ease-in-out infinite;
      pointer-events: none;
      z-index: -1;
    }
  }
  .label-led-on {
    margin-left: 5px;
    color: $positive !important;
  }
  .label-led-off {
    color: $negative !important;
  }
  .led {
    margin: 2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 50%;
    width: $size;
    height: $size;
    text-align: center;
    vertical-align: middle;
    font-size: 16px;
    color: $positive;
    background-color: $positive;
    position: relative;
    box-shadow: 0 0 2px 1px rgba(0,255,0,0.5), 0 0 4px 4px rgba(0,255,0,0);
    overflow: visible;
    animation: led-twinkle-brightness 2.2s infinite linear;
    &.led-off {
      background-color: $negative;
      color: $negative;
      opacity: 0.7;
      box-shadow: 0 0 2px 1px rgba(255,0,0,0.5), 0 0 2px 2px rgba(255,0,0,0);
      animation: none;
    }
    // Starburst rays
    &::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      width: 16px;
      height: 16px;
      transform: translate(-50%, -50%) scale(1);
      z-index: 0;
      pointer-events: none;
      background:
        repeating-conic-gradient(rgba(255,255,180,0.25) 0deg 2deg, transparent 2deg 90deg);
      border-radius: 50%;
      opacity: 0.7;
      animation: led-rays-twinkle 2.2s infinite linear;
      filter: blur(0.5px);
    }
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      pointer-events: none;
      background: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0) 100%);
      z-index: 1;
      animation: led-twinkle-gloss 2.2s infinite linear;
    }
  }

  @keyframes led-rays-twinkle {
    0% { opacity: 0.7; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
    10% { opacity: 1; transform: translate(-50%, -50%) scale(1.08) rotate(2deg); }
    20% { opacity: 0.7; transform: translate(-50%, -50%) scale(1) rotate(-2deg); }
    30% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.04) rotate(1deg); }
    40% { opacity: 0.7; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
    100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  }

  @keyframes led-twinkle-brightness {
    0% { filter: brightness(1); }
    10% { filter: brightness(1.15); }
    20% { filter: brightness(1); }
    30% { filter: brightness(1.08); }
    40% { filter: brightness(1); }
    100% { filter: brightness(1); }
  }

  @keyframes gradient-move {
    0% { background-position: -200% 0; }
    50% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
