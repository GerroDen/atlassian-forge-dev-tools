<script setup lang="ts">
defineProps({
  title: String,
  click: Function,
});
const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button :title="title" @click="emit('click')"><slot /></button>
</template>

<style scoped>
button {
  width: theme("blockSize.10");
  height: theme("blockSize.10");
  font: theme("typescale.body1.bold");
  text-align: -webkit-center;
  text-align: -moz-center;
}
</style>
