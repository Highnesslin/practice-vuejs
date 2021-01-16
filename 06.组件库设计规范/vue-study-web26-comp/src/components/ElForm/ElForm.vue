<template>
  <form>
    <slot />
  </form>
</template>

<script>
export default {
  provide() {
    return {
      form: this.model,
      rules: this.rules,
    };
  },
  props: {
    model: {
      type: Object,
      require: true,
    },
    rules: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
  methods: {
    validate(cb) {
      const promise = this.$children
        .filter((item) => item.prop)
        .map((item) => item.validate());
      Promise.all(promise)
        .then(() => cb(true))
        .catch(() => cb(false));
    },
  },
};
</script>

<style>
</style>