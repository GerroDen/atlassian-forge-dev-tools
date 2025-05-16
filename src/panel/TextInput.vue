<script setup lang="ts">
defineProps({
  placeholder: String,
});

const model = defineModel({ default: "" });
</script>

<template>
  <input type="text" v-model="model" :placeholder="placeholder" />
</template>

<style scoped>
input {
  border-radius: theme("borderRadius.full");
  background: theme("colors.surface.variant");
  padding: 0 theme("spacing.sm");
  min-width: theme("blockSize.10");
  height: theme("blockSize.8");
}
</style>
