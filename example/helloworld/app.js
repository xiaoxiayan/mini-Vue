import { h } from "../../lib/gg-mini-vue.esm.js";

export const App = {
  // 必须写 render
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