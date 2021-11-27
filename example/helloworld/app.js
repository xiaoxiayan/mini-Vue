import { h } from "../../lib/ggBond-mini-vue.esm.js";
// 调试使用。
window.self = null
export const App = {
  // 必须写 render
  render() {
    window.self = this
    // 渲染的 ui
    return h("div", {
      id: 'root',
      class: ['red', 'hard']
    } ,
    // setupState
    // this.$el  -> 需要 root element
    'hi,' + this.msg
    // string
    // "hi, mini-vue"
    // array
    // [h('p', {class:'red'}, 'hi-pi'), h('p', {class: 'blue'}, 'hhi') ]
    )
  },

  setup() {
    return {
      msg: 'mini-vue-dddd'
    }
  }
}