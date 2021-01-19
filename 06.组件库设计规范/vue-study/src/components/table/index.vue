<template>
  <el-table :columns="columns" :data="data">
    <template v-slot:sex="row">
      {{ row.sex === 1 ? "男" : "女" }}
    </template>
    <template v-slot:handle="row">
      <div style="display: flex">
        <button class="el-button" @click="edit(row)" style="margin-right: 10px">
          修改
        </button>
        <button class="el-button" @click="del(row)">删除</button>
      </div>
    </template>
  </el-table>
</template>

<script>
import ElTable from "./ElTable.vue";
export default {
  components: {
    ElTable,
  },
  data() {
    return {
      columns: [
        {
          title: "姓名",
          dataIndex: "name",
        },
        {
          title: "年龄",
          dataIndex: "age",
        },
        {
          title: "性别",
          dataIndex: "sex",
        },
        {
          title: "操作",
          dataIndex: "handle",
        },
      ],
      data: [
        {
          name: "鸡你太美",
          age: 39,
          sex: 1,
          reload: 3,
        },
        {
          name: "鸡你实在是太美",
          age: 39,
          sex: 2,
          reload: 3,
        },
      ],
    };
  },
  methods: {
    edit(row) {
      console.log("edit", row);
    },
    del(row) {
      console.log("delete", row);
    },
  },
};
</script>

<style>
</style>