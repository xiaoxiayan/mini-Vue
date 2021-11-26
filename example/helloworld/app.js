import { h } from "../../lib/ggBond-mini-vue.esm.js";

export const App = {
  // 必须写 render
  render() {
    // 渲染的 ui
    return h("div", {
      id: 'root',
      class: ['red', 'hard']
    } ,
    // string
    // "hi, mini-vue"
    // array
    [h('p', {class:'red'}, 'hi-pi'), h('p', {class: 'blue'}, 'hhi') ]
    )
  },

  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}