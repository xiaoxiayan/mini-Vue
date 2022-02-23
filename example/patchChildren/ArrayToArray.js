import { ref, h } from '../../lib/ggBond-mini-vue.esm.js'

const nextChildren = [h("div", {}, "C"), h("div", {}, [h("p", {}, "childP")])]
const prevChildren = [h("div", {}, "A"), h("div", {}, "B"), h("div", {}, "C")]

export default {
  name: 'ArrayToArray',
  setup() {
    const isChange = ref(false)
    window.isChange = isChange

    return {
      isChange
    }
  },
  render() {
    const self = this
    return self.isChange === true
    ? h('div', {}, nextChildren)
    : h('div', {}, prevChildren)

  }
}