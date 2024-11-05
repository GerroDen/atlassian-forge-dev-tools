export default {
  "*": ["oxlint --quiet"],
  "*.vue": ["oxlint --quiet", "vue-tsc --noEmit"],
};
