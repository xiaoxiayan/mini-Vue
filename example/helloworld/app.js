export const App = {
  render() {
    // 渲染的 ui
    return h("div", "hi," + this.msg)
  },

  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}