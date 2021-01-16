<template>
  <div>
    <el-form :model="model" :rules="rules" ref="form">
      <el-form-item prop="username" label="用户名">
        <el-input
          v-model="model.username"
          placeholder="请输入你那愚不可及的用户名"
        />
      </el-form-item>
      <el-form-item>
        <button @click="login" type="button">login</button>
      </el-form-item>
    </el-form>

    {{ model }}
  </div>
</template>

<script>
import ElForm from "./ElForm";
import ElFormItem from "./ElFormItem";
import ElInput from "./ElInput";
export default {
  components: {
    ElForm,
    ElFormItem,
    ElInput,
  },
  data() {
    return {
      model: {
        username: "",
        password: "",
      },
      rules: Object.freeze({
        username: [{ required: true, message: "用户名为必填项" }],
      }),
    };
  },
  methods: {
    login() {
      this.$refs.form.validate((res) => {
        console.log("校验结果", res);
      });
    },
  },
};
</script>

<style>
</style>