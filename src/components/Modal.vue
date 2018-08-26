<template>
  <transition name="fade">
    <div
      v-if="visible"
      :class="['y-modal', className]"
      :style="style"
      @touchmove.prevent.stop
      @click="$emit('click', $event)"
    />
  </transition>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean
    },
    zIndex: {
      type: Number
    },
    className: {
      type: String
    },
    customStyle: {
      type: Object
    }
  },
  computed: {
    style () {
      return {
        zIndex: this.zIndex,
        ...this.customStyle
      }
    }
  }
}
</script>

<style scoped>
.y-modal {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.7);
}
</style>
