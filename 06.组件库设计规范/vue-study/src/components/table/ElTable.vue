<script>
export default {
  props: {
    columns: {
      type: Array,
      require: true,
    },
    data: {
      type: Array,
      require: true,
    },
  },
  methods: {
    renderHeaders(h) {
      return h("thead", { class: "el-header" }, [
        h(
          "tr",
          { class: "el-header-row" },
          this.columns.map((header) =>
            h(
              "th",
              { class: ["el-header-column", "el-table-left"] },
              header.title
            )
          )
        ),
      ]);
    },
    renderBody(h) {
      return h(
        "tbody",
        this.data.map((row) =>
          h(
            "tr",
            { class: "el-bodel-row" },
            this.columns.map((header) =>
              h(
                "td",
                { class: "el-bodel-column" },
                this.$scopedSlots[header.dataIndex]
                  ? this.$scopedSlots[header.dataIndex].call(this, { ...row })
                  : row[header.dataIndex]
              )
            )
          )
        )
      );
    },
  },
  render(h) {
    return (
      <table class="el-table">
        {this.renderHeaders(h)}
        {this.renderBody(h)}
      </table>
    );
  },
};
</script>
