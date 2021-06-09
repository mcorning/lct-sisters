<template>
  <div v-bind="bind()" :style="style" class="box"></div>
</template>

<script>
import { useDrag } from 'vue-use-gesture';
import { useSpring } from 'vue-use-spring';
import { defineComponent, computed } from 'vue';

export default defineComponent({
  setup() {
    const [{ x, y }, set] = useSpring(() => ({ x: 0, y: 0 }));

    const bind = useDrag(({ down, movement: [mx, my] }) => {
      set({ x: down ? mx : 0, y: down ? my : 0 });
    });

    const style = computed(() => ({
      transform: `translate3d(${x.value}px,${y.value}px,0)`,
    }));

    return { bind, style };
  },
});
</script>

<style>
.box {
  touch-action: none;
  cursor: grab;
  width: 20px;
  height: 20ppx;
  background: blue;
}
</style>
