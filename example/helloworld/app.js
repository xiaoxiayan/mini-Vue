import { h } from "../../lib/ggBond-mini-vue.esm.js";
import { Foo } from "./Foo.js";
// 调试使用。
window.self = null
export const App = {
  name: 'App',
  // 必须写 render
  render() {
    window.self = this
    // 渲染的 ui
    return h("div", {
      id: 'root',
      class: ['red', 'hard'],
      onClick() {
        // console.log('click')
      }
    } ,
    [h('div', {}, 'hi' + this.msg), h(Foo, {
      count: 1,
    })]
    // setupState
    // this.$el  -> 需要 root element
    // 'hi,' + this.msg
    // string
    // "hi, mini-vue"
    // array
    // [h('p', {class:'red'}, 'hi-pi'), h('p', {class: 'blue'}, 'hhi') ]
    )
  },

  setup() {
    return {
      msg: 'mini-vue-ddaaaaaadd'
    }
  }
}