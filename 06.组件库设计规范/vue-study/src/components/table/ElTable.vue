<script>
export default {
  provide() {
    return {
      data: this.data,
    };
  },
  props: {
    columns: {
      type: Array,
      required: true,
    },
    data: {
      type: Array,
      required: true,
    },
  },
  methods: {
    // 根据配置生成thead
    renderHeader(h) {
      return h("thead", { class: "el-header" }, [
        h("tr", { class: "el-header-row" }, [
          this.columns.map((row) => {
            return h(
              "th",
              { class: ["el-header-column", "el-table-left"] },
              row.title
            );
          }),
        ]),
      ]);
    },
    // 根据配置生成tbody,再根据 this.$scopedSlots[item.dataIndex] 分配作用域插槽
    renderBody(h) {
      return h("tbody", {}, [
        this.data.map((row) => {
          return h("tr", { class: "el-bodel-row" }, [
            this.columns.map((item) => {
              return h(
                "td",
                { class: "el-bodel-column" },
                this.$scopedSlots[item.dataIndex]
                  ? this.$scopedSlots[item.dataIndex]({ ...row })
                  : row[item.dataIndex]
              );
            }),
          ]);
        }),
      ]);
    },
  },
  mounted() {
    console.log("this", this);
  },
  render(h) {
    return (
      <table class="el-table">
        {this.renderHeader(h)}
        {this.renderBody(h)}
      </table>
    );
  },
};
</script>

<style>
</style>