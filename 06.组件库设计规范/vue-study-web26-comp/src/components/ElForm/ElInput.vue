<template>
  <div>
    <i v-if="icon">{{ icon }}</i>
    <input v-bind="$attrs" @input="change" :value="value" />
  </div>
</template>

<script>
export default {
  inheritAttrs: false,
  props: {
    icon: {
      type: String,
      default: "",
    },
    value: {
      type: String,
      default: "",
    },
  },
  methods: {
    change(e) {
      this.$emit("input", e.target.value);
      this.$parent.validate();
    },
  },
};
</script>

<style>
</style>