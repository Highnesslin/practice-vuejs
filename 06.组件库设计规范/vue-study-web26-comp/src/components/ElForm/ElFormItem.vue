<template>
  <div class="el-form-item">
    <label v-if="label">{{ label }}</label>
    <slot></slot>
    <span class="error" v-if="error">{{ error }}</span>
  </div>
</template>

<script>
import Validator from "async-validator";
export default {
  inject: ["form", "rules"],
  name: "el-form-item",
  props: {
    label: {
      type: String,
      default: "",
    },
    prop: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      error: "",
    };
  },
  methods: {
    validate() {
      // 校验规则
      const rule = this.rules[this.prop];

      // 输入值
      const value = this.form[this.prop];

      const validator = new Validator({ [this.prop]: rule });

      // 执行校验
      return validator.validate({ [this.prop]: value }, (error) => {
        if (error) {
          // 显示错误信息
          this.error = error[0].message;
        } else {
          // 校验通过清除错误
          this.error = "";
        }
      });
    },
  },
};
</script>

<style>
.el-form-item {
  display: flex;
  flex-direction: row;
}
.error {
  color: red;
}
</style>